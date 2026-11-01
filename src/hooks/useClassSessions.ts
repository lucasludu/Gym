import { useQuery } from '@tanstack/react-query';

import { getClassSessions } from '../api/classes';
import type { LocalDate } from '../domain/dates';
import { queryKeys } from './queryKeys';

/** Class sessions between two Buenos Aires dates (both included). */
export function useClassSessions(range: { from: LocalDate; to: LocalDate }) {
  return useQuery({
    queryKey: queryKeys.classSessions(range),
    queryFn: ({ signal }) => getClassSessions(range, { signal }),
  });
}
