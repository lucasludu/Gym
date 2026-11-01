import type { LocalDate } from '../domain/dates';

/**
 * Every query key of the app, in one place. Keys that depend on the user include
 * the user id, so data never leaks between accounts.
 */
export const queryKeys = {
  user: (userId: string | null) => ['user', userId] as const,
  classTypes: () => ['classTypes'] as const,
  trainers: () => ['trainers'] as const,
  /** Prefix of every class sessions query, to invalidate them all after booking. */
  allClassSessions: () => ['classSessions'] as const,
  classSessions: (range: { from: LocalDate; to: LocalDate }) =>
    [...queryKeys.allClassSessions(), range.from, range.to] as const,
  bookings: (userId: string | null) => ['bookings', userId] as const,
  /** Bookings joined with their classes; under the bookings key so it is invalidated with them. */
  bookedClasses: (userId: string | null) => [...queryKeys.bookings(userId), 'classes'] as const,
  membership: (userId: string | null) => ['membership', userId] as const,
  routine: (userId: string | null) => ['routine', userId] as const,
  exercises: () => ['exercises'] as const,
  workoutHistory: (userId: string | null) => ['workoutHistory', userId] as const,
};
