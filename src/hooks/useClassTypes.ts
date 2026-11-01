import { useQuery } from '@tanstack/react-query';

import { getClassTypes } from '../api/classes';
import { queryKeys } from './queryKeys';

export function useClassTypes() {
  return useQuery({
    queryKey: queryKeys.classTypes(),
    queryFn: ({ signal }) => getClassTypes({ signal }),
  });
}
