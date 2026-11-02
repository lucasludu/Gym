import { getClassCardSummary, type ClassCardInput } from './classCardSummary';

const NOW = '2026-11-03T10:00:00-03:00';

const input = (patch: Partial<ClassCardInput> = {}): ClassCardInput => ({
  startsAt: '2026-11-03T19:00:00-03:00',
  durationMinutes: 60,
  capacity: 12,
  bookedCount: 8,
  booked: false,
  now: NOW,
  ...patch,
});

describe('getClassCardSummary', () => {
  it('gives the start and end time', () => {
    expect(getClassCardSummary(input()).timeRange).toBe('19:00 – 20:00');
    expect(getClassCardSummary(input({ durationMinutes: 45 })).timeRange).toBe('19:00 – 19:45');
  });

  it.each([
    [8, '4 lugares', 'neutral'],
    [9, 'Últimos 3 lugares', 'warning'],
    [10, 'Últimos 2 lugares', 'warning'],
    [11, 'Último lugar', 'warning'],
  ] as const)('with %p of 12 booked shows "%s" (criterion 8)', (bookedCount, label, tone) => {
    expect(getClassCardSummary(input({ bookedCount }))).toMatchObject({
      status: 'available',
      badge: { label, tone },
    });
  });

  it('is full without spots and not booked (criterion 9)', () => {
    expect(getClassCardSummary(input({ bookedCount: 12 }))).toMatchObject({
      status: 'full',
      badge: { label: 'Llena', tone: 'danger' },
    });
  });

  it('is booked even if full (criterion 10)', () => {
    expect(getClassCardSummary(input({ bookedCount: 12, booked: true }))).toMatchObject({
      status: 'booked',
      badge: { label: 'Reservada', tone: 'primary' },
    });
  });

  it('is started once it starts, also when full or already over (criterion 11)', () => {
    for (const now of ['2026-11-03T19:00:00-03:00', '2026-11-03T22:00:00-03:00']) {
      expect(getClassCardSummary(input({ now, bookedCount: 12 }))).toMatchObject({
        status: 'started',
        badge: { label: 'Empezada', tone: 'neutral' },
      });
    }
  });

  it('keeps "Reservada" over "Empezada"', () => {
    const now = '2026-11-03T19:30:00-03:00';
    expect(getClassCardSummary(input({ now, booked: true })).status).toBe('booked');
  });

  it('never shows more spots than the capacity or fewer than 0', () => {
    expect(getClassCardSummary(input({ bookedCount: 15 })).status).toBe('full');
    expect(getClassCardSummary(input({ capacity: 4, bookedCount: -2 })).badge.label).toBe(
      '4 lugares',
    );
  });
});
