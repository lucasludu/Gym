import { useMutation, useQueryClient } from '@tanstack/react-query';

import { cancelBooking } from '../api/bookings';
import type { Booking } from '../domain/booking';
import { cancelBooking as toCancelled } from '../domain/bookingRules';
import {
  adjustBookedCount,
  restoreSnapshot,
  snapshotBookingCaches,
  type CacheSnapshot,
} from './bookingCache';
import { queryKeys } from './queryKeys';

/**
 * T5.15: cancels a confirmed booking with an optimistic update (cancelled and one spot
 * more at once) and rolls it back if the server fails. The 2-hour limit is checked
 * before (canCancelBooking). Like booking, only the bookings are refetched afterwards.
 */
export function useCancelBooking(userId: string) {
  const client = useQueryClient();
  const bookingsKey = queryKeys.bookings(userId);

  return useMutation<Booking, unknown, { booking: Booking; now: Date }, CacheSnapshot>({
    mutationFn: ({ booking, now }) => cancelBooking(booking, now),
    onMutate: async ({ booking, now }) => {
      const snapshot = await snapshotBookingCaches(client, userId);
      const cancelled = toCancelled(booking, now);
      client.setQueryData<Booking[]>(bookingsKey, (old) =>
        (old ?? []).map((b) => (b.id === booking.id ? cancelled : b)),
      );
      adjustBookedCount(client, booking.classSessionId, -1);
      return snapshot;
    },
    onError: (_error, _input, snapshot) => {
      if (snapshot) restoreSnapshot(client, snapshot);
    },
    onSettled: () => client.invalidateQueries({ queryKey: bookingsKey }),
  });
}
