import { DarkTheme, DefaultTheme } from 'expo-router';

import { darkColors, lightColors } from './colors';
import { toNavigationTheme } from './navigationTheme';
import { createTheme } from './theme';

describe('toNavigationTheme', () => {
  it('maps the light theme onto the navigation light theme', () => {
    const nav = toNavigationTheme(createTheme('light'));
    expect(nav.dark).toBe(false);
    expect(nav.colors).toEqual({
      primary: lightColors.primary,
      background: lightColors.background,
      card: lightColors.surface,
      text: lightColors.text,
      border: lightColors.border,
      notification: lightColors.danger,
    });
    expect(nav.fonts).toBe(DefaultTheme.fonts);
  });

  it('maps the dark theme onto the navigation dark theme', () => {
    const nav = toNavigationTheme(createTheme('dark'));
    expect(nav.dark).toBe(true);
    expect(nav.colors.background).toBe(darkColors.background);
    expect(nav.colors.card).toBe(darkColors.surface);
    expect(nav.fonts).toBe(DarkTheme.fonts);
  });

  it('returns the same object for the same theme', () => {
    expect(toNavigationTheme(createTheme('dark'))).toBe(toNavigationTheme(createTheme('dark')));
  });
});
