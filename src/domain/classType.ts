import { z } from 'zod';

import { idSchema, nonEmptyStringSchema, positiveIntSchema } from './common';

export const intensitySchema = z.enum(['low', 'medium', 'high']);

export const classTypeSchema = z.object({
  id: idSchema,
  name: nonEmptyStringSchema,
  description: z.string(),
  durationMinutes: positiveIntSchema,
  intensity: intensitySchema,
  /** Theme color token in camelCase (e.g. "accentOrange"), never a hex value. */
  color: z.string().regex(/^[a-z][a-zA-Z0-9]*$/, 'color must be a theme token, not a hex value'),
});

export type Intensity = z.infer<typeof intensitySchema>;
export type ClassType = z.infer<typeof classTypeSchema>;
