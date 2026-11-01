import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { MIN_TOUCH_TARGET, useTheme, type ColorTokens } from '../../theme';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** Shows a spinner and ignores presses (avoids double submits). */
  loading?: boolean;
  /** Defaults to the label; use it when the label alone is ambiguous ("Reservar Yoga del martes"). */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** Optional icon before the label. */
  icon?: ReactNode;
  testID?: string;
}

type Colors = { background: string; text: keyof ColorTokens; border: string };

const variantColors = (variant: ButtonVariant, colors: ColorTokens): Colors => {
  switch (variant) {
    case 'primary':
      return { background: colors.primary, text: 'onPrimary', border: colors.primary };
    case 'danger':
      return { background: colors.danger, text: 'onDanger', border: colors.danger };
    case 'secondary':
      return { background: colors.surface, text: 'text', border: colors.borderStrong };
    case 'ghost':
      return { background: 'transparent', text: 'primary', border: 'transparent' };
  }
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityLabel,
  accessibilityHint,
  icon,
  testID,
}: ButtonProps) {
  const theme = useTheme();
  const { background, text, border } = variantColors(variant, theme.colors);
  const inactive = disabled || loading;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: background,
          borderColor: border,
          borderRadius: theme.radii.md,
          paddingHorizontal: theme.spacing.md,
          gap: theme.spacing.sm,
        },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {/* The content stays laid out while loading so the button keeps its size. */}
      <View style={[styles.content, { gap: theme.spacing.sm }, loading && styles.hidden]}>
        {icon}
        <Text variant="bodyStrong" color={text}>
          {label}
        </Text>
      </View>
      {loading && (
        <ActivityIndicator
          testID="button-spinner"
          color={theme.colors[text]}
          style={StyleSheet.absoluteFill}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH_TARGET,
    minWidth: MIN_TOUCH_TARGET,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: { flexDirection: 'row', alignItems: 'center' },
  hidden: { opacity: 0 },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
});
