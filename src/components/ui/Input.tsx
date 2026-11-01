import type { ComponentRef, Ref } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { MIN_TOUCH_TARGET, useTheme } from '../../theme';
import { Text } from './Text';

export interface InputProps extends Omit<TextInputProps, 'accessibilityLabel' | 'style'> {
  /** Visible label; also the accessible name of the field. */
  label: string;
  /** Help text, shown while there is no error. */
  hint?: string;
  /** Validation message; replaces the hint and is announced by screen readers. */
  error?: string;
  /** Forwarded to the TextInput (React Hook Form uses it to focus the first error). */
  ref?: Ref<ComponentRef<typeof TextInput>>;
}

export function Input({ label, hint, error, ref, editable = true, ...props }: InputProps) {
  const theme = useTheme();
  const message = error ?? hint;

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <Text variant="label">{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        accessibilityHint={message}
        accessibilityState={{ disabled: !editable }}
        editable={editable}
        placeholderTextColor={theme.colors.textMuted}
        {...props}
        style={[
          styles.input,
          theme.typography.body,
          {
            color: theme.colors.text,
            backgroundColor: editable ? theme.colors.surface : theme.colors.surfaceAlt,
            borderColor: error === undefined ? theme.colors.borderStrong : theme.colors.danger,
            borderRadius: theme.radii.md,
            paddingHorizontal: theme.spacing.md,
          },
        ]}
      />
      {message !== undefined && (
        <Text
          variant="caption"
          color={error === undefined ? 'textMuted' : 'danger'}
          accessibilityLiveRegion={error === undefined ? undefined : 'polite'}
        >
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: MIN_TOUCH_TARGET,
    borderWidth: 1,
  },
});
