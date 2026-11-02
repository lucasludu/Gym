import { formatBookingWhen, getBlockMessage } from './bookingMessages';

const TODAY = '2026-11-03T10:00:00-03:00'; // Tuesday

describe('getBlockMessage', () => {
  it('no membership (criterion 19)', () => {
    expect(getBlockMessage({ reason: 'no_membership', today: TODAY })).toEqual({
      button: 'No podés reservar',
      explanation: 'No tenés una membresía activa. Acercate a recepción para dar de alta tu plan.',
    });
  });

  it('expired membership, with its date (criterion 20)', () => {
    expect(
      getBlockMessage({
        reason: 'membership_expired',
        membershipEndDate: '2026-11-01',
        today: TODAY,
      }),
    ).toEqual({
      button: 'No podés reservar',
      explanation:
        'Tu membresía venció el 1 de noviembre. Renovala en recepción para volver a reservar.',
    });
  });

  it('class started and class full (criterion 23)', () => {
    expect(getBlockMessage({ reason: 'class_started', today: TODAY })).toEqual({
      button: 'Clase empezada',
      explanation: 'Esta clase ya empezó.',
    });
    expect(getBlockMessage({ reason: 'class_full', today: TODAY })).toEqual({
      button: 'Clase llena',
      explanation: 'No quedan lugares. Probá con otro horario.',
    });
  });

  it('schedule overlap names the other class (criterion 21)', () => {
    expect(
      getBlockMessage({
        reason: 'schedule_overlap',
        overlapping: { name: 'Yoga', startsAt: '2026-11-05T18:30:00-03:00' },
        today: TODAY,
      }),
    ).toEqual({
      button: 'Se superpone',
      explanation: 'Ya tenés reservada Yoga a las 18:30, en el mismo horario.',
    });
  });

  it('weekly limit with the plan limit (criterion 22)', () => {
    expect(
      getBlockMessage({ reason: 'weekly_limit_reached', weeklyLimit: 3, today: TODAY }),
    ).toEqual({
      button: 'Límite semanal alcanzado',
      explanation:
        'Tu plan permite 3 clases por semana y ya las reservaste. Cancelá una para reservar esta.',
    });
    expect(
      getBlockMessage({ reason: 'weekly_limit_reached', weeklyLimit: 1, today: TODAY })
        ?.explanation,
    ).toBe(
      'Tu plan permite 1 clase por semana y ya la reservaste. Cancelá una para reservar esta.',
    );
  });

  it('shows nothing for an already booked class (it shows "Cancelar reserva")', () => {
    expect(getBlockMessage({ reason: 'already_booked', today: TODAY })).toBeNull();
  });
});

describe('formatBookingWhen', () => {
  it('says hoy and mañana', () => {
    expect(formatBookingWhen('2026-11-03T19:00:00-03:00', TODAY)).toBe('hoy 19:00');
    expect(formatBookingWhen('2026-11-04T07:00:00-03:00', TODAY)).toBe('mañana 07:00');
  });

  it('says the weekday within the next 6 days (criterion 16)', () => {
    expect(formatBookingWhen('2026-11-05T19:00:00-03:00', TODAY)).toBe('jueves 19:00');
    expect(formatBookingWhen('2026-11-09T19:00:00-03:00', TODAY)).toBe('lunes 19:00');
  });

  it('adds the date from a week ahead, so the weekday is not ambiguous', () => {
    expect(formatBookingWhen('2026-11-10T19:00:00-03:00', TODAY)).toBe('martes 10/11 19:00');
  });
});

describe('formatBookingWhen in UTC', () => {
  it('uses the Buenos Aires date', () => {
    // 2026-11-11T01:00Z is Tuesday 10/11, 22:00 in Buenos Aires.
    expect(formatBookingWhen('2026-11-11T01:00:00Z', TODAY)).toBe('martes 10/11 22:00');
  });
});
