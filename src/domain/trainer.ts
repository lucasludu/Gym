import { z } from 'zod';

import { httpUrlSchema, idSchema, nonEmptyStringSchema } from './common';

export const trainerSchema = z.object({
  id: idSchema,
  firstName: nonEmptyStringSchema,
  lastName: nonEmptyStringSchema,
  avatarUrl: httpUrlSchema.nullable(),
});

export type Trainer = z.infer<typeof trainerSchema>;
