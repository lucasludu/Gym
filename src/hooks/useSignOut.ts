import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { sessionStore } from '../store/appSession';
import type { SessionStore } from '../store/session';

/**
 * Signs out and deletes every local data of the user: the saved session and the
 * query cache. (The in-progress workout store joins this list in T5.25.)
 */
export function useSignOut(store: SessionStore = sessionStore): () => Promise<void> {
  const queryClient = useQueryClient();
  return useCallback(async () => {
    await store.getState().signOut();
    queryClient.clear();
  }, [store, queryClient]);
}
