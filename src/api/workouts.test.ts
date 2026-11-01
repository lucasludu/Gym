import { mockApi } from './testing';
import { getWorkoutSessions, getWorkoutSets, saveWorkout, type NewWorkout } from './workouts';

const session = {
  id: 'workout-1',
  userId: 'user-1',
  routineDayId: 'routine-day-1',
  startedAt: '2026-11-02T19:00:00-03:00',
  finishedAt: '2026-11-02T20:00:00-03:00',
  notes: null,
};
const set = {
  id: 'set-1',
  workoutSessionId: 'workout-1',
  exerciseId: 'wger-73',
  order: 1,
  weightKg: 60,
  reps: 8,
  seconds: null,
  completed: true,
  completedAt: '2026-11-02T19:05:00-03:00',
};

const newWorkout = (): NewWorkout => {
  const { id: _id, ...sessionInput } = session;
  const { id: _setId, workoutSessionId: _sessionId, ...setInput } = set;
  return {
    session: sessionInput,
    sets: [setInput, { ...setInput, order: 2, completed: false, completedAt: null }],
  };
};

let server: ReturnType<typeof mockApi>;
beforeEach(() => {
  server = mockApi();
});
afterEach(() => server.restore());

describe('getWorkoutSessions', () => {
  it('fetches the workouts of a user, newest first', async () => {
    server.respond([session]);
    await expect(getWorkoutSessions('user-1')).resolves.toEqual([session]);
    const { path, query } = server.lastCall;
    expect(path).toBe('/workoutSessions');
    expect(query.get('userId')).toBe('user-1');
    expect(query.get('_sort')).toBe('startedAt');
    expect(query.get('_order')).toBe('desc');
  });
});

describe('getWorkoutSets', () => {
  it('fetches the sets of several workouts in one request', async () => {
    server.respond([set]);
    await expect(getWorkoutSets(['workout-1', 'workout-2'])).resolves.toEqual([set]);
    expect(server.lastCall.path).toBe('/workoutSets');
    expect(server.lastCall.query.getAll('workoutSessionId')).toEqual(['workout-1', 'workout-2']);
  });

  it('returns an empty list without calling the API when there are no workouts', async () => {
    await expect(getWorkoutSets([])).resolves.toEqual([]);
    expect(server.calls).toHaveLength(0);
  });
});

describe('saveWorkout', () => {
  it('creates the session and then each set linked to its new id', async () => {
    const created = { ...session, id: 'srv-1' };
    server.respond(
      created,
      { ...set, id: 'srv-set-1', workoutSessionId: 'srv-1' },
      {
        ...set,
        id: 'srv-set-2',
        workoutSessionId: 'srv-1',
        order: 2,
        completed: false,
        completedAt: null,
      },
    );
    const result = await saveWorkout(newWorkout());

    expect(server.calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'POST /workoutSessions',
      'POST /workoutSets',
      'POST /workoutSets',
    ]);
    expect(server.calls[0]?.body).not.toHaveProperty('id');
    expect(server.calls[1]?.body).toMatchObject({ workoutSessionId: 'srv-1', order: 1 });
    expect(server.calls[2]?.body).toMatchObject({ workoutSessionId: 'srv-1', order: 2 });
    expect(result.session).toEqual(created);
    expect(result.sets.map((s) => s.id)).toEqual(['srv-set-1', 'srv-set-2']);
  });

  it('refuses a workout that is still in progress', async () => {
    const workout = newWorkout();
    await expect(
      saveWorkout({ ...workout, session: { ...workout.session, finishedAt: null } }),
    ).rejects.toThrow(/finished/);
    expect(server.calls).toHaveLength(0);
  });

  it('refuses a workout without completed sets (it must be discarded locally)', async () => {
    const workout = newWorkout();
    await expect(
      saveWorkout({
        ...workout,
        sets: workout.sets.map((s) => ({ ...s, completed: false, completedAt: null })),
      }),
    ).rejects.toThrow(/completed/);
    expect(server.calls).toHaveLength(0);
  });
});
