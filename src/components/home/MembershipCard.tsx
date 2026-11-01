import { View } from 'react-native';

import { useMembership } from '../../hooks/useMembership';
import { useTheme } from '../../theme';
import { Badge, Text } from '../ui';
import { HomeCard } from './HomeCard';
import { getMembershipSummary } from './membershipSummary';

/** T5.6: membership status, days left and plan limit. Not interactive (no payments in the MVP). */
export function MembershipCard({ userId, now }: { userId: string; now: Date }) {
  const { spacing } = useTheme();
  const membership = useMembership(userId);

  return (
    <HomeCard title="Membresía" query={membership}>
      {(data) => {
        const summary = getMembershipSummary(data, now);
        return (
          <View style={{ gap: spacing.xs }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Text variant="subtitle" style={{ flexShrink: 1 }}>
                {summary.title}
              </Text>
              {summary.badge !== null && (
                <Badge label={summary.badge.label} tone={summary.badge.tone} />
              )}
            </View>
            <Text color="textMuted">{summary.detail}</Text>
            {summary.planLimit !== null && (
              <Text variant="caption" color="textMuted">
                {summary.planLimit}
              </Text>
            )}
          </View>
        );
      }}
    </HomeCard>
  );
}
