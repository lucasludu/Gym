import { userEvent } from '@testing-library/react-native';
import { renderRouter, screen, waitFor, within } from 'expo-router/testing-library';
import * as SecureStore from 'expo-secure-store';

import { mockApi } from '../../src/api/testing';
import { sessionStore } from '../../src/store/appSession';
import { fakeNow } from '../../src/testing/clock';
import { SOFIA } from '../../src/testing/fixtures';
import { routeHomeApi } from '../../src/testing/homeApi';

// Tuesday 2026-11-03, 10:00 in Buenos Aires.
const NOW = '2026-11-03T10:00:00-03:00';

let api: ReturnType<typeof mockApi>;

beforeAll(() => {
  jest.mocked(SecureStore.getItemAsync).mockReturnValue(new Promise(() => undefined));
});
beforeEach(() => {
  fakeNow(NOW);
  api = mockApi();
  sessionStore.setState({ status: 'signedIn', userId: SOFIA.id });
});
afterEach(() => {
  api.restore();
  jest.useRealTimers();
});

const openHome = () => renderRouter('./app', { initialUrl: '/' });
const card = (title: string) => screen.getByTestId(`home-card-${title}`);

const PLAN = { id: 'plan-2', name: '3 veces por semana', price: 30000, weeklyClassLimit: 3 };
const membershipEnding = (endDate: string) => ({
  memberships: [{ id: 'm1', userId: SOFIA.id, planId: PLAN.id, startDate: '2026-10-01', endDate }],
  plans: { [PLAN.id]: PLAN },
});

