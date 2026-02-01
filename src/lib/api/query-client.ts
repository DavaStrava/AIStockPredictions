/**
 * React Query Client Configuration
 *
 * Centralized configuration for React Query with optimized defaults
 * for the stock prediction application.
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Creates a configured QueryClient instance
 *
 * Default settings:
 * - staleTime: 30 seconds (data considered fresh)
 * - gcTime: 5 minutes (cache garbage collection)
 * - retry: 1 attempt on failure
 * - refetchOnWindowFocus: true (refresh when tab becomes active)
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 30 seconds
        staleTime: 30 * 1000,
        // Cache is garbage collected after 5 minutes
        gcTime: 5 * 60 * 1000,
        // Retry failed requests once
        retry: 1,
        // Refetch when window regains focus
        refetchOnWindowFocus: true,
        // Don't refetch on mount if data is fresh
        refetchOnMount: true,
        // Don't refetch on reconnect by default
        refetchOnReconnect: 'always',
      },
      mutations: {
        // Don't retry mutations by default
        retry: 0,
      },
    },
  });
}

/**
 * Query key factory for consistent cache key management
 *
 * Usage:
 * ```typescript
 * queryKey: queryKeys.trades.list({ status: 'OPEN' })
 * queryKey: queryKeys.predictions.list('AAPL,GOOGL')
 * ```
 */
export const queryKeys = {
  // Trades
  trades: {
    all: ['trades'] as const,
    lists: () => [...queryKeys.trades.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.trades.lists(), filters] as const,
    details: () => [...queryKeys.trades.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.trades.details(), id] as const,
    stats: () => [...queryKeys.trades.all, 'stats'] as const,
  },

  // Predictions
  predictions: {
    all: ['predictions'] as const,
    list: (symbols?: string) =>
      [...queryKeys.predictions.all, 'list', symbols] as const,
  },

  // Analysis
  analysis: {
    all: ['analysis'] as const,
    detail: (symbol: string, timeframe?: string) =>
      [...queryKeys.analysis.all, symbol, timeframe] as const,
  },

  // Search
  search: {
    all: ['search'] as const,
    stocks: (query: string, limit?: number) =>
      [...queryKeys.search.all, 'stocks', query, limit] as const,
  },

  // Market Indices
  marketIndices: {
    all: ['marketIndices'] as const,
    list: () => [...queryKeys.marketIndices.all, 'list'] as const,
    analysis: (symbol: string) =>
      [...queryKeys.marketIndices.all, 'analysis', symbol] as const,
  },

  // Watchlists
  watchlists: {
    all: ['watchlists'] as const,
    lists: () => [...queryKeys.watchlists.all, 'list'] as const,
    list: () => [...queryKeys.watchlists.lists()] as const,
    details: () => [...queryKeys.watchlists.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.watchlists.details(), id] as const,
  },

  // Insights
  insights: {
    all: ['insights'] as const,
    detail: (symbol: string) =>
      [...queryKeys.insights.all, symbol] as const,
  },
} as const;
