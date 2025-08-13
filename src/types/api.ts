// API response types and request/response interfaces

import { 
  Prediction, 
  BacktestResult, 
  Insight, 
  Watchlist,
  PortfolioMetrics
} from './models';

// Base API response structure
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
  requestId: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string; // Only in development
}

// Pagination for list responses
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Prediction API types
export interface PredictRequest {
  symbol: string;
  timeHorizon?: '1d' | '1w' | '1m' | '3m';
  includeInsights?: boolean;
}

export interface PredictResponse {
  prediction: Prediction;
  insights?: Insight[];
  dataFreshness: {
    marketData: string; // ISO timestamp
    sentimentData: string; // ISO timestamp
    technicalIndicators: string; // ISO timestamp
  };
}

// Backtest API types
export interface BacktestRequest {
  symbols: string[];
  startDate: string; // ISO date
  endDate: string; // ISO date
  strategy: {
    name: string;
    type: 'technical' | 'portfolio' | 'sentiment' | 'combined';
    parameters: Record<string, unknown>;
  };
  positionSizing?: {
    method: 'fixed' | 'kelly' | 'risk_parity';
    parameters: Record<string, number>;
  };
  riskManagement?: {
    stopLoss?: number;
    takeProfit?: number;
    maxPositionSize?: number;
  };
}

export interface BacktestResponse {
  result: BacktestResult;
  comparison?: {
    benchmark: string;
    benchmarkReturn: number;
    alpha: number;
    beta: number;
    informationRatio: number;
  };
}

// Insights API types
export interface InsightsRequest {
  symbol?: string;
  type?: 'technical' | 'portfolio' | 'sentiment';
  limit?: number;
  includeExpired?: boolean;
}

export interface InsightsResponse {
  insights: Insight[];
  summary: {
    technicalBias: 'bullish' | 'bearish' | 'neutral';
    portfolioBias: 'bullish' | 'bearish' | 'neutral';
    sentimentBias: 'bullish' | 'bearish' | 'neutral';
    overallBias: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
  };
}

// Watchlist API types
export interface CreateWatchlistRequest {
  name: string;
  description?: string;
  symbols?: string[];
}

export interface UpdateWatchlistRequest {
  name?: string;
  description?: string;
}

export interface AddStockToWatchlistRequest {
  symbol: string;
}

export interface WatchlistResponse {
  watchlist: Watchlist;
  metrics?: {
    totalValue?: number;
    dayChange?: number;
    dayChangePercent?: number;
    portfolioMetrics?: PortfolioMetrics;
  };
}

// Data refresh API types
export interface RefreshDataRequest {
  symbols?: string[];
  dataTypes?: ('market' | 'news' | 'social' | 'technical' | 'portfolio')[];
  force?: boolean; // Force refresh even if data is recent
}

export interface RefreshDataResponse {
  status: 'completed' | 'in_progress' | 'failed';
  jobId?: string;
  refreshedData: {
    marketData: {
      symbols: string[];
      timestamp: string;
      recordsProcessed: number;
    };
    sentimentData: {
      sources: string[];
      timestamp: string;
      recordsProcessed: number;
    };
    technicalIndicators: {
      indicators: string[];
      timestamp: string;
      symbolsProcessed: number;
    };
  };
  errors?: Array<{
    type: string;
    message: string;
    symbol?: string;
  }>;
}

// Market data types
export interface MarketDataPoint {
  symbol: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjustedClose?: number;
}

export interface QuoteData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  peRatio?: number;
  timestamp: Date;
}

// Health check and system status
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    database: ServiceStatus;
    s3: ServiceStatus;
    llmProviders: {
      openai: ServiceStatus;
      bedrock: ServiceStatus;
    };
    externalApis: {
      marketData: ServiceStatus;
      newsData: ServiceStatus;
      socialData: ServiceStatus;
    };
  };
  timestamp: string;
  version: string;
}

export interface ServiceStatus {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  lastCheck: string;
  error?: string;
}

// WebSocket message types for real-time updates
export interface WebSocketMessage {
  type: 'price_update' | 'prediction_update' | 'insight_update' | 'system_status';
  data: unknown;
  timestamp: string;
}

export interface PriceUpdateMessage {
  type: 'price_update';
  data: {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    timestamp: string;
  };
}

export interface PredictionUpdateMessage {
  type: 'prediction_update';
  data: {
    symbol: string;
    predictionId: string;
    confidenceScore: number;
    targetPrice: number;
    timeHorizon: string;
  };
}

// Error codes for consistent error handling
export enum ApiErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Validation errors
  INVALID_REQUEST = 'INVALID_REQUEST',
  INVALID_SYMBOL = 'INVALID_SYMBOL',
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  
  // Data errors
  DATA_NOT_FOUND = 'DATA_NOT_FOUND',
  DATA_STALE = 'DATA_STALE',
  DATA_UNAVAILABLE = 'DATA_UNAVAILABLE',
  
  // Service errors
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  LLM_SERVICE_ERROR = 'LLM_SERVICE_ERROR',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT'
}