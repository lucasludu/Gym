import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';

import { createQueryClient, setupAppFocus } from '../hooks/queryClient';

/** App-wide providers, used by the root layout. */
export function AppProviders({ children }: { children: ReactNode }) {
  // Lazy initial state: one client for the whole app session.
  const [queryClient] = useState(createQueryClient);

  useEffect(() => setupAppFocus(), []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
