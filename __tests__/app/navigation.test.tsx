import { renderRouter, screen, waitFor } from 'expo-router/testing-library';
import * as SecureStore from 'expo-secure-store';

import { mockApi, notFound } from '../../src/api/testing';
import { sessionStore } from '../../src/store/appSession';
import { SOFIA } from '../../src/testing/fixtures';

let api: ReturnType<typeof mockApi>;

// The saved session is never read in these tests: each one sets the session state itself.
beforeAll(() => {
  jest.mocked(SecureStore.getItemAsync).mockReturnValue(new Promise(() => undefined));
});

beforeEach(() => {
  api = mockApi();
  sessionStore.setState({ status: 'signedOut', userId: null });
});
afterEach(() => api.restore());

const signIn = () => sessionStore.setState({ status: 'signedIn', userId: SOFIA.id });

/** Every screen that loads data gets an empty-but-valid answer. */
const respondForever = (body: unknown) =>
  (globalThis.fetch as jest.Mock).mockImplementation(async () =>
    body instanceof Response ? body : new Response(JSON.stringify(body), { status: 200 }),
  );

describe('navigation', () => {
  it('shows nothing while the saved session is being read', async () => {
    sessionStore.setState({ status: 'loading', userId: null });
    await renderRouter('./app', { initialUrl: '/' });
    expect(screen.queryByText('Ingresá a tu cuenta')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Inicio' })).toBeNull();
  });

  describe('signed out', () => {
    it('opens the login', async () => {
      const router = await renderRouter('./app', { initialUrl: '/' });
      expect(await screen.findByRole('header', { name: 'Ingresá a tu cuenta' })).toBeOnTheScreen();
      expect(router.getPathname()).toBe('/login');
    });

    it.each(['/classes', '/profile'])('redirects %s to the login', async (url) => {
      const router = await renderRouter('./app', { initialUrl: url });
      await waitFor(() => expect(router.getPathname()).toBe('/login'));
    });
  });

  describe('signed in', () => {
    beforeEach(() => {
      signIn();
      respondForever(SOFIA);
    });

    it('opens Inicio with the five tabs', async () => {
      const router = await renderRouter('./app', { initialUrl: '/' });
      expect(router.getPathname()).toBe('/');
      for (const tab of ['Inicio', 'Clases', 'Rutina', 'Progreso', 'Perfil']) {
        expect(
          await screen.findByRole('button', { name: new RegExp(`^${tab}`) }),
        ).toBeOnTheScreen();
      }
    });

    it.each(['/login', '/register'])('redirects %s to Inicio', async (url) => {
      const router = await renderRouter('./app', { initialUrl: url });
      await waitFor(() => expect(router.getPathname()).toBe('/'));
    });
  });

  it('signs out and shows the login when the account no longer exists (404)', async () => {
    signIn();
    respondForever(notFound());
    const router = await renderRouter('./app', { initialUrl: '/' });
    await waitFor(() => expect(sessionStore.getState().status).toBe('signedOut'));
    await waitFor(() => expect(router.getPathname()).toBe('/login'));
  });

  it('keeps the session when the API is unreachable', async () => {
    signIn();
    (globalThis.fetch as jest.Mock).mockRejectedValue(new TypeError('Network request failed'));
    await renderRouter('./app', { initialUrl: '/' });
    expect(await screen.findByRole('button', { name: /^Inicio/ })).toBeOnTheScreen();
    expect(sessionStore.getState().status).toBe('signedIn');
  });
});
