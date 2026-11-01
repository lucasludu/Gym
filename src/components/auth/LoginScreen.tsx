import { View } from 'react-native';

import { useTheme } from '../../theme';
import { Text } from '../ui';

/** Login. The form arrives in T5.3. */
export function LoginScreen() {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg }}>
      <Text variant="display">Ingresá a tu cuenta</Text>
    </View>
  );
}
