import { formatLongDate } from '../../domain/format';
import { getDaysLeft, getMembershipStatus } from '../../domain/membership';
import type { MembershipWithPlan } from '../../hooks/useMembership';
import type { BadgeTone } from '../ui';

export interface MembershipSummary {
  title: string;
  detail: string;
  badge: { label: string; tone: BadgeTone } | null;
  /** "3 clases por semana" / "Clases sin límite"; null without membership. */
  planLimit: string | null;
}

const RENEW = 'Renovala en recepción.';

const describeLimit = (limit: number | null): string =>
  limit === null ? 'Clases sin límite' : `${limit} ${limit === 1 ? 'clase' : 'clases'} por semana`;

/** Texts of the membership card in Inicio (see specs/features/home.md). */
export function getMembershipSummary(
  data: MembershipWithPlan | null,
  today: string | Date,
): MembershipSummary {
  if (data === null) {
    return {
      title: 'Sin membresía activa',
      detail:
        'Acercate a recepción para dar de alta tu plan. Mientras tanto no podés reservar clases.',
      badge: null,
      planLimit: null,
    };
  }

  const { membership, plan } = data;
  const endDate = formatLongDate(membership.endDate, today);
  const daysLeft = getDaysLeft(membership, today);
  const base = { title: plan.name, planLimit: describeLimit(plan.weeklyClassLimit) };

  switch (getMembershipStatus(membership, today)) {
    case 'active':
      return {
        ...base,
        detail: `Vence el ${endDate}`,
        badge: { label: 'Activa', tone: 'success' },
      };
    case 'expiring': {
      const when =
        daysLeft === 0
          ? 'Vence hoy.'
          : daysLeft === 1
            ? 'Vence mañana.'
            : `Vence en ${daysLeft} días, el ${endDate}.`;
      return {
        ...base,
        detail: `${when} ${RENEW}`,
        badge: { label: 'Por vencer', tone: 'warning' },
      };
    }
    case 'expired':
      return {
        ...base,
        detail: `Venció el ${endDate}. Renovala en recepción para volver a reservar.`,
        badge: { label: 'Vencida', tone: 'danger' },
      };
  }
}
