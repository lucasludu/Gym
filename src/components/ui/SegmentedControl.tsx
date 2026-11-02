import { Pressable, View } from 'react-native';

import { MIN_TOUCH_TARGET, useTheme } from '../../theme';
import { Text } from './Text';

export interface SegmentedControlProps<V extends string> {
  options: readonly { value: V; label: string }[];
  value: V;
  onChange: (value: V) => void;
}

/** Switches between views of a screen ("Calendario" | "Mis reservas"); announced as tabs. */
export function SegmentedControl<V extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<V>) {
  const { colors, spacing, radii } = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        padding: spacing.xxs,
        borderRadius: radii.md,
        backgroundColor: colors.surfaceAlt,
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            style={{
              flex: 1,
              minHeight: MIN_TOUCH_TARGET,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radii.sm,
              backgroundColor: selected ? colors.surface : 'transparent',
            }}
          >
            <Text variant="label" color={selected ? 'text' : 'textMuted'}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
