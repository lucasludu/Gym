import { routineSchema } from './routine';

const validRoutine = {
  id: 'routine-1',
  userId: 'user-1',
  trainerId: 'trainer-1',
  name: 'Hipertrofia - Bloque 1',
  startDate: '2026-10-01',
  endDate: null,
  isActive: true,
};

describe('routineSchema', () => {
  it('accepts a routine without end date', () => {
    expect(routineSchema.parse(validRoutine)).toEqual(validRoutine);
  });

  it('accepts a routine with an end date', () => {
    const routine = { ...validRoutine, endDate: '2026-12-31', isActive: false };
    expect(routineSchema.safeParse(routine).success).toBe(true);
  });

  it.each([
    ['endDate before startDate', { endDate: '2026-09-30' }],
    ['empty name', { name: '' }],
    ['non-boolean isActive', { isActive: 'yes' }],
    ['startDate as datetime', { startDate: '2026-10-01T00:00:00-03:00' }],
  ])('rejects %s', (_label, patch) => {
    expect(routineSchema.safeParse({ ...validRoutine, ...patch }).success).toBe(false);
  });
});
