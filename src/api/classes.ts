import { z } from 'zod';

import { classSessionSchema, type ClassSession } from '../domain/classSession';
import { classTypeSchema, type ClassType } from '../domain/classType';
import { isoDateSchema } from '../domain/common';
import type { LocalDate } from '../domain/dates';
import { trainerSchema, type Trainer } from '../domain/trainer';
import { api } from './client';
import type { ReadOptions } from './types';

export function getClassTypes(options: ReadOptions = {}): Promise<ClassType[]> {
  return api.request('/classTypes', z.array(classTypeSchema), options);
}

export function getTrainers(options: ReadOptions = {}): Promise<Trainer[]> {
  return api.request('/trainers', z.array(trainerSchema), options);
}

/**
 * Class sessions starting between two Buenos Aires dates (both included), sorted by time.
 * json-server compares `startsAt` as strings, which works because every date uses -03:00.
 */
export async function getClassSessions(
  range: { from: LocalDate; to: LocalDate },
  options: ReadOptions = {},
): Promise<ClassSession[]> {
  const from = isoDateSchema.parse(range.from);
  const to = isoDateSchema.parse(range.to);
  if (from > to) throw new Error(`Invalid range: ${from} is after ${to}`);

  return api.request('/classSessions', z.array(classSessionSchema), {
    ...options,
    query: {
      startsAt_gte: `${from}T00:00:00-03:00`,
      startsAt_lte: `${to}T23:59:59-03:00`,
      _sort: 'startsAt',
      _order: 'asc',
    },
  });
}

export function getClassSession(id: string, options: ReadOptions = {}): Promise<ClassSession> {
  return api.request(`/classSessions/${encodeURIComponent(id)}`, classSessionSchema, options);
}
