import {
  CALENDAR_WEEKS,
  describeCalendarDay,
  formatWeekRange,
  getCalendarWeekStarts,
  getDefaultDay,
  getWeekDays,
} from './classCalendar';

// Tuesday 2026-11-03 in Buenos Aires.
const TODAY = '2026-11-03T10:00:00-03:00';

describe('getCalendarWeekStarts', () => {
  it('returns the Monday of this week and of the next one', () => {
    expect(getCalendarWeekStarts(TODAY)).toEqual(['2026-11-02', '2026-11-09']);
    expect(CALENDAR_WEEKS).toBe(2);
  });

  it('on Sunday night, this week is still the one ending that day', () => {
    expect(getCalendarWeekStarts('2026-11-08T23:30:00-03:00')).toEqual([
      '2026-11-02',
      '2026-11-09',
    ]);
  });

  it('uses the Buenos Aires date, not UTC (Monday 01:00 UTC is still Sunday)', () => {
    expect(getCalendarWeekStarts('2026-11-09T01:00:00Z')).toEqual(['2026-11-02', '2026-11-09']);
  });
});

describe('getWeekDays', () => {
  it('lists Monday to Sunday with short name and day of month', () => {
    const days = getWeekDays('2026-11-02', TODAY);
    expect(days.map((d) => `${d.shortName} ${d.dayOfMonth}`)).toEqual([
      'Lun 2',
      'Mar 3',
      'Mié 4',
      'Jue 5',
      'Vie 6',
      'Sáb 7',
      'Dom 8',
    ]);
  });

  it('marks today and the past days', () => {
    const days = getWeekDays('2026-11-02', TODAY);
    expect(days.map((d) => d.isToday)).toEqual([false, true, false, false, false, false, false]);
    expect(days.map((d) => d.isPast)).toEqual([true, false, false, false, false, false, false]);
  });

  it('crosses months', () => {
    const days = getWeekDays('2026-11-30', TODAY);
    expect(days.map((d) => d.date)).toEqual([
      '2026-11-30',
      '2026-12-01',
      '2026-12-02',
      '2026-12-03',
      '2026-12-04',
      '2026-12-05',
      '2026-12-06',
    ]);
    expect(days.map((d) => d.dayOfMonth)).toEqual([30, 1, 2, 3, 4, 5, 6]);
  });

  it('rejects a date that is not a Monday', () => {
    expect(() => getWeekDays('2026-11-03', TODAY)).toThrow();
  });
});

describe('formatWeekRange', () => {
  it('within a month', () => {
    expect(formatWeekRange('2026-11-02', TODAY)).toBe('2 al 8 de noviembre');
  });

  it('across months', () => {
    expect(formatWeekRange('2026-11-30', TODAY)).toBe('30 de noviembre al 6 de diciembre');
  });

  it('across years, with both years', () => {
    expect(formatWeekRange('2026-12-28', TODAY)).toBe(
      '28 de diciembre de 2026 al 3 de enero de 2027',
    );
  });

  it('in another year, with the year once', () => {
    expect(formatWeekRange('2027-01-04', TODAY)).toBe('4 al 10 de enero de 2027');
  });
});

describe('getDefaultDay', () => {
  it('is today in the current week', () => {
    expect(getDefaultDay('2026-11-02', TODAY)).toBe('2026-11-03');
  });

  it('is the Monday in another week', () => {
    expect(getDefaultDay('2026-11-09', TODAY)).toBe('2026-11-09');
  });
});

describe('describeCalendarDay', () => {
  it('gives the full date for screen readers, marking today', () => {
    expect(describeCalendarDay('2026-11-03', TODAY)).toBe('Martes 3 de noviembre, hoy');
    expect(describeCalendarDay('2026-11-04', TODAY)).toBe('Miércoles 4 de noviembre');
  });
});
