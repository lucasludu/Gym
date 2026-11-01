import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme';
import { Button } from './Button';
import { getErrorMessage } from './errorMessage';
import { Text } from './Text';

export interface ErrorStateProps {
  /** The error to explain; any value works (ApiError gets a specific message). */
  error: unknown;
  onRetry: () => void;
  /** Shows the retry button as loading (e.g. TanStack Query's `isRefetching`). */
  retrying?: boolean;
  /** Overrides the title derived from the error. */
  title?: string;
  /** Overrides the message derived from the error. */
  message?: string;
  /** Fits inside a card: no full-screen layout and a non-header title. */
  compact?: boolean;
  testID?: string;
}

/** Full-area error with a retry button. */
export function ErrorState({
  error,
  onRetry,
  retrying = false,
  title,
  message,
  compact = false,
  testID,
}: ErrorStateProps) {
  const theme = useTheme();
  const fallback = getErrorMessage(error);

  return (
    <View
      testID={testID}
      accessibilityLiveRegion="polite"
      style={[
        compact ? styles.compact : styles.container,
        { padding: compact ? theme.spacing.sm : theme.spacing.lg, gap: theme.spacing.md },
      ]}
    >
      <View style={[styles.texts, { gap: theme.spacing.xs }]}>
        <Text variant={compact ? 'subtitle' : 'title'} style={styles.center}>
          {title ?? fallback.title}
        </Text>
        <Text color="textMuted" style={styles.center}>
          {message ?? fallback.message}
        </Text>
      </View>
      <Button label="Reintentar" variant="secondary" loading={retrying} onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  compact: { alignItems: 'center' },
  texts: { alignItems: 'center' },
  center: { textAlign: 'center' },
});
