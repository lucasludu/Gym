import type { BookingStatus } from './booking';
import type { ClassSession } from './classSession';
import { addDays, getWeekStart, toLocalDate, type LocalDate } from './dates';
import type { WorkoutSession } from './workoutSession';

/**
 * Weekly streak from the data model. Weeks run Monday to Sunday (Buenos Aires).
 * A day is active if it has a finished workout (on the day it started)
 * or an attended booking (on the day of the class).
 */

export type StreakWorkout = Pick<WorkoutSession, 'startedAt' | 'finishedAt'>;

export interface StreakBooking {
  status: BookingStatus;
  classSession: Pick<ClassSession, 'startsAt'>;
}

export interface ActivityInput {
  workoutSessions: readonly StreakWorkout[];
  bookings: readonly StreakBooking[];
}

export interface WeeklyStreakInput extends ActivityInput {
  /** Days per week the user wants to train, 1–7. */
  weeklyGoal: number;
  today: string | Date;
}

const getActiveDates = ({ workoutSessions, bookings }: ActivityInput): Set<LocalDate> =>
  new Set([
    ...workoutSessions.filter((w) => w.finishedAt !== null).map((w) => toLocalDate(w.startedAt)),
    ...bookings
      .filter((b) => b.status === 'attended')
      .map((b) => toLocalDate(b.classSession.startsAt)),
  ]);

/** Active days per week, keyed by the week's Monday. */
const countDaysByWeek = (activity: ActivityInput): Map<LocalDate, number> => {
  const counts = new Map<LocalDate, number>();
  for (const date of getActiveDates(activity)) {
    const week = getWeekStart(date);
    counts.set(week, (counts.get(week) ?? 0) + 1);
  }
  return counts;
};

/** Distinct active days in the week (Monday to Sunday) that contains `dayInWeek`. */
export function getActiveDaysInWeek(activity: ActivityInput, dayInWeek: string | Date): number {
  return countDaysByWeek(activity).get(getWeekStart(dayInWeek)) ?? 0;
}

/**
 * Consecutive fulfilled weeks (active days ≥ weeklyGoal), counting back from last week.
 * The current week adds 1 if already fulfilled; otherwise it is still in progress
 * and does not break the streak.
 */
export function getWeeklyStreak(input: WeeklyStreakInput): number {
  const { weeklyGoal, today } = input;
  if (!Number.isInteger(weeklyGoal) || weeklyGoal < 1 || weeklyGoal > 7) {
    throw new Error(`weeklyGoal must be an integer from 1 to 7, got ${weeklyGoal}`);
  }

  const daysByWeek = countDaysByWeek(input);
  const isFulfilled = (week: LocalDate) => (daysByWeek.get(week) ?? 0) >= weeklyGoal;

  const currentWeek = getWeekStart(today);
  let streak = 0;
  for (let week = addDays(currentWeek, -7); isFulfilled(week); week = addDays(week, -7)) {
    streak += 1;
  }

  return isFulfilled(currentWeek) ? streak + 1 : streak;
}

export interface WeekDayActivity {
  date: LocalDate;
  active: boolean;
  isToday: boolean;
}

/** Monday to Sunday of the week of `today`, marking the days with activity. */
export function getWeekActivity(activity: ActivityInput, today: string | Date): WeekDayActivity[] {
  const active = getActiveDates(activity);
  const todayDate = toLocalDate(today);
  const monday = getWeekStart(todayDate);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    return { date, active: active.has(date), isToday: date === todayDate };
  });
}
