import { z } from 'zod';

import { membershipSchema, type Membership } from '../domain/membership';
import { planSchema, type Plan } from '../domain/plan';
import { api } from './client';
import type { ReadOptions } from './types';

/**
 * The user's membership, or `null` if they have none (e.g. just registered).
 * If the server returns several, the one with the latest endDate wins.
 */
export async function getUserMembership(
  userId: string,
  options: ReadOptions = {},
): Promise<Membership | null> {
  const memberships = await api.request('/memberships', z.array(membershipSchema), {
    ...options,
    query: { userId },
  });
  return memberships.reduce<Membership | null>(
    (latest, m) => (latest === null || m.endDate > latest.endDate ? m : latest),
    null,
  );
}

export function getPlans(options: ReadOptions = {}): Promise<Plan[]> {
  return api.request('/plans', z.array(planSchema), options);
}

export function getPlan(id: string, options: ReadOptions = {}): Promise<Plan> {
  return api.request(`/plans/${encodeURIComponent(id)}`, planSchema, options);
}
