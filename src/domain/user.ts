import { z } from 'zod';

import { httpUrlSchema, idSchema, isoDateTimeSchema } from './common';

/** Maximum length of firstName and lastName. */
export const NAME_MAX_LENGTH = 50;

export const userSchema = z.object({
  id: idSchema,
  firstName: z.string().min(1).max(NAME_MAX_LENGTH),
  lastName: z.string().min(1).max(NAME_MAX_LENGTH),
  email: z.email(),
  avatarUrl: httpUrlSchema.nullable(),
  weeklyGoal: z.number().int().min(1).max(7).default(3),
  createdAt: isoDateTimeSchema,
});

export type User = z.infer<typeof userSchema>;
