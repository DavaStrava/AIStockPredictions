/**
 * useStockData Hook
 *
 * Fetches and manages stock detail data including quote and price history.
 * Handles time range changes and loading/error states.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  StockQuote,
  StockPricePoint,
  MarketStatus,
  StockDetailTimeRange,
  StockDetailApiResponse,
  UseStockDataReturn,
} from '@/types/stock';

/**
 * Hook for fetching and managing stock data.
 *
 * @param symbol - Stock ticker symbol
 * @returns Stock data, loading state, error state, and range controls
 */
export function useStockData(symbol: string): UseStockDataReturn {
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [priceHistory, setPriceHistory] = useState<StockPricePoint[]>([]);
  const [marketStatus, setMarketStatus] = useState<MarketStatus>('closed');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<StockDetailTimeRange>('1Y');

  // Use ref to track if component is mounted to avoid state updates after unmount
  const isMountedRef = useRef(true);

  // Fetch data when symbol or range changes
  useEffect(() => {
    isMountedRef.current = true;

    const fetchStockData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/stock/${encodeURIComponent(symbol)}?period=${selectedRange}`
        );

        const data: StockDetailApiResponse = await response.json();

        // Only update state if component is still mounted
        if (!isMountedRef.current) return;

        if (!data.success || !data.data) {
          throw new Error(data.error || 'Failed to fetch stock data');
        }

        setQuote(data.data.quote);
        setPriceHistory(data.data.priceHistory);
        setMarketStatus(data.data.marketStatus);
      } catch (err) {
        if (!isMountedRef.current) return;

        const message = err instanceof Error ? err.message : 'An error occurred';
        setError(message);
        setQuote(null);
        setPriceHistory([]);
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchStockData();

    return () => {
      isMountedRef.current = false;
    };
  }, [symbol, selectedRange]);

  // Handle range change
  const handleRangeChange = useCallback((range: StockDetailTimeRange) => {
    setSelectedRange(range);
  }, []);

  return {
    quote,
    priceHistory,
    marketStatus,
    loading,
    error,
    selectedRange,
    setSelectedRange: handleRangeChange,
  };
}

export default useStockData;
