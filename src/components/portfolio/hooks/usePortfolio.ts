/**
 * Portfolio Hook - Client-side state management for portfolios
 *
 * Provides a React hook for managing portfolio data with:
 * - Portfolio CRUD operations
 * - Transaction management
 * - Real-time holdings with market data
 * - Performance history
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Portfolio,
  PortfolioTransaction,
  HoldingWithMarketData,
  PortfolioSummary,
  SectorAllocation,
  BenchmarkDataPoint,
  RebalanceSuggestion,
  CreateTransactionRequest,
  PortfolioTransactionType,
} from '@/types/portfolio';

interface UsePortfolioOptions {
  autoFetch?: boolean;
  refreshInterval?: number;
}

interface PortfolioState {
  portfolios: Portfolio[];
  selectedPortfolioId: string | null;
  summary: PortfolioSummary | null;
  holdings: HoldingWithMarketData[];
  transactions: PortfolioTransaction[];
  allocation: SectorAllocation[];
  history: BenchmarkDataPoint[];
  rebalanceSuggestions: RebalanceSuggestion[];
  loading: boolean;
  error: string | null;
}

export function usePortfolio(options: UsePortfolioOptions = {}) {
  const { autoFetch = true, refreshInterval } = options;

  const [state, setState] = useState<PortfolioState>({
    portfolios: [],
    selectedPortfolioId: null,
    summary: null,
    holdings: [],
    transactions: [],
    allocation: [],
    history: [],
    rebalanceSuggestions: [],
    loading: false,
    error: null,
  });

  // ============================================================================
  // Portfolio Operations
  // ============================================================================

  const fetchPortfolios = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/portfolios');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch portfolios');
      }

      const portfolios = data.data.portfolios;
      const defaultId = data.data.defaultPortfolioId;

      setState((prev) => ({
        ...prev,
        portfolios,
        selectedPortfolioId: prev.selectedPortfolioId || defaultId || portfolios[0]?.id || null,
        loading: false,
      }));

      return portfolios;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch portfolios';
      setState((prev) => ({ ...prev, loading: false, error: message }));
      throw error;
    }
  }, []);

  const createPortfolio = useCallback(
    async (name: string, description?: string, isDefault?: boolean) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch('/api/portfolios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description, isDefault }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to create portfolio');
        }

        await fetchPortfolios();
        return data.data as Portfolio;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create portfolio';
        setState((prev) => ({ ...prev, loading: false, error: message }));
        throw error;
      }
    },
    [fetchPortfolios]
  );

  const deletePortfolio = useCallback(
    async (portfolioId: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch(`/api/portfolios/${portfolioId}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to delete portfolio');
        }

        await fetchPortfolios();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete portfolio';
        setState((prev) => ({ ...prev, loading: false, error: message }));
        throw error;
      }
    },
    [fetchPortfolios]
  );

  const selectPortfolio = useCallback((portfolioId: string) => {
    setState((prev) => ({
      ...prev,
      selectedPortfolioId: portfolioId,
      summary: null,
      holdings: [],
      transactions: [],
      allocation: [],
      history: [],
      rebalanceSuggestions: [],
    }));
  }, []);

  // ============================================================================
  // Portfolio Data Fetching
  // ============================================================================

  const fetchSummary = useCallback(async (portfolioId: string) => {
    try {
      const response = await fetch(`/api/portfolios/${portfolioId}/summary`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch summary');
      }

      setState((prev) => ({ ...prev, summary: data.data }));
      return data.data as PortfolioSummary;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch summary';
      setState((prev) => ({ ...prev, error: message }));
      throw error;
    }
  }, []);

  const fetchHoldings = useCallback(async (portfolioId: string) => {
    try {
      const response = await fetch(`/api/portfolios/${portfolioId}/holdings`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch holdings');
      }

      setState((prev) => ({ ...prev, holdings: data.data.holdings }));
      return data.data.holdings as HoldingWithMarketData[];
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch holdings';
      setState((prev) => ({ ...prev, error: message }));
      throw error;
    }
  }, []);

  const fetchTransactions = useCallback(
    async (
      portfolioId: string,
      filters?: { type?: PortfolioTransactionType; symbol?: string }
    ) => {
      try {
        const params = new URLSearchParams();
        if (filters?.type) params.set('type', filters.type);
        if (filters?.symbol) params.set('symbol', filters.symbol);

        const url = `/api/portfolios/${portfolioId}/transactions${params.toString() ? `?${params}` : ''}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch transactions');
        }

        setState((prev) => ({ ...prev, transactions: data.data }));
        return data.data as PortfolioTransaction[];
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch transactions';
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      }
    },
    []
  );

  const fetchAllocation = useCallback(async (portfolioId: string) => {
    try {
      const response = await fetch(`/api/portfolios/${portfolioId}/allocation`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch allocation');
      }

      setState((prev) => ({ ...prev, allocation: data.data.sectors }));
      return data.data.sectors as SectorAllocation[];
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch allocation';
      setState((prev) => ({ ...prev, error: message }));
      throw error;
    }
  }, []);

  const fetchHistory = useCallback(
    async (portfolioId: string, startDate?: string, endDate?: string) => {
      try {
        const params = new URLSearchParams();
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);

        const url = `/api/portfolios/${portfolioId}/history${params.toString() ? `?${params}` : ''}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch history');
        }

        setState((prev) => ({ ...prev, history: data.data.data }));
        return data.data.data as BenchmarkDataPoint[];
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch history';
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      }
    },
    []
  );

  const fetchRebalanceSuggestions = useCallback(
    async (portfolioId: string, threshold?: number) => {
      try {
        const params = new URLSearchParams();
        if (threshold !== undefined) params.set('threshold', threshold.toString());

        const url = `/api/portfolios/${portfolioId}/rebalance${params.toString() ? `?${params}` : ''}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch rebalance suggestions');
        }

        setState((prev) => ({ ...prev, rebalanceSuggestions: data.data.suggestions }));
        return data.data.suggestions as RebalanceSuggestion[];
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to fetch rebalance suggestions';
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      }
    },
    []
  );

  // ============================================================================
  // Transaction Operations
  // ============================================================================

  const addTransaction = useCallback(
    async (transaction: Omit<CreateTransactionRequest, 'portfolioId'>) => {
      if (!state.selectedPortfolioId) {
        throw new Error('No portfolio selected');
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch(
          `/api/portfolios/${state.selectedPortfolioId}/transactions`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transaction),
          }
        );

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to add transaction');
        }

        // Refresh data
        await Promise.all([
          fetchSummary(state.selectedPortfolioId),
          fetchHoldings(state.selectedPortfolioId),
          fetchTransactions(state.selectedPortfolioId),
        ]);

        setState((prev) => ({ ...prev, loading: false }));
        return data.data as PortfolioTransaction;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add transaction';
        setState((prev) => ({ ...prev, loading: false, error: message }));
        throw error;
      }
    },
    [state.selectedPortfolioId, fetchSummary, fetchHoldings, fetchTransactions]
  );

  const updateHoldingTarget = useCallback(
    async (symbol: string, targetAllocationPercent: number | null) => {
      if (!state.selectedPortfolioId) {
        throw new Error('No portfolio selected');
      }

      try {
        const response = await fetch(
          `/api/portfolios/${state.selectedPortfolioId}/holdings?symbol=${symbol}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetAllocationPercent }),
          }
        );

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to update target');
        }

        await fetchHoldings(state.selectedPortfolioId);
        return data.data;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update target';
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      }
    },
    [state.selectedPortfolioId, fetchHoldings]
  );

  // ============================================================================
  // Fetch All Data for Selected Portfolio
  // ============================================================================

  const refreshPortfolioData = useCallback(async () => {
    if (!state.selectedPortfolioId) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await Promise.all([
        fetchSummary(state.selectedPortfolioId),
        fetchHoldings(state.selectedPortfolioId),
        fetchTransactions(state.selectedPortfolioId),
        fetchAllocation(state.selectedPortfolioId),
      ]);

      setState((prev) => ({ ...prev, loading: false }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to refresh data';
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, [
    state.selectedPortfolioId,
    fetchSummary,
    fetchHoldings,
    fetchTransactions,
    fetchAllocation,
  ]);

  // ============================================================================
  // Auto-fetch on mount and portfolio selection
  // ============================================================================

  useEffect(() => {
    if (autoFetch) {
      fetchPortfolios();
    }
  }, [autoFetch, fetchPortfolios]);

  useEffect(() => {
    if (state.selectedPortfolioId) {
      refreshPortfolioData();
    }
  }, [state.selectedPortfolioId, refreshPortfolioData]);

  // ============================================================================
  // Optional refresh interval
  // ============================================================================

  useEffect(() => {
    if (!refreshInterval || !state.selectedPortfolioId) return;

    const intervalId = setInterval(() => {
      fetchSummary(state.selectedPortfolioId!);
      fetchHoldings(state.selectedPortfolioId!);
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval, state.selectedPortfolioId, fetchSummary, fetchHoldings]);

  return {
    // State
    ...state,
    selectedPortfolio: state.portfolios.find((p) => p.id === state.selectedPortfolioId) || null,

    // Portfolio operations
    fetchPortfolios,
    createPortfolio,
    deletePortfolio,
    selectPortfolio,

    // Data fetching
    fetchSummary,
    fetchHoldings,
    fetchTransactions,
    fetchAllocation,
    fetchHistory,
    fetchRebalanceSuggestions,
    refreshPortfolioData,

    // Transaction operations
    addTransaction,
    updateHoldingTarget,

    // Utility
    clearError: () => setState((prev) => ({ ...prev, error: null })),
  };
}

