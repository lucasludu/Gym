import type { Booking } from './booking';
import type { ClassSession } from './classSession';
import type { ClassType } from './classType';
import { getDayClasses } from './dayClasses';
import type { Trainer } from './trainer';

const type = (id: string, name: string): ClassType => ({
  id,
  name,
  description: '',
  durationMinutes: 60,
  intensity: 'medium',
  color: 'accentBlue',
});
const yoga = type('ct-yoga', 'Yoga');
const spinning = type('ct-spinning', 'Spinning');
const funcional = type('ct-funcional', 'Funcional');
const camila: Trainer = { id: 't1', firstName: 'Camila', lastName: 'Rodríguez', avatarUrl: null };

const session = (id: string, startsAt: string, classTypeId = yoga.id): ClassSession => ({
  id,
  classTypeId,
  trainerId: camila.id,
  startsAt,
  capacity: 12,
  bookedCount: 3,
});
const booking = (classSessionId: string, status: Booking['status'] = 'confirmed'): Booking => ({
  id: `b-${classSessionId}-${status}`,
  userId: 'user-1',
  classSessionId,
  status,
  createdAt: '2026-11-01T10:00:00-03:00',
  cancelledAt: status === 'cancelled' ? '2026-11-02T10:00:00-03:00' : null,
});

const base = {
  classTypes: [yoga, spinning, funcional],
  trainers: [camila],
  bookings: [] as Booking[],
  date: '2026-11-03',
  classTypeId: null,
};

describe('getDayClasses', () => {
  it('keeps only the classes of that day in Buenos Aires', () => {
    const sessions = [
      session('mon', '2026-11-02T19:00:00-03:00'),
      session('tue', '2026-11-03T19:00:00-03:00'),
      session('tue-late-utc', '2026-11-04T02:00:00Z'), // Nov 3, 23:00 in Buenos Aires
      session('wed', '2026-11-04T07:00:00-03:00'),
    ];
    expect(getDayClasses({ ...base, sessions }).map((c) => c.session.id)).toEqual([
      'tue',
      'tue-late-utc',
    ]);
  });

  it('sorts by start time, then by class name (two rooms at once, criterion 4)', () => {
    const sessions = [
      session('yoga-19', '2026-11-03T19:00:00-03:00', yoga.id),
      session('spin-19', '2026-11-03T19:00:00-03:00', spinning.id),
      session('func-07', '2026-11-03T07:00:00-03:00', funcional.id),
    ];
    expect(getDayClasses({ ...base, sessions }).map((c) => c.session.id)).toEqual([
      'func-07',
      'spin-19',
      'yoga-19',
    ]);
  });

  it('joins the class type and trainer', () => {
    const [item] = getDayClasses({
      ...base,
      sessions: [session('s', '2026-11-03T19:00:00-03:00')],
    });
    expect(item).toMatchObject({ classType: yoga, trainer: camila, booked: false });
  });

  it('filters by class type (criterion 5)', () => {
    const sessions = [
      session('yoga', '2026-11-03T18:00:00-03:00', yoga.id),
      session('spin', '2026-11-03T19:00:00-03:00', spinning.id),
    ];
    expect(
      getDayClasses({ ...base, sessions, classTypeId: spinning.id }).map((c) => c.session.id),
    ).toEqual(['spin']);
  });

  it('marks the classes with a confirmed booking only', () => {
    const sessions = [
      session('booked', '2026-11-03T08:00:00-03:00'),
      session('cancelled', '2026-11-03T09:00:00-03:00'),
      session('free', '2026-11-03T10:00:00-03:00'),
    ];
    const bookings = [booking('booked'), booking('cancelled', 'cancelled')];
    expect(getDayClasses({ ...base, sessions, bookings }).map((c) => c.booked)).toEqual([
      true,
      false,
      false,
    ]);
  });

  it('marks nothing as booked when the bookings are unknown (failed to load)', () => {
    const sessions = [session('s', '2026-11-03T08:00:00-03:00')];
    expect(getDayClasses({ ...base, sessions, bookings: null })[0]?.booked).toBe(false);
  });

  it('leaves out classes whose type or trainer is unknown', () => {
    const sessions = [
      session('ok', '2026-11-03T08:00:00-03:00'),
      session('no-type', '2026-11-03T09:00:00-03:00', 'ct-gone'),
      { ...session('no-trainer', '2026-11-03T10:00:00-03:00'), trainerId: 't-gone' },
    ];
    expect(getDayClasses({ ...base, sessions }).map((c) => c.session.id)).toEqual(['ok']);
  });
});
