import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { createSessionStore, type KeyValueStorage } from '../store/session';
import { createTestQueryClient } from './testing';
import { useSignOut } from './useSignOut';

const memory = (): KeyValueStorage => {
  const data = new Map<string, string>();
  return {
    getItem: async (k) => data.get(k) ?? null,
    setItem: async (k, v) => void data.set(k, v),
    removeItem: async (k) => void data.delete(k),
  };
};

describe('useSignOut', () => {
  it('signs out and clears every cached query (no data left for the next user)', async () => {
    const store = createSessionStore(memory());
    await store.getState().signIn('user-1');
    const client = createTestQueryClient();
    client.setQueryData(['membership', 'user-1'], { plan: 'x' });
    client.setQueryData(['classTypes'], []);

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = await renderHook(() => useSignOut(store), { wrapper });
    await act(() => result.current());

    expect(store.getState().status).toBe('signedOut');
    expect(client.getQueryCache().getAll()).toHaveLength(0);
  });
});
