/**
 * usePortfolioStats Hook
 *
 * Manages trade data fetching, creation, closure, and portfolio statistics.
 * Uses React Query for automatic caching, background refetching, and
 * optimistic updates.
 *
 * Requirements: 6.1, 7.1, 7.2, 7.3
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, CreateTradeRequest } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-client';
import type {
  TradeWithPnL,
  PortfolioStats,
  TradeFilters,
  JournalTrade,
} from '@/types/models';

/**
 * Return type for the usePortfolioStats hook
 */
export interface UsePortfolioStatsReturn {
  trades: TradeWithPnL[];
  stats: PortfolioStats | null;
  loading: boolean;
  statsLoading: boolean;
  error: string | null;
  fetchTrades: (filters?: TradeFilters) => Promise<void>;
  createTrade: (data: CreateTradeRequest) => Promise<JournalTrade>;
  closeTrade: (tradeId: string, exitPrice: number) => Promise<JournalTrade>;
  refreshStats: () => Promise<void>;
}

/**
 * Hook for managing portfolio trades and statistics.
 *
 * Uses React Query for:
 * - Automatic caching of trades and stats
 * - Background refetching when window regains focus
 * - Automatic cache invalidation after mutations
 * - Loading and error state management
 *
 * @param filters - Optional filters for trades query
 * @returns UsePortfolioStatsReturn - State and functions for trade management
 */
export function usePortfolioStats(filters?: TradeFilters): UsePortfolioStatsReturn {
  const queryClient = useQueryClient();

  // Query for trades list
  const tradesQuery = useQuery({
    queryKey: queryKeys.trades.list(filters),
    queryFn: () => api.trades.list(filters),
  });

  // Query for portfolio stats
  const statsQuery = useQuery({
    queryKey: queryKeys.trades.stats(),
    queryFn: () => api.trades.stats(),
  });

  // Mutation for creating trades
  const createTradeMutation = useMutation({
    mutationFn: (data: CreateTradeRequest) => api.trades.create(data),
    onSuccess: () => {
      // Invalidate and refetch trades and stats after creation
      queryClient.invalidateQueries({ queryKey: queryKeys.trades.all });
    },
  });

  // Mutation for closing trades
  const closeTradeMutation = useMutation({
    mutationFn: ({ tradeId, exitPrice }: { tradeId: string; exitPrice: number }) =>
      api.trades.close(tradeId, exitPrice),
    onSuccess: () => {
      // Invalidate and refetch trades and stats after closing
      queryClient.invalidateQueries({ queryKey: queryKeys.trades.all });
    },
  });

  /**
   * Fetches trades with optional filters.
   * Triggers a refetch of the trades query with new filters.
   */
  const fetchTrades = async (newFilters?: TradeFilters): Promise<void> => {
    // If filters changed, invalidate and refetch
    if (newFilters !== filters) {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.trades.list(newFilters),
      });
    } else {
      await tradesQuery.refetch();
    }
  };

  /**
   * Creates a new trade.
   * @param data - Trade creation data
   * @returns The created trade
   */
  const createTrade = async (data: CreateTradeRequest): Promise<JournalTrade> => {
    return createTradeMutation.mutateAsync(data);
  };

  /**
   * Closes an open trade.
   * @param tradeId - ID of the trade to close
   * @param exitPrice - Exit price for the trade
   * @returns The updated trade
   */
  const closeTrade = async (
    tradeId: string,
    exitPrice: number
  ): Promise<JournalTrade> => {
    return closeTradeMutation.mutateAsync({ tradeId, exitPrice });
  };

  /**
   * Refreshes portfolio statistics.
   */
  const refreshStats = async (): Promise<void> => {
    await statsQuery.refetch();
  };

  // Derive error message from queries or mutations
  const error =
    tradesQuery.error?.message ||
    statsQuery.error?.message ||
    createTradeMutation.error?.message ||
    closeTradeMutation.error?.message ||
    null;

  return {
    trades: tradesQuery.data ?? [],
    stats: statsQuery.data ?? null,
    loading: tradesQuery.isLoading || tradesQuery.isFetching,
    statsLoading: statsQuery.isLoading || statsQuery.isFetching,
    error,
    fetchTrades,
    createTrade,
    closeTrade,
    refreshStats,
  };
}

// =============================================================================
// Additional Hooks for Granular Access
// =============================================================================

/**
 * Hook for fetching trades list only
 */
export function useTrades(filters?: TradeFilters) {
  return useQuery({
    queryKey: queryKeys.trades.list(filters),
    queryFn: () => api.trades.list(filters),
  });
}

/**
 * Hook for fetching a single trade
 */
export function useTrade(id: string) {
  return useQuery({
    queryKey: queryKeys.trades.detail(id),
    queryFn: () => api.trades.get(id),
    enabled: !!id,
  });
}

/**
 * Hook for fetching portfolio stats only
 */
export function usePortfolioStatsOnly() {
  return useQuery({
    queryKey: queryKeys.trades.stats(),
    queryFn: () => api.trades.stats(),
  });
}

/**
 * Hook for trade mutations (create, close, update, delete)
 */
export function useTradeMutations() {
  const queryClient = useQueryClient();

  const createTrade = useMutation({
    mutationFn: (data: CreateTradeRequest) => api.trades.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trades.all });
    },
  });

  const closeTrade = useMutation({
    mutationFn: ({ id, exitPrice }: { id: string; exitPrice: number }) =>
      api.trades.close(id, exitPrice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trades.all });
    },
  });

  const deleteTrade = useMutation({
    mutationFn: (id: string) => api.trades.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trades.all });
    },
  });

  return {
    createTrade,
    closeTrade,
    deleteTrade,
    isLoading:
      createTrade.isPending || closeTrade.isPending || deleteTrade.isPending,
  };
}
