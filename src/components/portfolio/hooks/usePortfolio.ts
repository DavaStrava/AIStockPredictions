/**
 * Portfolio Hook - Client-side state management for portfolios
 *
 * Provides a React hook for managing portfolio data with:
 * - Portfolio CRUD operations
 * - Transaction management
 * - Real-time holdings with market data
 * - Performance history
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Portfolio,
  PortfolioTransaction,
  HoldingWithMarketData,
  PortfolioSummary,
  SectorAllocation,
  BenchmarkDataPoint,
  RebalanceSuggestion,
  PortfolioHealthResult,
  CreateTransactionRequest,
  PortfolioTransactionType,
  OpenPositionSummary,
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
  positions: OpenPositionSummary[];
  allocation: SectorAllocation[];
  history: BenchmarkDataPoint[];
  rebalanceSuggestions: RebalanceSuggestion[];
  healthData: PortfolioHealthResult | null;
  healthLoading: boolean;
  loading: boolean;
  error: string | null;
}

export function usePortfolio(options: UsePortfolioOptions = {}) {
  const { autoFetch = true, refreshInterval } = options;

  const healthAbortRef = useRef<AbortController | null>(null);

  const [state, setState] = useState<PortfolioState>({
    portfolios: [],
    selectedPortfolioId: null,
    summary: null,
    holdings: [],
    transactions: [],
    positions: [],
    allocation: [],
    history: [],
    rebalanceSuggestions: [],
    healthData: null,
    healthLoading: false,
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
      positions: [],
      allocation: [],
      history: [],
      rebalanceSuggestions: [],
      healthData: null,
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

  const fetchHealth = useCallback(async (portfolioId: string) => {
    // Abort any in-flight health request
    healthAbortRef.current?.abort();
    const controller = new AbortController();
    healthAbortRef.current = controller;

    setState((prev) => ({ ...prev, healthLoading: true, healthData: null }));
    try {
      const response = await fetch(`/api/portfolios/${portfolioId}/health`, {
        signal: controller.signal,
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch health data');
      }

      setState((prev) => ({ ...prev, healthData: data.data, healthLoading: false }));
      return data.data as PortfolioHealthResult;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return null;
      }
      const message = error instanceof Error ? error.message : 'Failed to fetch health data';
      setState((prev) => ({ ...prev, healthLoading: false, error: message }));
      throw error;
    }
  }, []);

  // ============================================================================
  // Positions Operations
  // ============================================================================

  const fetchPositions = useCallback(async (portfolioId: string) => {
    try {
      const response = await fetch(`/api/portfolios/${portfolioId}/positions`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch positions');
      }

      // API returns { positions, summary } - extract positions array
      const positions = data.data.positions || data.data;
      setState((prev) => ({ ...prev, positions }));
      return positions as OpenPositionSummary[];
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch positions';
      setState((prev) => ({ ...prev, error: message }));
      throw error;
    }
  }, []);

  const sellPosition = useCallback(
    async (symbol: string, quantity: number, pricePerShare: number, transactionDate?: Date) => {
      let portfolioId: string | null = null;
      setState((prev) => {
        portfolioId = prev.selectedPortfolioId;
        return prev;
      });

      if (!portfolioId) {
        throw new Error('No portfolio selected');
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch(
          `/api/portfolios/${portfolioId}/positions/${symbol}/sell`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quantity,
              pricePerShare,
              transactionDate: (transactionDate || new Date()).toISOString(),
            }),
          }
        );

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to sell position');
        }

        // Refresh data
        await Promise.all([
          fetchSummary(portfolioId),
          fetchHoldings(portfolioId),
          fetchTransactions(portfolioId),
          fetchPositions(portfolioId),
        ]);

        setState((prev) => ({ ...prev, loading: false }));
        return data.data as PortfolioTransaction;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to sell position';
        setState((prev) => ({ ...prev, loading: false, error: message }));
        throw error;
      }
    },
    [fetchSummary, fetchHoldings, fetchTransactions, fetchPositions]
  );

  // ============================================================================
  // Transaction Operations
  // ============================================================================

  const editTransaction = useCallback(
    async (txnId: string, updates: Partial<PortfolioTransaction>) => {
      let portfolioId: string | null = null;
      setState((prev) => {
        portfolioId = prev.selectedPortfolioId;
        return prev;
      });

      if (!portfolioId) {
        throw new Error('No portfolio selected');
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch(
          `/api/portfolios/${portfolioId}/transactions/${txnId}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          }
        );

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to update transaction');
        }

        // Refresh data
        await Promise.all([
          fetchSummary(portfolioId),
          fetchHoldings(portfolioId),
          fetchTransactions(portfolioId),
        ]);

        setState((prev) => ({ ...prev, loading: false }));
        return data.data as PortfolioTransaction;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update transaction';
        setState((prev) => ({ ...prev, loading: false, error: message }));
        throw error;
      }
    },
    [fetchSummary, fetchHoldings, fetchTransactions]
  );

  const deleteTransaction = useCallback(
    async (txnId: string) => {
      let portfolioId: string | null = null;
      setState((prev) => {
        portfolioId = prev.selectedPortfolioId;
        return prev;
      });

      if (!portfolioId) {
        throw new Error('No portfolio selected');
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch(
          `/api/portfolios/${portfolioId}/transactions/${txnId}`,
          {
            method: 'DELETE',
          }
        );

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to delete transaction');
        }

        // Refresh data
        await Promise.all([
          fetchSummary(portfolioId),
          fetchHoldings(portfolioId),
          fetchTransactions(portfolioId),
        ]);

        setState((prev) => ({ ...prev, loading: false }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete transaction';
        setState((prev) => ({ ...prev, loading: false, error: message }));
        throw error;
      }
    },
    [fetchSummary, fetchHoldings, fetchTransactions]
  );

  const addTransaction = useCallback(
    async (transaction: Omit<CreateTransactionRequest, 'portfolioId'>) => {
      // Read portfolioId from state at call time via setState to avoid stale closures
      let portfolioId: string | null = null;
      setState((prev) => {
        portfolioId = prev.selectedPortfolioId;
        return prev;
      });

      if (!portfolioId) {
        throw new Error('No portfolio selected');
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch(
          `/api/portfolios/${portfolioId}/transactions`,
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

        // Refresh data using the same portfolioId captured at call time
        await Promise.all([
          fetchSummary(portfolioId),
          fetchHoldings(portfolioId),
          fetchTransactions(portfolioId),
        ]);

        setState((prev) => ({ ...prev, loading: false }));
        return data.data as PortfolioTransaction;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add transaction';
        setState((prev) => ({ ...prev, loading: false, error: message }));
        throw error;
      }
    },
    [fetchSummary, fetchHoldings, fetchTransactions]
  );

  const updateHoldingTarget = useCallback(
    async (symbol: string, targetAllocationPercent: number | null) => {
      let portfolioId: string | null = null;
      setState((prev) => {
        portfolioId = prev.selectedPortfolioId;
        return prev;
      });

      if (!portfolioId) {
        throw new Error('No portfolio selected');
      }

      try {
        const response = await fetch(
          `/api/portfolios/${portfolioId}/holdings?symbol=${symbol}`,
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

        await fetchHoldings(portfolioId);
        return data.data;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update target';
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      }
    },
    [fetchHoldings]
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
        fetchPositions(state.selectedPortfolioId),
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
    fetchPositions,
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
    fetchPositions,
    fetchAllocation,
    fetchHistory,
    fetchRebalanceSuggestions,
    fetchHealth,
    refreshPortfolioData,

    // Transaction operations
    addTransaction,
    editTransaction,
    deleteTransaction,
    updateHoldingTarget,

    // Position operations
    sellPosition,

    // Utility
    clearError: () => setState((prev) => ({ ...prev, error: null })),
  };
}





