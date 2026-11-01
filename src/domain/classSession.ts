import { z } from 'zod';

import { idSchema, isoDateTimeSchema, positiveIntSchema, toInstantMs } from './common';

/**
 * Stored fields only; `spotsLeft`, `isFull` and `hasStarted` are derived below.
 * `bookedCount` may exceed `capacity` (overbooking); derived functions handle it.
 */
export const classSessionSchema = z.object({
  id: idSchema,
  classTypeId: idSchema,
  trainerId: idSchema,
  startsAt: isoDateTimeSchema,
  capacity: positiveIntSchema,
  bookedCount: z.number().int().nonnegative(),
});

export type ClassSession = z.infer<typeof classSessionSchema>;

type Occupancy = Pick<ClassSession, 'capacity' | 'bookedCount'>;

/** Free spots: capacity minus booked, never below 0 (even when overbooked). */
export function getSpotsLeft(session: Occupancy): number {
  return Math.max(0, session.capacity - session.bookedCount);
}

/** True when no spots are left. */
export function isFull(session: Occupancy): boolean {
  return getSpotsLeft(session) === 0;
}

/** True once `now` reaches the start time (a class starting right now has started). */
export function hasStarted(session: Pick<ClassSession, 'startsAt'>, now: string | Date): boolean {
  return toInstantMs(now) >= toInstantMs(session.startsAt);
}
