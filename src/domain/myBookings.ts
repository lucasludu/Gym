import { toInstantMs } from './common';
import { hasEnded, type TimedBooking } from './nextClass';

/** "Mis reservas" shows at most this many past bookings (no pagination in the MVP). */
export const HISTORY_LIMIT = 20;

export type BookingOutcome = 'attended' | 'no_show' | 'cancelled' | 'finished';

export interface MyBookings<T> {
  /** Confirmed, not ended yet (in progress included), soonest first. */
  upcoming: T[];
  /** Everything else, most recent first, at most HISTORY_LIMIT. */
  history: { item: T; outcome: BookingOutcome }[];
}

const outcomeOf = (item: TimedBooking): BookingOutcome =>
  item.status === 'confirmed' ? 'finished' : item.status;

/** T5.16: splits the member's bookings into "Próximas" and "Historial". */
export function splitMyBookings<T extends TimedBooking>(
  items: readonly T[],
  now: string | Date,
): MyBookings<T> {
  const byStart = (a: T, b: T) => toInstantMs(a.startsAt) - toInstantMs(b.startsAt);
  const isUpcoming = (i: T) => i.status === 'confirmed' && !hasEnded(i, now);
  return {
    upcoming: items.filter(isUpcoming).sort(byStart),
    history: items
      .filter((i) => !isUpcoming(i))
      .sort((a, b) => byStart(b, a))
      .slice(0, HISTORY_LIMIT)
      .map((item) => ({ item, outcome: outcomeOf(item) })),
  };
}
