import { getNextRoutineDay } from './routineRotation';

const day = (id: string, order: number) => ({ id, order, name: `Día ${id}` });
const A = day('A', 1);
const B = day('B', 2);
const C = day('C', 3);
const session = (routineDayId: string | null, startedAt: string) => ({ routineDayId, startedAt });

describe('getNextRoutineDay', () => {
  it('returns the day after the last one trained (criterion 17)', () => {
    expect(getNextRoutineDay([A, B, C], [session('B', '2026-11-02T08:00:00-03:00')])).toBe(C);
  });

  it('wraps around after the last day (criterion 18)', () => {
    expect(getNextRoutineDay([A, B, C], [session('C', '2026-11-02T08:00:00-03:00')])).toBe(A);
  });

  it('starts with the lowest order when the routine was never trained (criterion 19)', () => {
    expect(getNextRoutineDay([A, B, C], [])).toBe(A);
  });

  it('ignores free workouts and other routines (criterion 19)', () => {
    const sessions = [
      session(null, '2026-11-03T08:00:00-03:00'),
      session('other-routine-day', '2026-11-02T08:00:00-03:00'),
    ];
    expect(getNextRoutineDay([A, B, C], sessions)).toBe(A);
  });

  it('uses the most recent session, whatever the order of the list', () => {
    const sessions = [
      session('A', '2026-11-01T08:00:00-03:00'),
      session('B', '2026-11-03T08:00:00-03:00'),
      session('C', '2026-11-02T08:00:00-03:00'),
    ];
    expect(getNextRoutineDay([A, B, C], sessions)).toBe(C);
  });

  it('ignores free workouts more recent than the last routine day', () => {
    const sessions = [
      session(null, '2026-11-04T08:00:00-03:00'),
      session('A', '2026-11-03T08:00:00-03:00'),
    ];
    expect(getNextRoutineDay([A, B, C], sessions)).toBe(B);
  });

  it('sorts the days by order even if they come unsorted', () => {
    expect(getNextRoutineDay([C, A, B], [session('A', '2026-11-02T08:00:00-03:00')])).toBe(B);
    expect(getNextRoutineDay([C, B, A], [])).toBe(A);
  });

  it('returns the only day of a one-day routine', () => {
    expect(getNextRoutineDay([A], [session('A', '2026-11-02T08:00:00-03:00')])).toBe(A);
  });

  it('returns null for a routine without days', () => {
    expect(getNextRoutineDay([], [session('A', '2026-11-02T08:00:00-03:00')])).toBeNull();
  });

  it('compares instants, not strings', () => {
    const sessions = [
      session('A', '2026-11-03T02:00:00Z'), // Nov 2, 23:00 in Buenos Aires
      session('B', '2026-11-02T22:00:00-03:00'),
    ];
    expect(getNextRoutineDay([A, B, C], sessions)).toBe(B);
  });
});
