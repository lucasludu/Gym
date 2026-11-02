import { act, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Alert, type AlertButton } from 'react-native';
import { renderRouter, screen, waitFor } from 'expo-router/testing-library';
import * as SecureStore from 'expo-secure-store';

import { mockApi, notFound, type RecordedCall } from '../../src/api/testing';
import { sessionStore } from '../../src/store/appSession';
import { booking, CAMILA, classSession, SPINNING, YOGA } from '../../src/testing/classFixtures';
import { fakeNow } from '../../src/testing/clock';
import { SOFIA } from '../../src/testing/fixtures';
import { routeHomeApi } from '../../src/testing/homeApi';

// Tuesday 2026-11-03, 10:00 in Buenos Aires.
const NOW = '2026-11-03T10:00:00-03:00';
const THURSDAY = classSession('s-thu', '2026-11-05T19:00:00-03:00', YOGA.id, 8);

let api: ReturnType<typeof mockApi>;

beforeAll(() => {
  jest.mocked(SecureStore.getItemAsync).mockReturnValue(new Promise(() => undefined));
});
beforeEach(() => {
  fakeNow(NOW);
  api = mockApi();
  routeHomeApi(api, {
    classTypes: [YOGA, SPINNING],
    trainers: [CAMILA],
    classSessions: [THURSDAY],
  });
  api.route(`/classSessions/${THURSDAY.id}`, THURSDAY);
  sessionStore.setState({ status: 'signedIn', userId: SOFIA.id });
});
afterEach(() => {
  api.restore();
  jest.useRealTimers();
});

describe('Class detail (T5.13)', () => {
  it('shows type, day and time, duration, trainer, intensity, description and spots (criterion 13)', async () => {
    await renderRouter('./app', { initialUrl: `/classes/${THURSDAY.id}` });
    expect(await screen.findByRole('header', { name: 'Yoga' })).toBeOnTheScreen();
    expect(screen.getByText('Jueves 5/11 · 19:00 – 20:00')).toBeOnTheScreen();
    expect(screen.getByText('60 min · Intensidad baja')).toBeOnTheScreen();
    expect(screen.getByText('con Camila Rodríguez')).toBeOnTheScreen();
    expect(screen.getByText(YOGA.description)).toBeOnTheScreen();
    expect(screen.getByText('4 de 12 lugares libres')).toBeOnTheScreen();
  });

  it('opens from a card of the list (criterion 12)', async () => {
    const router = await renderRouter('./app', { initialUrl: '/classes' });
    const user = userEvent.setup();
    await user.press(await screen.findByRole('button', { name: 'Jueves 5 de noviembre' }));
    await user.press(screen.getByRole('button', { name: /^Yoga, 19:00 a 20:00/ }));
    await waitFor(() => expect(router.getPathname()).toBe(`/classes/${THURSDAY.id}`));
    expect(await screen.findByText('4 de 12 lugares libres')).toBeOnTheScreen();
  });

  it('opens from "Próxima clase" on Inicio (criterion 15)', async () => {
    routeHomeApi(api, {
      classTypes: [YOGA],
      trainers: [CAMILA],
      classSessions: [THURSDAY],
      bookings: [booking('b1', THURSDAY.id)],
    });
    api.route(`/classSessions/${THURSDAY.id}`, THURSDAY);
    const router = await renderRouter('./app', { initialUrl: '/' });
    await userEvent
      .setup()
      .press(await screen.findByRole('button', { name: /^Próxima clase: Yoga/ }));
    await waitFor(() => expect(router.getPathname()).toBe(`/classes/${THURSDAY.id}`));
  });

  it('says the class no longer exists, with a way back (criterion 14)', async () => {
    api.route('/classSessions/gone', () => notFound());
    const router = await renderRouter('./app', { initialUrl: '/classes/gone' });
    expect(await screen.findByText('Esta clase ya no existe')).toBeOnTheScreen();
    await userEvent.setup().press(screen.getByRole('button', { name: 'Volver a clases' }));
    await waitFor(() => expect(router.getPathname()).toBe('/classes'));
  });

  it('shows the error with retry', async () => {
    api.route(`/classSessions/${THURSDAY.id}`, () => new Response('{}', { status: 400 }));
    await renderRouter('./app', { initialUrl: `/classes/${THURSDAY.id}` });
    const retry = await screen.findByRole('button', { name: 'Reintentar' });
    api.route(`/classSessions/${THURSDAY.id}`, THURSDAY);
    await userEvent.setup().press(retry);
    expect(await screen.findByText('4 de 12 lugares libres')).toBeOnTheScreen();
  });
});

