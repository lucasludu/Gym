import { useQuery } from '@tanstack/react-query';

import { getExercises } from '../api/exercises';
import { queryKeys } from './queryKeys';

/** The catalog only changes when it is reimported, so it never goes stale in a session. */
export function useExercises() {
  return useQuery({
    queryKey: queryKeys.exercises(),
    queryFn: ({ signal }) => getExercises({ signal }),
    staleTime: Infinity,
  });
}
