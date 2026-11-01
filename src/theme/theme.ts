import type { TextStyle, ViewStyle } from 'react-native';

import { darkColors, lightColors, type ColorScheme, type ColorTokens } from './colors';
import { spacing } from './spacing';

export { spacing };

/** Minimum touch area (width and height) of every interactive element. */
export const MIN_TOUCH_TARGET = 44;

type TypographyStyle = Required<Pick<TextStyle, 'fontSize' | 'lineHeight' | 'fontWeight'>> & {
  fontSize: number;
  lineHeight: number;
};

/** Text styles with the system font (San Francisco / Roboto), so dynamic type keeps working. */
export const typography = {
  display: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  subtitle: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
} as const satisfies Record<string, TypographyStyle>;

export const radii = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

type Shadows = Readonly<Record<'card' | 'raised', Pick<ViewStyle, 'boxShadow'>>>;

/** Cross-platform shadows (`boxShadow`, New Architecture). Dark mode uses deeper, subtler ones. */
export const shadows: Readonly<Record<ColorScheme, Shadows>> = {
  light: {
    card: { boxShadow: '0 1px 3px rgba(18, 20, 18, 0.08)' },
    raised: { boxShadow: '0 6px 16px rgba(18, 20, 18, 0.12)' },
  },
  dark: {
    card: { boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4)' },
    raised: { boxShadow: '0 6px 16px rgba(0, 0, 0, 0.5)' },
  },
};

export interface Theme {
  scheme: ColorScheme;
  colors: ColorTokens;
  spacing: typeof spacing;
  typography: typeof typography;
  radii: typeof radii;
  shadows: Shadows;
}

const themes: Readonly<Record<ColorScheme, Theme>> = {
  light: {
    scheme: 'light',
    colors: lightColors,
    spacing,
    typography,
    radii,
    shadows: shadows.light,
  },
  dark: { scheme: 'dark', colors: darkColors, spacing, typography, radii, shadows: shadows.dark },
};

/** The theme for a color scheme. Always the same object per scheme. */
export function createTheme(scheme: ColorScheme): Theme {
  return themes[scheme];
}
