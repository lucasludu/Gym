import { z } from 'zod';

import { NAME_MAX_LENGTH } from './user';

/** Email typed by the user: trimmed and lowercased, as stored in `User.email`. */
export const emailFieldSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, { error: 'Ingresá tu email' })
  .pipe(z.email({ error: 'Ingresá un email válido' }));

/**
 * Login form. The password only has to be present: the registration rules are not
 * enforced here, so a rule change never locks anyone out. Mock: it is never sent.
 */
export const loginFormSchema = z.object({
  email: emailFieldSchema,
  password: z.string().min(1, { error: 'Ingresá tu contraseña' }),
});

export type LoginFormInput = z.input<typeof loginFormSchema>;
export type LoginFormValues = z.output<typeof loginFormSchema>;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_RULE_MESSAGE = 'Usá al menos 8 caracteres, con letras y números';

const isStrongPassword = (value: string) =>
  value.length >= PASSWORD_MIN_LENGTH && /\p{L}/u.test(value) && /\d/.test(value);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const nameField = (missing: string) =>
  z
    .string()
    .trim()
    .min(1, { error: missing })
    .max(NAME_MAX_LENGTH, { error: `Máximo ${NAME_MAX_LENGTH} caracteres` });

/**
 * Registration form. Names and email follow `userSchema` (same limits); the password
 * rules are for the real backend: in the mock the password is never sent.
 */
export const registerFormSchema = z
  .object({
    firstName: nameField('Ingresá tu nombre'),
    lastName: nameField('Ingresá tu apellido'),
    email: emailFieldSchema,
    password: z.string().refine(isStrongPassword, { error: PASSWORD_RULE_MESSAGE }),
    confirmPassword: z.string(),
  })
  .refine((form) => form.confirmPassword === form.password, {
    error: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
    // Check the match even while other fields are invalid, so every error shows at once.
    when: ({ value }) =>
      isRecord(value) &&
      typeof value.password === 'string' &&
      typeof value.confirmPassword === 'string',
  });

export type RegisterFormInput = z.input<typeof registerFormSchema>;
export type RegisterFormValues = z.output<typeof registerFormSchema>;
