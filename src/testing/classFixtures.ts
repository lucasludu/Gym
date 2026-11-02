import { SOFIA } from './fixtures';

/** API-shaped class data for screen tests (Tuesday 2026-11-03 is the usual "today"). */
export const YOGA = {
  id: 'ct-yoga',
  name: 'Yoga',
  description: 'Posturas y respiración para ganar movilidad.',
  durationMinutes: 60,
  intensity: 'low',
  color: 'accentGreen',
} as const;

export const SPINNING = {
  id: 'ct-spinning',
  name: 'Spinning',
  description: 'Bici indoor con música.',
  durationMinutes: 45,
  intensity: 'high',
  color: 'accentOrange',
} as const;

export const CAMILA = { id: 't1', firstName: 'Camila', lastName: 'Rodríguez', avatarUrl: null };

export const classSession = (
  id: string,
  startsAt: string,
  classTypeId: string = YOGA.id,
  bookedCount = 8,
) => ({ id, classTypeId, trainerId: CAMILA.id, startsAt, capacity: 12, bookedCount });

export const booking = (
  id: string,
  classSessionId: string,
  status: 'confirmed' | 'cancelled' | 'attended' | 'no_show' = 'confirmed',
) => ({
  id,
  userId: SOFIA.id,
  classSessionId,
  status,
  createdAt: '2026-11-01T10:00:00-03:00',
  cancelledAt: status === 'cancelled' ? '2026-11-02T10:00:00-03:00' : null,
});
