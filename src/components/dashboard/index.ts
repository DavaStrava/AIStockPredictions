/**
 * Dashboard Components Barrel File
 *
 * Re-exports all dashboard components for convenient importing.
 */

// Main dashboard components
export { DashboardHeader } from './DashboardHeader';
export { PredictionCard } from './PredictionCard';
export { PredictionsGrid } from './PredictionsGrid';
export { DetailedAnalysisPanel } from './DetailedAnalysisPanel';

// Hooks
export { usePredictionStyles } from './hooks/usePredictionStyles';
export { useTradingModal } from './hooks/useTradingModal';
export { useIndicatorFiltering } from './hooks/useIndicatorFiltering';
export { usePredictions } from './hooks/usePredictions';
export { useStockAnalysis } from './hooks/useStockAnalysis';
export { useStockChartData } from './hooks/useStockChartData';
export { useMarketIndexAnalysis } from './hooks/useMarketIndexAnalysis';

// Hook types
export type { UsePredictionStylesReturn } from './hooks/usePredictionStyles';
export type { UseTradingModalReturn } from './hooks/useTradingModal';
export type { UseIndicatorFilteringReturn } from './hooks/useIndicatorFiltering';
export type { StockChartType, ChartDataPoint, ChartTab, UseStockChartDataReturn } from './hooks/useStockChartData';
