import { z } from 'zod';

import { toIsoDateTime } from '../domain/common';
import { userSchema, type User } from '../domain/user';
import { api } from './client';
import type { ReadOptions } from './types';

const DEFAULT_WEEKLY_GOAL = 3;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export function getUser(id: string, options: ReadOptions = {}): Promise<User> {
  return api.request(`/users/${encodeURIComponent(id)}`, userSchema, options);
}

/**
 * The user with that email, or `null`. The mock login only matches by email
 * (the password is format-checked in the form, never sent or stored).
 */
export async function findUserByEmail(
  email: string,
  options: ReadOptions = {},
): Promise<User | null> {
  const users = await api.request('/users', z.array(userSchema), {
    ...options,
    query: { email: normalizeEmail(email) },
  });
  return users[0] ?? null;
}

/**
 * Registers a user. Creates only the User, without membership: the gym assigns
 * one at the front desk. Validates before calling the API; the server assigns the id.
 */
export async function createUser(
  input: Pick<User, 'firstName' | 'lastName' | 'email'>,
  now: string | Date,
): Promise<User> {
  const { id: _pending, ...body } = userSchema.parse({
    id: 'pending',
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: normalizeEmail(input.email),
    avatarUrl: null,
    weeklyGoal: DEFAULT_WEEKLY_GOAL,
    createdAt: toIsoDateTime(now),
  });
  return api.request('/users', userSchema, { method: 'POST', body });
}

/** Changes the weekly training goal (1–7 days). Validates before calling the API. */
export async function updateWeeklyGoal(userId: string, weeklyGoal: number): Promise<User> {
  const goal = userSchema.shape.weeklyGoal.parse(weeklyGoal);
  return api.request(`/users/${encodeURIComponent(userId)}`, userSchema, {
    method: 'PATCH',
    body: { weeklyGoal: goal },
  });
}
