import { z } from 'zod';

import { idSchema, isoDateTimeSchema, positiveIntSchema } from './common';

/**
 * Stored fields only; `spotsLeft`, `isFull` and `hasStarted` are derived in the domain.
 * `bookedCount` may exceed `capacity` (overbooking); derived functions handle it.
 */
export const classSessionSchema = z.object({
  id: idSchema,
  classTypeId: idSchema,
  trainerId: idSchema,
  startsAt: isoDateTimeSchema,
  capacity: positiveIntSchema,
  bookedCount: z.number().int().nonnegative(),
});

export type ClassSession = z.infer<typeof classSessionSchema>;
