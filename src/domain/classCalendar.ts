import { addDays, differenceInDays, getWeekStart, toLocalDate, type LocalDate } from './dates';
import { MONTHS, getWeekdayName } from './format';

/** The class calendar shows this week and the next one (specs/features/reservas.md). */
export const CALENDAR_WEEKS = 2;

export interface CalendarDay {
  date: LocalDate;
  /** "Lun", "Mié"… */
  shortName: string;
  dayOfMonth: number;
  isToday: boolean;
  isPast: boolean;
}

const parse = (date: LocalDate) => {
  const [year, month, day] = date.split('-').map(Number);
  return { year: year ?? 0, month: month ?? 1, day: day ?? 1 };
};

/** Mondays of the weeks the calendar can show, starting with the current week. */
export function getCalendarWeekStarts(today: string | Date): LocalDate[] {
  const monday = getWeekStart(today);
  return Array.from({ length: CALENDAR_WEEKS }, (_, i) => addDays(monday, i * 7));
}

/** Monday to Sunday of the week that starts on `weekStart`. */
export function getWeekDays(weekStart: LocalDate, today: string | Date): CalendarDay[] {
  if (getWeekStart(weekStart) !== weekStart) {
    throw new Error(`weekStart must be a Monday, got ${weekStart}`);
  }
  const todayDate = toLocalDate(today);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const diff = differenceInDays(todayDate, date);
    return {
      date,
      shortName: getWeekdayName(date).slice(0, 3),
      dayOfMonth: parse(date).day,
      isToday: diff === 0,
      isPast: diff < 0,
    };
  });
}

/**
 * "2 al 8 de noviembre", "30 de noviembre al 6 de diciembre"; the year is added
 * when it is not the year of `today`, and to both ends when the week crosses years.
 */
export function formatWeekRange(weekStart: LocalDate, today: string | Date): string {
  const start = parse(weekStart);
  const end = parse(addDays(weekStart, 6));
  const month = (m: number) => MONTHS[m - 1] ?? '';
  if (start.year !== end.year) {
    return `${start.day} de ${month(start.month)} de ${start.year} al ${end.day} de ${month(end.month)} de ${end.year}`;
  }
  const year = end.year === parse(toLocalDate(today)).year ? '' : ` de ${end.year}`;
  if (start.month === end.month) return `${start.day} al ${end.day} de ${month(end.month)}${year}`;
  return `${start.day} de ${month(start.month)} al ${end.day} de ${month(end.month)}${year}`;
}

/** The day selected when a week is shown: today in the current week, otherwise its Monday. */
export function getDefaultDay(weekStart: LocalDate, today: string | Date): LocalDate {
  const todayDate = toLocalDate(today);
  return getWeekStart(todayDate) === weekStart ? todayDate : weekStart;
}

/** "Martes 3 de noviembre, hoy" for screen readers. */
export function describeCalendarDay(date: LocalDate, today: string | Date): string {
  const { day, month } = parse(date);
  const text = `${getWeekdayName(date)} ${day} de ${MONTHS[month - 1] ?? ''}`;
  return toLocalDate(today) === date ? `${text}, hoy` : text;
}
