import { z } from 'zod';

import { httpUrlSchema, idSchema, isoDateTimeSchema } from './common';

export const userSchema = z.object({
  id: idSchema,
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.email(),
  avatarUrl: httpUrlSchema.nullable(),
  weeklyGoal: z.number().int().min(1).max(7).default(3),
  createdAt: isoDateTimeSchema,
});

export type User = z.infer<typeof userSchema>;
