import type { MembershipWithPlan } from '../../hooks/useMembership';
import { getMembershipSummary } from './membershipSummary';

const today = '2026-11-01';

const withEndDate = (endDate: string, weeklyClassLimit: number | null = 3): MembershipWithPlan => ({
  membership: { id: 'm1', userId: 'u1', planId: 'p1', startDate: '2026-10-01', endDate },
  plan: { id: 'p1', name: '3 veces por semana', price: 30000, weeklyClassLimit },
});

describe('getMembershipSummary', () => {
  it('explains that there is no membership (criterion 1)', () => {
    expect(getMembershipSummary(null, today)).toEqual({
      title: 'Sin membresía activa',
      detail:
        'Acercate a recepción para dar de alta tu plan. Mientras tanto no podés reservar clases.',
      badge: null,
      planLimit: null,
    });
  });

  it('shows an active membership with its end date (criterion 2)', () => {
    expect(getMembershipSummary(withEndDate('2026-11-11'), today)).toEqual({
      title: '3 veces por semana',
      detail: 'Vence el 11 de noviembre',
      badge: { label: 'Activa', tone: 'success' },
      planLimit: '3 clases por semana',
    });
  });

  it.each([
    ['2026-11-06', 'Vence en 5 días, el 6 de noviembre. Renovala en recepción.'],
    ['2026-11-04', 'Vence en 3 días, el 4 de noviembre. Renovala en recepción.'],
    ['2026-11-03', 'Vence en 2 días, el 3 de noviembre. Renovala en recepción.'],
    ['2026-11-02', 'Vence mañana. Renovala en recepción.'],
    ['2026-11-01', 'Vence hoy. Renovala en recepción.'],
  ])('warns when it ends on %s (criteria 3 and 4)', (endDate, detail) => {
    const summary = getMembershipSummary(withEndDate(endDate), today);
    expect(summary.detail).toBe(detail);
    expect(summary.badge).toEqual({ label: 'Por vencer', tone: 'warning' });
  });

  it('shows an expired membership with the date it ended (criterion 5)', () => {
    const summary = getMembershipSummary(withEndDate('2026-10-31'), today);
    expect(summary.detail).toBe(
      'Venció el 31 de octubre. Renovala en recepción para volver a reservar.',
    );
    expect(summary.badge).toEqual({ label: 'Vencida', tone: 'danger' });
  });

  it('includes the year when the date is in another year', () => {
    expect(getMembershipSummary(withEndDate('2027-01-15'), today).detail).toBe(
      'Vence el 15 de enero de 2027',
    );
  });

  it.each([
    [null, 'Clases sin límite'],
    [1, '1 clase por semana'],
    [3, '3 clases por semana'],
  ])('describes the weekly limit %p (criterion 6)', (limit, text) => {
    expect(getMembershipSummary(withEndDate('2026-12-01', limit), today).planLimit).toBe(text);
  });
});
