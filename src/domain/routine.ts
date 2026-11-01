import { z } from 'zod';

import { idSchema, isoDateSchema, nonEmptyStringSchema } from './common';

/** Routine assigned by a trainer. A member has at most one active routine. */
export const routineSchema = z
  .object({
    id: idSchema,
    userId: idSchema,
    trainerId: idSchema,
    name: nonEmptyStringSchema,
    startDate: isoDateSchema,
    endDate: isoDateSchema.nullable(),
    isActive: z.boolean(),
  })
  .refine((r) => r.endDate === null || r.endDate >= r.startDate, {
    message: 'endDate cannot be before startDate',
    path: ['endDate'],
  });

export type Routine = z.infer<typeof routineSchema>;
