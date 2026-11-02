import type { Booking } from './booking';
import type { ClassSession } from './classSession';
import type { ClassType } from './classType';
import { toInstantMs } from './common';
import { toLocalDate, type LocalDate } from './dates';
import type { Trainer } from './trainer';

export interface DayClass {
  session: ClassSession;
  classType: ClassType;
  trainer: Trainer;
  /** The member has a confirmed booking for it. */
  booked: boolean;
}

export interface DayClassesInput {
  sessions: readonly ClassSession[];
  classTypes: readonly ClassType[];
  trainers: readonly Trainer[];
  /** The member's bookings; `null` when they could not be loaded (nothing is marked booked). */
  bookings: readonly Booking[] | null;
  /** Buenos Aires date; a class belongs to the day it starts on. */
  date: LocalDate;
  /** Only this class type; `null` for all. */
  classTypeId: string | null;
}

/**
 * The classes of a day for the calendar (T5.12), with their type and trainer,
 * sorted by start time and then by class name. Classes with an unknown type
 * or trainer are left out.
 */
export function getDayClasses(input: DayClassesInput): DayClass[] {
  const typeById = new Map(input.classTypes.map((t) => [t.id, t]));
  const trainerById = new Map(input.trainers.map((t) => [t.id, t]));
  const bookedIds = new Set(
    (input.bookings ?? []).filter((b) => b.status === 'confirmed').map((b) => b.classSessionId),
  );

  return input.sessions
    .filter((s) => toLocalDate(s.startsAt) === input.date)
    .filter((s) => input.classTypeId === null || s.classTypeId === input.classTypeId)
    .flatMap((session) => {
      const classType = typeById.get(session.classTypeId);
      const trainer = trainerById.get(session.trainerId);
      if (!classType || !trainer) return [];
      return [{ session, classType, trainer, booked: bookedIds.has(session.id) }];
    })
    .sort(
      (a, b) =>
        toInstantMs(a.session.startsAt) - toInstantMs(b.session.startsAt) ||
        a.classType.name.localeCompare(b.classType.name, 'es'),
    );
}
