import { Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';

import { AppProviders } from '../src/components/AppProviders';
import { sessionStore, useSession } from '../src/store/appSession';
import { toNavigationTheme, useTheme } from '../src/theme';

export default function RootLayout() {
  const theme = useTheme();
  const status = useSession((s) => s.status);

  useEffect(() => {
    void sessionStore.getState().hydrate();
  }, []);

  return (
    <AppProviders>
      <ThemeProvider value={toNavigationTheme(theme)}>
        <StatusBar style="auto" />
        {status === 'loading' ? (
          // Reading the saved session takes milliseconds: show only the background.
          <View style={{ flex: 1, backgroundColor: theme.colors.background }} />
        ) : (
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Protected guard={status === 'signedIn'} redirectTo="/login">
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="classes/[id]" />
            </Stack.Protected>
            <Stack.Protected guard={status === 'signedOut'} redirectTo="/">
              <Stack.Screen name="(auth)" />
            </Stack.Protected>
            <Stack.Screen name="showcase" options={{ headerShown: true, title: 'Componentes' }} />
          </Stack>
        )}
      </ThemeProvider>
    </AppProviders>
  );
}