describe('Inicio', () => {
  it('greets the member by name', async () => {
    routeHomeApi(api);
    await openHome();
    expect(await screen.findByRole('header', { name: 'Hola, Sofía' })).toBeOnTheScreen();
  });

  describe('membership card (T5.6)', () => {
    it('says there is no active membership (criterion 1)', async () => {
      routeHomeApi(api);
      await openHome();
      expect(await screen.findByText('Sin membresía activa')).toBeOnTheScreen();
      expect(screen.getByText(/no podés reservar clases/)).toBeOnTheScreen();
    });

    it('shows an expiring membership with its plan (criteria 3 and 6)', async () => {
      routeHomeApi(api, membershipEnding('2026-11-06'));
      await openHome();
      expect(await screen.findByText('3 veces por semana')).toBeOnTheScreen();
      expect(screen.getByText('Por vencer')).toBeOnTheScreen();
      expect(
        screen.getByText('Vence en 3 días, el 6 de noviembre. Renovala en recepción.'),
      ).toBeOnTheScreen();
      expect(screen.getByText('3 clases por semana')).toBeOnTheScreen();
    });

    it('shows an expired membership (criterion 5)', async () => {
      routeHomeApi(api, membershipEnding('2026-11-02'));
      await openHome();
      expect(await screen.findByText('Vencida')).toBeOnTheScreen();
    });

    it('shows its own error with retry, and retrying only asks for the membership (criteria 24 and 25)', async () => {
      // A 4xx is not retried by the app's QueryClient, so the error shows at once.
      routeHomeApi(api, { memberships: () => new Response('{}', { status: 400 }) });
      await openHome();
      const membership = await waitFor(() => {
        const element = card('Membresía');
        within(element).getByRole('button', { name: 'Reintentar' });
        return element;
      });
      expect(within(membership).getByText('Algo salió mal')).toBeOnTheScreen();
      expect(screen.getByRole('header', { name: 'Hola, Sofía' })).toBeOnTheScreen();

      routeHomeApi(api, membershipEnding('2026-11-20'));
      const before = api.calls.length;
      await userEvent.setup().press(within(membership).getByRole('button', { name: 'Reintentar' }));
      expect(await screen.findByText('Activa')).toBeOnTheScreen();
      const retried = api.calls.slice(before).map((c) => c.path);
      expect(new Set(retried)).toEqual(new Set(['/memberships', `/plans/${PLAN.id}`]));
    });
  });

  describe('next class card (T5.7)', () => {
    const yoga = {
      id: 'ct-yoga',
      name: 'Yoga',
      description: '',
      durationMinutes: 60,
      intensity: 'low',
      color: 'accentGreen',
    };
    const camila = { id: 't1', firstName: 'Camila', lastName: 'Rodríguez', avatarUrl: null };
    const session = (id: string, startsAt: string) => ({
      id,
      classTypeId: yoga.id,
      trainerId: camila.id,
      startsAt,
      capacity: 12,
      bookedCount: 5,
    });
    const booking = (id: string, classSessionId: string, status = 'confirmed') => ({
      id,
      userId: SOFIA.id,
      classSessionId,
      status,
      createdAt: '2026-11-01T10:00:00-03:00',
      cancelledAt: status === 'cancelled' ? '2026-11-02T10:00:00-03:00' : null,
    });
    const withClasses = (
      bookings: ReturnType<typeof booking>[],
      sessions: ReturnType<typeof session>[],
    ) => ({ bookings, classSessions: sessions, classTypes: [yoga], trainers: [camila] });

    it('shows the soonest confirmed class with day, time, duration and trainer (criteria 7 and 10)', async () => {
      routeHomeApi(
        api,
        withClasses(
          [booking('b1', 's-later'), booking('b2', 's-today')],
          [
            session('s-later', '2026-11-05T19:00:00-03:00'),
            session('s-today', '2026-11-03T19:00:00-03:00'),
          ],
        ),
      );
      await openHome();
      const next = await screen.findByRole('button', { name: /^Próxima clase: Yoga/ });
      expect(next).toHaveAccessibleName('Próxima clase: Yoga, Hoy · 19:00, con Camila Rodríguez');
      expect(within(next).getByText('Hoy · 19:00')).toBeOnTheScreen();
      expect(within(next).getByText('60 min · con Camila Rodríguez')).toBeOnTheScreen();
      expect(within(next).getByText('Podés cancelar hasta las 17:00')).toBeOnTheScreen();
    });

    it('does not offer to cancel once inside the 2-hour limit (criterion 10)', async () => {
      fakeNow('2026-11-03T17:30:00-03:00');
      routeHomeApi(
        api,
        withClasses([booking('b1', 's1')], [session('s1', '2026-11-03T19:00:00-03:00')]),
      );
      await openHome();
      await screen.findByText('Hoy · 19:00');
      expect(screen.queryByText(/Podés cancelar/)).toBeNull();
    });

    it('marks a class in progress (criterion 8)', async () => {
      routeHomeApi(
        api,
        withClasses([booking('b1', 's1')], [session('s1', '2026-11-03T09:30:00-03:00')]),
      );
      await openHome();
      expect(await screen.findByText('En curso')).toBeOnTheScreen();
    });

    it.each([
      ['ended', booking('b1', 's1'), session('s1', '2026-11-03T08:00:00-03:00')],
      ['cancelled', booking('b1', 's1', 'cancelled'), session('s1', '2026-11-04T19:00:00-03:00')],
    ])('shows the empty state when the only booking is %s (criterion 9)', async (_c, b, s) => {
      routeHomeApi(api, withClasses([b], [s]));
      const router = await openHome();
      expect(await screen.findByText('No tenés clases reservadas')).toBeOnTheScreen();
      await userEvent.setup().press(screen.getByRole('button', { name: 'Ver clases' }));
      await waitFor(() => expect(router.getPathname()).toBe('/classes'));
    });

    it('opens the classes when tapped (criterion 11; the class detail arrives in T5.13)', async () => {
      routeHomeApi(
        api,
        withClasses([booking('b1', 's1')], [session('s1', '2026-11-05T19:00:00-03:00')]),
      );
      const router = await openHome();
      await userEvent
        .setup()
        .press(await screen.findByRole('button', { name: /^Próxima clase: Yoga, Jueves 5\/11/ }));
      await waitFor(() => expect(router.getPathname()).toBe('/classes'));
    });
  });

  it('still greets with "Hola" when the profile cannot be loaded', async () => {
    routeHomeApi(api, { user: () => new Response('{}', { status: 400 }) });
    await openHome();
    expect(await screen.findByRole('header', { name: 'Hola' })).toBeOnTheScreen();
  });
});
