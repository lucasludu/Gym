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
  testID?: string;
}

/** Full-area error with a retry button. */
export function ErrorState({
  error,
  onRetry,
  retrying = false,
  title,
  message,
  testID,
}: ErrorStateProps) {
  const theme = useTheme();
  const fallback = getErrorMessage(error);

  return (
    <View
      testID={testID}
      accessibilityLiveRegion="polite"
      style={[styles.container, { padding: theme.spacing.lg, gap: theme.spacing.md }]}
    >
      <View style={[styles.texts, { gap: theme.spacing.xs }]}>
        <Text variant="title" style={styles.center}>
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
  texts: { alignItems: 'center' },
  center: { textAlign: 'center' },
});
