/**
 * usePredictions Hook
 * Extracts prediction-related state and logic from StockDashboard.
 * Handles fetching, searching, and managing stock predictions.
 */

import { useState, useEffect, useCallback } from 'react';
import { PredictionResult } from '@/types/predictions';

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
 * @param onStockSelected - Optional callback when a stock is selected via search
 * @returns UsePredictionsReturn - State and functions for prediction management
 */
export function usePredictions(
  onStockSelected?: (symbol: string) => Promise<void>
): UsePredictionsReturn {
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  /**
   * Fetches predictions from the API.
   * @param symbols - Optional comma-separated stock symbols
   * @param isNewSearch - If true, merges with existing predictions; if false, replaces
   */
  const fetchPredictions = useCallback(async (symbols?: string, isNewSearch = false) => {
    try {
      if (!isNewSearch) {
        setLoading(true);
      }

      const url = symbols
        ? `/api/predictions?symbols=${symbols}`
        : '/api/predictions?symbols=AAPL,GOOGL,MSFT,TSLA,NVDA';

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        if (isNewSearch && symbols) {
          // Merge new predictions with existing, removing duplicates
          const newPredictions = data.data;
          setPredictions(prev => {
            const existingPredictions = prev.filter(p =>
              !newPredictions.some((np: PredictionResult) => np.symbol === p.symbol)
            );
            return [...newPredictions, ...existingPredictions];
          });
        } else {
          setPredictions(data.data);
        }
      } else {
        console.error('Predictions API error:', data.error);
        setPredictions([]);
      }
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
      setPredictions([]);
    } finally {
      if (!isNewSearch) {
        setLoading(false);
      }
    }
  }, []);

  /**
   * Handles stock search - fetches predictions and triggers analysis.
   * @param symbol - Stock symbol to search for
   */
  const handleStockSearch = useCallback(async (symbol: string) => {
    try {
      setSearchLoading(true);
      await fetchPredictions(symbol, true);
      if (onStockSelected) {
        await onStockSelected(symbol);
      }
    } catch (error) {
      console.error('Error in handleStockSearch:', error);
    } finally {
      setSearchLoading(false);
    }
  }, [fetchPredictions, onStockSelected]);

  /**
   * Removes a stock tile from predictions.
   * @param symbolToRemove - Symbol of the stock to remove
   * @returns The removed symbol if it was the selected stock, null otherwise
   */
  const removeTile = useCallback((symbolToRemove: string) => {
    try {
      setPredictions(prev => prev.filter(p => p.symbol !== symbolToRemove));
    } catch (error) {
      console.error('Error in removeTile:', error);
    }
  }, []);

  // Initial load effect
  useEffect(() => {
    let isMounted = true;

    const loadPredictions = async () => {
      if (isMounted) {
        await fetchPredictions();
      }
    };

    loadPredictions();

    return () => {
      isMounted = false;
    };
  }, [fetchPredictions]);

  return {
    predictions,
    loading,
    searchLoading,
    fetchPredictions,
    handleStockSearch,
    removeTile,
  };
}
