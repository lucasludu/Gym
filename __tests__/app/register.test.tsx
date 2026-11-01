import { userEvent } from '@testing-library/react-native';
import { renderRouter, screen, waitFor } from 'expo-router/testing-library';
import * as SecureStore from 'expo-secure-store';

import { mockApi } from '../../src/api/testing';
import { sessionStore } from '../../src/store/appSession';
import { SOFIA } from '../../src/testing/fixtures';

let api: ReturnType<typeof mockApi>;

beforeAll(() => {
  jest.mocked(SecureStore.getItemAsync).mockReturnValue(new Promise(() => undefined));
});
beforeEach(() => {
  api = mockApi();
  sessionStore.setState({ status: 'signedOut', userId: null });
});
afterEach(() => api.restore());

const openRegister = () => renderRouter('./app', { initialUrl: '/register' });
const submit = () => screen.getByRole('button', { name: 'Crear cuenta' });

const NEW_USER = {
  ...SOFIA,
  id: 'abc123',
  firstName: 'Ana',
  lastName: 'Gómez',
  email: 'ana@example.com',
  createdAt: '2026-11-01T10:00:00.000Z',
};

async function fill(values: Partial<Record<string, string>> = {}) {
  const data = {
    Nombre: 'Ana',
    Apellido: 'Gómez',
    Email: 'ana@example.com',
    Contraseña: 'secreta1',
    'Repetir contraseña': 'secreta1',
    ...values,
  };
  const user = userEvent.setup();
  for (const [label, value] of Object.entries(data)) {
    if (value !== undefined && value !== '') await user.type(screen.getByLabelText(label), value);
  }
  return user;
}

describe('registration', () => {
  it('shows the title as header and the password rule as hint', async () => {
    await openRegister();
    expect(screen.getByRole('header', { name: 'Creá tu cuenta' })).toBeOnTheScreen();
    expect(screen.getByText('Usá al menos 8 caracteres, con letras y números')).toBeOnTheScreen();
  });

  it('shows the error of every required field when empty (criterion 15)', async () => {
    await openRegister();
    await userEvent.setup().press(submit());
    expect(await screen.findByText('Ingresá tu nombre')).toBeOnTheScreen();
    expect(screen.getByText('Ingresá tu apellido')).toBeOnTheScreen();
    expect(screen.getByText('Ingresá tu email')).toBeOnTheScreen();
    expect(api.calls).toHaveLength(0);
  });

  it('rejects a weak password (criterion 16)', async () => {
    await openRegister();
    const user = await fill({ Contraseña: 'abcdefgh', 'Repetir contraseña': 'abcdefgh' });
    await user.press(submit());
    expect(
      await screen.findByText('Usá al menos 8 caracteres, con letras y números'),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText('Contraseña').props.accessibilityHint).toBe(
      'Usá al menos 8 caracteres, con letras y números',
    );
    expect(api.calls).toHaveLength(0);
  });

  it('rejects a confirmation that does not match (criterion 17)', async () => {
    await openRegister();
    const user = await fill({ 'Repetir contraseña': 'secreta2' });
    await user.press(submit());
    expect(await screen.findByText('Las contraseñas no coinciden')).toBeOnTheScreen();
    expect(api.calls).toHaveLength(0);
  });

  it('does not create a user when the email exists, and offers the login (criterion 18)', async () => {
    api.respond([SOFIA]);
    const router = await openRegister();
    const user = await fill({ Email: SOFIA.email });
    await user.press(submit());

    expect(await screen.findByText('Ya existe una cuenta con ese email.')).toBeOnTheScreen();
    expect(api.calls.filter((c) => c.method === 'POST')).toHaveLength(0);

    await user.press(screen.getByRole('button', { name: 'Ingresar con ese email' }));
    await waitFor(() => expect(router.getPathname()).toBe('/login'));
    expect(screen.getByLabelText('Email')).toHaveDisplayValue(SOFIA.email);
  });

  it('creates the user without membership, signs in and opens Inicio (criteria 19 and 20)', async () => {
    api.respond([], NEW_USER, ...Array.from({ length: 10 }, () => NEW_USER));
    const router = await openRegister();
    const user = await fill({ Nombre: '  Ana ', Email: ' Ana@Example.com ' });
    await user.press(submit());

    await waitFor(() => expect(router.getPathname()).toBe('/'));
    const post = api.calls.find((c) => c.method === 'POST');
    expect(post?.path).toBe('/users');
    expect(post?.body).toMatchObject({
      firstName: 'Ana',
      lastName: 'Gómez',
      email: 'ana@example.com',
      weeklyGoal: 3,
      avatarUrl: null,
    });
    expect(JSON.stringify(post?.body)).not.toContain('secreta1');
    expect(api.calls.some((c) => c.path.startsWith('/memberships') && c.method === 'POST')).toBe(
      false,
    );
    expect(sessionStore.getState()).toMatchObject({ status: 'signedIn', userId: 'abc123' });
  });

  it('shows the connection error when offline', async () => {
    (globalThis.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Network request failed'));
    await openRegister();
    const user = await fill();
    await user.press(submit());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos conectarnos. Revisá tu conexión e intentá de nuevo.',
    );
  });

  it('goes back to the login with "Ya tengo cuenta"', async () => {
    const router = await openRegister();
    await userEvent.setup().press(screen.getByRole('button', { name: 'Ya tengo cuenta' }));
    await waitFor(() => expect(router.getPathname()).toBe('/login'));
  });
});
