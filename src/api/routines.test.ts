import { getActiveRoutine, getRoutineDays, getRoutineExercises } from './routines';
import { mockApi } from './testing';

const routine = {
  id: 'routine-1',
  userId: 'user-1',
  trainerId: 'trainer-1',
  name: 'Hipertrofia – Bloque 1',
  startDate: '2026-08-31',
  endDate: null,
  isActive: true,
};
const day = { id: 'routine-day-1', routineId: 'routine-1', order: 1, name: 'Día A' };
const routineExercise = {
  id: 'routine-exercise-1-1',
  routineDayId: 'routine-day-1',
  exerciseId: 'wger-615',
  order: 1,
  targetSets: 3,
  targetReps: '8-10',
  targetWeightKg: 60,
  targetSeconds: null,
  restSeconds: 90,
  notes: null,
};

let server: ReturnType<typeof mockApi>;
beforeEach(() => {
  server = mockApi();
});
afterEach(() => server.restore());

describe('getActiveRoutine', () => {
  it('returns the active routine of the user', async () => {
    server.respond([routine]);
    await expect(getActiveRoutine('user-1')).resolves.toEqual(routine);
    const { path, query } = server.lastCall;
    expect(path).toBe('/routines');
    expect(query.get('userId')).toBe('user-1');
    expect(query.get('isActive')).toBe('true');
  });

  it('returns null when the user has no active routine', async () => {
    server.respond([]);
    await expect(getActiveRoutine('user-4')).resolves.toBeNull();
  });
});

describe('getRoutineDays', () => {
  it('fetches the days of a routine sorted by order', async () => {
    server.respond([day]);
    await expect(getRoutineDays('routine-1')).resolves.toEqual([day]);
    const { path, query } = server.lastCall;
    expect(path).toBe('/routineDays');
    expect(query.get('routineId')).toBe('routine-1');
    expect(query.get('_sort')).toBe('order');
  });
});

describe('getRoutineExercises', () => {
  it('fetches the exercises of several days in one request', async () => {
    server.respond([routineExercise]);
    await expect(getRoutineExercises(['routine-day-1', 'routine-day-2'])).resolves.toEqual([
      routineExercise,
    ]);
    const { path, query } = server.lastCall;
    expect(path).toBe('/routineExercises');
    expect(query.getAll('routineDayId')).toEqual(['routine-day-1', 'routine-day-2']);
    expect(query.get('_sort')).toBe('order');
  });

  it('returns an empty list without calling the API when there are no days', async () => {
    await expect(getRoutineExercises([])).resolves.toEqual([]);
    expect(server.calls).toHaveLength(0);
  });
});
