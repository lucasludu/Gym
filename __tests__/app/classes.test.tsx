import { userEvent } from '@testing-library/react-native';
import { renderRouter, screen, waitFor, within } from 'expo-router/testing-library';
import * as SecureStore from 'expo-secure-store';

import { mockApi } from '../../src/api/testing';
import { sessionStore } from '../../src/store/appSession';
import { fakeNow } from '../../src/testing/clock';
import { SOFIA } from '../../src/testing/fixtures';
import { routeHomeApi } from '../../src/testing/homeApi';
import {
  booking as apiBooking,
  CAMILA,
  classSession,
  SPINNING,
  YOGA,
} from '../../src/testing/classFixtures';

// Tuesday 2026-11-03, 10:00 in Buenos Aires.
const NOW = '2026-11-03T10:00:00-03:00';

let api: ReturnType<typeof mockApi>;

beforeAll(() => {
  jest.mocked(SecureStore.getItemAsync).mockReturnValue(new Promise(() => undefined));
});
beforeEach(() => {
  fakeNow(NOW);
  api = mockApi();
  routeHomeApi(api);
  sessionStore.setState({ status: 'signedIn', userId: SOFIA.id });
});
afterEach(() => {
  api.restore();
  jest.useRealTimers();
});

const openClasses = () => renderRouter('./app', { initialUrl: '/classes' });
const day = (label: string) => screen.getByRole('button', { name: label });

