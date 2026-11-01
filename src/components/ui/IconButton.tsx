import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { MIN_TOUCH_TARGET, useTheme } from '../../theme';

export interface IconButtonProps {
  icon: ReactNode;
  /** Required: an icon has no text for screen readers. */
  accessibilityLabel: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityHint?: string;
  testID?: string;
}

/** A round button with only an icon; always at least 44 × 44 px. */
export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  disabled = false,
  accessibilityHint,
  testID,
}: IconButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.base,
        { borderRadius: theme.radii.pill },
        pressed && { backgroundColor: theme.colors.surfaceAlt },
        disabled && styles.disabled,
      ]}
    >
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.5 },
});
