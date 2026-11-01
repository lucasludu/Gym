import { bookingBlockReasonSchema, bookingSchema } from './booking';

const validBooking = {
  id: 'booking-1',
  userId: 'user-1',
  classSessionId: 'class-1',
  status: 'confirmed',
  createdAt: '2026-11-01T10:00:00-03:00',
  cancelledAt: null,
};

describe('bookingSchema', () => {
  it('accepts a confirmed booking', () => {
    expect(bookingSchema.parse(validBooking)).toEqual(validBooking);
  });

  it.each(['attended', 'no_show'])('accepts a %s booking without cancelledAt', (status) => {
    expect(bookingSchema.safeParse({ ...validBooking, status }).success).toBe(true);
  });

  it('accepts a cancelled booking with cancelledAt', () => {
    const booking = {
      ...validBooking,
      status: 'cancelled',
      cancelledAt: '2026-11-02T09:00:00-03:00',
    };
    expect(bookingSchema.safeParse(booking).success).toBe(true);
  });

  it.each([
    ['unknown status', { status: 'pending' }],
    ['cancelled without cancelledAt', { status: 'cancelled', cancelledAt: null }],
    ['confirmed with cancelledAt', { cancelledAt: '2026-11-02T09:00:00-03:00' }],
    ['createdAt without timezone', { createdAt: '2026-11-01T10:00:00' }],
    ['empty classSessionId', { classSessionId: '' }],
  ])('rejects %s', (_label, patch) => {
    expect(bookingSchema.safeParse({ ...validBooking, ...patch }).success).toBe(false);
  });
});

describe('bookingBlockReasonSchema', () => {
  it.each([
    'membership_expired',
    'class_full',
    'class_started',
    'already_booked',
    'schedule_overlap',
    'weekly_limit_reached',
  ])('accepts %p', (reason) => {
    expect(bookingBlockReasonSchema.safeParse(reason).success).toBe(true);
  });

  it('rejects an unknown reason', () => {
    expect(bookingBlockReasonSchema.safeParse('no_reason').success).toBe(false);
  });
});
