import { useQuery } from '@tanstack/react-query';

import { getClassSession } from '../api/classes';
import { queryKeys } from './queryKeys';

/** One class session; under the class sessions key, so booking invalidates it too. */
export function useClassSession(id: string) {
  return useQuery({
    queryKey: queryKeys.classSession(id),
    queryFn: ({ signal }) => getClassSession(id, { signal }),
  });
}
