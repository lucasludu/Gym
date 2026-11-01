import { PASSWORD_RULE_MESSAGE, loginFormSchema, registerFormSchema } from './auth';

const messagesOf = (schema: typeof loginFormSchema | typeof registerFormSchema, input: unknown) => {
  const result = schema.safeParse(input);
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message]));
};

describe('registerFormSchema', () => {
  const valid = {
    firstName: 'Ana',
    lastName: 'Gómez',
    email: 'ana@example.com',
    password: 'secreta1',
    confirmPassword: 'secreta1',
  };
  const errors = (overrides: Partial<typeof valid>) =>
    messagesOf(registerFormSchema, { ...valid, ...overrides });

  it('accepts valid data, trimming the names and normalizing the email', () => {
    expect(
      registerFormSchema.parse({
        ...valid,
        firstName: '  Ana ',
        lastName: ' Gómez  ',
        email: ' Ana@Example.COM ',
      }),
    ).toMatchObject({ firstName: 'Ana', lastName: 'Gómez', email: 'ana@example.com' });
  });

  it('asks for every required field when empty', () => {
    expect(
      messagesOf(registerFormSchema, {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
      }),
    ).toEqual({
      firstName: 'Ingresá tu nombre',
      lastName: 'Ingresá tu apellido',
      email: 'Ingresá tu email',
      password: PASSWORD_RULE_MESSAGE,
    });
  });

  it('treats blank names as empty', () => {
    expect(errors({ firstName: '   ', lastName: '  ' })).toEqual({
      firstName: 'Ingresá tu nombre',
      lastName: 'Ingresá tu apellido',
    });
  });

  it('limits names to 50 characters (after trimming)', () => {
    expect(errors({ firstName: 'a'.repeat(50), lastName: ` ${'b'.repeat(50)} ` })).toEqual({});
    expect(errors({ firstName: 'a'.repeat(51), lastName: 'b'.repeat(51) })).toEqual({
      firstName: 'Máximo 50 caracteres',
      lastName: 'Máximo 50 caracteres',
    });
  });

  it('uses the expected password rule message', () => {
    expect(PASSWORD_RULE_MESSAGE).toBe('Usá al menos 8 caracteres, con letras y números');
  });

  it.each([
    ['7 characters', 'abcdef1'],
    ['no numbers', 'abcdefgh'],
    ['no letters', '12345678'],
  ])('rejects a password with %s', (_case, password) => {
    expect(errors({ password, confirmPassword: password })).toEqual({
      password: PASSWORD_RULE_MESSAGE,
    });
  });

  it.each(['abcdefg1', 'ñandú123', 'CON ESPACIO 1'])('accepts the password %p', (password) => {
    expect(errors({ password, confirmPassword: password })).toEqual({});
  });

  it('rejects a confirmation that does not match', () => {
    expect(errors({ confirmPassword: 'secreta2' })).toEqual({
      confirmPassword: 'Las contraseñas no coinciden',
    });
  });

  it('reports the mismatch even when other fields have errors', () => {
    expect(errors({ firstName: '', confirmPassword: 'otra1234' })).toEqual({
      firstName: 'Ingresá tu nombre',
      confirmPassword: 'Las contraseñas no coinciden',
    });
  });
});

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
