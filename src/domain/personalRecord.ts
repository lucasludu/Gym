import { z } from 'zod';

import {
  idSchema,
  isoDateTimeSchema,
  positiveIntSchema,
  toInstantMs,
  weightKgSchema,
} from './common';
import type { WorkoutSet } from './workoutSet';

/** Derived per exercise from completed sets; never stored. */
export const personalRecordSchema = z.object({
  exerciseId: idSchema,
  maxWeightKg: weightKgSchema.nullable(),
  bestEstimated1RmKg: weightKgSchema.nullable(),
  maxReps: positiveIntSchema.nullable(),
  maxSeconds: positiveIntSchema.nullable(),
  /** completedAt of the set that set the main record (1RM, else reps, else seconds). */
  achievedAt: isoDateTimeSchema,
});

export type PersonalRecord = z.infer<typeof personalRecordSchema>;

/** The fields of a set needed to compute records. */
export type RecordSet = Pick<
  WorkoutSet,
  'exerciseId' | 'weightKg' | 'reps' | 'seconds' | 'completed' | 'completedAt'
>;

/** Epley loses precision above this many reps, so no estimate is made. */
export const MAX_1RM_REPS = 12;

const roundToHalf = (value: number): number => Math.round(value * 2) / 2;

/**
 * Estimated one-rep max with the Epley formula, rounded to 0.5 kg.
 * 1 rep returns the weight itself; outside 1–MAX_1RM_REPS reps returns `null`.
 */
export function estimate1Rm(weightKg: number, reps: number): number | null {
  if (!Number.isFinite(weightKg) || weightKg < 0) {
    throw new Error(`weightKg must be a non-negative number, got ${weightKg}`);
  }
  if (!Number.isInteger(reps) || reps < 0) {
    throw new Error(`reps must be a non-negative integer, got ${reps}`);
  }
  if (reps < 1 || reps > MAX_1RM_REPS) return null;
  if (reps === 1) return weightKg;
  return roundToHalf(weightKg * (1 + reps / 30));
}

type CompletedSet = RecordSet & { completedAt: string };

const isCompleted = (s: RecordSet): s is CompletedSet => s.completed && s.completedAt !== null;

const set1Rm = (s: RecordSet): number | null =>
  s.weightKg !== null && s.reps !== null ? estimate1Rm(s.weightKg, s.reps) : null;

interface Best {
  value: number;
  achievedAt: string;
}

/** Highest value of a metric; on a tie, the set completed first wins. */
const findBest = (
  sets: readonly CompletedSet[],
  metric: (s: CompletedSet) => number | null,
): Best | null =>
  sets.reduce<Best | null>((best, s) => {
    const value = metric(s);
    if (value === null) return best;
    const isBetter =
      best === null ||
      value > best.value ||
      (value === best.value && toInstantMs(s.completedAt) < toInstantMs(best.achievedAt));
    return isBetter ? { value, achievedAt: s.completedAt } : best;
  }, null);

const recordOf = (exerciseId: string, sets: readonly CompletedSet[]): PersonalRecord | null => {
  const weight = findBest(sets, (s) => s.weightKg);
  const oneRm = findBest(sets, set1Rm);
  const reps = findBest(sets, (s) => s.reps);
  const seconds = findBest(sets, (s) => s.seconds);

  const main = oneRm ?? reps ?? seconds;
  if (main === null) return null;

  return {
    exerciseId,
    maxWeightKg: weight?.value ?? null,
    bestEstimated1RmKg: oneRm?.value ?? null,
    maxReps: reps?.value ?? null,
    maxSeconds: seconds?.value ?? null,
    achievedAt: main.achievedAt,
  };
};

/**
 * One record per exercise with at least one completed set,
 * in order of first appearance. Sets not completed are ignored.
 */
export function getPersonalRecords(sets: readonly RecordSet[]): PersonalRecord[] {
  const byExercise = new Map<string, CompletedSet[]>();
  for (const s of sets.filter(isCompleted)) {
    byExercise.set(s.exerciseId, [...(byExercise.get(s.exerciseId) ?? []), s]);
  }

  return [...byExercise].flatMap(([exerciseId, exerciseSets]) => {
    const record = recordOf(exerciseId, exerciseSets);
    return record === null ? [] : [record];
  });
}

/** Strictly greater than a previous value; no previous value is never a record. */
const beats = (value: number | null, previous: number | null): boolean =>
  value !== null && previous !== null && value > previous;

/**
 * True if a completed set strictly beats the previous record in its main metrics:
 * weight and reps → maxWeightKg or bestEstimated1RmKg; reps only → maxReps;
 * seconds only → maxSeconds. Ties and first-time sets (no previous value) are not records.
 */
export function isNewRecord(set: RecordSet, previous: PersonalRecord | null): boolean {
  if (previous !== null && previous.exerciseId !== set.exerciseId) {
    throw new Error(
      `Set of "${set.exerciseId}" cannot be compared with a record of "${previous.exerciseId}"`,
    );
  }
  if (!isCompleted(set) || previous === null) return false;

  if (set.weightKg !== null && set.reps !== null) {
    return (
      beats(set.weightKg, previous.maxWeightKg) || beats(set1Rm(set), previous.bestEstimated1RmKg)
    );
  }
  if (set.reps !== null) return beats(set.reps, previous.maxReps);
  return beats(set.seconds, previous.maxSeconds);
}
