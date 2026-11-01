import { z } from 'zod';

import { idSchema, positiveIntSchema, weightKgSchema } from './common';

const isValidTargetReps = (value: string): boolean => {
  if (value === 'AMRAP') return true;

  const match = /^(\d+)(?:-(\d+))?$/.exec(value);
  if (!match) return false;

  const min = Number(match[1]);
  const max = match[2] === undefined ? min : Number(match[2]);
  return min > 0 && max >= min;
};

/** Planned exercise within a routine day. */
export const routineExerciseSchema = z.object({
  id: idSchema,
  routineDayId: idSchema,
  exerciseId: idSchema,
  order: positiveIntSchema,
  targetSets: positiveIntSchema,
  /** A number ("8"), a range ("8-10") or "AMRAP". */
  targetReps: z.string().refine(isValidTargetReps, {
    message: 'targetReps must be a number, a range like "8-10", or "AMRAP"',
  }),
  /** Suggested weight; `null` when free. */
  targetWeightKg: weightKgSchema.nullable(),
  /** Only for exercises with trackingType "time". */
  targetSeconds: positiveIntSchema.nullable(),
  restSeconds: z.number().int().nonnegative().default(90),
  notes: z.string().nullable(),
});

export type RoutineExercise = z.infer<typeof routineExerciseSchema>;
