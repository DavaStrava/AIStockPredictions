/**
 * Component Types
 * 
 * Centralized type definitions for React component props, state, and related types.
 * Follows the rule: NEVER define interfaces inside component files.
 */

import React, { ReactNode } from 'react';
import { PriceData, TechnicalAnalysisResult, TechnicalSignal } from '@/lib/technical-analysis/types';
import { MarketContext } from '@/lib/technical-analysis/explanations';
import { PredictionResult } from './predictions';
import { 
  HoldingWithMarketData, 
  Portfolio, 
  PortfolioSummary, 
  PortfolioTransaction,
  SectorAllocation,
  BenchmarkDataPoint,
  CreateTransactionRequest
} from './portfolio';
import { JournalTrade, TradeWithPnL, PortfolioStats, TradeSide, CreateTradeRequest } from './models';

// ============================================================================
// Common Types
// ============================================================================

/** Sort direction for tables and lists */
export type SortDirection = 'asc' | 'desc';

// ============================================================================
// Chart Types
// ============================================================================

/** Time range options for stock charts */
export type ChartTimeRange = '1M' | '3M' | '6M' | '1Y' | '2Y' | '5Y' | 'MAX';

/** Time range options for performance charts */
export type PerformanceTimeRange = '1M' | '3M' | '6M' | '1Y' | 'ALL';

/** Chart visualization types for AdvancedStockChart */
export type AdvancedChartType = 'line' | 'area' | 'volume';

/** Chart visualization types for StockChart */
export type StockChartType = 'price' | 'volume' | 'rsi' | 'macd' | 'bollinger';

/** Data point for simple charts */
export interface ChartDataPoint {
  date: string;
  price: number;
  volume?: number;
}

// ============================================================================
// Market Data Types
// ============================================================================

/** Market index data for sidebar display */
export interface MarketIndex {
  symbol: string;
  tickerSymbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  isOpen: boolean;
  marketStatus: string;
  isExtendedHours: boolean;
  isFuturesTime: boolean;
  isShowingFutures: boolean;
  dataSource: string;
  lastUpdate: string;
}

/** Index analysis data */
export interface IndexAnalysisData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  analysis: TechnicalAnalysisResult;
  priceData: PriceData[];
}

// ============================================================================
// Search & Stock Types
// ============================================================================

/** Stock search result */
export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  type: string;
}

// ============================================================================
// Insights Types
// ============================================================================

/** LLM-generated insight */
export interface LLMInsight {
  type: 'technical' | 'portfolio' | 'sentiment';
  content: string;
  confidence: number;
  provider: 'openai' | 'bedrock' | 'cached';
  metadata: {
    indicators_used?: string[];
    timeframe?: string;
    data_quality?: 'high' | 'medium' | 'low';
    market_conditions?: string;
    [key: string]: unknown;
  };
}

/** Market insight for sidebar */
export interface MarketInsight {
  id: string;
  type: 'tip' | 'warning' | 'info' | 'opportunity';
  title: string;
  content: string;
  timestamp?: string;
}

// ============================================================================
// Trading Journal Types
// ============================================================================

/** Sortable columns for trade log table */
export type TradeSortColumn =
  | 'symbol'
  | 'side'
  | 'status'
  | 'entryDate'
  | 'exitDate'
  | 'entryPrice'
  | 'exitPrice'
  | 'quantity'
  | 'realizedPnl'
  | 'unrealizedPnl';

// ============================================================================
// Portfolio Types
// ============================================================================

/** Portfolio manager tab identifiers */
export type PortfolioTabId = 'holdings' | 'transactions' | 'allocation' | 'performance';

/** Portfolio manager tab definition */
export interface PortfolioTab {
  id: PortfolioTabId;
  label: string;
  icon: ReactNode;
}

/** Sortable keys for holdings data grid */
export type HoldingsSortKey =
  | 'symbol'
  | 'quantity'
  | 'currentPrice'
  | 'marketValue'
  | 'dayChange'
  | 'dayChangePercent'
  | 'totalGainLoss'
  | 'totalGainLossPercent'
  | 'portfolioWeight';

/** Tree map data item for portfolio visualization */
export interface TreeMapDataItem {
  name: string;
  value: number;
  children?: TreeMapDataItem[];
  dayChangePercent?: number;
}

// ============================================================================
// Responsive Layout Types
// ============================================================================

/** Responsive grid configuration */
export interface ResponsiveGridConfig {
  /** Minimum width for grid items before wrapping */
  minItemWidth?: string;
  /** Gap spacing between grid items */
  gap?: 'gap-2' | 'gap-4' | 'gap-6' | 'gap-8';
  /** Custom CSS classes to apply */
  className?: string;
  /** Column configuration for different breakpoints */
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    large?: number;
  };
}

