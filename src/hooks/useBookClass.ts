import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createBooking } from '../api/bookings';
import type { Booking } from '../domain/booking';
import { toIsoDateTime } from '../domain/common';
import {
  adjustBookedCount,
  restoreSnapshot,
  snapshotBookingCaches,
  type CacheSnapshot,
} from './bookingCache';
import { queryKeys } from './queryKeys';

const OPTIMISTIC_PREFIX = 'optimistic-';

/** True for the booking shown before the server answers (it cannot be cancelled yet). */
export const isOptimisticBooking = (booking: Pick<Booking, 'id'>) =>
  booking.id.startsWith(OPTIMISTIC_PREFIX);

/**
 * T5.14: books a class with an optimistic update (the booking and one spot less are shown
 * at once) and rolls it back if the server fails. The rules are checked before
 * (canBookClass). Afterwards the bookings are refetched; the class sessions are not,
 * because json-server would bring back the old bookedCount.
 */
export function useBookClass(userId: string) {
  const client = useQueryClient();
  const bookingsKey = queryKeys.bookings(userId);

  return useMutation<Booking, unknown, { classSessionId: string; now: Date }, CacheSnapshot>({
    mutationFn: ({ classSessionId, now }) => createBooking({ userId, classSessionId }, now),
    onMutate: async ({ classSessionId, now }) => {
      const snapshot = await snapshotBookingCaches(client, userId);
      const optimistic: Booking = {
        id: `${OPTIMISTIC_PREFIX}${classSessionId}`,
        userId,
        classSessionId,
        status: 'confirmed',
        createdAt: toIsoDateTime(now),
        cancelledAt: null,
      };
      client.setQueryData<Booking[]>(bookingsKey, (old) => [...(old ?? []), optimistic]);
      adjustBookedCount(client, classSessionId, +1);
      return snapshot;
    },
    onError: (_error, _input, snapshot) => {
      if (snapshot) restoreSnapshot(client, snapshot);
    },
    onSuccess: (booking) => {
      client.setQueryData<Booking[]>(bookingsKey, (old) =>
        (old ?? []).map((b) =>
          isOptimisticBooking(b) && b.classSessionId === booking.classSessionId ? booking : b,
        ),
      );
    },
    onSettled: () => client.invalidateQueries({ queryKey: bookingsKey }),
  });
}
