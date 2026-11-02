import { userEvent } from '@testing-library/react-native';
import { renderRouter, screen, waitFor } from 'expo-router/testing-library';
import * as SecureStore from 'expo-secure-store';

import { mockApi, notFound } from '../../src/api/testing';
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
