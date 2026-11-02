import { toInstantMs } from './common';
import { differenceInDays, toLocalDate } from './dates';

/**
 * Spanish (Rioplatense) date and time texts in Buenos Aires time (fixed UTC-3, like dates.ts).
 * Written by hand instead of Intl, whose Spanish support in Hermes is incomplete.
 */

export const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const;

/** Sunday first, like Date#getUTCDay. */
export const WEEKDAYS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const;

const BUENOS_AIRES_OFFSET_MS = -3 * 60 * 60 * 1000;

const parts = (value: string | Date) => {
  const [year, month, day] = toLocalDate(value).split('-').map(Number);
  return { year: year ?? 0, month: month ?? 1, day: day ?? 1 };
};

/** "12 de noviembre"; with the year when it is not the year of `today`: "3 de enero de 2027". */
export function formatLongDate(date: string | Date, today: string | Date): string {
  const { year, month, day } = parts(date);
  const text = `${day} de ${MONTHS[month - 1]}`;
  return year === parts(today).year ? text : `${text} de ${year}`;
}

/** "19:00" in Buenos Aires. */
export function formatTime(instant: string | Date): string {
  const local = new Date(toInstantMs(instant) + BUENOS_AIRES_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`;
}

/** Weekday name of a date (Buenos Aires). */
export function getWeekdayName(date: string | Date): (typeof WEEKDAYS)[number] {
  const weekday = new Date(`${toLocalDate(date)}T00:00:00Z`).getUTCDay();
  return WEEKDAYS[weekday] ?? 'Domingo';
}

/** "Hoy", "Mañana" or "Jueves 12/11", comparing Buenos Aires dates. */
export function formatDayLabel(instant: string | Date, now: string | Date): string {
  const days = differenceInDays(now, instant);
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  const { month, day } = parts(instant);
  return `${getWeekdayName(instant)} ${day}/${month}`;
}
