import type { BookingBlockReason } from '../../domain/booking';
import { differenceInDays, toLocalDate } from '../../domain/dates';
import { formatLongDate, formatTime, getWeekdayName } from '../../domain/format';

export interface BlockMessage {
  /** Text of the disabled button. */
  button: string;
  explanation: string;
}

export interface BlockMessageInput {
  reason: BookingBlockReason;
  today: string | Date;
  /** For membership_expired. */
  membershipEndDate?: string;
  /** For schedule_overlap: the booked class that is in the way. */
  overlapping?: { name: string; startsAt: string };
  /** For weekly_limit_reached. */
  weeklyLimit?: number;
}

const NO_BOOKING = 'No podés reservar';

/**
 * Why a class cannot be booked (specs/features/reservas.md, "Motivo de bloqueo").
 * `already_booked` has no message: the class shows "Cancelar reserva" instead.
 */
export function getBlockMessage(input: BlockMessageInput): BlockMessage | null {
  switch (input.reason) {
    case 'no_membership':
      return {
        button: NO_BOOKING,
        explanation:
          'No tenés una membresía activa. Acercate a recepción para dar de alta tu plan.',
      };
    case 'membership_expired': {
      const date =
        input.membershipEndDate === undefined
          ? ''
          : ` el ${formatLongDate(input.membershipEndDate, input.today)}`;
      return {
        button: NO_BOOKING,
        explanation: `Tu membresía venció${date}. Renovala en recepción para volver a reservar.`,
      };
    }
    case 'class_started':
      return { button: 'Clase empezada', explanation: 'Esta clase ya empezó.' };
    case 'class_full':
      return { button: 'Clase llena', explanation: 'No quedan lugares. Probá con otro horario.' };
    case 'already_booked':
      return null;
    case 'schedule_overlap': {
      const other = input.overlapping;
      return {
        button: 'Se superpone',
        explanation:
          other === undefined
            ? 'Ya tenés otra clase reservada en el mismo horario.'
            : `Ya tenés reservada ${other.name} a las ${formatTime(other.startsAt)}, en el mismo horario.`,
      };
    }
    case 'weekly_limit_reached': {
      const n = input.weeklyLimit;
      const allowed =
        n === undefined
          ? 'Tu plan tiene un límite de clases por semana'
          : `Tu plan permite ${n} ${n === 1 ? 'clase' : 'clases'} por semana`;
      return {
        button: 'Límite semanal alcanzado',
        explanation: `${allowed} y ya ${n === 1 ? 'la' : 'las'} reservaste. Cancelá una para reservar esta.`,
      };
    }
  }
}

/** "hoy 19:00", "mañana 07:00", "jueves 19:00"; with the date from a week ahead. */
export function formatBookingWhen(startsAt: string, now: string | Date): string {
  const days = differenceInDays(now, startsAt);
  const time = formatTime(startsAt);
  if (days === 0) return `hoy ${time}`;
  if (days === 1) return `mañana ${time}`;
  const weekday = getWeekdayName(startsAt).toLowerCase();
  if (days >= 2 && days <= 6) return `${weekday} ${time}`;
  const [, month, day] = toLocalDate(startsAt).split('-').map(Number);
  return `${weekday} ${day}/${month} ${time}`;
}
