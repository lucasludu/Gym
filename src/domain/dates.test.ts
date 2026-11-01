import { addDays, differenceInDays, getWeekEnd, getWeekStart, toLocalDate } from './dates';

describe('toLocalDate', () => {
  it('returns a plain date unchanged', () => {
    expect(toLocalDate('2026-11-03')).toBe('2026-11-03');
  });

  it('converts a datetime with Buenos Aires offset to its local date', () => {
    expect(toLocalDate('2026-11-03T00:30:00-03:00')).toBe('2026-11-03');
    expect(toLocalDate('2026-11-03T23:59:59-03:00')).toBe('2026-11-03');
  });

  it('converts UTC instants to the Buenos Aires date (UTC-3)', () => {
    // 02:00Z is 23:00 of the previous day in Buenos Aires.
    expect(toLocalDate('2026-11-03T02:00:00Z')).toBe('2026-11-02');
    // 03:00Z is exactly midnight in Buenos Aires.
    expect(toLocalDate('2026-11-03T03:00:00Z')).toBe('2026-11-03');
  });

  it('converts instants with other offsets', () => {
    // 01:00 in Madrid (+01:00) is 21:00 of the previous day in Buenos Aires.
    expect(toLocalDate('2026-11-03T01:00:00+01:00')).toBe('2026-11-02');
  });

  it('accepts a Date object', () => {
    expect(toLocalDate(new Date('2026-11-03T02:00:00Z'))).toBe('2026-11-02');
  });

  it('handles month and year changes when converting', () => {
    expect(toLocalDate('2026-12-01T02:00:00Z')).toBe('2026-11-30');
    expect(toLocalDate('2027-01-01T02:59:59Z')).toBe('2026-12-31');
  });

  it.each(['', 'not a date', '2026-02-30', '2026-13-01', '2026-11-03T18:00:00'])(
    'throws on invalid input %p',
    (value) => {
      expect(() => toLocalDate(value)).toThrow();
    },
  );

  it('throws on an invalid Date object', () => {
    expect(() => toLocalDate(new Date('nope'))).toThrow();
  });
});

describe('addDays', () => {
  it('adds and subtracts days', () => {
    expect(addDays('2026-11-03', 1)).toBe('2026-11-04');
    expect(addDays('2026-11-03', -1)).toBe('2026-11-02');
    expect(addDays('2026-11-03', 0)).toBe('2026-11-03');
  });

  it('crosses month and year boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
  });

  it('handles leap years', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01');
  });

  it('throws when days is not an integer', () => {
    expect(() => addDays('2026-11-03', 1.5)).toThrow();
  });
});

describe('getWeekStart (Monday)', () => {
  it('returns the same date on a Monday', () => {
    expect(getWeekStart('2026-11-02')).toBe('2026-11-02');
  });

  it('returns the previous Monday on a Sunday (week is Monday to Sunday)', () => {
    expect(getWeekStart('2026-11-08')).toBe('2026-11-02');
  });

  it('crosses into the previous month', () => {
    // Sunday 2026-11-01 belongs to the week starting Monday 2026-10-26.
    expect(getWeekStart('2026-11-01')).toBe('2026-10-26');
  });

  it('crosses into the previous year', () => {
    // Friday 2027-01-01 belongs to the week starting Monday 2026-12-28.
    expect(getWeekStart('2027-01-01')).toBe('2026-12-28');
  });

  it('crosses a leap day', () => {
    expect(getWeekStart('2028-03-01')).toBe('2028-02-28');
  });

  it('uses the Buenos Aires date of a datetime, not the UTC date', () => {
    // 02:00Z on Monday 2026-11-02 is still Sunday 2026-11-01 in Buenos Aires.
    expect(getWeekStart('2026-11-02T02:00:00Z')).toBe('2026-10-26');
    expect(getWeekStart('2026-11-02T03:00:00Z')).toBe('2026-11-02');
  });
});

describe('getWeekEnd (Sunday)', () => {
  it('returns the next Sunday on a Monday', () => {
    expect(getWeekEnd('2026-11-02')).toBe('2026-11-08');
  });

  it('returns the same date on a Sunday', () => {
    expect(getWeekEnd('2026-11-08')).toBe('2026-11-08');
  });

  it('crosses into the next month', () => {
    expect(getWeekEnd('2026-10-28')).toBe('2026-11-01');
  });

  it('crosses into the next year', () => {
    expect(getWeekEnd('2026-12-30')).toBe('2027-01-03');
  });

  it('uses the Buenos Aires date of a datetime', () => {
    // Late Sunday night in Buenos Aires is already Monday in UTC.
    expect(getWeekEnd('2026-11-01T23:30:00-03:00')).toBe('2026-11-01');
  });
});

describe('differenceInDays', () => {
  it('returns 0 for the same day', () => {
    expect(differenceInDays('2026-11-03', '2026-11-03')).toBe(0);
  });

  it('returns a positive number when the second date is later', () => {
    expect(differenceInDays('2026-11-01', '2026-11-06')).toBe(5);
  });

  it('returns a negative number when the second date is earlier', () => {
    expect(differenceInDays('2026-11-06', '2026-11-01')).toBe(-5);
  });

  it('crosses month and year boundaries', () => {
    expect(differenceInDays('2026-10-30', '2026-11-02')).toBe(3);
    expect(differenceInDays('2026-12-30', '2027-01-02')).toBe(3);
  });

  it('counts the leap day', () => {
    expect(differenceInDays('2028-02-28', '2028-03-01')).toBe(2);
    expect(differenceInDays('2027-02-28', '2027-03-01')).toBe(1);
  });

  it('counts calendar days in Buenos Aires, not 24-hour periods', () => {
    // 40 minutes apart but on different calendar days.
    expect(differenceInDays('2026-11-03T23:30:00-03:00', '2026-11-04T00:10:00-03:00')).toBe(1);
    // 23 hours apart but on the same calendar day.
    expect(differenceInDays('2026-11-03T00:30:00-03:00', '2026-11-03T23:30:00-03:00')).toBe(0);
  });

  it('mixes plain dates and datetimes', () => {
    // 2026-11-05T02:00:00Z is 2026-11-04 in Buenos Aires.
    expect(differenceInDays('2026-11-03', '2026-11-05T02:00:00Z')).toBe(1);
  });
});
