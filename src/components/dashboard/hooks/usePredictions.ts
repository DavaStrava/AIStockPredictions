/**
 * usePredictions Hook
 *
 * Manages stock predictions state and operations.
 * Uses React Query for caching and automatic refetching.
 */

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-client';
import type { PredictionResult } from '@/types/predictions';

// Default symbols to fetch when no symbols are specified
const DEFAULT_SYMBOLS = 'AAPL,GOOGL,MSFT,TSLA,NVDA';

/**
 * Return type for the usePredictions hook
 */
export interface UsePredictionsReturn {
  predictions: PredictionResult[];
  loading: boolean;
  searchLoading: boolean;
  fetchPredictions: (symbols?: string, isNewSearch?: boolean) => Promise<void>;
  handleStockSearch: (symbol: string) => Promise<void>;
  removeTile: (symbol: string) => void;
}

/**
 * Hook for managing stock predictions state and operations.
 *
 * Uses React Query for:
 * - Automatic caching of predictions
 * - Background refetching
 * - Request deduplication
 *
 * @param onStockSelected - Optional callback when a stock is selected via search
 * @returns UsePredictionsReturn - State and functions for prediction management
 */
export function usePredictions(
  onStockSelected?: (symbol: string) => Promise<void>
): UsePredictionsReturn {
  const queryClient = useQueryClient();

  // Local state for managing manually added/removed predictions
  const [additionalPredictions, setAdditionalPredictions] = useState<PredictionResult[]>([]);
  const [removedSymbols, setRemovedSymbols] = useState<Set<string>>(new Set());
  const [searchLoading, setSearchLoading] = useState(false);

  // Query for default predictions
  const predictionsQuery = useQuery({
    queryKey: queryKeys.predictions.list(DEFAULT_SYMBOLS),
    queryFn: () => api.predictions.list(DEFAULT_SYMBOLS),
  });

  // Merge default predictions with additional ones, filtering out removed
  const predictions = [
    ...additionalPredictions,
    ...(predictionsQuery.data ?? []).filter(
      (p) =>
        !removedSymbols.has(p.symbol) &&
        !additionalPredictions.some((ap) => ap.symbol === p.symbol)
    ),
  ];

  /**
   * Fetches predictions from the API.
   * @param symbols - Optional comma-separated stock symbols
   * @param isNewSearch - If true, merges with existing predictions
   */
  const fetchPredictions = useCallback(
    async (symbols?: string, isNewSearch = false) => {
      if (!isNewSearch) {
        // Full refresh - just refetch the query
        await predictionsQuery.refetch();
        return;
      }

      if (symbols) {
        // Fetch specific symbols and merge
        try {
          const newPredictions = await api.predictions.list(symbols);

          // Update additional predictions
          setAdditionalPredictions((prev) => {
            const existingSymbols = new Set(prev.map((p) => p.symbol));
            const toAdd = newPredictions.filter((p) => !existingSymbols.has(p.symbol));
            return [...toAdd, ...prev];
          });

          // Remove from removed set if re-added
          setRemovedSymbols((prev) => {
            const next = new Set(prev);
            newPredictions.forEach((p) => next.delete(p.symbol));
            return next;
          });
        } catch (error) {
          console.error('Failed to fetch predictions:', error);
        }
      }
    },
    [predictionsQuery]
  );

  /**
   * Handles stock search - fetches predictions and triggers analysis.
   * @param symbol - Stock symbol to search for
   */
  const handleStockSearch = useCallback(
    async (symbol: string) => {
      try {
        setSearchLoading(true);
        await fetchPredictions(symbol.toUpperCase(), true);
        if (onStockSelected) {
          await onStockSelected(symbol.toUpperCase());
        }
      } catch (error) {
        console.error('Error in handleStockSearch:', error);
      } finally {
        setSearchLoading(false);
      }
    },
    [fetchPredictions, onStockSelected]
  );

  /**
   * Removes a stock tile from predictions.
   * @param symbolToRemove - Symbol of the stock to remove
   */
  const removeTile = useCallback((symbolToRemove: string) => {
    setRemovedSymbols((prev) => new Set([...prev, symbolToRemove]));
    setAdditionalPredictions((prev) =>
      prev.filter((p) => p.symbol !== symbolToRemove)
    );
  }, []);

  return {
    predictions,
    loading: predictionsQuery.isLoading,
    searchLoading,
    fetchPredictions,
    handleStockSearch,
    removeTile,
  };
}

// =============================================================================
// Additional Hooks for Granular Access
// =============================================================================

/**
 * Hook for fetching predictions for specific symbols
 */
export function usePredictionsQuery(symbols?: string) {
  return useQuery({
    queryKey: queryKeys.predictions.list(symbols),
    queryFn: () => api.predictions.list(symbols),
    enabled: !!symbols,
  });
}

/**
 * Hook for prefetching predictions (useful for hover states)
 */
export function usePrefetchPredictions() {
  const queryClient = useQueryClient();

  return useCallback(
    (symbols: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.predictions.list(symbols),
        queryFn: () => api.predictions.list(symbols),
      });
    },
    [queryClient]
  );
}
