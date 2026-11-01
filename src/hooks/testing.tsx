/**
 * Test helpers for TanStack Query hooks. Only imported from tests.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

/** A client without retries or caching between tests, so failures show up at once. */
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });

/** Renders a hook inside a fresh QueryClientProvider. */
export async function renderQueryHook<Result>(hook: () => Result) {
  const client = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const rendered = await renderHook(hook, { wrapper });
  return { ...rendered, client };
}
