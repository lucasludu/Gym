import { skipToken, useQuery } from '@tanstack/react-query';

import { getWorkoutSessions, getWorkoutSets } from '../api/workouts';
import type { WorkoutSession } from '../domain/workoutSession';
import type { WorkoutSet } from '../domain/workoutSet';
import { queryKeys } from './queryKeys';

export interface WorkoutHistory {
  /** Newest first. */
  sessions: WorkoutSession[];
  sets: WorkoutSet[];
}

/** Finished workouts of the user with their sets: the input for records, charts and streak. */
export function useWorkoutHistory(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.workoutHistory(userId),
    queryFn:
      userId === null
        ? skipToken
        : async ({ signal }): Promise<WorkoutHistory> => {
            const sessions = await getWorkoutSessions(userId, { signal });
            const sets = await getWorkoutSets(
              sessions.map((s) => s.id),
              { signal },
            );
            return { sessions, sets };
          },
  });
}