describe('Clases · week and day selector (T5.10)', () => {
  it('opens on this week with today selected (criterion 1)', async () => {
    await openClasses();
    expect(await screen.findByRole('header', { name: 'Esta semana' })).toBeOnTheScreen();
    expect(screen.getByText('2 al 8 de noviembre')).toBeOnTheScreen();
    expect(day('Martes 3 de noviembre, hoy')).toBeSelected();
    expect(day('Lunes 2 de noviembre')).not.toBeSelected();
    expect(within(day('Martes 3 de noviembre, hoy')).getByText('Hoy')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Semana anterior' })).toBeDisabled();
  });

  it('shows the seven days with short name and number', async () => {
    await openClasses();
    await screen.findByText('2 al 8 de noviembre');
    for (const text of ['Lun', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']) {
      expect(screen.getByText(text)).toBeOnTheScreen();
    }
    expect(screen.getByText('8')).toBeOnTheScreen();
  });

  it('goes to next week with its Monday selected (criterion 2)', async () => {
    await openClasses();
    const user = userEvent.setup();
    await user.press(await screen.findByRole('button', { name: 'Semana siguiente' }));
    expect(screen.getByRole('header', { name: 'Semana que viene' })).toBeOnTheScreen();
    expect(screen.getByText('9 al 15 de noviembre')).toBeOnTheScreen();
    expect(day('Lunes 9 de noviembre')).toBeSelected();
    expect(screen.getByRole('button', { name: 'Semana siguiente' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Semana anterior' })).toBeEnabled();
  });

  it('comes back to this week with today selected (criterion 3)', async () => {
    await openClasses();
    const user = userEvent.setup();
    await user.press(await screen.findByRole('button', { name: 'Semana siguiente' }));
    await user.press(day('Jueves 12 de noviembre'));
    await user.press(screen.getByRole('button', { name: 'Semana anterior' }));
    expect(screen.getByRole('header', { name: 'Esta semana' })).toBeOnTheScreen();
    expect(day('Martes 3 de noviembre, hoy')).toBeSelected();
  });

  it('selects another day, including a past one', async () => {
    await openClasses();
    const user = userEvent.setup();
    await user.press(await screen.findByRole('button', { name: 'Lunes 2 de noviembre' }));
    expect(day('Lunes 2 de noviembre')).toBeSelected();
    expect(day('Martes 3 de noviembre, hoy')).not.toBeSelected();
  });
});

describe('Clases · list of the day (T5.12)', () => {
  const classType = (id: string, name: string) => ({
    id,
    name,
    description: '',
    durationMinutes: 60,
    intensity: 'medium',
    color: 'accentBlue',
  });
  const yoga = classType('ct-yoga', 'Yoga');
  const spinning = classType('ct-spinning', 'Spinning');
  const camila = { id: 't1', firstName: 'Camila', lastName: 'Rodríguez', avatarUrl: null };
  const session = (id: string, startsAt: string, classTypeId: string, bookedCount = 3) => ({
    id,
    classTypeId,
    trainerId: camila.id,
    startsAt,
    capacity: 12,
    bookedCount,
  });
  const sessions = [
    session('tue-19-spin', '2026-11-03T19:00:00-03:00', spinning.id),
    session('tue-19-yoga', '2026-11-03T19:00:00-03:00', yoga.id),
    session('tue-07-spin', '2026-11-03T07:00:00-03:00', spinning.id),
    session('wed-18-yoga', '2026-11-04T18:00:00-03:00', yoga.id),
    session('mon-10-spin', '2026-11-09T10:00:00-03:00', spinning.id),
  ];
  const withClasses = (patch: Parameters<typeof routeHomeApi>[1] = {}) =>
    routeHomeApi(api, {
      classTypes: [yoga, spinning],
      trainers: [camila],
      classSessions: sessions,
      ...patch,
    });
  const cardNames = () =>
    screen
      .getAllByRole('button', { name: /, con Camila Rodríguez, / })
      .map((c) => String(c.props.accessibilityLabel).split(', con')[0]);

  it("lists today's classes by time, both classes at 19:00 included (criteria 1 and 4)", async () => {
    withClasses();
    await openClasses();
    await screen.findByText('07:00 – 08:00');
    expect(cardNames()).toEqual([
      'Spinning, 07:00 a 08:00',
      'Spinning, 19:00 a 20:00',
      'Yoga, 19:00 a 20:00',
    ]);
  });

  it('asks for the classes of the visible week only', async () => {
    withClasses();
    await openClasses();
    await screen.findByText('07:00 – 08:00');
    const call = api.calls.find((c) => c.path === '/classSessions');
    expect(call?.query.get('startsAt_gte')).toBe('2026-11-02T00:00:00-03:00');
    expect(call?.query.get('startsAt_lte')).toBe('2026-11-08T23:59:59-03:00');

    await userEvent.setup().press(screen.getByRole('button', { name: 'Semana siguiente' }));
    expect(await screen.findByText('10:00 – 11:00')).toBeOnTheScreen();
    const next = api.calls.filter((c) => c.path === '/classSessions').at(-1);
    expect(next?.query.get('startsAt_gte')).toBe('2026-11-09T00:00:00-03:00');
  });

  it('shows the classes of the day I pick', async () => {
    withClasses();
    await openClasses();
    await screen.findByText('07:00 – 08:00');
    await userEvent.setup().press(day('Miércoles 4 de noviembre'));
    expect(cardNames()).toEqual(['Yoga, 18:00 a 19:00']);
  });

  it('filters by type and keeps the filter across days (criterion 5)', async () => {
    withClasses();
    await openClasses();
    const user = userEvent.setup();
    await user.press(await screen.findByRole('button', { name: 'Yoga' }));
    expect(screen.getByRole('button', { name: 'Yoga' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'Todas' })).not.toBeSelected();
    expect(cardNames()).toEqual(['Yoga, 19:00 a 20:00']);

    await user.press(day('Miércoles 4 de noviembre'));
    expect(cardNames()).toEqual(['Yoga, 18:00 a 19:00']);
  });

  it('says there are no classes of that type, and "Ver todas" clears the filter (criterion 6)', async () => {
    withClasses();
    await openClasses();
    const user = userEvent.setup();
    await user.press(await screen.findByRole('button', { name: 'Spinning' }));
    await user.press(day('Miércoles 4 de noviembre'));
    expect(screen.getByText('No hay clases de Spinning este día')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Ver todas' }));
    expect(screen.getByRole('button', { name: 'Todas' })).toBeSelected();
    expect(cardNames()).toEqual(['Yoga, 18:00 a 19:00']);
  });

  it('says there are no classes on an empty day', async () => {
    withClasses();
    await openClasses();
    await screen.findByText('07:00 – 08:00');
    await userEvent.setup().press(day('Domingo 8 de noviembre'));
    expect(screen.getByText('No hay clases este día')).toBeOnTheScreen();
  });

  it('shows the error with retry when the classes fail (criterion 7)', async () => {
    withClasses({ classSessions: () => new Response('{}', { status: 400 }) });
    await openClasses();
    const retry = await screen.findByRole('button', { name: 'Reintentar' });
    withClasses();
    await userEvent.setup().press(retry);
    expect(await screen.findByText('07:00 – 08:00')).toBeOnTheScreen();
  });

  it('marks my booked classes', async () => {
    withClasses({
      bookings: [
        {
          id: 'b1',
          userId: SOFIA.id,
          classSessionId: 'tue-19-yoga',
          status: 'confirmed',
          createdAt: '2026-11-01T10:00:00-03:00',
          cancelledAt: null,
        },
      ],
    });
    await openClasses();
    expect(
      await screen.findByRole('button', { name: /^Yoga, 19:00 a 20:00.*reservada$/ }),
    ).toBeOnTheScreen();
  });

  it('still lists the classes when my bookings fail to load', async () => {
    withClasses({ bookings: () => new Response('{}', { status: 400 }) });
    await openClasses();
    expect(await screen.findByText('07:00 – 08:00')).toBeOnTheScreen();
    expect(screen.queryByText('Reservada')).toBeNull();
  });
});

describe('Clases · Mis reservas (T5.16)', () => {
  const sessions = [
    classSession('s-thu', '2026-11-05T19:00:00-03:00', YOGA.id),
    classSession('s-today', '2026-11-03T19:00:00-03:00', SPINNING.id),
    classSession('s-now', '2026-11-03T09:30:00-03:00', YOGA.id),
    classSession('s-att', '2026-10-30T19:00:00-03:00', SPINNING.id),
    classSession('s-ns', '2026-10-28T19:00:00-03:00', YOGA.id),
    classSession('s-can', '2026-11-04T07:00:00-03:00', SPINNING.id),
    classSession('s-fin', '2026-11-02T19:00:00-03:00', YOGA.id),
  ];
  const serve = (bookings: ReturnType<typeof apiBooking>[]) => {
    routeHomeApi(api, {
      classTypes: [YOGA, SPINNING],
      trainers: [CAMILA],
      classSessions: sessions,
      bookings,
    });
    for (const s of sessions) api.route(`/classSessions/${s.id}`, s);
  };
  const openMine = async () => {
    const router = await openClasses();
    await userEvent.setup().press(await screen.findByRole('tab', { name: 'Mis reservas' }));
    return router;
  };

  it('starts on "Calendario"', async () => {
    serve([]);
    await openClasses();
    expect(await screen.findByRole('tab', { name: 'Calendario' })).toBeSelected();
  });

  it('lists the upcoming bookings, soonest first, with "En curso" (criterion 30)', async () => {
    serve([apiBooking('b1', 's-thu'), apiBooking('b2', 's-today'), apiBooking('b3', 's-now')]);
    await openMine();
    const upcoming = await screen.findAllByRole('button', { name: /^Reserva: / });
    expect(upcoming.map((b) => b.props.accessibilityLabel)).toEqual([
      'Reserva: Yoga, Hoy · 09:30, con Camila Rodríguez, en curso',
      'Reserva: Spinning, Hoy · 19:00, con Camila Rodríguez',
      'Reserva: Yoga, Jueves 5/11 · 19:00, con Camila Rodríguez',
    ]);
    expect(screen.getByText('En curso')).toBeOnTheScreen();
  });

  it('lists the history with its outcome, most recent first (criteria 31 and 32)', async () => {
    serve([
      apiBooking('b1', 's-att', 'attended'),
      apiBooking('b2', 's-ns', 'no_show'),
      apiBooking('b3', 's-can', 'cancelled'),
      apiBooking('b4', 's-fin'),
    ]);
    await openMine();
    const history = await screen.findAllByRole('button', { name: /^Historial: / });
    expect(history.map((b) => b.props.accessibilityLabel)).toEqual([
      'Historial: Spinning, Mañana · 07:00, cancelada',
      'Historial: Yoga, Lunes 2/11 · 19:00, finalizada',
      'Historial: Spinning, Viernes 30/10 · 19:00, asististe',
      'Historial: Yoga, Miércoles 28/10 · 19:00, no asististe',
    ]);
    for (const badge of ['Cancelada', 'Finalizada', 'Asististe', 'No asististe']) {
      expect(screen.getByText(badge)).toBeOnTheScreen();
    }
    expect(screen.getByText('No tenés clases reservadas')).toBeOnTheScreen();
  });

  it('opens the detail of a booking', async () => {
    serve([apiBooking('b1', 's-thu')]);
    const router = await openMine();
    await userEvent
      .setup()
      .press(await screen.findByRole('button', { name: /^Reserva: Yoga, Jueves/ }));
    await waitFor(() => expect(router.getPathname()).toBe('/classes/s-thu'));
  });

  it('has empty states, and "Ver calendario" goes back to the calendar (criterion 33)', async () => {
    serve([]);
    await openMine();
    expect(await screen.findByText('No tenés clases reservadas')).toBeOnTheScreen();
    expect(screen.getByText('Todavía no fuiste a ninguna clase')).toBeOnTheScreen();
    await userEvent.setup().press(screen.getByRole('button', { name: 'Ver calendario' }));
    expect(screen.getByRole('tab', { name: 'Calendario' })).toBeSelected();
    expect(screen.getByText('2 al 8 de noviembre')).toBeOnTheScreen();
  });

  it('shows the error with retry', async () => {
    routeHomeApi(api, { bookings: () => new Response('{}', { status: 400 }) });
    await openMine();
    expect(await screen.findByRole('button', { name: 'Reintentar' })).toBeOnTheScreen();
  });
});
