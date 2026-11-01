import { skipToken, useQuery } from '@tanstack/react-query';

import { getActiveRoutine, getRoutineDays, getRoutineExercises } from '../api/routines';
import type { Routine } from '../domain/routine';
import type { RoutineDay } from '../domain/routineDay';
import type { RoutineExercise } from '../domain/routineExercise';
import { queryKeys } from './queryKeys';

export interface RoutineWithDays {
  routine: Routine;
  /** Sorted by order. */
  days: RoutineDay[];
  /** Planned exercises of every day, sorted by order. */
  exercises: RoutineExercise[];
}

/** The user's active routine with its days and exercises, or `null` if none is assigned. */
export function useRoutine(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.routine(userId),
    queryFn:
      userId === null
        ? skipToken
        : async ({ signal }): Promise<RoutineWithDays | null> => {
            const routine = await getActiveRoutine(userId, { signal });
            if (routine === null) return null;
            const days = await getRoutineDays(routine.id, { signal });
            const exercises = await getRoutineExercises(
              days.map((d) => d.id),
              { signal },
            );
            return { routine, days, exercises };
          },
  });
}
