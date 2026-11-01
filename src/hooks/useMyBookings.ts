import { skipToken, useQuery } from '@tanstack/react-query';

import { getUserBookings } from '../api/bookings';
import { queryKeys } from './queryKeys';

/** Bookings of the logged-in user; idle while `userId` is null. */
export function useMyBookings(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.bookings(userId),
    queryFn: userId === null ? skipToken : ({ signal }) => getUserBookings(userId, { signal }),
  });
}
