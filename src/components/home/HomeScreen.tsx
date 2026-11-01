import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';

import { useNow } from '../../hooks/useNow';
import { useUser } from '../../hooks/useUser';
import { useSession } from '../../store/appSession';
import { useTheme } from '../../theme';
import { Text } from '../ui';
import { MembershipCard } from './MembershipCard';
import { NextClassCard } from './NextClassCard';
import { StreakCard } from './StreakCard';

/** Inicio (specs/features/home.md): what the member needs for today, each card on its own. */
export function HomeScreen() {
  const { colors, spacing } = useTheme();
  const userId = useSession((s) => s.userId);
  const user = useUser(userId);
  const now = useNow();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Pull to refresh refetches every card; the data on screen stays visible meanwhile.
  const refresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.refetchQueries({ type: 'active' });
    } finally {
      setRefreshing(false);
    }
  };

  if (userId === null) return null;
  const greeting = user.data === undefined ? 'Hola' : `Hola, ${user.data.firstName}`;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void refresh()}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <Text variant="title">{greeting}</Text>
      <MembershipCard userId={userId} now={now} />
      <NextClassCard userId={userId} now={now} />
      <StreakCard userId={userId} now={now} />
    </ScrollView>
  );
}
