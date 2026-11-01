import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { MIN_TOUCH_TARGET, useTheme } from '../../theme';

interface BaseProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** A pressable card must say what it does: accessibilityLabel is required with onPress. */
export type CardProps = BaseProps &
  (
    | { onPress?: undefined; accessibilityLabel?: string; accessibilityHint?: undefined }
    | { onPress: () => void; accessibilityLabel: string; accessibilityHint?: string }
  );

export function Card({
  children,
  style,
  testID,
  onPress,
  accessibilityLabel,
  accessibilityHint,
}: CardProps) {
  const theme = useTheme();
  const cardStyle: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    ...theme.shadows.card,
  };

  if (onPress === undefined) {
    return (
      <View testID={testID} accessibilityLabel={accessibilityLabel} style={[cardStyle, style]}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        cardStyle,
        { minHeight: MIN_TOUCH_TARGET },
        pressed && { backgroundColor: theme.colors.surfaceAlt },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}
