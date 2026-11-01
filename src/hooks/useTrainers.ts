import { useQuery } from '@tanstack/react-query';

import { getTrainers } from '../api/classes';
import { queryKeys } from './queryKeys';

export function useTrainers() {
  return useQuery({
    queryKey: queryKeys.trainers(),
    queryFn: ({ signal }) => getTrainers({ signal }),
  });
}
