import { z } from 'zod';

import { bookingSchema, type Booking } from '../domain/booking';
import { cancelBooking as toCancelledBooking } from '../domain/bookingRules';
import { toIsoDateTime } from '../domain/common';
import { api } from './client';
import type { ReadOptions } from './types';

/** All bookings of a user, any status. */
export function getUserBookings(userId: string, options: ReadOptions = {}): Promise<Booking[]> {
  return api.request('/bookings', z.array(bookingSchema), { ...options, query: { userId } });
}

/**
 * Creates a confirmed booking. The booking rules are checked before calling this
 * (`canBookClass`); the server assigns the id.
 */
export function createBooking(
  input: Pick<Booking, 'userId' | 'classSessionId'>,
  now: string | Date,
): Promise<Booking> {
  return api.request('/bookings', bookingSchema, {
    method: 'POST',
    body: {
      userId: input.userId,
      classSessionId: input.classSessionId,
      status: 'confirmed',
      createdAt: toIsoDateTime(now),
      cancelledAt: null,
    },
  });
}

/**
 * Cancels a confirmed booking (rule 7: the record is kept). Throws without calling the
 * API if the booking is not confirmed; the 2-hour limit is checked with `canCancelBooking`.
 */
export async function cancelBooking(booking: Booking, now: string | Date): Promise<Booking> {
  const { status, cancelledAt } = toCancelledBooking(booking, now);
  return api.request(`/bookings/${encodeURIComponent(booking.id)}`, bookingSchema, {
    method: 'PATCH',
    body: { status, cancelledAt },
  });
}
