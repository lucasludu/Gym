import { bookingSchema, type Booking } from './booking';
import {
  CANCELLATION_LIMIT_HOURS,
  canBookClass,
  canCancelBooking,
  cancelBooking,
  findOverlappingBooking,
  type BookableClass,
  type CanBookClassInput,
  type UserBooking,
} from './bookingRules';

// Calendar: Mon 2026-11-02 to Sun 2026-11-08 is the week of the target class.
const NOW = '2026-11-02T10:00:00-03:00';

const target: BookableClass = {
  id: 'class-target',
  startsAt: '2026-11-04T18:00:00-03:00', // Wednesday
  durationMinutes: 60,
  capacity: 20,
  bookedCount: 5,
};

const activeMembership = { endDate: '2026-12-31' };
const unlimitedPlan = { weeklyClassLimit: null };

const userBooking = (
  id: string,
  startsAt: string,
  status: UserBooking['status'] = 'confirmed',
  durationMinutes = 60,
): UserBooking => ({
  status,
  classSession: { id, startsAt, durationMinutes },
});

const baseInput: CanBookClassInput = {
  classSession: target,
  membership: activeMembership,
  plan: unlimitedPlan,
  userBookings: [],
  now: NOW,
};

const check = (patch: Partial<CanBookClassInput>) => canBookClass({ ...baseInput, ...patch });

