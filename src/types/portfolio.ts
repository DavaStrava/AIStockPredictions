/**
 * Portfolio Investment Tracker Type Definitions
 * 
 * This module defines the TypeScript interfaces for the Portfolio Investment Tracker feature.
 * It covers portfolios, transactions, holdings, and performance metrics.
 */

// ============================================================================
// Enums
// ============================================================================

export type PortfolioTransactionType = 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAW' | 'DIVIDEND';

// ============================================================================
// Core Models
// ============================================================================

/**
 * Represents a user's investment portfolio.
 */
export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  description?: string;
  currency: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a single transaction within a portfolio.
 */
export interface PortfolioTransaction {
  id: string;
  portfolioId: string;
  assetSymbol: string | null; // Null for DEPOSIT/WITHDRAW
  transactionType: PortfolioTransactionType;
  quantity: number | null; // Null for DEPOSIT/WITHDRAW
  pricePerShare: number | null; // Null for DEPOSIT/WITHDRAW
  fees: number;
  totalAmount: number; // Net cash impact
  transactionDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a current holding in a portfolio (cached state).
 */
export interface PortfolioHolding {
  id: string;
  portfolioId: string;
  symbol: string;
  quantity: number;
  averageCostBasis: number;
  totalCostBasis: number;
  targetAllocationPercent: number | null;
  sector: string | null;
  firstPurchaseDate: Date | null;
  lastTransactionDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Price data status indicator.
 * - 'live': Real-time price data successfully fetched
 * - 'unavailable': Price data could not be fetched (API error or symbol not found)
 */
export type PriceStatus = 'live' | 'unavailable';

/**
 * Holding with real-time market data merged.
 */
export interface HoldingWithMarketData extends PortfolioHolding {
  currentPrice: number;
  marketValue: number;
  portfolioWeight: number;
  driftPercent: number | null; // Weight - Target
  dayChange: number;
  dayChangePercent: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  previousClose: number;
  companyName?: string;
  sparklineData?: number[]; // 7-day price history
  /** Indicates the status of the price data for this holding */
  priceStatus: PriceStatus;
  /** Human-readable message if price data is unavailable */
  priceStatusMessage?: string;

