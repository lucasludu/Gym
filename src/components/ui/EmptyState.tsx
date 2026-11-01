import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme';
import { Button } from './Button';
import { Text } from './Text';

export interface EmptyStateProps {
  title: string;
  message?: string;
  /** Optional illustration or icon above the title. */
  icon?: ReactNode;
  /** Optional next step ("Ver clases"). */
  action?: { label: string; onPress: () => void };
  testID?: string;
}

/** Shown when a screen has data but nothing to list. */
export function EmptyState({ title, message, icon, action, testID }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View
      testID={testID}
      style={[styles.container, { padding: theme.spacing.lg, gap: theme.spacing.md }]}
    >
      {icon}
      <View style={[styles.texts, { gap: theme.spacing.xs }]}>
        <Text variant="title" style={styles.center}>
          {title}
        </Text>
        {message !== undefined && (
          <Text color="textMuted" style={styles.center}>
            {message}
          </Text>
        )}
      </View>
      {action !== undefined && <Button label={action.label} onPress={action.onPress} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  texts: { alignItems: 'center' },
  center: { textAlign: 'center' },
});
