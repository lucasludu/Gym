import { SESSION_KEY, createSessionStore, type KeyValueStorage } from './session';

const memoryStorage = (initial: Record<string, string> = {}) => {
  const data = new Map(Object.entries(initial));
  const storage: KeyValueStorage = {
    getItem: jest.fn(async (key: string) => data.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      data.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      data.delete(key);
    }),
  };
  return { storage, data };
};

const saved = (userId: string) => ({ [SESSION_KEY]: JSON.stringify({ userId }) });

describe('session store', () => {
  it('starts loading, without user', () => {
    const store = createSessionStore(memoryStorage().storage);
    expect(store.getState()).toMatchObject({ status: 'loading', userId: null });
  });

  describe('hydrate', () => {
    it('restores a saved session', async () => {
      const store = createSessionStore(memoryStorage(saved('user-1')).storage);
      await store.getState().hydrate();
      expect(store.getState()).toMatchObject({ status: 'signedIn', userId: 'user-1' });
    });

    it('is signed out when nothing is saved', async () => {
      const store = createSessionStore(memoryStorage().storage);
      await store.getState().hydrate();
      expect(store.getState()).toMatchObject({ status: 'signedOut', userId: null });
    });

    it.each([
      ['not JSON', '{oops'],
      ['wrong shape', JSON.stringify({ id: 'user-1' })],
      ['empty userId', JSON.stringify({ userId: '' })],
    ])('treats a corrupt session (%s) as signed out and deletes it', async (_case, value) => {
      const { storage, data } = memoryStorage({ [SESSION_KEY]: value });
      const store = createSessionStore(storage);
      await store.getState().hydrate();
      expect(store.getState().status).toBe('signedOut');
      expect(data.has(SESSION_KEY)).toBe(false);
    });

    it('is signed out when the storage cannot be read', async () => {
      const { storage } = memoryStorage();
      storage.getItem = jest.fn().mockRejectedValue(new Error('keychain locked'));
      const store = createSessionStore(storage);
      await store.getState().hydrate();
      expect(store.getState().status).toBe('signedOut');
    });

    it('only reads the storage once', async () => {
      const { storage } = memoryStorage(saved('user-1'));
      const store = createSessionStore(storage);
      await Promise.all([store.getState().hydrate(), store.getState().hydrate()]);
      await store.getState().hydrate();
      expect(storage.getItem).toHaveBeenCalledTimes(1);
    });

    it('does not undo a sign in that happened while reading', async () => {
      const { storage } = memoryStorage();
      let release: (value: string | null) => void = () => undefined;
      storage.getItem = jest.fn(() => new Promise<string | null>((r) => (release = r)));
      const store = createSessionStore(storage);
      const hydrating = store.getState().hydrate();
      await store.getState().signIn('user-2');
      release(null);
      await hydrating;
      expect(store.getState()).toMatchObject({ status: 'signedIn', userId: 'user-2' });
    });
  });

  it('does not delete a new session when the old one was corrupt', async () => {
    const { storage, data } = memoryStorage({ [SESSION_KEY]: '{oops' });
    const read = storage.getItem;
    let release: () => void = () => undefined;
    storage.getItem = jest.fn(async (key: string) => {
      const value = await read(key);
      await new Promise<void>((r) => (release = r));
      return value;
    });
    const store = createSessionStore(storage);
    const hydrating = store.getState().hydrate();
    await Promise.resolve();
    await store.getState().signIn('user-2');
    release();
    await hydrating;
    expect(JSON.parse(data.get(SESSION_KEY) ?? 'null')).toEqual({ userId: 'user-2' });
  });

  describe('signIn', () => {
    it('saves only the userId and signs in', async () => {
      const { storage, data } = memoryStorage();
      const store = createSessionStore(storage);
      await store.getState().signIn('user-1');
      expect(store.getState()).toMatchObject({ status: 'signedIn', userId: 'user-1' });
      expect(JSON.parse(data.get(SESSION_KEY) ?? 'null')).toEqual({ userId: 'user-1' });
    });

    it('fails without signing in when the session cannot be saved', async () => {
      const { storage } = memoryStorage();
      storage.setItem = jest.fn().mockRejectedValue(new Error('disk full'));
      const store = createSessionStore(storage);
      await store.getState().hydrate();
      await expect(store.getState().signIn('user-1')).rejects.toThrow('disk full');
      expect(store.getState().status).toBe('signedOut');
    });

    it('rejects an empty userId', async () => {
      const store = createSessionStore(memoryStorage().storage);
      await expect(store.getState().signIn('')).rejects.toThrow();
    });
  });

  describe('signOut', () => {
    it('deletes the saved session and signs out', async () => {
      const { storage, data } = memoryStorage(saved('user-1'));
      const store = createSessionStore(storage);
      await store.getState().hydrate();
      await store.getState().signOut();
      expect(store.getState()).toMatchObject({ status: 'signedOut', userId: null });
      expect(data.has(SESSION_KEY)).toBe(false);
    });

    it('signs out even if the storage fails to delete', async () => {
      const { storage } = memoryStorage(saved('user-1'));
      storage.removeItem = jest.fn().mockRejectedValue(new Error('keychain locked'));
      const store = createSessionStore(storage);
      await store.getState().hydrate();
      await store.getState().signOut();
      expect(store.getState().status).toBe('signedOut');
    });

    it('stays signed out after reopening the app', async () => {
      const { storage } = memoryStorage(saved('user-1'));
      const first = createSessionStore(storage);
      await first.getState().hydrate();
      await first.getState().signOut();

      const reopened = createSessionStore(storage);
      await reopened.getState().hydrate();
      expect(reopened.getState().status).toBe('signedOut');
    });
  });
});
