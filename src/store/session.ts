import { z } from 'zod';
import { createStore, type StoreApi } from 'zustand/vanilla';

import { idSchema } from '../domain/common';

/** Async key-value storage (expo-secure-store in the app, in memory in tests). */
export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export const SESSION_KEY = 'session';

/** Only the userId is persisted; the profile is fetched from the API. */
const savedSessionSchema = z.object({ userId: idSchema });

export type SessionStatus = 'loading' | 'signedIn' | 'signedOut';

export interface SessionState {
  status: SessionStatus;
  userId: string | null;
  /** Reads the saved session once. Unreadable or corrupt → signed out. */
  hydrate(): Promise<void>;
  /** Saves the session; throws (and stays signed out) if it cannot be saved. */
  signIn(userId: string): Promise<void>;
  /** Signs out locally even if the storage fails to delete. */
  signOut(): Promise<void>;
}

export type SessionStore = StoreApi<SessionState>;

const parseSaved = (raw: string | null): string | null => {
  if (raw === null) return null;
  try {
    const parsed = savedSessionSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data.userId : null;
  } catch {
    return null;
  }
};

export function createSessionStore(storage: KeyValueStorage): SessionStore {
  let hydration: Promise<void> | null = null;

  return createStore<SessionState>()((set, get) => ({
    status: 'loading',
    userId: null,

    hydrate() {
      hydration ??= (async () => {
        let raw: string | null = null;
        try {
          raw = await storage.getItem(SESSION_KEY);
        } catch {
          raw = null;
        }
        // A sign in/out during the read wins over what was saved (and must not be deleted).
        if (get().status !== 'loading') return;
        const userId = parseSaved(raw);
        set(
          userId === null ? { status: 'signedOut', userId: null } : { status: 'signedIn', userId },
        );
        if (raw !== null && userId === null) {
          await storage.removeItem(SESSION_KEY).catch(() => undefined);
        }
      })();
      return hydration;
    },

    async signIn(userId) {
      const valid = idSchema.parse(userId);
      await storage.setItem(SESSION_KEY, JSON.stringify({ userId: valid }));
      set({ status: 'signedIn', userId: valid });
    },

    async signOut() {
      set({ status: 'signedOut', userId: null });
      await storage.removeItem(SESSION_KEY).catch(() => undefined);
    },
  }));
}
