import type { Booking, BookingBlockReason, BookingStatus } from './booking';
import { hasStarted, isFull, type ClassSession } from './classSession';
import { toInstantMs } from './common';
import { getWeekStart } from './dates';
import { getMembershipStatus, type Membership } from './membership';
import type { Plan } from './plan';

/**
 * Booking rules from the data model (rules 1 to 7).
 * The front validates them for the UI only; the backend is the source of truth.
 */

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;

/** Bookings can be cancelled up to this many hours before the class starts (inclusive). */
export const CANCELLATION_LIMIT_HOURS = 2;

/** A class session joined with its class type duration, enough to place it in time. */
export interface ScheduledClass {
  id: ClassSession['id'];
  startsAt: ClassSession['startsAt'];
  durationMinutes: number;
}

/** The class the user wants to book: schedule plus occupancy. */
export type BookableClass = ScheduledClass & Pick<ClassSession, 'capacity' | 'bookedCount'>;

/** One of the user's existing bookings, joined with its class. */
export interface UserBooking {
  status: BookingStatus;
  classSession: ScheduledClass;
}

export interface CanBookClassInput {
  classSession: BookableClass;
  membership: Pick<Membership, 'endDate'>;
  plan: Pick<Plan, 'weeklyClassLimit'>;
  /** All bookings of the user, any status. */
  userBookings: readonly UserBooking[];
  now: string | Date;
}

export type CanBookClassResult = { ok: true } | { ok: false; reason: BookingBlockReason };

const blocked = (reason: BookingBlockReason): CanBookClassResult => ({ ok: false, reason });

const getInterval = (c: ScheduledClass): { start: number; end: number } => {
  const start = toInstantMs(c.startsAt);
  return { start, end: start + c.durationMinutes * MS_PER_MINUTE };
};

/** Half-open intervals: a class ending exactly when another starts does not overlap. */
const overlaps = (a: ScheduledClass, b: ScheduledClass): boolean => {
  const x = getInterval(a);
  const y = getInterval(b);
  return x.start < y.end && y.start < x.end;
};

/**
 * Checks whether the user can book a class. When several rules block, the reason
 * follows this priority: membership_expired, class_started, class_full,
 * already_booked, schedule_overlap, weekly_limit_reached.
 */
export function canBookClass(input: CanBookClassInput): CanBookClassResult {
  const { classSession, membership, plan, userBookings, now } = input;

  // Rule 1
  if (getMembershipStatus(membership, now) === 'expired') return blocked('membership_expired');

  // Rule 2
  if (hasStarted(classSession, now)) return blocked('class_started');
  if (isFull(classSession)) return blocked('class_full');

  const confirmed = userBookings.filter((b) => b.status === 'confirmed');

  // Rule 3
  if (confirmed.some((b) => b.classSession.id === classSession.id)) {
    return blocked('already_booked');
  }

  // Rule 4
  if (confirmed.some((b) => overlaps(b.classSession, classSession))) {
    return blocked('schedule_overlap');
  }

  // Rule 5
  if (plan.weeklyClassLimit !== null) {
    const classWeek = getWeekStart(classSession.startsAt);
    const countedThisWeek = userBookings.filter(
      (b) =>
        (b.status === 'confirmed' || b.status === 'attended') &&
        getWeekStart(b.classSession.startsAt) === classWeek,
    ).length;
    if (countedThisWeek >= plan.weeklyClassLimit) return blocked('weekly_limit_reached');
  }

  return { ok: true };
}

/**
 * Rule 6: a confirmed booking can be cancelled up to CANCELLATION_LIMIT_HOURS
 * before the class starts (exactly at the limit is still allowed).
 */
export function canCancelBooking(
  booking: Pick<Booking, 'status'>,
  classSession: Pick<ClassSession, 'startsAt'>,
  now: string | Date,
): boolean {
  if (booking.status !== 'confirmed') return false;
  const deadline = toInstantMs(classSession.startsAt) - CANCELLATION_LIMIT_HOURS * MS_PER_HOUR;
  return toInstantMs(now) <= deadline;
}

/**
 * Rule 7: returns the cancelled booking (status "cancelled", cancelledAt = now).
 * The record is kept, never deleted. Only confirmed bookings can be cancelled.
 * Does not check the time limit; use `canCancelBooking` for that.
 */
export function cancelBooking(booking: Booking, now: string | Date): Booking {
  if (booking.status !== 'confirmed') {
    throw new Error(`Only confirmed bookings can be cancelled, got "${booking.status}"`);
  }
  const instantMs = toInstantMs(now); // throws on invalid input
  const cancelledAt = typeof now === 'string' ? now : new Date(instantMs).toISOString();
  return { ...booking, status: 'cancelled', cancelledAt };
}
