import type { WorkoutSet } from './workoutSet';
import { getTotalVolume, getWorkoutDuration, workoutSessionSchema } from './workoutSession';

const validSession = {
  id: 'workout-1',
  userId: 'user-1',
  routineDayId: 'routine-day-1',
  startedAt: '2026-10-30T18:00:00-03:00',
  finishedAt: '2026-10-30T19:10:00-03:00',
  notes: null,
};

describe('workoutSessionSchema', () => {
  it('accepts a finished session', () => {
    expect(workoutSessionSchema.parse(validSession)).toEqual(validSession);
  });

  it('accepts a session in progress (finishedAt null)', () => {
    const session = { ...validSession, finishedAt: null };
    expect(workoutSessionSchema.safeParse(session).success).toBe(true);
  });

  it('accepts a free workout (routineDayId null)', () => {
    const session = { ...validSession, routineDayId: null };
    expect(workoutSessionSchema.safeParse(session).success).toBe(true);
  });

  it('compares start and finish as instants, even with different offsets', () => {
    // 21:30Z is 18:30 in Buenos Aires, 30 minutes after the start.
    const session = { ...validSession, finishedAt: '2026-10-30T21:30:00Z' };
    expect(workoutSessionSchema.safeParse(session).success).toBe(true);
  });

  it('does not keep derived fields (durationSeconds, totalVolumeKg)', () => {
    const parsed = workoutSessionSchema.parse({
      ...validSession,
      durationSeconds: 4200,
      totalVolumeKg: 5000,
    });
    expect(parsed).not.toHaveProperty('durationSeconds');
    expect(parsed).not.toHaveProperty('totalVolumeKg');
  });

  it.each([
    ['finishedAt before startedAt', { finishedAt: '2026-10-30T17:59:00-03:00' }],
    ['finishedAt before startedAt in another offset', { finishedAt: '2026-10-30T20:59:00Z' }],
    ['startedAt without timezone', { startedAt: '2026-10-30T18:00:00' }],
    ['empty userId', { userId: '' }],
  ])('rejects %s', (_label, patch) => {
    expect(workoutSessionSchema.safeParse({ ...validSession, ...patch }).success).toBe(false);
  });
});

describe('getWorkoutDuration', () => {
  it('returns the seconds between startedAt and finishedAt', () => {
    expect(getWorkoutDuration(validSession)).toBe(70 * 60);
  });

  it('returns null while the session is in progress', () => {
    expect(getWorkoutDuration({ ...validSession, finishedAt: null })).toBeNull();
  });

  it('returns 0 when the session finished at the same instant it started', () => {
    expect(getWorkoutDuration({ ...validSession, finishedAt: validSession.startedAt })).toBe(0);
  });

  it('compares instants across timezone offsets', () => {
    // 22:30Z is 19:30 in Buenos Aires: 90 minutes after 18:00.
    expect(getWorkoutDuration({ ...validSession, finishedAt: '2026-10-30T22:30:00Z' })).toBe(
      90 * 60,
    );
  });

  it('works across midnight', () => {
    expect(
      getWorkoutDuration({
        startedAt: '2026-10-30T23:30:00-03:00',
        finishedAt: '2026-10-31T00:15:00-03:00',
      }),
    ).toBe(45 * 60);
  });

  it('drops fractions of a second', () => {
    expect(
      getWorkoutDuration({
        startedAt: '2026-10-30T18:00:00.000-03:00',
        finishedAt: '2026-10-30T18:00:10.900-03:00',
      }),
    ).toBe(10);
  });

  it('throws when finishedAt is before startedAt', () => {
    expect(() =>
      getWorkoutDuration({ ...validSession, finishedAt: '2026-10-30T17:00:00-03:00' }),
    ).toThrow();
  });

  it('throws on an invalid datetime', () => {
    expect(() => getWorkoutDuration({ ...validSession, finishedAt: 'not-a-date' })).toThrow();
  });
});

describe('getTotalVolume', () => {
  type VolumeSet = Pick<WorkoutSet, 'weightKg' | 'reps' | 'completed'>;
  const set = (weightKg: number | null, reps: number | null, completed = true): VolumeSet => ({
    weightKg,
    reps,
    completed,
  });

  it('returns 0 for a session without sets', () => {
    expect(getTotalVolume([])).toBe(0);
  });

  it('sums weight × reps of completed sets', () => {
    expect(getTotalVolume([set(100, 5), set(80, 8), set(20, 12)])).toBe(500 + 640 + 240);
  });

  it('ignores sets that are not completed (session in progress)', () => {
    expect(getTotalVolume([set(100, 5), set(100, 5, false), set(100, 5, false)])).toBe(500);
  });

  it('returns 0 when no set is completed', () => {
    expect(getTotalVolume([set(100, 5, false), set(80, 8, false)])).toBe(0);
  });

  it('ignores sets without weight (reps exercises) or without reps (time exercises)', () => {
    expect(getTotalVolume([set(60, 10), set(null, 15), set(null, null)])).toBe(600);
  });

  it('counts a completed set with 0 kg as 0 volume', () => {
    expect(getTotalVolume([set(0, 10), set(50, 2)])).toBe(100);
  });

  it('avoids floating point drift with decimal weights', () => {
    // 0.1 + 0.2 style errors: 3 × (2.1 × 1) would give 6.300000000000001.
    expect(getTotalVolume([set(2.1, 1), set(2.1, 1), set(2.1, 1)])).toBe(6.3);
    expect(getTotalVolume([set(22.5, 3), set(17.5, 7)])).toBe(67.5 + 122.5);
  });
});
