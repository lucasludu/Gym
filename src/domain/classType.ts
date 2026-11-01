import { z } from 'zod';

import { idSchema, nonEmptyStringSchema, positiveIntSchema } from './common';

export const intensitySchema = z.enum(['low', 'medium', 'high']);

/** Accent color tokens a class type can use; each has a light and dark value in the theme. */
export const classColorSchema = z.enum([
  'accentOrange',
  'accentBlue',
  'accentGreen',
  'accentPurple',
  'accentPink',
  'accentTeal',
]);

export const classTypeSchema = z.object({
  id: idSchema,
  name: nonEmptyStringSchema,
  description: z.string(),
  durationMinutes: positiveIntSchema,
  intensity: intensitySchema,
  /** Theme accent token, never a hex value. */
  color: classColorSchema,
});

export type Intensity = z.infer<typeof intensitySchema>;
export type ClassColor = z.infer<typeof classColorSchema>;
export type ClassType = z.infer<typeof classTypeSchema>;
