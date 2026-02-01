/**
 * API Response Contracts
 *
 * These types define the EXACT structure that API endpoints must return.
 * Both frontend and backend code should import and use these types.
 *
 * Benefits:
 * - TypeScript will catch structure mismatches at compile time
 * - Single source of truth for API contracts
 * - Self-documenting API
 * - Refactoring safety
 */

import { PredictionResult } from './predictions';
import { JournalTrade } from './trading';

/**
 * Standard API Response Wrapper
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  field?: string;
  code?: string;
  details?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * GET /api/predictions
 *
 * Returns array of stock predictions with metadata
 */
export interface PredictionsResponse {
  success: true;
  data: PredictionResult[]; // MUST be array, not object
  metadata: {
    timestamp: string;
    symbolsRequested: number;
    symbolsProcessed: number;
    dataSource: string;
  };
}

/**
 * GET /api/search
 *
 * Returns array of search results
 */
export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  type: string;
}

export interface SearchResponse {
  success: true;
  data: SearchResult[]; // MUST be array
  metadata: {
    query: string;
    resultsCount: number;
    timestamp: string;
  };
}

/**
 * GET /api/analysis
 *
 * Returns technical analysis with price data
 */
export interface AnalysisResponse {
  success: true;
  data: any; // TechnicalAnalysisResult type
  priceData: any[]; // PriceData[] type
  currentQuote: any | null; // Quote type or null
  metadata: {
    symbol: string;
    dataPoints: number;
    period: string;
    dataSource: string;
    analysisTimestamp: string;
    dateRange: {
      from?: Date;
      to?: Date;
    };
  };
}

/**
 * POST /api/trades
 *
 * Returns created trade
 */
export interface CreateTradeResponse {
  success: true;
  data: JournalTrade;
}

/**
 * GET /api/trades
 *
 * Returns array of trades
 */
export interface TradesListResponse {
  success: true;
  data: JournalTrade[];
}

/**
 * GET /api/trades/stats
 *
 * Returns portfolio statistics
 */
export interface PortfolioStats {
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  totalPnL: number;
  winRate: number | null;
  avgWin: number | null;
  avgLoss: number | null;
  profitFactor: number | null;
  largestWin: number | null;
  largestLoss: number | null;
  totalFees: number;
}

export interface TradeStatsResponse {
  success: true;
  data: PortfolioStats;
}

/**
 * Type guard to check if response is successful
 */
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

/**
 * Type guard to check if response is an error
 */
export function isErrorResponse<T>(
  response: ApiResponse<T>
): response is ApiErrorResponse {
  return response.success === false;
}

/**
 * Helper to assert response structure at runtime
 */
export function assertPredictionsResponse(
  response: any
): asserts response is PredictionsResponse {
  if (!response.success) {
    throw new Error('Response is not successful');
  }
  if (!Array.isArray(response.data)) {
    throw new Error('predictions.data must be an array');
  }
  if (!response.metadata) {
    throw new Error('predictions.metadata is required');
  }
}

export function assertSearchResponse(
  response: any
): asserts response is SearchResponse {
  if (!response.success) {
    throw new Error('Response is not successful');
  }
  if (!Array.isArray(response.data)) {
    throw new Error('search.data must be an array');
  }
  if (!response.metadata) {
    throw new Error('search.metadata is required');
  }
}
