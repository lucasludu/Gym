import { workoutSessionSchema } from './workoutSession';

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
