import type { mockApi } from '../api/testing';
import { SOFIA } from './fixtures';

type Api = ReturnType<typeof mockApi>;

/** One response (or response factory) per collection the Inicio screen reads. */
export interface HomeApiData {
  user: unknown;
  memberships: unknown;
  plans: Record<string, unknown>;
  bookings: unknown;
  classSessions: unknown;
  classTypes: unknown;
  trainers: unknown;
  workoutSessions: unknown;
  workoutSets: unknown;
  routines: unknown;
  routineDays: unknown;
  routineExercises: unknown;
}

const EMPTY: HomeApiData = {
  user: SOFIA,
  memberships: [],
  plans: {},
  bookings: [],
  classSessions: [],
  classTypes: [],
  trainers: [],
  workoutSessions: [],
  workoutSets: [],
  routines: [],
  routineDays: [],
  routineExercises: [],
};

/** Routes every endpoint of Inicio; anything not overridden is empty (a new member). */
export function routeHomeApi(api: Api, overrides: Partial<HomeApiData> = {}): void {
  const data = { ...EMPTY, ...overrides };
  api.route(`/users/${SOFIA.id}`, data.user);
  for (const name of [
    'memberships',
    'bookings',
    'classSessions',
    'classTypes',
    'trainers',
    'workoutSessions',
    'workoutSets',
    'routines',
    'routineDays',
    'routineExercises',
  ] as const) {
    api.route(`/${name}`, data[name]);
  }
  for (const [id, plan] of Object.entries(data.plans)) api.route(`/plans/${id}`, plan);
}
