import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme, type ColorTokens, type typography } from '../../theme';

export type TextVariant = keyof typeof typography;

export interface TextProps extends RNTextProps {
  /** Typography style. Default: body. */
  variant?: TextVariant;
  /** Color token. Default: text. */
  color?: keyof ColorTokens;
}

const HEADER_VARIANTS: ReadonlySet<TextVariant> = new Set(['display', 'title']);

/** Themed text. Display and title are announced as headers by screen readers. */
export function Text({ variant = 'body', color = 'text', style, ...props }: TextProps) {
  const theme = useTheme();
  return (
    <RNText
      accessibilityRole={HEADER_VARIANTS.has(variant) ? 'header' : undefined}
      {...props}
      style={[theme.typography[variant], { color: theme.colors[color] }, style]}
    />
  );
}
