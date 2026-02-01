'use client';

/**
 * Client-side Providers
 *
 * Wraps the application with necessary client-side providers.
 * This component must be a client component to use React Query.
 */

import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createQueryClient } from '@/lib/api/query-client';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Create QueryClient instance once per component lifecycle
  // Using useState ensures the client is created only once on the client
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only shown in development */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
