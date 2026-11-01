import { View } from 'react-native';

import { useTheme } from '../../theme';
import { Text } from '../ui';

/** Error about the whole form (credentials, connection), announced to screen readers. */
export function FormError({ message }: { message: string }) {
  const { colors, radii, spacing } = useTheme();
  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{
        backgroundColor: colors.surfaceAlt,
        borderColor: colors.danger,
        borderWidth: 1,
        borderRadius: radii.md,
        padding: spacing.md,
      }}
    >
      <Text color="danger">{message}</Text>
    </View>
  );
}
