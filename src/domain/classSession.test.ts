import { classSessionSchema } from './classSession';

const validSession = {
  id: 'class-1',
  classTypeId: 'class-type-1',
  trainerId: 'trainer-1',
  startsAt: '2026-11-03T18:00:00-03:00',
  capacity: 20,
  bookedCount: 5,
};

describe('classSessionSchema', () => {
  it('accepts a valid class session', () => {
    expect(classSessionSchema.parse(validSession)).toEqual(validSession);
  });

  it('accepts a full class', () => {
    expect(classSessionSchema.safeParse({ ...validSession, bookedCount: 20 }).success).toBe(true);
  });

  it('accepts overbooking (bookedCount above capacity) so the UI can handle it', () => {
    expect(classSessionSchema.safeParse({ ...validSession, bookedCount: 22 }).success).toBe(true);
  });

  it('does not keep derived fields (spotsLeft, isFull, hasStarted)', () => {
    const parsed = classSessionSchema.parse({
      ...validSession,
      spotsLeft: 15,
      isFull: false,
      hasStarted: false,
    });
    expect(parsed).not.toHaveProperty('spotsLeft');
    expect(parsed).not.toHaveProperty('isFull');
    expect(parsed).not.toHaveProperty('hasStarted');
  });

  it.each([
    ['capacity 0', { capacity: 0 }],
    ['negative capacity', { capacity: -1 }],
    ['non-integer capacity', { capacity: 2.5 }],
    ['negative bookedCount', { bookedCount: -1 }],
    ['non-integer bookedCount', { bookedCount: 1.5 }],
    ['startsAt without timezone', { startsAt: '2026-11-03T18:00:00' }],
    ['empty classTypeId', { classTypeId: '' }],
  ])('rejects %s', (_label, patch) => {
    expect(classSessionSchema.safeParse({ ...validSession, ...patch }).success).toBe(false);
  });
});
