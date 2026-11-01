import { isoDateSchema, isoDateTimeSchema } from './common';

/**
 * Date utilities in the reference timezone, America/Argentina/Buenos_Aires.
 *
 * Argentina has used a fixed UTC-3 offset with no daylight saving time since 2009,
 * so a constant offset is exact and behaves the same in Node (tests) and Hermes (app).
 * Weeks run Monday to Sunday. Functions never read the current time: callers pass it in.
 */

/** A calendar date in "YYYY-MM-DD" format. */
export type LocalDate = string;

const BUENOS_AIRES_OFFSET_MS = -3 * 60 * 60 * 1000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const dateToUtcMs = (date: LocalDate): number => Date.parse(`${date}T00:00:00Z`);
const utcMsToDate = (ms: number): LocalDate => new Date(ms).toISOString().slice(0, 10);

/**
 * Returns the Buenos Aires calendar date of a value.
 * Accepts a plain date ("2026-11-03"), an ISO datetime with timezone, or a Date.
 * Throws on invalid input.
 */
export function toLocalDate(value: string | Date): LocalDate {
  let instantMs: number;

  if (value instanceof Date) {
    instantMs = value.getTime();
    if (Number.isNaN(instantMs)) throw new Error('Invalid Date object');
  } else if (isoDateSchema.safeParse(value).success) {
    return value;
  } else if (isoDateTimeSchema.safeParse(value).success) {
    instantMs = Date.parse(value);
  } else {
    throw new Error(`Invalid date: "${value}". Use YYYY-MM-DD or an ISO datetime with timezone.`);
  }

  return utcMsToDate(instantMs + BUENOS_AIRES_OFFSET_MS);
}

/** Adds (or subtracts, if negative) whole days to a date. */
export function addDays(value: string | Date, days: number): LocalDate {
  if (!Number.isInteger(days)) throw new Error(`days must be an integer, got ${days}`);
  return utcMsToDate(dateToUtcMs(toLocalDate(value)) + days * MS_PER_DAY);
}

/** Monday of the week (Monday to Sunday) that contains the date. */
export function getWeekStart(value: string | Date): LocalDate {
  const date = toLocalDate(value);
  const dayOfWeek = new Date(dateToUtcMs(date)).getUTCDay(); // 0 = Sunday
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  return addDays(date, -daysSinceMonday);
}

/** Sunday of the week (Monday to Sunday) that contains the date. */
export function getWeekEnd(value: string | Date): LocalDate {
  return addDays(getWeekStart(value), 6);
}

/**
 * Calendar days from `from` to `to` in Buenos Aires (negative if `to` is earlier).
 * Counts date changes, not 24-hour periods.
 */
export function differenceInDays(from: string | Date, to: string | Date): number {
  const diffMs = dateToUtcMs(toLocalDate(to)) - dateToUtcMs(toLocalDate(from));
  return Math.round(diffMs / MS_PER_DAY);
}
