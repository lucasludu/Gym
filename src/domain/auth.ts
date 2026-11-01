import { z } from 'zod';

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
