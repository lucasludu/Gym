import { Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppProviders } from '../src/components/AppProviders';
import { toNavigationTheme, useTheme } from '../src/theme';

export default function RootLayout() {
  const theme = useTheme();
  return (
    <AppProviders>
      <ThemeProvider value={toNavigationTheme(theme)}>
        <StatusBar style="auto" />
        <Stack>
          <Stack.Screen name="index" options={{ title: 'Gym' }} />
        </Stack>
      </ThemeProvider>
    </AppProviders>
  );
}
