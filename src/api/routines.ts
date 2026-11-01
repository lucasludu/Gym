import { z } from 'zod';

import { routineSchema, type Routine } from '../domain/routine';
import { routineDaySchema, type RoutineDay } from '../domain/routineDay';
import { routineExerciseSchema, type RoutineExercise } from '../domain/routineExercise';
import { api } from './client';
import type { ReadOptions } from './types';

/** The user's active routine, or `null` if none is assigned. */
export async function getActiveRoutine(
  userId: string,
  options: ReadOptions = {},
): Promise<Routine | null> {
  const routines = await api.request('/routines', z.array(routineSchema), {
    ...options,
    query: { userId, isActive: true },
  });
  return routines[0] ?? null;
}

export function getRoutineDays(
  routineId: string,
  options: ReadOptions = {},
): Promise<RoutineDay[]> {
  return api.request('/routineDays', z.array(routineDaySchema), {
    ...options,
    query: { routineId, _sort: 'order', _order: 'asc' },
  });
}

/** Planned exercises of several routine days, in one request. */
export async function getRoutineExercises(
  routineDayIds: readonly string[],
  options: ReadOptions = {},
): Promise<RoutineExercise[]> {
  if (routineDayIds.length === 0) return [];
  return api.request('/routineExercises', z.array(routineExerciseSchema), {
    ...options,
    query: { routineDayId: routineDayIds, _sort: 'order', _order: 'asc' },
  });
}
