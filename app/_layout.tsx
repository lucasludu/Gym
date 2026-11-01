import { Stack } from 'expo-router';

import { AppProviders } from '../src/components/AppProviders';

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack />
    </AppProviders>
  );
}
