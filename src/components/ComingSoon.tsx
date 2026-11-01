import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme';
import { EmptyState } from './ui';

/** Placeholder for a tab whose feature is not built yet. */
export function ComingSoon({ feature, children }: { feature: string; children?: ReactNode }) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.md }}>
      <EmptyState title={feature} message="Esta sección está en construcción." />
      {children}
    </View>
  );
}
