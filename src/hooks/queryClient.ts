import { QueryClient, focusManager } from '@tanstack/react-query';
import { AppState } from 'react-native';

import { isApiError } from '../api/client';

export const MAX_RETRIES = 2;
const STALE_TIME_MS = 30_000;

/**
 * Retries only errors that may go away on their own: network, timeout and 5xx.
 * 4xx, invalid responses, cancellations and bugs fail at once.
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES || !isApiError(error)) return false;
  if (error.kind === 'network' || error.kind === 'timeout') return true;
  return error.kind === 'http' && error.status !== null && error.status >= 500;
}

/** One client per app session; created in the root layout. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry, staleTime: STALE_TIME_MS },
      mutations: { retry: false },
    },
  });
}

/**
 * React Native has no window focus: tell TanStack Query when the app comes back to the
 * foreground, so stale queries refetch. Returns the cleanup function.
 */
export function setupAppFocus(): () => void {
  const subscription = AppState.addEventListener('change', (state) => {
    focusManager.setFocused(state === 'active');
  });
  return () => subscription.remove();
}
