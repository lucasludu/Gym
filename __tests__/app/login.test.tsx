import { userEvent } from '@testing-library/react-native';
import { renderRouter, screen, waitFor } from 'expo-router/testing-library';
import * as SecureStore from 'expo-secure-store';

import { mockApi } from '../../src/api/testing';
import { sessionStore } from '../../src/store/appSession';
import { SOFIA } from '../../src/testing/fixtures';

let api: ReturnType<typeof mockApi>;
const originalDemo = process.env.EXPO_PUBLIC_DEMO_LOGIN;

beforeAll(() => {
  jest.mocked(SecureStore.getItemAsync).mockReturnValue(new Promise(() => undefined));
});
beforeEach(() => {
  api = mockApi();
  sessionStore.setState({ status: 'signedOut', userId: null });
  delete process.env.EXPO_PUBLIC_DEMO_LOGIN;
});
afterEach(() => {
  api.restore();
  process.env.EXPO_PUBLIC_DEMO_LOGIN = originalDemo;
});

const openLogin = (url = '/login') => renderRouter('./app', { initialUrl: url });
const email = () => screen.getByLabelText('Email');
const password = () => screen.getByLabelText('Contraseña');
const submit = () => screen.getByRole('button', { name: 'Ingresar' });

/** After signing in, the tabs load the profile: answer every later request with Sofía. */
const thenAnswerProfile = () => api.respond(...Array.from({ length: 10 }, () => SOFIA));

describe('login', () => {
  it('shows the title as header', async () => {
    await openLogin();
    expect(screen.getByRole('header', { name: 'Ingresá a tu cuenta' })).toBeOnTheScreen();
  });

  it('shows both required errors and does not call the API when empty (criterion 7)', async () => {
    await openLogin();
    await userEvent.setup().press(submit());
    expect(await screen.findByText('Ingresá tu email')).toBeOnTheScreen();
    expect(screen.getByText('Ingresá tu contraseña')).toBeOnTheScreen();
    expect(api.calls).toHaveLength(0);
  });

  it('rejects an invalid email (criterion 8)', async () => {
    await openLogin();
    const user = userEvent.setup();
    await user.type(email(), 'sofia@');
    await user.type(password(), 'secreta1');
    await user.press(submit());
    expect(await screen.findByText('Ingresá un email válido')).toBeOnTheScreen();
    expect(api.calls).toHaveLength(0);
  });

  it('updates the errors while typing after the first submit', async () => {
    await openLogin();
    const user = userEvent.setup();
    await user.press(submit());
    await screen.findByText('Ingresá tu email');
    await user.type(email(), 'sofia@example.com');
    await waitFor(() => expect(screen.queryByText('Ingresá tu email')).toBeNull());
  });

  it('signs in with the normalized email and opens Inicio (criterion 9)', async () => {
    api.respond([SOFIA]);
    thenAnswerProfile();
    const router = await openLogin();
    const user = userEvent.setup();
    await user.type(email(), ' Sofia.Martinez@Example.com ');
    await user.type(password(), 'secreta1');
    await user.press(submit());

    await waitFor(() => expect(router.getPathname()).toBe('/'));
    expect(api.calls[0]?.path).toBe('/users');
    expect(api.calls[0]?.query.get('email')).toBe('sofia.martinez@example.com');
    expect(sessionStore.getState()).toMatchObject({ status: 'signedIn', userId: SOFIA.id });
  });

  it('never sends the password', async () => {
    api.respond([SOFIA]);
    thenAnswerProfile();
    await openLogin();
    const user = userEvent.setup();
    await user.type(email(), SOFIA.email);
    await user.type(password(), 'secreta1');
    await user.press(submit());
    await waitFor(() => expect(sessionStore.getState().status).toBe('signedIn'));
    for (const call of api.calls) {
      expect(JSON.stringify(call.body ?? null)).not.toContain('secreta1');
      expect(call.query.toString()).not.toContain('secreta1');
    }
  });

  it('shows a generic error for an unknown email and keeps the input (criterion 10)', async () => {
    api.respond([]);
    await openLogin();
    const user = userEvent.setup();
    await user.type(email(), 'nadie@example.com');
    await user.type(password(), 'secreta1');
    await user.press(submit());

    expect(await screen.findByRole('alert')).toHaveTextContent('Email o contraseña incorrectos.');
    expect(email()).toHaveDisplayValue('nadie@example.com');
    expect(password()).toHaveDisplayValue('secreta1');
    expect(sessionStore.getState().status).toBe('signedOut');
  });

  it('shows the connection error when offline (criterion 11)', async () => {
    (globalThis.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Network request failed'));
    await openLogin();
    const user = userEvent.setup();
    await user.type(email(), SOFIA.email);
    await user.type(password(), 'secreta1');
    await user.press(submit());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos conectarnos. Revisá tu conexión e intentá de nuevo.',
    );
  });

  it('makes a single request on a double tap (criterion 12)', async () => {
    let release: (r: Response) => void = () => undefined;
    (globalThis.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise<Response>((r) => (release = r)),
    );
    await openLogin();
    const user = userEvent.setup();
    await user.type(email(), SOFIA.email);
    await user.type(password(), 'secreta1');
    await user.press(submit());
    await waitFor(() => expect(submit()).toBeBusy());
    await user.press(submit());
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    release(new Response('[]'));
    await screen.findByRole('alert');
  });

  it('shows and hides the password (criterion 13)', async () => {
    await openLogin();
    const user = userEvent.setup();
    expect(password().props.secureTextEntry).toBe(true);
    await user.press(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(password().props.secureTextEntry).toBe(false);
    await user.press(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(password().props.secureTextEntry).toBe(true);
  });

  describe('demo account (criterion 14)', () => {
    it('is hidden unless EXPO_PUBLIC_DEMO_LOGIN is "true"', async () => {
      process.env.EXPO_PUBLIC_DEMO_LOGIN = 'false';
      await openLogin();
      expect(screen.queryByRole('button', { name: 'Probar con la cuenta demo' })).toBeNull();
    });

    it('signs in as Sofía', async () => {
      process.env.EXPO_PUBLIC_DEMO_LOGIN = 'true';
      api.respond([SOFIA]);
      thenAnswerProfile();
      const router = await openLogin();
      await userEvent
        .setup()
        .press(screen.getByRole('button', { name: 'Probar con la cuenta demo' }));
      await waitFor(() => expect(router.getPathname()).toBe('/'));
      expect(api.calls[0]?.query.get('email')).toBe('sofia.martinez@example.com');
    });
  });

  it('goes to the registration with "Crear cuenta"', async () => {
    const router = await openLogin();
    await userEvent.setup().press(screen.getByRole('button', { name: 'Crear cuenta' }));
    await waitFor(() => expect(router.getPathname()).toBe('/register'));
  });

  it('prefills the email from the URL (coming from the registration)', async () => {
    await openLogin('/login?email=sofia.martinez%40example.com');
    expect(email()).toHaveDisplayValue('sofia.martinez@example.com');
  });
});
