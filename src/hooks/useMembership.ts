import { skipToken, useQuery } from '@tanstack/react-query';

import { getPlan, getUserMembership } from '../api/memberships';
import type { Membership } from '../domain/membership';
import type { Plan } from '../domain/plan';
import { queryKeys } from './queryKeys';

export interface MembershipWithPlan {
  membership: Membership;
  plan: Plan;
}

/**
 * The user's membership with its plan, or `null` if they have none.
 * Status and days left are derived in the UI with getMembershipStatus / getDaysLeft.
 */
export function useMembership(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.membership(userId),
    queryFn:
      userId === null
        ? skipToken
        : async ({ signal }): Promise<MembershipWithPlan | null> => {
            const membership = await getUserMembership(userId, { signal });
            if (membership === null) return null;
            const plan = await getPlan(membership.planId, { signal });
            return { membership, plan };
          },
  });
}
