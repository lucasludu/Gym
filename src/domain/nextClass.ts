import type { BookingStatus } from './booking';
import { toInstantMs } from './common';

const MS_PER_MINUTE = 60_000;

/** A booked class with what is needed to place it in time. */
export interface TimedBooking {
  status: BookingStatus;
  startsAt: string;
  durationMinutes: number;
}

/** True from the moment the class ends (startsAt + durationMinutes). */
export function hasEnded(
  item: Pick<TimedBooking, 'startsAt' | 'durationMinutes'>,
  now: string | Date,
): boolean {
  return toInstantMs(now) >= toInstantMs(item.startsAt) + item.durationMinutes * MS_PER_MINUTE;
}

/**
 * The member's next class: the confirmed booking whose class has not ended yet
 * (a class in progress counts), with the earliest start. `null` if there is none.
 */
export function getNextClass<T extends TimedBooking>(
  items: readonly T[],
  now: string | Date,
): T | null {
  let next: T | null = null;
  for (const item of items) {
    if (item.status !== 'confirmed' || hasEnded(item, now)) continue;
    if (next === null || toInstantMs(item.startsAt) < toInstantMs(next.startsAt)) next = item;
  }
  return next;
}
