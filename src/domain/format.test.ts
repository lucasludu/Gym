import { formatDayLabel, formatLongDate, formatTime } from './format';

describe('formatLongDate', () => {
  it('omits the year when it is the current year', () => {
    expect(formatLongDate('2026-11-12', '2026-11-01')).toBe('12 de noviembre');
  });

  it('includes the year when it is another year', () => {
    expect(formatLongDate('2027-01-03', '2026-11-01')).toBe('3 de enero de 2027');
    expect(formatLongDate('2025-12-31', '2026-01-02')).toBe('31 de diciembre de 2025');
  });

  it.each([
    ['2026-01-01', 'enero'],
    ['2026-02-01', 'febrero'],
    ['2026-03-01', 'marzo'],
    ['2026-04-01', 'abril'],
    ['2026-05-01', 'mayo'],
    ['2026-06-01', 'junio'],
    ['2026-07-01', 'julio'],
    ['2026-08-01', 'agosto'],
    ['2026-09-01', 'septiembre'],
    ['2026-10-01', 'octubre'],
    ['2026-11-01', 'noviembre'],
    ['2026-12-01', 'diciembre'],
  ])('names the month of %s', (date, month) => {
    expect(formatLongDate(date, '2026-06-15')).toBe(`1 de ${month}`);
  });

  it('uses the Buenos Aires date of "today" given as an instant', () => {
    // 2027-01-01 01:00 UTC is still 2026-12-31 in Buenos Aires.
    expect(formatLongDate('2027-01-05', new Date('2027-01-01T01:00:00Z'))).toBe(
      '5 de enero de 2027',
    );
  });
});

describe('formatTime', () => {
  it('shows the Buenos Aires time as HH:mm', () => {
    expect(formatTime('2026-11-03T19:00:00-03:00')).toBe('19:00');
    expect(formatTime('2026-11-03T22:05:00Z')).toBe('19:05');
  });

  it('pads single digits', () => {
    expect(formatTime('2026-11-03T07:05:00-03:00')).toBe('07:05');
  });

  it('shows midnight as 00:00', () => {
    expect(formatTime('2026-11-04T03:00:00Z')).toBe('00:00');
  });

  it('accepts a Date', () => {
    expect(formatTime(new Date('2026-11-03T20:30:00Z'))).toBe('17:30');
  });
});

describe('formatDayLabel', () => {
  const now = '2026-11-03T10:00:00-03:00'; // Tuesday

  it('says "Hoy" for today', () => {
    expect(formatDayLabel('2026-11-03T23:30:00-03:00', now)).toBe('Hoy');
  });

  it('says "Mañana" for tomorrow', () => {
    expect(formatDayLabel('2026-11-04T00:15:00-03:00', now)).toBe('Mañana');
  });

  it('uses the weekday and day/month otherwise', () => {
    expect(formatDayLabel('2026-11-05T19:00:00-03:00', now)).toBe('Jueves 5/11');
    expect(formatDayLabel('2026-11-09T19:00:00-03:00', now)).toBe('Lunes 9/11');
    expect(formatDayLabel('2026-11-08T19:00:00-03:00', now)).toBe('Domingo 8/11');
  });

  it('uses the weekday for past days too', () => {
    expect(formatDayLabel('2026-11-02T19:00:00-03:00', now)).toBe('Lunes 2/11');
  });

  it('compares Buenos Aires dates, not UTC', () => {
    // 01:00 UTC on Nov 4 is 22:00 on Nov 3 in Buenos Aires: still today.
    expect(formatDayLabel('2026-11-04T01:00:00Z', now)).toBe('Hoy');
  });
});
