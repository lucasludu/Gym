import { routineExerciseSchema } from './routineExercise';

const validRoutineExercise = {
  id: 'routine-exercise-1',
  routineDayId: 'routine-day-1',
  exerciseId: 'exercise-1',
  order: 1,
  targetSets: 4,
  targetReps: '8-10',
  targetWeightKg: 60,
  targetSeconds: null,
  restSeconds: 90,
  notes: null,
};

describe('routineExerciseSchema', () => {
  it('accepts a valid routine exercise', () => {
    expect(routineExerciseSchema.parse(validRoutineExercise)).toEqual(validRoutineExercise);
  });

  it.each(['8', '12', '8-10', '6-6', 'AMRAP'])('accepts targetReps %p', (targetReps) => {
    const value = { ...validRoutineExercise, targetReps };
    expect(routineExerciseSchema.safeParse(value).success).toBe(true);
  });

  it('defaults restSeconds to 90 when missing', () => {
    const { restSeconds: _omit, ...withoutRest } = validRoutineExercise;
    expect(routineExerciseSchema.parse(withoutRest).restSeconds).toBe(90);
  });

  it('accepts a free weight (null) and a time target', () => {
    const value = { ...validRoutineExercise, targetWeightKg: null, targetSeconds: 45 };
    expect(routineExerciseSchema.safeParse(value).success).toBe(true);
  });

  it('accepts restSeconds 0 (no rest)', () => {
    const value = { ...validRoutineExercise, restSeconds: 0 };
    expect(routineExerciseSchema.safeParse(value).success).toBe(true);
  });

  it.each([
    ['empty targetReps', { targetReps: '' }],
    ['targetReps 0', { targetReps: '0' }],
    ['inverted range', { targetReps: '10-8' }],
    ['incomplete range', { targetReps: '8-' }],
    ['range starting at 0', { targetReps: '0-8' }],
    ['free text', { targetReps: 'muchas' }],
    ['targetSets 0', { targetSets: 0 }],
    ['non-integer targetSets', { targetSets: 3.5 }],
    ['negative targetWeightKg', { targetWeightKg: -5 }],
    ['targetWeightKg with 2 decimals', { targetWeightKg: 82.55 }],
    ['targetSeconds 0', { targetSeconds: 0 }],
    ['negative restSeconds', { restSeconds: -1 }],
    ['order 0', { order: 0 }],
  ])('rejects %s', (_label, patch) => {
    const value = { ...validRoutineExercise, ...patch };
    expect(routineExerciseSchema.safeParse(value).success).toBe(false);
  });
});
