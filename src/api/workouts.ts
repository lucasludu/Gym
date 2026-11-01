import { z } from 'zod';

import { workoutSessionSchema, type WorkoutSession } from '../domain/workoutSession';
import { workoutSetSchema, type WorkoutSet } from '../domain/workoutSet';
import { api } from './client';
import type { ReadOptions } from './types';

/** The user's workouts, newest first. On the server they are all finished. */
export function getWorkoutSessions(
  userId: string,
  options: ReadOptions = {},
): Promise<WorkoutSession[]> {
  return api.request('/workoutSessions', z.array(workoutSessionSchema), {
    ...options,
    query: { userId, _sort: 'startedAt', _order: 'desc' },
  });
}

/** Sets of several workouts, in one request. */
export async function getWorkoutSets(
  workoutSessionIds: readonly string[],
  options: ReadOptions = {},
): Promise<WorkoutSet[]> {
  if (workoutSessionIds.length === 0) return [];
  return api.request('/workoutSets', z.array(workoutSetSchema), {
    ...options,
    query: { workoutSessionId: workoutSessionIds, _sort: 'order', _order: 'asc' },
  });
}

/** A finished workout built on the phone, before the server assigns ids. */
export interface NewWorkout {
  session: Omit<WorkoutSession, 'id'>;
  sets: Omit<WorkoutSet, 'id' | 'workoutSessionId'>[];
}

const PENDING_ID = 'pending';

/**
 * Sends a finished workout: first the session, then each set with the new session id.
 * The in-progress workout lives only on the phone, so this is called once, at the end.
 * Refuses unfinished workouts and workouts without completed sets (those are discarded
 * locally) without calling the API.
 */
export async function saveWorkout(
  workout: NewWorkout,
): Promise<{ session: WorkoutSession; sets: WorkoutSet[] }> {
  if (workout.session.finishedAt === null) {
    throw new Error('Only finished workouts can be saved');
  }
  if (!workout.sets.some((s) => s.completed)) {
    throw new Error('A workout without completed sets must be discarded, not saved');
  }
  // Validate everything before the first request, so nothing is half-saved by bad data.
  workoutSessionSchema.parse({ ...workout.session, id: PENDING_ID });
  workout.sets.forEach((s) =>
    workoutSetSchema.parse({ ...s, id: PENDING_ID, workoutSessionId: PENDING_ID }),
  );

  const session = await api.request('/workoutSessions', workoutSessionSchema, {
    method: 'POST',
    body: workout.session,
  });

  const sets: WorkoutSet[] = [];
  for (const s of workout.sets) {
    sets.push(
      await api.request('/workoutSets', workoutSetSchema, {
        method: 'POST',
        body: { ...s, workoutSessionId: session.id },
      }),
    );
  }

  return { session, sets };
}
