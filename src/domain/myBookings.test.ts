import type { BookingStatus } from './booking';
import { HISTORY_LIMIT, splitMyBookings } from './myBookings';

const NOW = '2026-11-03T10:00:00-03:00';
const item = (id: string, startsAt: string, status: BookingStatus = 'confirmed') => ({
  id,
  status,
  startsAt,
  durationMinutes: 60,
});

describe('splitMyBookings', () => {
  it('puts confirmed classes that have not ended in "Próximas", soonest first (criterion 30)', () => {
    const later = item('later', '2026-11-05T19:00:00-03:00');
    const sooner = item('sooner', '2026-11-03T19:00:00-03:00');
    const inProgress = item('now', '2026-11-03T09:30:00-03:00');
    expect(splitMyBookings([later, sooner, inProgress], NOW).upcoming).toEqual([
      inProgress,
      sooner,
      later,
    ]);
  });

  it('puts the rest in "Historial", most recent first, with their outcome (criteria 31 and 32)', () => {
    const attended = item('a', '2026-10-30T19:00:00-03:00', 'attended');
    const noShow = item('n', '2026-10-28T19:00:00-03:00', 'no_show');
    const cancelled = item('c', '2026-11-04T19:00:00-03:00', 'cancelled');
    const finished = item('f', '2026-11-02T19:00:00-03:00', 'confirmed');
    const { upcoming, history } = splitMyBookings([noShow, attended, cancelled, finished], NOW);
    expect(upcoming).toEqual([]);
    expect(history.map((h) => [h.item.id, h.outcome])).toEqual([
      ['c', 'cancelled'],
      ['f', 'finished'],
      ['a', 'attended'],
      ['n', 'no_show'],
    ]);
  });

  it('keeps only the last 20 of the history', () => {
    const many = Array.from({ length: 25 }, (_, i) =>
      item(`h${i}`, `2026-10-${String(i + 1).padStart(2, '0')}T19:00:00-03:00`, 'attended'),
    );
    const { history } = splitMyBookings(many, NOW);
    expect(HISTORY_LIMIT).toBe(20);
    expect(history).toHaveLength(20);
    expect(history[0]?.item.id).toBe('h24');
  });

  it('returns empty lists without bookings', () => {
    expect(splitMyBookings([], NOW)).toEqual({ upcoming: [], history: [] });
  });
});
