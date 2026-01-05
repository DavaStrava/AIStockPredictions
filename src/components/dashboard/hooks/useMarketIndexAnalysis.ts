/**
 * useMarketIndexAnalysis Hook
 * 
 * Extracts API fetching and state management logic from MarketIndexAnalysis component.
 * Handles:
 * - Index analysis data fetching
 * - Loading and error state management
 * - Price and percentage formatting utilities
 * - Color utilities for trend/sentiment display
 */

import { useState, useEffect, useCallback } from 'react';
import { PriceData } from '@/lib/technical-analysis/types';

/** Technical analysis data structure */
export interface IndexTechnicalAnalysis {
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  movingAverages: {
    sma20: number;
    sma50: number;
    sma200: number;
  };
  support: number;
  resistance: number;
  trend: 'bullish' | 'bearish' | 'neutral';
}

/** Market news item */
export interface MarketNewsItem {
  title: string;
  summary: string;
  publishedAt: string;
  source: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

/** Complete index analysis data */
export interface IndexAnalysisData {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  technicalAnalysis: IndexTechnicalAnalysis;
  aiSummary: string;
  marketNews: MarketNewsItem[];
  priceData: PriceData[];
}

export interface UseMarketIndexAnalysisOptions {
  symbol: string;
}

export interface UseMarketIndexAnalysisReturn {
  /** Index analysis data */
  data: IndexAnalysisData | null;
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refetch the data */
  refetch: () => Promise<void>;
  /** Format price to display format */
  formatPrice: (price: number) => string;
  /** Format change with sign */
  formatChange: (change: number) => string;
  /** Format change percent with sign */
  formatChangePercent: (changePercent: number) => string;
  /** Get CSS class for change color */
  getChangeColor: (change: number) => string;
  /** Get CSS class for trend color */
  getTrendColor: (trend: string) => string;
  /** Get CSS class for sentiment color */
  getSentimentColor: (sentiment: string) => string;
}

/**
 * Custom hook for fetching and managing market index analysis data.
 */
export function useMarketIndexAnalysis({
  symbol,
}: UseMarketIndexAnalysisOptions): UseMarketIndexAnalysisReturn {
  const [data, setData] = useState<IndexAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIndexAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/market-index-analysis?symbol=${encodeURIComponent(symbol)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch index analysis');
      }
    } catch (err) {
      console.error('Market Index Analysis - Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  // Fetch on mount and symbol change
  useEffect(() => {
    fetchIndexAnalysis();
  }, [fetchIndexAnalysis]);

  // Formatting utilities
  const formatPrice = useCallback((price: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  }, []);

  const formatChange = useCallback((change: number): string => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(change)}`;
  }, []);

  const formatChangePercent = useCallback((changePercent: number): string => {
    const sign = changePercent >= 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(2)}%`;
  }, []);

  // Color utilities
  const getChangeColor = useCallback((change: number): string => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  }, []);

  const getTrendColor = useCallback((trend: string): string => {
    switch (trend) {
      case 'bullish':
        return 'text-green-600 dark:text-green-400';
      case 'bearish':
        return 'text-red-600 dark:text-red-400';
      case 'neutral':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  }, []);

  const getSentimentColor = useCallback((sentiment: string): string => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'negative':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'neutral':
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchIndexAnalysis,
    formatPrice,
    formatChange,
    formatChangePercent,
    getChangeColor,
    getTrendColor,
    getSentimentColor,
  };
}

