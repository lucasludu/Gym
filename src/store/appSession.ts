import * as SecureStore from 'expo-secure-store';
import { useStore } from 'zustand';

import { createSessionStore, type KeyValueStorage, type SessionState } from './session';

/** expo-secure-store: Keychain on iOS, encrypted SharedPreferences (Keystore) on Android. */
export const secureStorage: KeyValueStorage = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

/** The app's session, persisted in secure storage. */
export const sessionStore = createSessionStore(secureStorage);

export function useSession<T>(selector: (state: SessionState) => T): T {
  return useStore(sessionStore, selector);
}
