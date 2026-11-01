import { z } from 'zod';

import { idSchema, isoDateTimeSchema, isSameOrAfterInstant, toInstantMs } from './common';
import type { WorkoutSet } from './workoutSet';

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

/** Seconds from startedAt to finishedAt (whole seconds), or `null` while in progress. */
export function getWorkoutDuration(
  session: Pick<WorkoutSession, 'startedAt' | 'finishedAt'>,
): number | null {
  if (session.finishedAt === null) return null;
  const diffMs = toInstantMs(session.finishedAt) - toInstantMs(session.startedAt);
  if (diffMs < 0) throw new Error('finishedAt cannot be before startedAt');
  return Math.floor(diffMs / 1000);
}

/**
 * Sum of weightKg × reps over completed sets. Sets without weight or reps
 * (reps-only or time exercises) add nothing. Rounded to 1 decimal, like weights.
 */
export function getTotalVolume(
  sets: readonly Pick<WorkoutSet, 'weightKg' | 'reps' | 'completed'>[],
): number {
  const total = sets.reduce(
    (sum, s) =>
      s.completed && s.weightKg !== null && s.reps !== null ? sum + s.weightKg * s.reps : sum,
    0,
  );
  return Math.round(total * 10) / 10;
}
