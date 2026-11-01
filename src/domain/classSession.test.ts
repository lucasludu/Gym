import { classSessionSchema, getSpotsLeft, hasStarted, isFull } from './classSession';

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

describe('getSpotsLeft', () => {
  it('returns capacity minus booked spots', () => {
    expect(getSpotsLeft({ capacity: 20, bookedCount: 5 })).toBe(15);
  });

  it('returns the full capacity when nobody booked', () => {
    expect(getSpotsLeft({ capacity: 20, bookedCount: 0 })).toBe(20);
  });

  it('returns 1 when one spot is left', () => {
    expect(getSpotsLeft({ capacity: 20, bookedCount: 19 })).toBe(1);
  });

  it('returns 0 when the class is exactly full', () => {
    expect(getSpotsLeft({ capacity: 20, bookedCount: 20 })).toBe(0);
  });

  it('never goes below 0 when the class is overbooked', () => {
    expect(getSpotsLeft({ capacity: 20, bookedCount: 22 })).toBe(0);
  });
});

describe('isFull', () => {
  it('is false while spots are left', () => {
    expect(isFull({ capacity: 20, bookedCount: 19 })).toBe(false);
  });

  it('is true with 0 spots left', () => {
    expect(isFull({ capacity: 20, bookedCount: 20 })).toBe(true);
  });

  it('is true when overbooked', () => {
    expect(isFull({ capacity: 20, bookedCount: 22 })).toBe(true);
  });
});

describe('hasStarted', () => {
  const session = { startsAt: '2026-11-03T18:00:00-03:00' };

  it('is false before the start time', () => {
    expect(hasStarted(session, '2026-11-03T17:59:00-03:00')).toBe(false);
  });

  it('is true when the class is starting right now', () => {
    expect(hasStarted(session, '2026-11-03T18:00:00-03:00')).toBe(true);
  });

  it('is false one millisecond before the start', () => {
    expect(hasStarted(session, new Date(Date.parse(session.startsAt) - 1))).toBe(false);
  });

  it('is true after the start time', () => {
    expect(hasStarted(session, '2026-11-03T19:30:00-03:00')).toBe(true);
  });

  it('compares instants across timezone offsets', () => {
    // 21:00Z is exactly 18:00 in Buenos Aires.
    expect(hasStarted(session, '2026-11-03T21:00:00Z')).toBe(true);
    expect(hasStarted(session, '2026-11-03T20:59:59Z')).toBe(false);
  });

  it('accepts a Date as now', () => {
    expect(hasStarted(session, new Date('2026-11-03T21:00:00Z'))).toBe(true);
  });

  it.each(['2026-11-03', '2026-11-03T18:00:00', 'not a date'])(
    'throws when now is not an instant with timezone (%p)',
    (now) => {
      expect(() => hasStarted(session, now)).toThrow();
    },
  );

  it('throws when now is an invalid Date', () => {
    expect(() => hasStarted(session, new Date('nope'))).toThrow();
  });
});