describe('Booking (T5.14)', () => {
  const PLAN = { id: 'plan-2', name: '3 veces por semana', price: 30000, weeklyClassLimit: 3 };
  const membership = (endDate: string) => ({
    memberships: [
      { id: 'm1', userId: SOFIA.id, planId: PLAN.id, startDate: '2026-10-01', endDate },
    ],
    plans: { [PLAN.id]: PLAN },
  });
  type ApiBooking = ReturnType<typeof booking>;

  /** A server whose bookings change when the app posts one. */
  const serve = (opts: {
    bookings?: ApiBooking[];
    sessions?: ReturnType<typeof classSession>[];
    membershipEnd?: string | null;
    post?: () => unknown;
    patch?: () => unknown;
  }) => {
    const bookings = [...(opts.bookings ?? [])];
    const sessions = opts.sessions ?? [THURSDAY];
    routeHomeApi(api, {
      classTypes: [YOGA, SPINNING],
      trainers: [CAMILA],
      classSessions: sessions,
      bookings: (call: RecordedCall) => {
        if (call.method !== 'POST') return bookings;
        if (opts.post) return opts.post();
        const created = { ...(call.body as ApiBooking), id: `b-${bookings.length + 1}` };
        bookings.push(created);
        return created;
      },
      ...(opts.membershipEnd === null ? {} : membership(opts.membershipEnd ?? '2026-11-30')),
    });
    for (const s of sessions) api.route(`/classSessions/${s.id}`, s);
    for (const b of bookings) {
      api.route(`/bookings/${b.id}`, (call: RecordedCall) => {
        if (opts.patch) return opts.patch();
        Object.assign(b, call.body);
        return b;
      });
    }
    return { bookings };
  };
  const openDetail = (id = THURSDAY.id) => renderRouter('./app', { initialUrl: `/classes/${id}` });
  const posts = () => api.calls.filter((c) => c.method === 'POST' && c.path === '/bookings');

  it('books with one tap: booked and one spot less at once, then the notice (criterion 16)', async () => {
    let release: (value: unknown) => void = () => undefined;
    const { bookings } = serve({
      post: () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    });
    await openDetail();
    await userEvent.setup().press(await screen.findByRole('button', { name: 'Reservar' }));
    expect(await screen.findByText('3 de 12 lugares libres')).toBeOnTheScreen();
    expect(screen.getByText('Reservada')).toBeOnTheScreen();

    const created = { ...booking('b-1', THURSDAY.id), createdAt: NOW };
    bookings.push(created);
    release(created);
    expect(await screen.findByText('Reservaste Yoga, jueves 19:00')).toBeOnTheScreen();
    expect(posts()).toHaveLength(1);
  });

  it('rolls back and says so when the server fails (criterion 17)', async () => {
    serve({ post: () => new Response('{}', { status: 500 }) });
    await openDetail();
    await userEvent.setup().press(await screen.findByRole('button', { name: 'Reservar' }));
    expect(await screen.findByText('No pudimos reservar. Intentá de nuevo.')).toBeOnTheScreen();
    expect(screen.getByText('4 de 12 lugares libres')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Reservar' })).toBeEnabled();
  });

  it('does not book twice when tapped twice (criterion 18)', async () => {
    serve({ post: () => new Promise(() => undefined) });
    await openDetail();
    const user = userEvent.setup();
    const button = await screen.findByRole('button', { name: 'Reservar' });
    await user.press(button);
    await user.press(button);
    expect(posts()).toHaveLength(1);
  });

  it('blocks without membership (criterion 19)', async () => {
    serve({ membershipEnd: null });
    await openDetail();
    expect(await screen.findByRole('button', { name: 'No podés reservar' })).toBeDisabled();
    expect(screen.getByText(/No tenés una membresía activa/)).toBeOnTheScreen();
  });

  it('blocks with an expired membership, saying when it expired (criterion 20)', async () => {
    serve({ membershipEnd: '2026-11-01' });
    await openDetail();
    expect(await screen.findByRole('button', { name: 'No podés reservar' })).toBeDisabled();
    expect(
      screen.getByText(
        'Tu membresía venció el 1 de noviembre. Renovala en recepción para volver a reservar.',
      ),
    ).toBeOnTheScreen();
  });

  it('blocks an overlapping class and names the booked one (criterion 21)', async () => {
    const spinning = classSession('s-spin', '2026-11-05T18:30:00-03:00', SPINNING.id, 2);
    serve({ sessions: [THURSDAY, spinning], bookings: [booking('b1', spinning.id)] });
    await openDetail();
    expect(await screen.findByRole('button', { name: 'Se superpone' })).toBeDisabled();
    expect(
      screen.getByText('Ya tenés reservada Spinning a las 18:30, en el mismo horario.'),
    ).toBeOnTheScreen();
  });

  it('blocks over the weekly limit, but not next week (criterion 22)', async () => {
    const week = ['2026-11-02', '2026-11-03', '2026-11-04'].map((d, i) =>
      classSession(`s${i}`, `${d}T07:00:00-03:00`, SPINNING.id),
    );
    const nextWeek = classSession('s-next', '2026-11-10T19:00:00-03:00');
    serve({
      sessions: [THURSDAY, nextWeek, ...week],
      bookings: week.map((s, i) => booking(`b${i}`, s.id, i === 0 ? 'attended' : 'confirmed')),
    });
    await openDetail();
    expect(await screen.findByRole('button', { name: 'Límite semanal alcanzado' })).toBeDisabled();
    expect(screen.getByText(/Tu plan permite 3 clases por semana/)).toBeOnTheScreen();

    await act(() => router.push(`/classes/${nextWeek.id}`));
    expect(await screen.findByRole('button', { name: 'Reservar' })).toBeEnabled();
  });

  it('blocks a full class (criterion 23)', async () => {
    const full = classSession('s-full', '2026-11-05T19:00:00-03:00', YOGA.id, 12);
    serve({ sessions: [full] });
    await openDetail(full.id);
    expect(await screen.findByRole('button', { name: 'Clase llena' })).toBeDisabled();
    expect(screen.getByText('No quedan lugares. Probá con otro horario.')).toBeOnTheScreen();
  });

  it('updates "Próxima clase" on Inicio after booking (criterion 24)', async () => {
    serve({});
    await openDetail();
    await userEvent.setup().press(await screen.findByRole('button', { name: 'Reservar' }));
    await screen.findByText('Reservaste Yoga, jueves 19:00');
    await act(() => router.navigate('/'));
    expect(
      await screen.findByRole('button', { name: /^Próxima clase: Yoga, Jueves 5\/11/ }),
    ).toBeOnTheScreen();
  });

  describe('cancelling (T5.15)', () => {
    const confirmCancel = async () => {
      const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
      alert.mockClear();
      await userEvent
        .setup()
        .press(await screen.findByRole('button', { name: 'Cancelar reserva' }));
      expect(alert).toHaveBeenCalledTimes(1);
      const [title, message, buttons] = alert.mock.calls[0] ?? [];
      const byText = (text: string): AlertButton | undefined =>
        (buttons ?? []).find((b) => b.text === text);
      return { title, message, byText };
    };

    it('asks for confirmation and frees the spot (criterion 25)', async () => {
      serve({ bookings: [booking('b1', THURSDAY.id)] });
      await openDetail();
      const { title, message, byText } = await confirmCancel();
      expect(title).toBe('¿Cancelar la reserva?');
      expect(message).toBe('Yoga, jueves 19:00. Vas a liberar tu lugar.');
      expect(byText('Volver')?.style).toBe('cancel');
      expect(byText('Cancelar reserva')?.style).toBe('destructive');

      await act(async () => byText('Cancelar reserva')?.onPress?.());
      expect(await screen.findByText('5 de 12 lugares libres')).toBeOnTheScreen();
      expect(await screen.findByText('Cancelaste tu reserva de Yoga')).toBeOnTheScreen();
      expect(screen.getByRole('button', { name: 'Reservar' })).toBeOnTheScreen();
      expect(api.calls.find((c) => c.method === 'PATCH')?.path).toBe('/bookings/b1');
    });

    it('keeps the booking with "Volver" (criterion 26)', async () => {
      serve({ bookings: [booking('b1', THURSDAY.id)] });
      await openDetail();
      const { byText } = await confirmCancel();
      await act(async () => byText('Volver')?.onPress?.());
      expect(screen.getByText('Reservada')).toBeOnTheScreen();
      expect(api.calls.some((c) => c.method === 'PATCH')).toBe(false);
    });

    // The exact limit (2:00:00 before) is covered by canCancelBooking in bookingRules.test.ts:
    // here waitFor moves the fake clock forward 50 ms per attempt.
    it('cannot cancel less than 2 hours before, but can with a bit more (criterion 27)', async () => {
      const soon = classSession('s-soon', '2026-11-03T11:59:00-03:00');
      const atLimit = classSession('s-limit', '2026-11-03T12:01:00-03:00', SPINNING.id);
      serve({
        sessions: [soon, atLimit],
        bookings: [booking('b1', soon.id), booking('b2', atLimit.id)],
      });
      await openDetail(soon.id);
      expect(
        await screen.findByText('Ya no podés cancelar: el límite es 2 horas antes de la clase.'),
      ).toBeOnTheScreen();
      expect(screen.queryByRole('button', { name: 'Cancelar reserva' })).toBeNull();

      await act(() => router.push(`/classes/${atLimit.id}`));
      expect(await screen.findByRole('button', { name: 'Cancelar reserva' })).toBeOnTheScreen();
    });

    it('keeps the booking and says so when the server fails (criterion 28)', async () => {
      serve({
        bookings: [booking('b1', THURSDAY.id)],
        patch: () => new Response('{}', { status: 500 }),
      });
      await openDetail();
      const { byText } = await confirmCancel();
      await act(async () => byText('Cancelar reserva')?.onPress?.());
      expect(await screen.findByText('No pudimos cancelar. Intentá de nuevo.')).toBeOnTheScreen();
      expect(screen.getByText('Reservada')).toBeOnTheScreen();
      expect(screen.getByText('4 de 12 lugares libres')).toBeOnTheScreen();
    });

    it('can book the class again after cancelling (criterion 29)', async () => {
      serve({ bookings: [booking('b1', THURSDAY.id)] });
      await openDetail();
      const { byText } = await confirmCancel();
      await act(async () => byText('Cancelar reserva')?.onPress?.());
      await userEvent.setup().press(await screen.findByRole('button', { name: 'Reservar' }));
      expect(await screen.findByText(/^Reservaste Yoga/)).toBeOnTheScreen();
      expect(posts()).toHaveLength(1);
    });
  });
});
