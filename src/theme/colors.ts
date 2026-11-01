import type { ClassColor } from '../domain/classType';

export type ColorScheme = 'light' | 'dark';

type SemanticColor =
  | 'background'
  | 'surface'
  | 'surfaceAlt'
  | 'border'
  | 'borderStrong'
  | 'text'
  | 'textMuted'
  | 'primary'
  | 'onPrimary'
  | 'primarySoft'
  | 'success'
  | 'warning'
  | 'danger'
  | 'onDanger';

/** Every color token, including the 6 ClassType accents. Light and dark share the keys. */
export type ColorTokens = Readonly<Record<SemanticColor | ClassColor, string>>;

/**
 * Brand: lime green. Accents are chosen to stay distinguishable from the primary
 * (green is emerald, teal is cyan). Contrast is checked in colors.test.ts.
 */
export const lightColors: ColorTokens = {
  background: '#F7F8F5',
  surface: '#FFFFFF',
  surfaceAlt: '#F2F4EF',
  border: '#D9DDD4',
  borderStrong: '#8A9186',
  text: '#121412',
  textMuted: '#555B52',
  primary: '#3F7D0A',
  onPrimary: '#FFFFFF',
  primarySoft: '#EEF7E4',
  success: '#147A3A',
  warning: '#A14A07',
  danger: '#B91C1C',
  onDanger: '#FFFFFF',

  accentOrange: '#C2410C',
  accentBlue: '#1D4ED8',
  accentGreen: '#047857',
  accentPurple: '#7E22CE',
  accentPink: '#BE185D',
  accentTeal: '#0E7490',
};

export const darkColors: ColorTokens = {
  background: '#0F1110',
  surface: '#1A1D1B',
  surfaceAlt: '#242826',
  border: '#2F3431',
  borderStrong: '#6B736A',
  text: '#F2F4F1',
  textMuted: '#A3AAA0',
  primary: '#A3E635',
  onPrimary: '#121412',
  primarySoft: '#24331A',
  success: '#4ADE80',
  warning: '#FBBF24',
  danger: '#F87171',
  onDanger: '#121412',

  accentOrange: '#FB923C',
  accentBlue: '#60A5FA',
  accentGreen: '#34D399',
  accentPurple: '#C084FC',
  accentPink: '#F472B6',
  accentTeal: '#22D3EE',
};
