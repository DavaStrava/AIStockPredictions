/**
 * useStockAnalysis Hook
 *
 * Manages stock analysis state and operations.
 * Uses React Query for caching analysis results and automatic refetching.
 */

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-client';
import type { TechnicalAnalysisResult, PriceData } from '@/lib/technical-analysis/types';

/**
 * Return type for the useStockAnalysis hook
 */
export interface UseStockAnalysisReturn {
  selectedStock: string;
  analysis: TechnicalAnalysisResult | null;
  priceData: PriceData[];
  selectedIndex: string | null;
  loading: boolean;
  error: string | null;
  fetchDetailedAnalysis: (symbol: string) => Promise<void>;
  handleIndexClick: (indexSymbol: string) => void;
  closeIndexAnalysis: () => void;
  clearAnalysis: () => void;
}

/**
 * Hook for managing stock analysis state and operations.
 *
 * Uses React Query for:
 * - Caching analysis results (avoids re-fetching same stock)
 * - Background refetching when data becomes stale
 * - Request deduplication
 *
 * @returns UseStockAnalysisReturn - State and functions for analysis management
 */
export function useStockAnalysis(): UseStockAnalysisReturn {
  const queryClient = useQueryClient();
  const [selectedStock, setSelectedStock] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null);

  // Query for stock analysis - only runs when selectedStock is set
  const analysisQuery = useQuery({
    queryKey: queryKeys.analysis.detail(selectedStock, '1y'),
    queryFn: () => api.analysis.get(selectedStock, '1y'),
    enabled: !!selectedStock,
    // Keep previous data while fetching new stock
    placeholderData: (previousData) => previousData,
  });

  /**
   * Fetches detailed analysis for a stock symbol.
   * @param symbol - Stock symbol to analyze
   */
  const fetchDetailedAnalysis = useCallback(
    async (symbol: string) => {
      const upperSymbol = symbol.toUpperCase();
      setSelectedStock(upperSymbol);

      // Prefetch the data if not already in cache
      await queryClient.prefetchQuery({
        queryKey: queryKeys.analysis.detail(upperSymbol, '1y'),
        queryFn: () => api.analysis.get(upperSymbol, '1y'),
      });
    },
    [queryClient]
  );

  /**
   * Handles market index click from sidebar.
   * @param indexSymbol - Technical symbol of the market index (e.g., "^GSPC")
   */
  const handleIndexClick = useCallback((indexSymbol: string) => {
    setSelectedIndex(indexSymbol);
  }, []);

  /**
   * Closes the market index analysis modal.
   */
  const closeIndexAnalysis = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  /**
   * Clears all analysis state.
   */
  const clearAnalysis = useCallback(() => {
    setSelectedStock('');
    setSelectedIndex(null);
  }, []);

  return {
    selectedStock,
    analysis: analysisQuery.data?.data ?? null,
    priceData: analysisQuery.data?.priceData ?? [],
    selectedIndex,
    loading: analysisQuery.isLoading || analysisQuery.isFetching,
    error: analysisQuery.error?.message ?? null,
    fetchDetailedAnalysis,
    handleIndexClick,
    closeIndexAnalysis,
    clearAnalysis,
  };
}

// =============================================================================
// Additional Hooks for Granular Access
// =============================================================================

/**
 * Hook for fetching analysis for a specific symbol
 */
export function useAnalysisQuery(
  symbol: string,
  timeframe: '1d' | '5d' | '1m' | '3m' | '6m' | '1y' | '5y' = '1y'
) {
  return useQuery({
    queryKey: queryKeys.analysis.detail(symbol, timeframe),
    queryFn: () => api.analysis.get(symbol, timeframe),
    enabled: !!symbol,
  });
}

/**
 * Hook for prefetching analysis (useful for hover states)
 */
export function usePrefetchAnalysis() {
  const queryClient = useQueryClient();

  return useCallback(
    (symbol: string, timeframe: '1d' | '5d' | '1m' | '3m' | '6m' | '1y' | '5y' = '1y') => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.analysis.detail(symbol, timeframe),
        queryFn: () => api.analysis.get(symbol, timeframe),
      });
    },
    [queryClient]
  );
}

/**
 * Hook for market index analysis
 */
export function useMarketIndexAnalysis(symbol: string | null) {
  return useQuery({
    queryKey: queryKeys.marketIndices.analysis(symbol ?? ''),
    queryFn: () => api.marketIndices.analysis(symbol!),
    enabled: !!symbol,
  });
}
