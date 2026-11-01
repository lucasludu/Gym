import { DarkTheme, DefaultTheme, type Theme as NavigationTheme } from 'expo-router';

import type { ColorScheme } from './colors';
import { createTheme, type Theme } from './theme';

const build = (scheme: ColorScheme): NavigationTheme => {
  const { colors } = createTheme(scheme);
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
  };
};

const navigationThemes: Readonly<Record<ColorScheme, NavigationTheme>> = {
  light: build('light'),
  dark: build('dark'),
};

/** Our theme in the shape React Navigation expects (headers, tab bar). Stable per scheme. */
export function toNavigationTheme(theme: Theme): NavigationTheme {
  return navigationThemes[theme.scheme];
}
