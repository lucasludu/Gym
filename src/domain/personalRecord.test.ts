import {
  MAX_1RM_REPS,
  estimate1Rm,
  getPersonalRecords,
  isNewRecord,
  personalRecordSchema,
  type PersonalRecord,
  type RecordSet,
} from './personalRecord';

describe('estimate1Rm', () => {
  it('applies the Epley formula: weight × (1 + reps / 30)', () => {
    expect(estimate1Rm(90, 10)).toBe(120); // 90 × 1.333… = 120
  });

  it('returns the weight itself for 1 rep', () => {
    expect(estimate1Rm(102.5, 1)).toBe(102.5);
  });

  it('rounds to the nearest 0.5 kg', () => {
    expect(estimate1Rm(100, 5)).toBe(116.5); // 116.67
    expect(estimate1Rm(80, 8)).toBe(101.5); // 101.33
    expect(estimate1Rm(60, 3)).toBe(66); // 66.0
    expect(estimate1Rm(50, 2)).toBe(53.5); // 53.33
  });

  it('rounds halfway values (.25 / .75) up', () => {
    expect(estimate1Rm(22.5, 3)).toBe(25); // 24.75
    expect(estimate1Rm(15, 3)).toBe(16.5); // 16.5 exact
  });

  it(`estimates up to ${MAX_1RM_REPS} reps`, () => {
    expect(MAX_1RM_REPS).toBe(12);
    expect(estimate1Rm(100, 12)).toBe(140);
  });

  it('does not estimate above 12 reps', () => {
    expect(estimate1Rm(100, 13)).toBeNull();
    expect(estimate1Rm(100, 30)).toBeNull();
  });

  it('does not estimate with 0 reps', () => {
    expect(estimate1Rm(100, 0)).toBeNull();
  });

  it('returns 0 for 0 kg', () => {
    expect(estimate1Rm(0, 5)).toBe(0);
  });

  it.each([
    ['negative weight', -10, 5],
    ['non-integer reps', 100, 2.5],
    ['negative reps', 100, -1],
    ['NaN weight', Number.NaN, 5],
  ])('throws on %s', (_label, weightKg, reps) => {
    expect(() => estimate1Rm(weightKg, reps)).toThrow();
  });
});

const set = (
  exerciseId: string,
  values: Partial<Pick<RecordSet, 'weightKg' | 'reps' | 'seconds'>>,
  completedAt: string | null = '2026-10-01T18:00:00-03:00',
): RecordSet => ({
  exerciseId,
  weightKg: values.weightKg ?? null,
  reps: values.reps ?? null,
  seconds: values.seconds ?? null,
  completed: completedAt !== null,
  completedAt,
});

const day = (d: number, time = '18:00:00') => `2026-10-${String(d).padStart(2, '0')}T${time}-03:00`;

describe('getPersonalRecords', () => {
  it('returns an empty list without sets', () => {
    expect(getPersonalRecords([])).toEqual([]);
  });

  it('computes the records of a weight_reps exercise', () => {
    const records = getPersonalRecords([
      set('squat', { weightKg: 100, reps: 5 }, day(1)), // 1RM 116.5
      set('squat', { weightKg: 110, reps: 1 }, day(2)), // 1RM 110, heaviest
      set('squat', { weightKg: 60, reps: 15 }, day(3)), // no 1RM, most reps
    ]);
    expect(records).toEqual<PersonalRecord[]>([
      {
        exerciseId: 'squat',
        maxWeightKg: 110,
        bestEstimated1RmKg: 116.5,
        maxReps: 15,
        maxSeconds: null,
        achievedAt: day(1),
      },
    ]);
  });

  it('computes the records of a reps exercise (no weight)', () => {
    const [record] = getPersonalRecords([
      set('pullup', { reps: 8 }, day(1)),
      set('pullup', { reps: 12 }, day(2)),
      set('pullup', { reps: 10 }, day(3)),
    ]);
    expect(record).toEqual({
      exerciseId: 'pullup',
      maxWeightKg: null,
      bestEstimated1RmKg: null,
      maxReps: 12,
      maxSeconds: null,
      achievedAt: day(2),
    });
  });

  it('computes the records of a time exercise', () => {
    const [record] = getPersonalRecords([
      set('plank', { seconds: 60 }, day(1)),
      set('plank', { seconds: 90 }, day(2)),
    ]);
    expect(record).toEqual({
      exerciseId: 'plank',
      maxWeightKg: null,
      bestEstimated1RmKg: null,
      maxReps: null,
      maxSeconds: 90,
      achievedAt: day(2),
    });
  });

  it('falls back to maxReps for achievedAt when no set allows a 1RM estimate', () => {
    const [record] = getPersonalRecords([
      set('curl', { weightKg: 10, reps: 20 }, day(1)),
      set('curl', { weightKg: 12, reps: 15 }, day(2)),
    ]);
    expect(record?.bestEstimated1RmKg).toBeNull();
    expect(record?.maxWeightKg).toBe(12);
    expect(record?.achievedAt).toBe(day(1));
  });

  it('ignores sets that are not completed', () => {
    const [record] = getPersonalRecords([
      set('squat', { weightKg: 100, reps: 5 }, day(1)),
      set('squat', { weightKg: 200, reps: 5 }, null),
    ]);
    expect(record?.maxWeightKg).toBe(100);
    expect(record?.bestEstimated1RmKg).toBe(116.5);
  });

  it('skips an exercise with no completed sets', () => {
    expect(getPersonalRecords([set('squat', { weightKg: 100, reps: 5 }, null)])).toEqual([]);
  });

  it('uses the first set to reach a tied record, by completion time, for achievedAt', () => {
    const [record] = getPersonalRecords([
      set('squat', { weightKg: 100, reps: 5 }, day(5)),
      set('squat', { weightKg: 100, reps: 5 }, day(2)),
      set('squat', { weightKg: 100, reps: 5 }, day(9)),
    ]);
    expect(record?.achievedAt).toBe(day(2));
  });

  it('compares completion times as instants across offsets', () => {
    const [record] = getPersonalRecords([
      set('squat', { weightKg: 100, reps: 5 }, '2026-10-02T18:00:00-03:00'), // 21:00Z
      set('squat', { weightKg: 100, reps: 5 }, '2026-10-02T20:00:00Z'), // earlier
    ]);
    expect(record?.achievedAt).toBe('2026-10-02T20:00:00Z');
  });

  it('returns one record per exercise, in order of first appearance', () => {
    const records = getPersonalRecords([
      set('bench', { weightKg: 80, reps: 5 }),
      set('plank', { seconds: 45 }),
      set('bench', { weightKg: 85, reps: 3 }),
      set('pullup', { reps: 10 }),
    ]);
    expect(records.map((r) => r.exerciseId)).toEqual(['bench', 'plank', 'pullup']);
  });

  it('returns records that pass the schema', () => {
    const records = getPersonalRecords([
      set('bench', { weightKg: 80, reps: 5 }),
      set('plank', { seconds: 45 }),
    ]);
    records.forEach((r) => expect(personalRecordSchema.safeParse(r).success).toBe(true));
  });
});

