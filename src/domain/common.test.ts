import { idSchema, isoDateSchema, isoDateTimeSchema, weightKgSchema } from './common';

describe('idSchema', () => {
  it('accepts readable mock ids and UUIDs', () => {
    expect(idSchema.safeParse('class-1').success).toBe(true);
    expect(idSchema.safeParse('3f2b8c1e-9a4d-4e6b-8f1a-2c3d4e5f6a7b').success).toBe(true);
  });

  it('rejects an empty id', () => {
    expect(idSchema.safeParse('').success).toBe(false);
  });
});

describe('isoDateTimeSchema', () => {
  it('accepts ISO datetimes with a timezone offset or Z', () => {
    expect(isoDateTimeSchema.safeParse('2026-11-03T18:00:00-03:00').success).toBe(true);
    expect(isoDateTimeSchema.safeParse('2026-11-03T21:00:00Z').success).toBe(true);
  });

  it('rejects datetimes without timezone and plain dates', () => {
    expect(isoDateTimeSchema.safeParse('2026-11-03T18:00:00').success).toBe(false);
    expect(isoDateTimeSchema.safeParse('2026-11-03').success).toBe(false);
  });
});

describe('isoDateSchema', () => {
  it('accepts a plain date', () => {
    expect(isoDateSchema.safeParse('2026-11-03').success).toBe(true);
  });

  it('rejects datetimes and impossible dates', () => {
    expect(isoDateSchema.safeParse('2026-11-03T18:00:00-03:00').success).toBe(false);
    expect(isoDateSchema.safeParse('2026-02-30').success).toBe(false);
  });
});

describe('weightKgSchema', () => {
  it.each([0, 20, 82.5, 1.1, 0.1, 102.3])('accepts %p kg', (value) => {
    expect(weightKgSchema.safeParse(value).success).toBe(true);
  });

  it.each([-1, -0.5, 82.55, 1.25, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects %p kg',
    (value) => {
      expect(weightKgSchema.safeParse(value).success).toBe(false);
    },
  );
});
