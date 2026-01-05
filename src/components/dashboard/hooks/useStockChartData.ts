/**
 * useStockChartData Hook
 * 
 * Extracts data transformation and formatting logic from StockChart component.
 * Handles:
 * - Chart data transformation with memoization
 * - Price and volume formatting utilities
 * - Chart type management
 */

import { useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { PriceData, TechnicalAnalysisResult } from '@/lib/technical-analysis/types';

/** Chart visualization types */
export type StockChartType = 'price' | 'volume' | 'rsi' | 'macd' | 'bollinger';

/** Transformed chart data point */
export interface ChartDataPoint {
  date: string;
  fullDate: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  macdHistogram?: number;
  bbUpper?: number;
  bbMiddle?: number;
  bbLower?: number;
  sma20?: number;
  sma50?: number;
}

/** Chart tab configuration */
export interface ChartTab {
  id: StockChartType;
  label: string;
}

/** Chart tabs configuration */
export const CHART_TABS: ChartTab[] = [
  { id: 'price', label: 'Price & MA' },
  { id: 'volume', label: 'Volume' },
  { id: 'rsi', label: 'RSI' },
  { id: 'macd', label: 'MACD' },
  { id: 'bollinger', label: 'Bollinger Bands' },
];

export interface UseStockChartDataOptions {
  priceData: PriceData[];
  analysis?: TechnicalAnalysisResult;
}

export interface UseStockChartDataReturn {
  /** Current active chart type */
  activeChart: StockChartType;
  /** Set the active chart type */
  setActiveChart: (chart: StockChartType) => void;
  /** Transformed chart data with technical indicators */
  chartData: ChartDataPoint[];
  /** Format price to $XX.XX format */
  formatPrice: (value: number) => string;
  /** Format volume to human-readable format (1.5M, 2.5K) */
  formatVolume: (value: number) => string;
  /** Chart tabs configuration */
  chartTabs: ChartTab[];
}

/**
 * Custom hook for managing stock chart data and state.
 * Memoizes data transformations for performance.
 */
export function useStockChartData({
  priceData,
  analysis,
}: UseStockChartDataOptions): UseStockChartDataReturn {
  // Chart type state
  const [activeChart, setActiveChart] = useState<StockChartType>('price');

  // Memoized data transformation
  const chartData = useMemo<ChartDataPoint[]>(() => {
    return priceData.map((data, index) => {
      // Safely access technical indicators
      const rsi = analysis?.indicators.rsi?.[index];
      const macd = analysis?.indicators.macd?.[index];
      const bb = analysis?.indicators.bollingerBands?.[index];

      // Find matching moving averages by period and date
      const sma20 = analysis?.indicators.sma?.find(
        sma => sma.period === 20 && sma.date.getTime() === data.date.getTime()
      );
      const sma50 = analysis?.indicators.sma?.find(
        sma => sma.period === 50 && sma.date.getTime() === data.date.getTime()
      );

      return {
        date: format(data.date, 'MMM dd'),
        fullDate: data.date,
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        volume: data.volume,
        rsi: rsi?.value,
        macd: macd?.macd,
        macdSignal: macd?.signal,
        macdHistogram: macd?.histogram,
        bbUpper: bb?.upper,
        bbMiddle: bb?.middle,
        bbLower: bb?.lower,
        sma20: sma20?.value,
        sma50: sma50?.value,
      };
    });
  }, [priceData, analysis]);

  // Formatting utilities (memoized for stability)
  const formatPrice = useCallback((value: number): string => {
    return `$${value.toFixed(2)}`;
  }, []);

  const formatVolume = useCallback((value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  }, []);

  return {
    activeChart,
    setActiveChart,
    chartData,
    formatPrice,
    formatVolume,
    chartTabs: CHART_TABS,
  };
}

