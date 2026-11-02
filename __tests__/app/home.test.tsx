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

    it('opens the class detail when tapped (criterion 11)', async () => {
      routeHomeApi(
        api,
        withClasses([booking('b1', 's1')], [session('s1', '2026-11-05T19:00:00-03:00')]),
      );
      api.route('/classSessions/s1', session('s1', '2026-11-05T19:00:00-03:00'));
      const router = await openHome();
      await userEvent
        .setup()
        .press(await screen.findByRole('button', { name: /^Próxima clase: Yoga, Jueves 5\/11/ }));
      await waitFor(() => expect(router.getPathname()).toBe('/classes/s1'));
    });
  });

  describe('streak card (T5.8)', () => {
    const workout = (id: string, startedAt: string) => ({
      id,
      userId: SOFIA.id,
      routineDayId: null,
      startedAt,
      finishedAt: startedAt.replace('T08:', 'T09:'),
      notes: null,
    });

    it('shows the progress of the week with a progress bar (criterion 12)', async () => {
      routeHomeApi(api, {
        workoutSessions: [
          workout('w1', '2026-11-02T08:00:00-03:00'),
          workout('w2', '2026-11-03T08:00:00-03:00'),
        ],
      });
      await openHome();
      expect(await screen.findByText('2 de 3 días esta semana')).toBeOnTheScreen();
      const bar = screen.getByRole('progressbar', { name: 'Objetivo semanal' });
      expect(bar.props.accessibilityValue).toEqual({ min: 0, max: 3, now: 2 });
    });

    it('counts Sunday in the week it belongs to (the previous one)', async () => {
      routeHomeApi(api, {
        workoutSessions: ['2026-11-01', '2026-11-02', '2026-11-03'].map((d, i) =>
          workout(`w${i}`, `${d}T08:00:00-03:00`),
        ),
      });

      await openHome();
      expect(await screen.findByText('2 de 3 días esta semana')).toBeOnTheScreen();
      expect(screen.queryByText('¡Objetivo cumplido esta semana!')).toBeNull();
    });

    it('counts a workout and an attended class on the same day once (criterion 14)', async () => {
      routeHomeApi(api, {
        ...withClasses(
          [booking('b1', 's1', 'attended')],
          [session('s1', '2026-11-02T19:00:00-03:00')],
        ),
        workoutSessions: [
          workout('w1', '2026-11-02T08:00:00-03:00'),
          workout('w2', '2026-11-03T08:00:00-03:00'),
          workout('w3', '2026-11-03T08:30:00-03:00'),
        ],
      });
      await openHome();
      expect(await screen.findByText('2 de 3 días esta semana')).toBeOnTheScreen();
    });

    it('describes each day of the week for screen readers', async () => {
      routeHomeApi(api, { workoutSessions: [workout('w1', '2026-11-02T08:00:00-03:00')] });
      await openHome();
      expect(await screen.findByLabelText('Lunes, con actividad')).toBeOnTheScreen();
      expect(screen.getByLabelText('Martes, hoy, sin actividad')).toBeOnTheScreen();
    });

    it('invites to start when there is no activity (criterion 16)', async () => {
      routeHomeApi(api);
      await openHome();
      expect(await screen.findByText('Empezá tu racha esta semana')).toBeOnTheScreen();
      expect(screen.getByText('0 de 3 días esta semana')).toBeOnTheScreen();
    });

    it('celebrates a fulfilled week (criterion 13)', async () => {
      routeHomeApi(api, {
        user: { ...SOFIA, weeklyGoal: 2 },
        workoutSessions: [
          workout('w1', '2026-11-02T08:00:00-03:00'),
          workout('w2', '2026-11-03T08:00:00-03:00'),
        ],
      });
      await openHome();
      expect(await screen.findByText('¡Objetivo cumplido esta semana!')).toBeOnTheScreen();
      expect(screen.getByText('1 semana seguida')).toBeOnTheScreen();
    });
  });

  describe("today's workout card (T5.9)", () => {
    const routine = {
      id: 'routine-1',
      userId: SOFIA.id,
      trainerId: 't1',
      name: 'Hipertrofia',
      startDate: '2026-10-01',
      endDate: null,
      isActive: true,
    };
    const days = [
      { id: 'day-a', routineId: routine.id, order: 1, name: 'Día A – Tren inferior' },
      { id: 'day-b', routineId: routine.id, order: 2, name: 'Día B – Tren superior' },
      { id: 'day-c', routineId: routine.id, order: 3, name: 'Día C – Full body' },
    ];
    const planned = (id: string, routineDayId: string, order: number) => ({
      id,
      routineDayId,
      exerciseId: `wger-${order}`,
      order,
      targetSets: 3,
      targetReps: '8-10',
      targetWeightKg: null,
      targetSeconds: null,
      restSeconds: 90,
      notes: null,
    });
    const trained = (routineDayId: string | null, startedAt: string) => ({
      id: `w-${startedAt}`,
      userId: SOFIA.id,
      routineDayId,
      startedAt,
      finishedAt: startedAt.replace('T08:', 'T09:'),
      notes: null,
    });
    const withRoutine = {
      routines: [routine],
      routineDays: days,
      routineExercises: [
        planned('re1', 'day-c', 1),
        planned('re2', 'day-c', 2),
        planned('re3', 'day-c', 3),
        planned('re4', 'day-a', 1),
      ],
    };

    it('shows the day after the last one trained with its exercises (criterion 17)', async () => {
      routeHomeApi(api, {
        ...withRoutine,
        workoutSessions: [trained('day-b', '2026-11-02T08:00:00-03:00')],
      });
      await openHome();
      const today = await waitFor(() => {
        const element = card('Entrenamiento de hoy');
        within(element).getByText('Día C – Full body');
        return element;
      });
      expect(within(today).getByText('3 ejercicios')).toBeOnTheScreen();
      expect(
        within(today).getByRole('button', { name: 'Empezar Día C – Full body' }),
      ).toBeOnTheScreen();
    });

    it('starts with the first day when the routine was never trained (criterion 19)', async () => {
      routeHomeApi(api, {
        ...withRoutine,
        workoutSessions: [trained(null, '2026-11-02T08:00:00-03:00')],
      });
      await openHome();
      expect(await screen.findByText('Día A – Tren inferior')).toBeOnTheScreen();
      expect(screen.getByText('1 ejercicio')).toBeOnTheScreen();
    });

    it('opens the Rutina tab with "Elegir otro día"', async () => {
      routeHomeApi(api, withRoutine);
      const router = await openHome();
      await userEvent.setup().press(await screen.findByRole('button', { name: 'Elegir otro día' }));
      await waitFor(() => expect(router.getPathname()).toBe('/routine'));
    });

    it.each([
      ['without an active routine', {}],
      ['with a routine without days', { routines: [routine], routineDays: [] }],
    ])('invites to train free %s (criterion 22)', async (_case, data) => {
      routeHomeApi(api, data);
      await openHome();
      expect(await screen.findByText('Todavía no tenés rutina')).toBeOnTheScreen();
      expect(
        screen.getByText('Pedile una a tu entrenador. Mientras tanto podés entrenar libre.'),
      ).toBeOnTheScreen();
      expect(screen.getByRole('button', { name: 'Entrenamiento libre' })).toBeOnTheScreen();
    });

    it('is available with an expired membership (criterion 23)', async () => {
      routeHomeApi(api, { ...withRoutine, ...membershipEnding('2026-10-01') });
      await openHome();
      await screen.findByText('Vencida');
      expect(
        await screen.findByRole('button', { name: 'Empezar Día A – Tren inferior' }),
      ).toBeEnabled();
    });
  });

  it('shows the cards in the order of the spec', async () => {
    routeHomeApi(api);
    await openHome();
    await screen.findByText('Todavía no tenés rutina');
    const titles = screen
      .getAllByTestId(/^home-card-/)
      .map((element) => String(element.props.testID).replace('home-card-', ''));
    expect(titles).toEqual(['Membresía', 'Entrenamiento de hoy', 'Próxima clase', 'Racha semanal']);
  });

  it('still greets with "Hola" when the profile cannot be loaded', async () => {
    routeHomeApi(api, { user: () => new Response('{}', { status: 400 }) });
    await openHome();
    expect(await screen.findByRole('header', { name: 'Hola' })).toBeOnTheScreen();
  });
});
