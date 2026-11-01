import { renderHook } from '@testing-library/react-native';
import * as ReactNative from 'react-native';

import { darkColors, lightColors } from './colors';
import { useTheme } from './useTheme';

const mockScheme = (scheme: ReactNative.ColorSchemeName) =>
  jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue(scheme);

afterEach(() => jest.restoreAllMocks());

describe('useTheme', () => {
  it('returns the light theme when the system is in light mode', async () => {
    mockScheme('light');
    const { result } = await renderHook(() => useTheme());
    expect(result.current.scheme).toBe('light');
    expect(result.current.colors).toBe(lightColors);
  });

  it('returns the dark theme when the system is in dark mode', async () => {
    mockScheme('dark');
    const { result } = await renderHook(() => useTheme());
    expect(result.current.scheme).toBe('dark');
    expect(result.current.colors).toBe(darkColors);
  });

  it.each([null, undefined, 'unspecified'] as const)(
    'falls back to light when the scheme is %p',
    async (scheme) => {
      mockScheme(scheme as ReactNative.ColorSchemeName);
      const { result } = await renderHook(() => useTheme());
      expect(result.current.scheme).toBe('light');
    },
  );

  it('changes the theme when the system scheme changes', async () => {
    const spy = mockScheme('light');
    const { result, rerender } = await renderHook(() => useTheme());
    expect(result.current.scheme).toBe('light');

    spy.mockReturnValue('dark');
    await rerender(undefined);
    expect(result.current.colors).toBe(darkColors);
  });
});
