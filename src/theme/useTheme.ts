import * as ReactNative from 'react-native';

import { createTheme, type Theme } from './theme';

/**
 * The theme of the current system color scheme; re-renders when it changes.
 * Anything other than "dark" (null, "unspecified") falls back to light.
 */
export function useTheme(): Theme {
  const scheme = ReactNative.useColorScheme();
  return createTheme(scheme === 'dark' ? 'dark' : 'light');
}
