import { StyleSheet, View } from 'react-native';

import type { ClassColor } from '../../domain/classType';
import { useTheme, type ColorTokens } from '../../theme';
import { Text } from './Text';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | ClassColor;

export interface BadgeProps {
  label: string;
  /** Default: neutral. Class accents are allowed, e.g. the class type color. */
  tone?: BadgeTone;
  testID?: string;
}

const textColor = (tone: BadgeTone): keyof ColorTokens => (tone === 'neutral' ? 'textMuted' : tone);

/** A small, non-interactive status label ("Lleno", "Reservada", "Por vencer"). */
export function Badge({ label, tone = 'neutral', testID }: BadgeProps) {
  const theme = useTheme();
  return (
    <View
      testID={testID}
      style={[
        styles.base,
        {
          backgroundColor: tone === 'primary' ? theme.colors.primarySoft : theme.colors.surfaceAlt,
          borderRadius: theme.radii.pill,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xxs,
        },
      ]}
    >
      <Text variant="label" color={textColor(tone)}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignSelf: 'flex-start' },
});
