import type { BookingStatus } from './booking';
import { getNextClass, hasEnded } from './nextClass';

const NOW = '2026-11-03T10:00:00-03:00';

const booked = (
  id: string,
  startsAt: string,
  status: BookingStatus = 'confirmed',
  minutes = 60,
) => ({
  id,
  status,
  startsAt,
  durationMinutes: minutes,
});

describe('hasEnded', () => {
  it('is false before the end and true from the end on', () => {
    const c = booked('a', '2026-11-03T09:00:00-03:00');
    expect(hasEnded(c, '2026-11-03T09:59:59-03:00')).toBe(false);
    expect(hasEnded(c, '2026-11-03T10:00:00-03:00')).toBe(true);
  });
});

describe('getNextClass', () => {
  it('returns the earliest confirmed future class (criterion 7)', () => {
    const later = booked('later', '2026-11-05T19:00:00-03:00');
    const sooner = booked('sooner', '2026-11-03T19:00:00-03:00');
    expect(getNextClass([later, sooner], NOW)).toBe(sooner);
  });

  it('includes a class that started but has not ended (criterion 8)', () => {
    const inProgress = booked('now', '2026-11-03T09:30:00-03:00');
    const tomorrow = booked('tomorrow', '2026-11-04T19:00:00-03:00');
    expect(getNextClass([tomorrow, inProgress], NOW)).toBe(inProgress);
  });

  it('ignores classes that already ended (criterion 9)', () => {
    expect(getNextClass([booked('past', '2026-11-03T08:00:00-03:00')], NOW)).toBeNull();
  });

  it.each(['cancelled', 'attended', 'no_show'] as const)('ignores %s bookings', (status) => {
    expect(getNextClass([booked('x', '2026-11-04T19:00:00-03:00', status)], NOW)).toBeNull();
  });

  it('returns null without bookings', () => {
    expect(getNextClass([], NOW)).toBeNull();
  });

  it('keeps a class past midnight as next until it ends', () => {
    const late = booked('late', '2026-11-03T23:30:00-03:00', 'confirmed', 90);
    expect(getNextClass([late], '2026-11-04T00:30:00-03:00')).toBe(late);
    expect(getNextClass([late], '2026-11-04T01:00:00-03:00')).toBeNull();
  });

  it('compares instants, not strings (different offsets)', () => {
    const utc = booked('utc', '2026-11-03T21:00:00Z'); // 18:00 in Buenos Aires
    const local = booked('local', '2026-11-03T19:00:00-03:00');
    expect(getNextClass([local, utc], NOW)).toBe(utc);
  });
});