describe('canBookClass', () => {
  it('allows booking when no rule blocks it', () => {
    expect(check({})).toEqual({ ok: true });
  });

  describe('rule 1: user must have a membership', () => {
    it('blocks with no_membership when the user has no membership (just registered)', () => {
      expect(check({ membership: null, plan: null })).toEqual({
        ok: false,
        reason: 'no_membership',
      });
    });

    it('reports no_membership before any class rule', () => {
      expect(
        check({
          membership: null,
          plan: null,
          classSession: { ...target, bookedCount: 20 },
          now: target.startsAt,
        }),
      ).toEqual({ ok: false, reason: 'no_membership' });
    });

    it('throws when there is a membership but its plan is missing (inconsistent data)', () => {
      expect(() => check({ plan: null })).toThrow();
    });
  });

  describe('rule 1: membership must not be expired', () => {
    it('blocks with membership_expired when today is after endDate', () => {
      expect(check({ membership: { endDate: '2026-11-01' } })).toEqual({
        ok: false,
        reason: 'membership_expired',
      });
    });

    it('allows booking on the endDate itself (still expiring, not expired)', () => {
      expect(check({ membership: { endDate: '2026-11-02' } })).toEqual({ ok: true });
    });

    it('allows booking while the membership is expiring', () => {
      expect(check({ membership: { endDate: '2026-11-05' } })).toEqual({ ok: true });
    });
  });

  describe('rule 2: class must not be full or started', () => {
    it('blocks with class_full when no spots are left', () => {
      expect(check({ classSession: { ...target, bookedCount: 20 } })).toEqual({
        ok: false,
        reason: 'class_full',
      });
    });

    it('blocks with class_full when the class is overbooked', () => {
      expect(check({ classSession: { ...target, bookedCount: 22 } })).toEqual({
        ok: false,
        reason: 'class_full',
      });
    });

    it('allows booking the last spot', () => {
      expect(check({ classSession: { ...target, bookedCount: 19 } })).toEqual({ ok: true });
    });

    it('blocks with class_started when now is the start time', () => {
      expect(check({ now: target.startsAt })).toEqual({ ok: false, reason: 'class_started' });
    });

    it('blocks with class_started when the class already started', () => {
      expect(check({ now: '2026-11-04T18:30:00-03:00' })).toEqual({
        ok: false,
        reason: 'class_started',
      });
    });

    it('allows booking one minute before the start', () => {
      expect(check({ now: '2026-11-04T17:59:00-03:00' })).toEqual({ ok: true });
    });
  });

  describe('rule 3: no duplicate confirmed booking for the same class', () => {
    it('blocks with already_booked when the user has a confirmed booking for it', () => {
      expect(check({ userBookings: [userBooking(target.id, target.startsAt)] })).toEqual({
        ok: false,
        reason: 'already_booked',
      });
    });

    it('allows booking again after cancelling', () => {
      expect(
        check({ userBookings: [userBooking(target.id, target.startsAt, 'cancelled')] }),
      ).toEqual({ ok: true });
    });
  });

  describe('rule 4: no overlapping confirmed bookings', () => {
    it('blocks with schedule_overlap when another booking starts during the class', () => {
      expect(check({ userBookings: [userBooking('other', '2026-11-04T18:30:00-03:00')] })).toEqual({
        ok: false,
        reason: 'schedule_overlap',
      });
    });

    it('blocks when another booking is still running when the class starts', () => {
      expect(check({ userBookings: [userBooking('other', '2026-11-04T17:30:00-03:00')] })).toEqual({
        ok: false,
        reason: 'schedule_overlap',
      });
    });

    it('blocks when another booking contains the whole class', () => {
      expect(
        check({
          userBookings: [userBooking('other', '2026-11-04T17:00:00-03:00', 'confirmed', 180)],
        }),
      ).toEqual({ ok: false, reason: 'schedule_overlap' });
    });

    it('blocks when another booking starts at the same time', () => {
      expect(check({ userBookings: [userBooking('other', target.startsAt)] })).toEqual({
        ok: false,
        reason: 'schedule_overlap',
      });
    });

    it('detects overlap across timezone offsets', () => {
      // 21:30Z is 18:30 in Buenos Aires.
      expect(check({ userBookings: [userBooking('other', '2026-11-04T21:30:00Z')] })).toEqual({
        ok: false,
        reason: 'schedule_overlap',
      });
    });

    it('allows a class that ends exactly when the new one starts', () => {
      expect(check({ userBookings: [userBooking('other', '2026-11-04T17:00:00-03:00')] })).toEqual({
        ok: true,
      });
    });

    it('allows a class that starts exactly when the new one ends', () => {
      expect(check({ userBookings: [userBooking('other', '2026-11-04T19:00:00-03:00')] })).toEqual({
        ok: true,
      });
    });

    it.each(['cancelled', 'attended', 'no_show'] as const)(
      'ignores overlapping bookings with status %s',
      (status) => {
        expect(
          check({ userBookings: [userBooking('other', '2026-11-04T18:30:00-03:00', status)] }),
        ).toEqual({ ok: true });
      },
    );
  });

  describe('rule 5: weekly class limit of the plan', () => {
    const limitedPlan = { weeklyClassLimit: 2 };

    it('blocks with weekly_limit_reached when the limit is reached in the class week', () => {
      expect(
        check({
          plan: limitedPlan,
          userBookings: [
            userBooking('mon', '2026-11-02T09:00:00-03:00', 'attended'),
            userBooking('thu', '2026-11-05T09:00:00-03:00'),
          ],
        }),
      ).toEqual({ ok: false, reason: 'weekly_limit_reached' });
    });

    it('allows booking when one spot of the limit is left', () => {
      expect(
        check({
          plan: limitedPlan,
          userBookings: [userBooking('thu', '2026-11-05T09:00:00-03:00')],
        }),
      ).toEqual({ ok: true });
    });

    it.each(['cancelled', 'no_show'] as const)('does not count %s bookings', (status) => {
      expect(
        check({
          plan: limitedPlan,
          userBookings: [
            userBooking('mon', '2026-11-02T09:00:00-03:00', status),
            userBooking('thu', '2026-11-05T09:00:00-03:00', status),
          ],
        }),
      ).toEqual({ ok: true });
    });

    it('does not count bookings from the previous or next week', () => {
      expect(
        check({
          plan: limitedPlan,
          userBookings: [
            userBooking('prev-sun', '2026-11-01T20:00:00-03:00', 'attended'),
            userBooking('next-mon', '2026-11-09T09:00:00-03:00'),
          ],
        }),
      ).toEqual({ ok: true });
    });

    it('counts bookings on Monday 00:00 and Sunday 23:59 of the class week (Buenos Aires)', () => {
      expect(
        check({
          plan: limitedPlan,
          userBookings: [
            userBooking('mon', '2026-11-02T00:00:00-03:00', 'attended'),
            // 02:59Z on Monday 9th is still Sunday 8th in Buenos Aires.
            userBooking('sun', '2026-11-09T02:59:00Z'),
          ],
        }),
      ).toEqual({ ok: false, reason: 'weekly_limit_reached' });
    });

    it('uses the week of the class, not the current week', () => {
      const nextWeekClass = { ...target, startsAt: '2026-11-11T18:00:00-03:00' };
      expect(
        check({
          classSession: nextWeekClass,
          plan: limitedPlan,
          userBookings: [
            userBooking('mon', '2026-11-02T09:00:00-03:00', 'attended'),
            userBooking('thu', '2026-11-05T09:00:00-03:00'),
          ],
        }),
      ).toEqual({ ok: true });
    });

    it('never blocks when the plan has no limit', () => {
      const manyBookings = ['02', '03', '05', '06', '07'].map((day) =>
        userBooking(`day-${day}`, `2026-11-${day}T09:00:00-03:00`),
      );
      expect(check({ plan: unlimitedPlan, userBookings: manyBookings })).toEqual({ ok: true });
    });
  });

  describe('priority when several rules block', () => {
    it('reports membership_expired before any class rule', () => {
      expect(
        check({
          membership: { endDate: '2026-10-01' },
          classSession: { ...target, bookedCount: 20 },
          now: target.startsAt,
        }),
      ).toEqual({ ok: false, reason: 'membership_expired' });
    });

    it('reports class_started before class_full', () => {
      expect(check({ classSession: { ...target, bookedCount: 20 }, now: target.startsAt })).toEqual(
        {
          ok: false,
          reason: 'class_started',
        },
      );
    });

    it('reports class_full before already_booked', () => {
      expect(
        check({
          classSession: { ...target, bookedCount: 20 },
          userBookings: [userBooking(target.id, target.startsAt)],
        }),
      ).toEqual({ ok: false, reason: 'class_full' });
    });

    it('reports already_booked instead of an overlap with itself', () => {
      expect(check({ userBookings: [userBooking(target.id, target.startsAt)] })).toEqual({
        ok: false,
        reason: 'already_booked',
      });
    });

    it('reports schedule_overlap before weekly_limit_reached', () => {
      expect(
        check({
          plan: { weeklyClassLimit: 1 },
          userBookings: [userBooking('other', '2026-11-04T18:30:00-03:00')],
        }),
      ).toEqual({ ok: false, reason: 'schedule_overlap' });
    });
  });
});

