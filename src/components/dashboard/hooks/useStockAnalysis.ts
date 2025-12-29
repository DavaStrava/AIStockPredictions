/**
 * useStockAnalysis Hook
 * Extracts analysis-related state and logic from StockDashboard.
 * Handles fetching detailed stock analysis and managing market index selection.
 */

import { useState, useCallback } from 'react';
import { TechnicalAnalysisResult, PriceData } from '@/lib/technical-analysis/types';

/**
 * Return type for the useStockAnalysis hook
 */
export interface UseStockAnalysisReturn {
  selectedStock: string;
  analysis: TechnicalAnalysisResult | null;
  priceData: PriceData[];
  selectedIndex: string | null;
  fetchDetailedAnalysis: (symbol: string) => Promise<void>;
  handleIndexClick: (indexSymbol: string) => void;
  closeIndexAnalysis: () => void;
  clearAnalysis: () => void;
}

/**
 * Hook for managing stock analysis state and operations.
 * 
 * @returns UseStockAnalysisReturn - State and functions for analysis management
 */
export function useStockAnalysis(): UseStockAnalysisReturn {
  const [selectedStock, setSelectedStock] = useState<string>('');
  const [analysis, setAnalysis] = useState<TechnicalAnalysisResult | null>(null);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null);

  /**
   * Fetches detailed analysis for a stock symbol.
   * Called when user selects a stock from search or clicks a prediction tile.
   * @param symbol - Stock symbol to analyze
   */
  const fetchDetailedAnalysis = useCallback(async (symbol: string) => {
    try {
      const response = await fetch(`/api/analysis?symbol=${symbol}&period=1year`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setAnalysis(data.data);
        setSelectedStock(symbol);
        
        if (data.priceData && Array.isArray(data.priceData)) {
          const processedPriceData = data.priceData.map((item: any) => ({
            ...item,
            date: new Date(item.date),
          }));
          setPriceData(processedPriceData);
        }
      } else {
        console.error('Analysis failed:', data.error);
        setAnalysis(null);
        setPriceData([]);
      }
    } catch (error) {
      console.error('Failed to fetch analysis:', error);
      setAnalysis(null);
      setPriceData([]);
    }
  }, []);

  /**
   * Handles market index click from sidebar.
   * @param indexSymbol - Technical symbol of the market index (e.g., "^GSPC")
   */
  const handleIndexClick = useCallback((indexSymbol: string) => {
    console.log('useStockAnalysis - Index clicked:', indexSymbol);
    setSelectedIndex(indexSymbol);
    console.log('useStockAnalysis - selectedIndex set to:', indexSymbol);
  }, []);

  /**
   * Closes the market index analysis modal.
   */
  const closeIndexAnalysis = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  /**
   * Clears all analysis state.
   * Used when closing detailed analysis or when removing a selected stock.
   */
  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setPriceData([]);
    setSelectedStock('');
  }, []);

  return {
    selectedStock,
    analysis,
    priceData,
    selectedIndex,
    fetchDetailedAnalysis,
    handleIndexClick,
    closeIndexAnalysis,
    clearAnalysis,
  };
}
