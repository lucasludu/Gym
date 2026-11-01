import { z } from 'zod';

import { exerciseSchema, type Exercise } from '../domain/exercise';
import { api } from './client';
import type { ReadOptions } from './types';

/** Full exercise catalog, sorted by name. */
export function getExercises(options: ReadOptions = {}): Promise<Exercise[]> {
  return api.request('/exercises', z.array(exerciseSchema), {
    ...options,
    query: { _sort: 'name', _order: 'asc' },
  });
}

export function getExercise(id: string, options: ReadOptions = {}): Promise<Exercise> {
  return api.request(`/exercises/${encodeURIComponent(id)}`, exerciseSchema, options);
}
