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

  it('still greets with "Hola" when the profile cannot be loaded', async () => {
    routeHomeApi(api, { user: () => new Response('{}', { status: 400 }) });
    await openHome();
    expect(await screen.findByRole('header', { name: 'Hola' })).toBeOnTheScreen();
  });
});
