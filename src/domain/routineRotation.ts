import { toInstantMs } from './common';
import type { RoutineDay } from './routineDay';
import type { WorkoutSession } from './workoutSession';

/**
 * "Today's workout": the day after the last one trained with this routine, by `order`,
 * wrapping around after the last. Free workouts and days of other routines are ignored.
 * Never trained with it → the day with the lowest order. No days → null.
 */
export function getNextRoutineDay<D extends Pick<RoutineDay, 'id' | 'order'>>(
  days: readonly D[],
  sessions: readonly Pick<WorkoutSession, 'routineDayId' | 'startedAt'>[],
): D | null {
  const sorted = [...days].sort((a, b) => a.order - b.order);
  const first = sorted[0];
  if (first === undefined) return null;

  const dayIds = new Set(sorted.map((d) => d.id));
  let last: Pick<WorkoutSession, 'routineDayId' | 'startedAt'> | null = null;
  for (const s of sessions) {
    if (s.routineDayId === null || !dayIds.has(s.routineDayId)) continue;
    if (last === null || toInstantMs(s.startedAt) > toInstantMs(last.startedAt)) last = s;
  }
  if (last === null) return first;

  const index = sorted.findIndex((d) => d.id === last.routineDayId);
  return sorted[(index + 1) % sorted.length] ?? first;
}
