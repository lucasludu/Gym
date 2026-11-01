import { z } from 'zod';

import { idSchema, isoDateTimeSchema } from './common';

export const bookingStatusSchema = z.enum(['confirmed', 'cancelled', 'attended', 'no_show']);

/** Reasons shown in the UI when a class cannot be booked. */
export const bookingBlockReasonSchema = z.enum([
  'no_membership',
  'membership_expired',
  'class_full',
  'class_started',
  'already_booked',
  'schedule_overlap',
  'weekly_limit_reached',
]);

export const bookingSchema = z
  .object({
    id: idSchema,
    userId: idSchema,
    classSessionId: idSchema,
    status: bookingStatusSchema,
    createdAt: isoDateTimeSchema,
    cancelledAt: isoDateTimeSchema.nullable(),
  })
  // Cancelling sets `cancelledAt`; any other status must not have it.
  .refine((b) => (b.status === 'cancelled') === (b.cancelledAt !== null), {
    message: 'cancelledAt must be set only when status is "cancelled"',
    path: ['cancelledAt'],
  });

export type BookingStatus = z.infer<typeof bookingStatusSchema>;
export type BookingBlockReason = z.infer<typeof bookingBlockReasonSchema>;
export type Booking = z.infer<typeof bookingSchema>;