/** Props for the ResponsiveGrid component */
export interface ResponsiveGridProps extends ResponsiveGridConfig {
  children: React.ReactNode;
  /** Enable layout shift prevention during responsive transitions */
  preventLayoutShift?: boolean;
  /** Provide minimum height for grid items to prevent layout shift */
  itemMinHeight?: string;
}

// ============================================================================
// Error Boundary Types
// ============================================================================

/** Error boundary state */
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/** Responsive layout error boundary state */
export interface ResponsiveLayoutErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorMessage: string;
  shouldShowFallback: boolean;
  isRecovering: boolean;
}

// ============================================================================
// Performance & Stats Types
// ============================================================================

/** Performance statistics display data */
export interface PerformanceStatsDisplay {
  label: string;
  value: number;
  format: 'currency' | 'percent' | 'number';
  positive?: boolean;
}

// ============================================================================
// Component Props - Dashboard
// ============================================================================

export interface AdvancedStockChartProps {
  symbol: string;
  priceData: PriceData[];
  analysis?: TechnicalAnalysisResult;
}

export interface SimpleStockChartProps {
  symbol: string;
  data?: ChartDataPoint[];
  loading?: boolean;
  error?: string | null;
  height?: number;
  showVolume?: boolean;
  color?: string;
}

export interface StockChartProps {
  symbol: string;
  priceData: PriceData[];
  analysis: TechnicalAnalysisResult | null;
  loading?: boolean;
}

export interface StockSearchProps {
  onSelectStock: (symbol: string) => void;
  placeholder?: string;
  className?: string;
}

export interface PerformanceMetricsProps {
  symbol: string;
  priceData: PriceData[];
}

/** Performance statistics for display */
export interface PerformanceStats {
  currentPrice: number;
  dayChange: number;
  dayChangePercent: number;
  weekChange: number;
  weekChangePercent: number;
  monthChange: number;
  monthChangePercent: number;
  volatility: number;
  averageVolume: number;
  high52Week: number;
  low52Week: number;
  priceToHigh: number;
  priceToLow: number;
}

export interface TechnicalIndicatorExplanationsProps {
  indicators: TechnicalSignal[];
  symbol: string;
  currentPrice: number;
  marketContext?: MarketContext;
}

export interface LazyTechnicalIndicatorExplanationsProps {
  indicators: TechnicalSignal[];
  symbol: string;
  currentPrice: number;
  marketContext?: MarketContext;
}

export interface AIInsightsProps {
  symbol: string;
  analysis?: TechnicalAnalysisResult;
}

// ============================================================================
// Component Props - Market
// ============================================================================

export interface MarketIndicesProps {
  onIndexClick: (symbol: string) => void;
}

export interface MarketIndexAnalysisProps {
  symbol: string;
  onClose: () => void;
}

export interface AdditionalInsightsSidebarProps {
  symbol?: string;
  analysis?: TechnicalAnalysisResult | null;
  priceData?: PriceData[];
  className?: string;
}

// ============================================================================
// Component Props - Layout
// ============================================================================

export interface MultiColumnLayoutProps {
  leftColumn: React.ReactNode;
  centerColumn: React.ReactNode;
  rightColumn?: React.ReactNode;
  sidebarWidth?: 'narrow' | 'medium' | 'wide';
  className?: string;
}

export interface MultiColumnLayoutExampleProps {
  symbol?: string;
}

export interface ResponsiveContainerProps {
  children: React.ReactNode;
  variant?: 'narrow' | 'wide' | 'full';
  className?: string;
  preventLayoutShift?: boolean;
}


export interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  icon?: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
  badge?: string | number;
}

// ============================================================================
// Component Props - Error Handling
// ============================================================================

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

export interface ResponsiveLayoutErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
  maxRetries?: number;
  retryDelay?: number;
}

// ============================================================================
// Component Props - Watchlist
// ============================================================================

export interface WatchlistManagerProps {
  onStockSelect?: (symbol: string) => void;
  useMockData?: boolean;
}

// ============================================================================
// Component Props - Terms & Glossary
// ============================================================================

export interface TermProps {
  children: string;
  term?: string;
  className?: string;
}

export interface TermsGlossaryProps {
  className?: string;
}

// ============================================================================
// Component Props - Trading Journal
// ============================================================================

export interface TradeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<CreateTradeRequest, 'userId'>) => Promise<void>;
  prefillSymbol?: string;
  prefillPredictionId?: string;
}

