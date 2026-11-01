import { z } from 'zod';

import { idSchema, isoDateSchema } from './common';
import { differenceInDays } from './dates';

/** Stored fields only; `status` and `daysLeft` are derived below. */
export const membershipSchema = z
  .object({
    id: idSchema,
    userId: idSchema,
    planId: idSchema,
    startDate: isoDateSchema,
    endDate: isoDateSchema,
  })
  .refine((m) => m.endDate >= m.startDate, {
    message: 'endDate cannot be before startDate',
    path: ['endDate'],
  });

export const membershipStatusSchema = z.enum(['active', 'expiring', 'expired']);

export type Membership = z.infer<typeof membershipSchema>;
export type MembershipStatus = z.infer<typeof membershipStatusSchema>;

/** A membership is "expiring" when this many days or fewer are left (inclusive). */
export const EXPIRING_THRESHOLD_DAYS = 5;

/**
 * Days from `today` until the membership's endDate, in Buenos Aires calendar days.
 * 0 on the endDate itself; negative once expired.
 */
export function getDaysLeft(membership: Pick<Membership, 'endDate'>, today: string | Date): number {
  return differenceInDays(today, membership.endDate);
}

/**
 * - `expired` if today is after endDate.
 * - `expiring` if EXPIRING_THRESHOLD_DAYS or fewer days are left (endDate included).
 * - `active` otherwise.
 */
export function getMembershipStatus(
  membership: Pick<Membership, 'endDate'>,
  today: string | Date,
): MembershipStatus {
  const daysLeft = getDaysLeft(membership, today);

  if (daysLeft < 0) return 'expired';
  if (daysLeft <= EXPIRING_THRESHOLD_DAYS) return 'expiring';
  return 'active';
}
