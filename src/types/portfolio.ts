/**
 * Portfolio Investment Tracker Type Definitions
 * 
 * This module defines the TypeScript interfaces for the Portfolio Investment Tracker feature.
 * It covers portfolios, transactions, holdings, and performance metrics.
 */

// ============================================================================
// Enums
// ============================================================================

export type PortfolioTransactionType =
  | 'BUY'
  | 'SELL'
  | 'DEPOSIT'
  | 'WITHDRAW'
  | 'DIVIDEND'
  | 'DIVIDEND_REINVESTMENT'
  | 'INTEREST';

export type TradeSide = 'LONG' | 'SHORT';
export type TradeStatus = 'OPEN' | 'CLOSED';

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
 * Extended to support trade tracking with P&L calculations.
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

  // Trade tracking fields (unified from trades table)
  side?: TradeSide | null; // LONG or SHORT
  tradeStatus?: TradeStatus | null; // OPEN or CLOSED
  exitPrice?: number | null; // Price at which position was closed
  exitDate?: Date | null; // Date position was closed
  realizedPnl?: number | null; // Profit/loss for closed trades
  linkedTradeId?: string | null; // Reference to related transaction (e.g., SELL refs BUY)
  settlementDate?: Date | null; // T+1 or T+2 settlement date
  importSource?: string | null; // Source of import (merrill_edge, fidelity, manual)
  rawDescription?: string | null; // Original description from CSV import
}

/**
 * Represents an open or closed trade position for P&L tracking.
 * This is a backwards-compatible view that mirrors the old JournalTrade interface.
 */
export interface TradePosition {
  id: string;
  portfolioId: string;
  symbol: string;
  side: TradeSide;
  status: TradeStatus;
  entryPrice: number;
  quantity: number;
  entryDate: Date;
  exitPrice: number | null;
  exitDate: Date | null;
  fees: number;
  realizedPnl: number | null;
  unrealizedPnl?: number | null; // Calculated with current price
  currentPrice?: number | null; // Current market price
  notes: string | null;
  createdAt: Date;
}

/**
 * Summary statistics for open positions.
 */
export interface OpenPositionSummary {
  symbol: string;
  portfolioId: string;
  totalShares: number;
  averageCostBasis: number;
  totalCostBasis: number;
  firstPurchaseDate: Date;
  lastTransactionDate: Date;
  currentPrice?: number;
  marketValue?: number;
  unrealizedPnl?: number;
  unrealizedPnlPercent?: number;
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

  // Trade tracking fields
  side?: TradeSide; // LONG or SHORT (defaults to LONG for BUY)
  tradeStatus?: TradeStatus; // OPEN or CLOSED (defaults to OPEN for BUY)
  linkedTradeId?: string; // Reference to related transaction
  settlementDate?: Date; // Settlement date
  importSource?: string; // Source of import
  rawDescription?: string; // Original description from CSV
}

/**
 * Request to update an existing transaction.
 */
export interface UpdateTransactionRequest {
  transactionDate?: Date;
  quantity?: number;
  pricePerShare?: number;
  fees?: number;
  notes?: string;
  side?: TradeSide;
  tradeStatus?: TradeStatus;
  exitPrice?: number;
  exitDate?: Date;
  settlementDate?: Date;
}

/**
 * Request to sell shares from an open position.
 */
export interface SellPositionRequest {
  symbol: string;
  quantity?: number; // If not specified, sells all shares
  pricePerShare: number;
  fees?: number;
  transactionDate: Date;
  notes?: string;
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
  transactionTypes?: PortfolioTransactionType[]; // Filter by multiple types
  symbol?: string;
  startDate?: Date;
  endDate?: Date;
  tradeStatus?: TradeStatus; // Filter by trade status
  includeReinvestments?: boolean; // Include DIVIDEND_REINVESTMENT (default: true)
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






