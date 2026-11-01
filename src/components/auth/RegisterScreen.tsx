import { View } from 'react-native';

import { useTheme } from '../../theme';
import { Text } from '../ui';

/** Registration. The form arrives in T5.4. */
export function RegisterScreen() {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg }}>
      <Text variant="display">Creá tu cuenta</Text>
    </View>
  );
}