  // Phase 1: Enhanced Holdings View fields
  /** Today's gain in dollars (dayChange * quantity) */
  todayGain: number;
  /** Today's gain as percentage of market value */
  todayGainPercent: number;
  /** Estimated annual dividend income (dividendYield * marketValue) */
  estimatedAnnualIncome: number;
  /** Annual dividend yield as percentage */
  dividendYield: number;
  /** 52-week high price */
  yearHigh: number;
  /** 52-week low price */
  yearLow: number;
  /** Post-market/after-hours price (if available) */
  postMarketPrice?: number;
  /** Post-market change percentage (if available) */
  postMarketChangePercent?: number;
}

/**
 * Daily performance snapshot for equity curve and benchmarking.
 */
export interface PortfolioDailyPerformance {
  id: string;
  portfolioId: string;
  date: Date;
  totalEquity: number;
  cashBalance: number;
  holdingsValue: number;
  dailyReturnPercent: number | null;
  totalReturnPercent: number | null;
  netDeposits: number;
  benchmarkSpyClose: number | null;
  benchmarkQqqClose: number | null;
  createdAt: Date;
}

// ============================================================================
// Summary & Analytics
// ============================================================================

/**
 * Portfolio summary statistics for the dashboard header.
 */
export interface PortfolioSummary {
  portfolioId: string;
  portfolioName: string;
  totalEquity: number; // Holdings value + Cash
  cashBalance: number;
  holdingsValue: number;
  holdingsCount: number;
  dayChange: number;
  dayChangePercent: number;
  totalReturn: number; // Current Equity - Net Deposits
  totalReturnPercent: number;
  dailyAlpha: number | null; // Portfolio day change % - SPY day change %
}

/**
 * Sector allocation for tree map visualization.
 */
export interface SectorAllocation {
  sector: string;
  marketValue: number;
  portfolioWeight: number;
  dayChangePercent: number;
  holdings: Array<{
    symbol: string;
    marketValue: number;
    portfolioWeight: number;
    dayChangePercent: number;
  }>;
}

/**
 * Benchmark comparison data point.
 */
export interface BenchmarkDataPoint {
  date: string;
  portfolioValue: number;
  portfolioReturn: number;
  spyReturn: number;
  qqqReturn: number;
}

/**
 * Rebalancing suggestion for a holding.
 */
export interface RebalanceSuggestion {
  symbol: string;
  currentWeight: number;
  targetWeight: number;
  driftPercent: number;
  action: 'BUY' | 'SELL' | 'HOLD';
  suggestedTradeValue: number;
  suggestedShares: number;
}

// ============================================================================
// Request DTOs
// ============================================================================

/**
 * Request to create a new portfolio.
 */
export interface CreatePortfolioRequest {
  userId: string;
  name: string;
  description?: string;
  currency?: string;
  isDefault?: boolean;
}

/**
 * Request to update an existing portfolio.
 */
export interface UpdatePortfolioRequest {
  name?: string;
  description?: string;
  currency?: string;
  isDefault?: boolean;
}

/**
 * Request to add a transaction to a portfolio.
 */
export interface CreateTransactionRequest {
  portfolioId: string;
  transactionType: PortfolioTransactionType;
  assetSymbol?: string; // Required for BUY/SELL/DIVIDEND
  quantity?: number; // Required for BUY/SELL
  pricePerShare?: number; // Required for BUY/SELL
  totalAmount: number; // Always required
  fees?: number;
  transactionDate: Date;
  notes?: string;
  /** Skip cash/holdings validation - use for historical imports where transactions already occurred */
  skipValidation?: boolean;
}

/**
 * Request to update a holding's target allocation.
 */
export interface UpdateHoldingTargetRequest {
  targetAllocationPercent: number | null;
}

/**
 * Filters for fetching transactions.
 */
export interface TransactionFilters {
  transactionType?: PortfolioTransactionType;
  symbol?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Filters for fetching performance history.
 */
export interface PerformanceHistoryFilters {
  startDate?: Date;
  endDate?: Date;
  interval?: 'daily' | 'weekly' | 'monthly';
}

// ============================================================================
// API Response Types
// ============================================================================

export interface PortfolioApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
}

export interface PortfolioListResponse {
  portfolios: Portfolio[];
  defaultPortfolioId?: string;
}

export interface HoldingsResponse {
  holdings: HoldingWithMarketData[];
  totalMarketValue: number;
  lastUpdated: Date;
}

export interface HistoryResponse {
  data: BenchmarkDataPoint[];
  startDate: string;
  endDate: string;
}

export interface RebalanceResponse {
  suggestions: RebalanceSuggestion[];
  totalDrift: number;
  rebalanceThreshold: number;
}

// ============================================================================
// Health Dashboard Types
// ============================================================================

export type HealthRating = 'bullish' | 'neutral' | 'bearish';

export interface HoldingHealthAnalysis {
  symbol: string;
  companyName?: string;
  score: number; // 0-100
  rating: HealthRating;
  signalSummary: 'bullish' | 'bearish' | 'neutral';
  topSignals: Array<{ indicator: string; signal: 'buy' | 'sell' | 'hold'; strength: number }>;
  diagnosticMessage: string;
  portfolioWeight: number;
  volatility: 'low' | 'medium' | 'high';
}

export interface PortfolioHealthResult {
  portfolioId: string;
  overallScore: number; // 0-100
  overallRating: HealthRating;
  ratingBreakdown: {
    bullish: { count: number; percent: number };
    neutral: { count: number; percent: number };
    bearish: { count: number; percent: number };
  };
  holdings: HoldingHealthAnalysis[];
  analyzedAt: string;
  holdingsAnalyzed: number;
  holdingsSkipped: number;
}






