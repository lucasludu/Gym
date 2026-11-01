import { workoutSetSchema } from './workoutSet';

const validSet = {
  id: 'set-1',
  workoutSessionId: 'workout-1',
  exerciseId: 'exercise-1',
  order: 1,
  weightKg: 80,
  reps: 8,
  seconds: null,
  completed: true,
  completedAt: '2026-10-30T18:05:00-03:00',
};

describe('workoutSetSchema', () => {
  it('accepts a completed weight_reps set', () => {
    expect(workoutSetSchema.parse(validSet)).toEqual(validSet);
  });

  it('accepts a reps-only set', () => {
    const set = { ...validSet, weightKg: null };
    expect(workoutSetSchema.safeParse(set).success).toBe(true);
  });

  it('accepts a time set', () => {
    const set = { ...validSet, weightKg: null, reps: null, seconds: 45 };
    expect(workoutSetSchema.safeParse(set).success).toBe(true);
  });

  it('accepts a pending set (not completed, no completedAt)', () => {
    const set = { ...validSet, completed: false, completedAt: null };
    expect(workoutSetSchema.safeParse(set).success).toBe(true);
  });

  it('accepts weightKg 0 and 1 decimal', () => {
    expect(workoutSetSchema.safeParse({ ...validSet, weightKg: 0 }).success).toBe(true);
    expect(workoutSetSchema.safeParse({ ...validSet, weightKg: 82.5 }).success).toBe(true);
  });

  it.each([
    ['reps 0', { reps: 0 }],
    ['non-integer reps', { reps: 8.5 }],
    ['negative weightKg', { weightKg: -1 }],
    ['weightKg with 2 decimals', { weightKg: 80.25 }],
    ['seconds 0', { seconds: 0 }],
    ['non-integer seconds', { seconds: 30.5 }],
    ['completed without completedAt', { completedAt: null }],
    ['not completed with completedAt', { completed: false }],
    ['order 0', { order: 0 }],
    ['empty workoutSessionId', { workoutSessionId: '' }],
  ])('rejects %s', (_label, patch) => {
    expect(workoutSetSchema.safeParse({ ...validSet, ...patch }).success).toBe(false);
  });
});
