// Icon fonts (@expo/vector-icons) cannot be loaded in Jest: there is no asset registry.
// Report every font as loaded so icons render as they do in the app.
jest.mock('expo-font', () => ({
  ...jest.requireActual<typeof import('expo-font')>('expo-font'),
  isLoaded: () => true,
  loadAsync: () => Promise.resolve(),
}));
