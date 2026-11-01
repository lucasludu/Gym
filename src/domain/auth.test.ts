import { loginFormSchema } from './auth';

const messages = (input: unknown) => {
  const result = loginFormSchema.safeParse(input);
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message]));
};

describe('loginFormSchema', () => {
  it('accepts an email and a password', () => {
    expect(loginFormSchema.parse({ email: 'sofia@example.com', password: 'x' })).toEqual({
      email: 'sofia@example.com',
      password: 'x',
    });
  });

  it('normalizes the email (trim and lowercase)', () => {
    expect(
      loginFormSchema.parse({ email: ' Sofia.Martinez@Example.com ', password: 'x' }).email,
    ).toBe('sofia.martinez@example.com');
  });

  it('asks for the email and password when empty', () => {
    expect(messages({ email: '', password: '' })).toEqual({
      email: 'Ingresá tu email',
      password: 'Ingresá tu contraseña',
    });
  });

  it('treats a blank email as empty', () => {
    expect(messages({ email: '   ', password: 'x' }).email).toBe('Ingresá tu email');
  });

  it.each(['sofia', 'sofia@', '@example.com', 'sofia@example', 'so fia@example.com'])(
    'rejects the invalid email %p',
    (email) => {
      expect(messages({ email, password: 'x' }).email).toBe('Ingresá un email válido');
    },
  );

  it('does not apply the registration password rules (any non-empty password works)', () => {
    expect(loginFormSchema.safeParse({ email: 'a@b.co', password: '1' }).success).toBe(true);
  });

  it('keeps the password as typed (no trim)', () => {
    expect(loginFormSchema.parse({ email: 'a@b.co', password: ' pass ' }).password).toBe(' pass ');
  });
});
