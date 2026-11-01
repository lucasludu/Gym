import { skipToken, useQuery } from '@tanstack/react-query';

import { getUserBookings } from '../api/bookings';
import { getClassSessionsByIds, getClassTypes, getTrainers } from '../api/classes';
import type { Booking } from '../domain/booking';
import type { ClassSession } from '../domain/classSession';
import type { ClassType } from '../domain/classType';
import type { TimedBooking } from '../domain/nextClass';
import type { Trainer } from '../domain/trainer';
import { queryKeys } from './queryKeys';

/** A booking with its class; also a TimedBooking for getNextClass and the streak. */
export interface BookedClass extends TimedBooking {
  booking: Booking;
  session: ClassSession;
  classType: ClassType;
  trainer: Trainer;
}

/**
 * The user's bookings with their class session, class type and trainer.
 * Bookings whose class no longer exists are left out.
 */
export function useBookedClasses(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.bookedClasses(userId),
    queryFn:
      userId === null
        ? skipToken
        : async ({ signal }): Promise<BookedClass[]> => {
            const bookings = await getUserBookings(userId, { signal });
            if (bookings.length === 0) return [];
            const [sessions, classTypes, trainers] = await Promise.all([
              getClassSessionsByIds(
                bookings.map((b) => b.classSessionId),
                { signal },
              ),
              getClassTypes({ signal }),
              getTrainers({ signal }),
            ]);
            const sessionById = new Map(sessions.map((s) => [s.id, s]));
            const typeById = new Map(classTypes.map((t) => [t.id, t]));
            const trainerById = new Map(trainers.map((t) => [t.id, t]));

            return bookings.flatMap((booking) => {
              const session = sessionById.get(booking.classSessionId);
              const classType = session && typeById.get(session.classTypeId);
              const trainer = session && trainerById.get(session.trainerId);
              if (!session || !classType || !trainer) return [];
              return [
                {
                  booking,
                  session,
                  classType,
                  trainer,
                  status: booking.status,
                  startsAt: session.startsAt,
                  durationMinutes: classType.durationMinutes,
                },
              ];
            });
          },
  });
}
