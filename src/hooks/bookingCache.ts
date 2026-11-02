import type { QueryClient, QueryKey } from '@tanstack/react-query';

import type { ClassSession } from '../domain/classSession';
import { queryKeys } from './queryKeys';

/** Cached queries as they were, to roll an optimistic update back. */
export type CacheSnapshot = [QueryKey, unknown][];

const isSession = (value: unknown): value is ClassSession =>
  typeof value === 'object' && value !== null && 'bookedCount' in value && 'capacity' in value;

const withBooked = (session: ClassSession, delta: number): ClassSession => ({
  ...session,
  // Spots are never fewer than 0 nor more than the capacity.
  bookedCount: Math.min(session.capacity, Math.max(0, session.bookedCount + delta)),
});

/** Takes a snapshot of the class sessions and the user's bookings before an optimistic update. */
export async function snapshotBookingCaches(
  client: QueryClient,
  userId: string,
): Promise<CacheSnapshot> {
  const keys = [queryKeys.allClassSessions(), queryKeys.bookings(userId)];
  await Promise.all(keys.map((queryKey) => client.cancelQueries({ queryKey })));
  return keys.flatMap((queryKey) => client.getQueriesData({ queryKey }));
}

export function restoreSnapshot(client: QueryClient, snapshot: CacheSnapshot): void {
  for (const [key, data] of snapshot) client.setQueryData(key, data);
}

/**
 * Adds `delta` to the booked count of a class in every cached class session query
 * (the detail and the week lists). json-server does not update bookedCount, so this
 * is what the member sees until the next refresh (see the data model).
 */
export function adjustBookedCount(
  client: QueryClient,
  classSessionId: string,
  delta: number,
): void {
  client.setQueriesData({ queryKey: queryKeys.allClassSessions() }, (data: unknown) => {
    if (Array.isArray(data)) {
      return data.map((s: unknown) =>
        isSession(s) && s.id === classSessionId ? withBooked(s, delta) : s,
      );
    }
    return isSession(data) && data.id === classSessionId ? withBooked(data, delta) : data;
  });
}