export interface TradeLogTableProps {
  trades: TradeWithPnL[];
  loading?: boolean;
  onCloseTrade?: (tradeId: string, exitPrice: number) => Promise<void>;
  onViewTrade?: (trade: TradeWithPnL) => void;
}

export interface UsePortfolioStatsReturn {
  stats: PortfolioStats | null;
  trades: TradeWithPnL[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// ============================================================================
// Component Props - Portfolio
// ============================================================================

export interface PortfolioManagerProps {
  className?: string;
}

export interface PortfolioSummaryCardProps {
  summary: PortfolioSummary | null;
  loading: boolean;
  error: string | null;
}

export interface HoldingsDataGridProps {
  holdings: HoldingWithMarketData[];
  loading: boolean;
  onUpdateTarget?: (symbol: string, targetPercent: number | null) => Promise<void>;
}

export interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: Omit<CreateTransactionRequest, 'portfolioId'>) => Promise<void>;
  portfolioId: string;
}

export interface PortfolioTreeMapProps {
  allocations: SectorAllocation[];
  loading: boolean;
}

export interface PerformanceChartProps {
  portfolioId: string;
  history: BenchmarkDataPoint[];
  loading: boolean;
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseStockAnalysisReturn {
  analysis: TechnicalAnalysisResult | null;
  priceData: PriceData[];
  loading: boolean;
  error: string | null;
  fetchAnalysis: (symbol: string, period?: string) => Promise<void>;
}

export interface UsePredictionsReturn {
  predictions: PredictionResult[];
  loading: boolean;
  error: string | null;
  fetchPredictions: (symbols: string[], isNewSearch?: boolean) => Promise<void>;
}

export interface UsePortfolioOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface PortfolioState {
  portfolios: Portfolio[];
  selectedPortfolioId: string | null;
  summary: PortfolioSummary | null;
  holdings: HoldingWithMarketData[];
  transactions: PortfolioTransaction[];
  allocations: SectorAllocation[];
  history: BenchmarkDataPoint[];
  loading: boolean;
  error: string | null;
}

// ============================================================================
// Internal Component Types (for tree map cells, tooltips, etc.)
// ============================================================================

export interface TreeMapCellProps {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  value: number;
  dayChangePercent?: number;
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    dataKey: string;
    payload: Record<string, unknown>;
  }>;
  label?: string;
}

export interface ChartLine {
  dataKey: string;
  stroke: string;
  name: string;
}

/** Form validation errors for trade entry */
export interface TradeFormErrors {
  symbol?: string;
  entryPrice?: string;
  quantity?: string;
  general?: string;
}

/** Stat card display props */
export interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  loading?: boolean;
}

// ============================================================================
// Dashboard Component Props
// ============================================================================

/** Props for DashboardHeader component */
export interface DashboardHeaderProps {
  onStockSearch: (symbol: string) => void;
  onQuickSelect: (symbol: string) => void;
  searchLoading: boolean;
}

/** Props for PredictionCard component */
export interface PredictionCardProps {
  prediction: PredictionResult;
  onSelect: (symbol: string) => void;
  onRemove: (symbol: string) => void;
  onLogTrade: (symbol: string, predictionId?: string) => void;
}

/** Props for PredictionsGrid component */
export interface PredictionsGridProps {
  predictions: PredictionResult[];
  onSelectStock: (symbol: string) => void;
  onRemoveStock: (symbol: string) => void;
  onLogTrade: (symbol: string, predictionId?: string) => void;
}

/** Props for DetailedAnalysisPanel component */
export interface DetailedAnalysisPanelProps {
  selectedStock: string;
  analysis: TechnicalAnalysisResult;
  priceData: PriceData[];
  onClose: () => void;
}

// ============================================================================
// Chart Component Props
// ============================================================================

/** Props for ChartHeader component */
export interface ChartHeaderProps {
  symbol: string;
  dataPointCount: number;
}

/** Chart tab definition */
export interface ChartTab {
  id: StockChartType;
  label: string;
}

/** Props for ChartTabNavigation component */
export interface ChartTabNavigationProps {
  tabs: ChartTab[];
  activeTab: StockChartType;
  onTabChange: (tab: StockChartType) => void;
}

/** Common props for individual chart components */
export interface ChartComponentProps {
  chartData: Array<{
    date: string;
    fullDate?: Date;
    open?: number;
    high?: number;
    low?: number;
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
  }>;
  formatPrice: (value: number) => string;
  formatVolume: (value: number) => string;
}

/** Props for ChartHelpText component */
export interface ChartHelpTextProps {
  activeChart: StockChartType;
}

