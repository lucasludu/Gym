import { z } from 'zod';

import { idSchema, isoDateTimeSchema, positiveIntSchema, weightKgSchema } from './common';

/**
 * Which of weightKg / reps / seconds are required depends on the exercise's trackingType,
 * which lives in another entity; that check belongs to the workout domain logic.
 */
export const workoutSetSchema = z
  .object({
    id: idSchema,
    workoutSessionId: idSchema,
    exerciseId: idSchema,
    /** Order of the set within the exercise. */
    order: positiveIntSchema,
    weightKg: weightKgSchema.nullable(),
    reps: positiveIntSchema.nullable(),
    seconds: positiveIntSchema.nullable(),
    completed: z.boolean(),
    completedAt: isoDateTimeSchema.nullable(),
  })
  .refine((s) => s.completed === (s.completedAt !== null), {
    message: 'completedAt must be set only when the set is completed',
    path: ['completedAt'],
  });

export type WorkoutSet = z.infer<typeof workoutSetSchema>;
