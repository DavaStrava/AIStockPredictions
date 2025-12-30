/**
 * usePortfolioStats Hook
 * Manages trade data fetching, creation, closure, and portfolio statistics.
 * Follows the pattern established by usePredictions hook.
 * 
 * Requirements: 6.1, 7.1, 7.2, 7.3
 */

import { useState, useEffect, useCallback } from 'react';
import {
  TradeWithPnL,
  PortfolioStats,
  TradeFilters,
  CreateTradeRequest,
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
  createTrade: (data: Omit<CreateTradeRequest, 'userId'>) => Promise<JournalTrade>;
  closeTrade: (tradeId: string, exitPrice: number) => Promise<JournalTrade>;
  refreshStats: () => Promise<void>;
}

/**
 * Hook for managing portfolio trades and statistics.
 * 
 * @returns UsePortfolioStatsReturn - State and functions for trade management
 */
export function usePortfolioStats(): UsePortfolioStatsReturn {
  const [trades, setTrades] = useState<TradeWithPnL[]>([]);
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches trades from the API with optional filters.
   * @param filters - Optional filters for status, symbol, date range
   */
  const fetchTrades = useCallback(async (filters?: TradeFilters) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters?.status) {
        params.append('status', filters.status);
      }
      if (filters?.symbol) {
        params.append('symbol', filters.symbol);
      }
      if (filters?.startDate) {
        params.append('startDate', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        params.append('endDate', filters.endDate.toISOString());
      }

      const queryString = params.toString();
      const url = queryString ? `/api/trades?${queryString}` : '/api/trades';

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        // Convert date strings to Date objects
        const tradesWithDates = data.data.map((trade: TradeWithPnL) => ({
          ...trade,
          entryDate: new Date(trade.entryDate),
          exitDate: trade.exitDate ? new Date(trade.exitDate) : null,
          createdAt: new Date(trade.createdAt),
          updatedAt: new Date(trade.updatedAt),
        }));
        setTrades(tradesWithDates);
      } else {
        setError(data.error || 'Failed to fetch trades');
        setTrades([]);
      }
    } catch (err) {
      console.error('Failed to fetch trades:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch trades');
      setTrades([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetches portfolio statistics from the API.
   */
  const refreshStats = useCallback(async () => {
    try {
      setStatsLoading(true);

      const response = await fetch('/api/trades/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
        setError(null);
      } else {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error;
        console.error('Stats API error:', errorMsg);
        setError(errorMsg);
        setStats(null);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  /**
   * Creates a new trade.
   * @param data - Trade creation data (userId is added automatically)
   * @returns The created trade
   */
  const createTrade = useCallback(async (
    data: Omit<CreateTradeRequest, 'userId'>
  ): Promise<JournalTrade> => {
    const response = await fetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to create trade');
    }

    // Refresh trades and stats after creation
    await Promise.all([fetchTrades(), refreshStats()]);

    return {
      ...result.data,
      entryDate: new Date(result.data.entryDate),
      exitDate: result.data.exitDate ? new Date(result.data.exitDate) : null,
      createdAt: new Date(result.data.createdAt),
      updatedAt: new Date(result.data.updatedAt),
    };
  }, [fetchTrades, refreshStats]);

  /**
   * Closes an open trade.
   * @param tradeId - ID of the trade to close
   * @param exitPrice - Exit price for the trade
   * @returns The updated trade
   */
  const closeTrade = useCallback(async (
    tradeId: string,
    exitPrice: number
  ): Promise<JournalTrade> => {
    const response = await fetch(`/api/trades/${tradeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exitPrice }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to close trade');
    }

    // Refresh trades and stats after closure
    await Promise.all([fetchTrades(), refreshStats()]);

    return {
      ...result.data,
      entryDate: new Date(result.data.entryDate),
      exitDate: result.data.exitDate ? new Date(result.data.exitDate) : null,
      createdAt: new Date(result.data.createdAt),
      updatedAt: new Date(result.data.updatedAt),
    };
  }, [fetchTrades, refreshStats]);

  // Initial load effect
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (isMounted) {
        await Promise.all([fetchTrades(), refreshStats()]);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [fetchTrades, refreshStats]);

  return {
    trades,
    stats,
    loading,
    statsLoading,
    error,
    fetchTrades,
    createTrade,
    closeTrade,
    refreshStats,
  };
}
