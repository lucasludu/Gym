import { z } from 'zod';

import { idSchema, isoDateTimeSchema, isSameOrAfterInstant } from './common';

/**
 * Stored fields only; `durationSeconds` and `totalVolumeKg` are derived in the domain.
 * `finishedAt` is `null` while the session is in progress.
 */
export const workoutSessionSchema = z
  .object({
    id: idSchema,
    userId: idSchema,
    /** `null` for a free workout. */
    routineDayId: idSchema.nullable(),
    startedAt: isoDateTimeSchema,
    finishedAt: isoDateTimeSchema.nullable(),
    notes: z.string().nullable(),
  })
  .refine((s) => s.finishedAt === null || isSameOrAfterInstant(s.startedAt, s.finishedAt), {
    message: 'finishedAt cannot be before startedAt',
    path: ['finishedAt'],
  });

export type WorkoutSession = z.infer<typeof workoutSessionSchema>;
