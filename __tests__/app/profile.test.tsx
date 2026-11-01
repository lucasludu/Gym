import { userEvent } from '@testing-library/react-native';
import { renderRouter, screen, waitFor } from 'expo-router/testing-library';
import * as SecureStore from 'expo-secure-store';
import { Alert, type AlertButton } from 'react-native';

import { mockApi } from '../../src/api/testing';
import { getSignOutConfirmation } from '../../src/components/profile/signOutConfirmation';
import { SESSION_KEY } from '../../src/store/session';
import { sessionStore } from '../../src/store/appSession';
import { SOFIA } from '../../src/testing/fixtures';

let api: ReturnType<typeof mockApi>;

beforeAll(() => {
  jest.mocked(SecureStore.getItemAsync).mockReturnValue(new Promise(() => undefined));
});
beforeEach(async () => {
  api = mockApi();
  (globalThis.fetch as jest.Mock).mockImplementation(
    async () => new Response(JSON.stringify(SOFIA), { status: 200 }),
  );
  sessionStore.setState({ status: 'signedOut', userId: null });
  await sessionStore.getState().signIn(SOFIA.id);
});
afterEach(() => {
  api.restore();
  jest.restoreAllMocks();
});

/** Opens Perfil, taps "Cerrar sesión" and returns the buttons of the confirmation dialog. */
async function askToSignOut() {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const router = await renderRouter('./app', { initialUrl: '/profile' });
  expect(await screen.findByText('Sofía Martínez')).toBeOnTheScreen();
  await userEvent.setup().press(screen.getByRole('button', { name: 'Cerrar sesión' }));
  expect(alert).toHaveBeenCalledTimes(1);
  const [title, message, buttons] = alert.mock.calls[0] ?? [];
  const byText = (text: string): AlertButton | undefined =>
    (buttons ?? []).find((b) => b.text === text);
  return { router, title, message, byText };
}

describe('sign out from Perfil', () => {
  it('asks for confirmation before signing out', async () => {
    const { title, byText } = await askToSignOut();
    expect(title).toBe('¿Cerrar sesión?');
    expect(byText('Cancelar')?.style).toBe('cancel');
    expect(byText('Cerrar sesión')?.style).toBe('destructive');
    expect(sessionStore.getState().status).toBe('signedIn');
  });

  it('signs out, deletes the saved session and shows the login when confirmed (criterion 21)', async () => {
    const { router, byText } = await askToSignOut();
    byText('Cerrar sesión')?.onPress?.();
    await waitFor(() => expect(router.getPathname()).toBe('/login'));
    expect(sessionStore.getState().status).toBe('signedOut');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(SESSION_KEY);
  });

  it('keeps the session when cancelled (criterion 22)', async () => {
    const { router, byText } = await askToSignOut();
    byText('Cancelar')?.onPress?.();
    expect(sessionStore.getState().status).toBe('signedIn');
    expect(router.getPathname()).toBe('/profile');
  });
});

describe('getSignOutConfirmation (criterion 23)', () => {
  it('has no extra message without a workout in progress', () => {
    expect(getSignOutConfirmation(false)).toEqual({ title: '¿Cerrar sesión?', message: undefined });
  });

  it('warns that an in-progress workout will be lost', () => {
    expect(getSignOutConfirmation(true).message).toBe(
      'Tenés un entrenamiento en curso. Si cerrás sesión, se va a perder.',
    );
  });
});
