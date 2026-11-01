import { skipToken, useQuery } from '@tanstack/react-query';

import { getUser } from '../api/users';
import { queryKeys } from './queryKeys';

/** The user's profile. A 404 means the account no longer exists. */
export function useUser(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.user(userId),
    queryFn: userId === null ? skipToken : ({ signal }) => getUser(userId, { signal }),
  });
}