describe('isNewRecord', () => {
  const previous: PersonalRecord = {
    exerciseId: 'squat',
    maxWeightKg: 110,
    bestEstimated1RmKg: 116.5,
    maxReps: 15,
    maxSeconds: null,
    achievedAt: day(1),
  };

  describe('sets with weight and reps', () => {
    it('is a record when the estimated 1RM beats the previous best', () => {
      expect(isNewRecord(set('squat', { weightKg: 105, reps: 5 }), previous)).toBe(true); // 122.5
    });

    it('is a record when the weight beats the previous max', () => {
      expect(isNewRecord(set('squat', { weightKg: 112.5, reps: 1 }), previous)).toBe(true);
    });

    it('is not a record when the estimated 1RM ties the previous best', () => {
      expect(isNewRecord(set('squat', { weightKg: 100, reps: 5 }), previous)).toBe(false);
    });

    it('is not a record when the weight ties the previous max', () => {
      expect(isNewRecord(set('squat', { weightKg: 110, reps: 1 }), previous)).toBe(false);
    });

    it('is not a record when both are below', () => {
      expect(isNewRecord(set('squat', { weightKg: 90, reps: 5 }), previous)).toBe(false);
    });

    it('does not count more reps with a light weight as a record', () => {
      expect(isNewRecord(set('squat', { weightKg: 40, reps: 20 }), previous)).toBe(false);
    });
  });

  describe('sets with reps only', () => {
    const pullups = {
      ...previous,
      exerciseId: 'pullup',
      maxWeightKg: null,
      bestEstimated1RmKg: null,
      maxReps: 12,
    };

    it('is a record with more reps than the previous max', () => {
      expect(isNewRecord(set('pullup', { reps: 13 }), pullups)).toBe(true);
    });

    it('is not a record when it ties the previous max', () => {
      expect(isNewRecord(set('pullup', { reps: 12 }), pullups)).toBe(false);
    });
  });

  describe('sets with seconds only', () => {
    const plank = {
      ...previous,
      exerciseId: 'plank',
      maxWeightKg: null,
      bestEstimated1RmKg: null,
      maxReps: null,
      maxSeconds: 90,
    };

    it('is a record with more seconds than the previous max', () => {
      expect(isNewRecord(set('plank', { seconds: 91 }), plank)).toBe(true);
    });

    it('is not a record when it ties the previous max', () => {
      expect(isNewRecord(set('plank', { seconds: 90 }), plank)).toBe(false);
    });
  });

  it('is not a record when there is no previous record (first time)', () => {
    expect(isNewRecord(set('squat', { weightKg: 100, reps: 5 }), null)).toBe(false);
  });

  it('is not a record when the previous record has no value for that metric', () => {
    const onlyReps = { ...previous, maxWeightKg: null, bestEstimated1RmKg: null };
    expect(isNewRecord(set('squat', { weightKg: 100, reps: 5 }), onlyReps)).toBe(false);
  });

  it('is not a record when the set is not completed', () => {
    expect(isNewRecord(set('squat', { weightKg: 200, reps: 5 }, null), previous)).toBe(false);
  });

  it('throws when the set and the record belong to different exercises', () => {
    expect(() => isNewRecord(set('bench', { weightKg: 200, reps: 5 }), previous)).toThrow();
  });
});