describe('canCancelBooking (rule 6)', () => {
  const classSession = { startsAt: target.startsAt };
  const confirmed = { status: 'confirmed' as const };

  it('uses a 2-hour limit', () => {
    expect(CANCELLATION_LIMIT_HOURS).toBe(2);
  });

  it('allows cancelling well before the class', () => {
    expect(canCancelBooking(confirmed, classSession, NOW)).toBe(true);
  });

  it('allows cancelling exactly 2 hours before the start', () => {
    expect(canCancelBooking(confirmed, classSession, '2026-11-04T16:00:00-03:00')).toBe(true);
  });

  it('does not allow cancelling less than 2 hours before the start', () => {
    expect(canCancelBooking(confirmed, classSession, '2026-11-04T16:00:01-03:00')).toBe(false);
  });

  it('does not allow cancelling after the class started', () => {
    expect(canCancelBooking(confirmed, classSession, '2026-11-04T18:30:00-03:00')).toBe(false);
  });

  it('compares instants across timezone offsets', () => {
    // 19:00Z is 16:00 in Buenos Aires: exactly 2 hours before.
    expect(canCancelBooking(confirmed, classSession, '2026-11-04T19:00:00Z')).toBe(true);
    expect(canCancelBooking(confirmed, classSession, '2026-11-04T19:00:01Z')).toBe(false);
  });

  it.each(['cancelled', 'attended', 'no_show'] as const)(
    'does not allow cancelling a %s booking',
    (status) => {
      expect(canCancelBooking({ status }, classSession, NOW)).toBe(false);
    },
  );
});

describe('cancelBooking (rule 7)', () => {
  const booking: Booking = {
    id: 'booking-1',
    userId: 'user-1',
    classSessionId: target.id,
    status: 'confirmed',
    createdAt: '2026-11-01T10:00:00-03:00',
    cancelledAt: null,
  };

  it('sets status to cancelled and cancelledAt to now, keeping the rest', () => {
    expect(cancelBooking(booking, NOW)).toEqual({
      ...booking,
      status: 'cancelled',
      cancelledAt: NOW,
    });
  });

  it('accepts a Date as now and stores it as an ISO datetime', () => {
    const cancelled = cancelBooking(booking, new Date('2026-11-02T13:00:00Z'));
    expect(Date.parse(cancelled.cancelledAt ?? '')).toBe(Date.parse('2026-11-02T13:00:00Z'));
  });

  it('returns a booking that passes the schema', () => {
    expect(bookingSchema.safeParse(cancelBooking(booking, NOW)).success).toBe(true);
  });

  it('does not mutate the original booking (the record is kept, not deleted)', () => {
    cancelBooking(booking, NOW);
    expect(booking.status).toBe('confirmed');
    expect(booking.cancelledAt).toBeNull();
  });

  it.each(['cancelled', 'attended', 'no_show'] as const)(
    'throws when the booking is %s',
    (status) => {
      const other = {
        ...booking,
        status,
        cancelledAt: status === 'cancelled' ? NOW : null,
      };
      expect(() => cancelBooking(other, NOW)).toThrow();
    },
  );

  it('throws on an invalid now', () => {
    expect(() => cancelBooking(booking, 'not-a-date')).toThrow();
  });
});

describe('findOverlappingBooking', () => {
  it('returns the confirmed booking that overlaps the class', () => {
    const overlapping = userBooking('other', '2026-11-04T17:30:00-03:00');
    const bookings = [userBooking('before', '2026-11-04T16:00:00-03:00'), overlapping];
    expect(findOverlappingBooking(target, bookings)).toBe(overlapping);
  });

  it('ignores bookings that are not confirmed', () => {
    const bookings = [userBooking('other', '2026-11-04T18:00:00-03:00', 'cancelled')];
    expect(findOverlappingBooking(target, bookings)).toBeNull();
  });

  it('ignores the booking of the same class', () => {
    const bookings = [userBooking(target.id, target.startsAt)];
    expect(findOverlappingBooking(target, bookings)).toBeNull();
  });

  it('does not count a class ending exactly when the other starts', () => {
    const bookings = [userBooking('before', '2026-11-04T17:00:00-03:00')];
    expect(findOverlappingBooking(target, bookings)).toBeNull();
  });

  it('agrees with canBookClass', () => {
    const bookings = [userBooking('other', '2026-11-04T18:30:00-03:00')];
    expect(findOverlappingBooking(target, bookings)).not.toBeNull();
    expect(check({ userBookings: bookings })).toEqual({ ok: false, reason: 'schedule_overlap' });
  });
});
