/**
 * Centralized prediction types for the AI Stock Prediction platform.
 * These types are used across the application for stock predictions and analysis.
 */

import { TechnicalSignal } from './technical-indicators';

/**
 * Risk metrics for a stock prediction
 */
export interface PredictionRiskMetrics {
  volatility: 'low' | 'medium' | 'high';
  support: number;
  resistance: number;
  stopLoss: number;
}

/**
 * Prediction details including direction, confidence, and reasoning
 */
export interface PredictionDetails {
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  targetPrice: number;
  timeframe: string;
  reasoning: string[];
}

/**
 * Market data for a stock (optional, included in API responses)
 */
export interface PredictionMarketData {
  dayChange: number;
  dayChangePercent: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  pe: number;
}

/**
 * Complete prediction result for a stock symbol.
 * Used by both the StockDashboard component and the predictions API route.
 */
export interface PredictionResult {
  symbol: string;
  currentPrice: number;
  prediction: PredictionDetails;
  signals: TechnicalSignal[];
  riskMetrics: PredictionRiskMetrics;
  /** Market data is included in API responses but may not be present in all contexts */
  marketData?: PredictionMarketData;
}
