import { z } from 'zod';

/** Entity id: UUID in the backend, readable string in the mock (e.g. "class-1"). */
export const idSchema = z.string().min(1);

/** ISO 8601 datetime with timezone (offset or Z), e.g. "2026-11-03T18:00:00-03:00". */
export const isoDateTimeSchema = z.iso.datetime({ offset: true });

/** ISO 8601 date without time, e.g. "2026-11-03". */
export const isoDateSchema = z.iso.date();

/** Absolute http(s) URL. */
export const httpUrlSchema = z.url({ protocol: /^https?$/ });

export const nonEmptyStringSchema = z.string().min(1);

export const positiveIntSchema = z.number().int().positive();

const hasAtMostOneDecimal = (value: number): boolean =>
  Math.abs(value * 10 - Math.round(value * 10)) < 1e-9;

/** Weight in kg: non-negative, at most 1 decimal. */
export const weightKgSchema = z
  .number()
  .nonnegative()
  .refine(hasAtMostOneDecimal, { message: 'Weight must have at most 1 decimal' });

/**
 * Milliseconds since epoch of an ISO datetime with timezone or a Date.
 * Throws on invalid input instead of returning NaN.
 */
export const toInstantMs = (value: string | Date): number => {
  if (value instanceof Date) {
    const ms = value.getTime();
    if (Number.isNaN(ms)) throw new Error('Invalid Date object');
    return ms;
  }
  if (!isoDateTimeSchema.safeParse(value).success) {
    throw new Error(`Invalid instant: "${value}". Use an ISO datetime with timezone.`);
  }
  return Date.parse(value);
};

/** True if `later` is the same instant as `earlier` or after it. Works across offsets. */
export const isSameOrAfterInstant = (earlier: string, later: string): boolean =>
  Date.parse(later) >= Date.parse(earlier);
