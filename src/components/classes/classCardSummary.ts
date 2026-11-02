import { getSpotsLeft, hasStarted } from '../../domain/classSession';
import { toInstantMs } from '../../domain/common';
import { formatTime } from '../../domain/format';
import type { BadgeTone } from '../ui';

const MS_PER_MINUTE = 60_000;
/** With this many spots or fewer, the card warns "Últimos {n} lugares". */
const FEW_SPOTS = 3;

export interface ClassCardInput {
  startsAt: string;
  durationMinutes: number;
  capacity: number;
  bookedCount: number;
  /** The member has a confirmed booking for this class. */
  booked: boolean;
  now: string | Date;
}

export type ClassCardStatus = 'booked' | 'started' | 'full' | 'available';

export interface ClassCardSummary {
  status: ClassCardStatus;
  /** "19:00 – 20:00" */
  timeRange: string;
  badge: { label: string; tone: BadgeTone };
}

const spotsBadge = (spots: number): ClassCardSummary['badge'] => {
  if (spots === 1) return { label: 'Último lugar', tone: 'warning' };
  if (spots <= FEW_SPOTS) return { label: `Últimos ${spots} lugares`, tone: 'warning' };
  return { label: `${spots} lugares`, tone: 'neutral' };
};

/**
 * State and texts of a ClassCard (specs/features/reservas.md, T5.11).
 * Priority: Reservada > Empezada > Llena > Disponible.
 */
export function getClassCardSummary(input: ClassCardInput): ClassCardSummary {
  const end = new Date(toInstantMs(input.startsAt) + input.durationMinutes * MS_PER_MINUTE);
  const timeRange = `${formatTime(input.startsAt)} – ${formatTime(end)}`;
  // Never more spots than the capacity, never fewer than 0.
  const spots = Math.min(getSpotsLeft(input), input.capacity);

  if (input.booked)
    return { status: 'booked', timeRange, badge: { label: 'Reservada', tone: 'primary' } };
  if (hasStarted(input, input.now)) {
    return { status: 'started', timeRange, badge: { label: 'Empezada', tone: 'neutral' } };
  }
  if (spots === 0) return { status: 'full', timeRange, badge: { label: 'Llena', tone: 'danger' } };
  return { status: 'available', timeRange, badge: spotsBadge(spots) };
}
