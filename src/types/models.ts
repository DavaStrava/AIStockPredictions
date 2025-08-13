// Core data models for the AI Stock Prediction application

export interface User {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Watchlist {
  id: string;
  userId: string;
  name: string;
  description?: string;
  stocks: WatchlistStock[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WatchlistStock {
  id: string;
  watchlistId: string;
  symbol: string;
  addedAt: Date;
}

export interface Prediction {
  id: string;
  symbol: string;
  predictionDate: Date;
  targetPrice?: number;
  confidenceScore: number; // 0-1 scale
  timeHorizon: '1d' | '1w' | '1m' | '3m';
  technicalSignals: TechnicalSignals;
  portfolioMetrics: PortfolioMetrics;
  sentimentData: SentimentData;
  createdAt: Date;
}

export interface TechnicalSignals {
  rsi: number;
  macd: {
    macd: number;
    signalLine: number;
    histogram: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  movingAverages: {
    sma20: number;
    sma50: number;
    sma200: number;
    ema12: number;
    ema26: number;
  };
  momentum: {
    stochastic: number;
    williamsR: number;
    adx: number;
  };
  volume: {
    obv: number;
    volumePriceTrend: number;
    accumulationDistribution: number;
  };
}

export interface PortfolioMetrics {
  beta: number;
  alpha: number;
  sharpeRatio: number;
  sortinoRatio: number;
  correlation: Record<string, number>; // correlations with other symbols
  volatility: number;
  expectedReturn: number;
  valueAtRisk: number;
  expectedShortfall: number;
}

export interface SentimentData {
  newsScore: number; // -1 to 1
  socialScore: number; // -1 to 1
  analystRating: number; // -1 to 1
  institutionalFlow: number; // -1 to 1
  aggregatedScore: number; // -1 to 1
  confidence: number; // 0-1
  sources: SentimentSource[];
}

export interface SentimentSource {
  type: 'news' | 'social' | 'analyst' | 'institutional';
  source: string;
  score: number;
  timestamp: Date;
  content?: string;
}

export interface BacktestResult {
  id: string;
  userId?: string;
  strategyName: string;
  parameters: BacktestParameters;
  startDate: Date;
  endDate: Date;
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  tradeCount: number;
  resultsData: BacktestResultsData;
  createdAt: Date;
}

export interface BacktestParameters {
  symbols: string[];
  strategy: TradingStrategy;
  positionSizing: PositionSizingMethod;
  riskManagement: RiskManagementRules;
  technicalIndicators: TechnicalIndicatorConfig[];
  portfolioTheory: PortfolioTheoryConfig;
  sentimentWeights: SentimentWeights;
}

export interface TradingStrategy {
  type: 'technical' | 'portfolio' | 'sentiment' | 'combined';
  rules: StrategyRule[];
  entryConditions: Condition[];
  exitConditions: Condition[];
}

export interface StrategyRule {
  indicator: string;
  condition: 'above' | 'below' | 'crossover' | 'crossunder' | 'divergence';
  value: number | string;
  weight: number;
}

export interface Condition {
  type: 'technical' | 'portfolio' | 'sentiment';
  indicator: string;
  operator: '>' | '<' | '=' | '>=' | '<=' | 'crossover' | 'crossunder';
  value: number;
  timeframe?: string;
}

export interface PositionSizingMethod {
  type: 'fixed' | 'kelly' | 'risk_parity' | 'mean_variance';
  parameters: Record<string, number>;
}

export interface RiskManagementRules {
  stopLoss?: number; // percentage
  takeProfit?: number; // percentage
  maxPositionSize?: number; // percentage of portfolio
  maxDrawdown?: number; // percentage
  riskPerTrade?: number; // percentage
}

export interface TechnicalIndicatorConfig {
  name: string;
  parameters: Record<string, number>;
  weight: number;
}

export interface PortfolioTheoryConfig {
  optimizationMethod: 'mean_variance' | 'risk_parity' | 'black_litterman';
  riskTolerance: number;
  expectedReturns?: Record<string, number>;
  covarianceMatrix?: number[][];
  constraints?: PortfolioConstraints;
}

export interface PortfolioConstraints {
  minWeight?: number;
  maxWeight?: number;
  sectorLimits?: Record<string, number>;
  turnoverLimit?: number;
}

export interface SentimentWeights {
  news: number;
  social: number;
  analyst: number;
  institutional: number;
}

export interface BacktestResultsData {
  trades: Trade[];
  portfolioValue: TimeSeriesData[];
  drawdown: TimeSeriesData[];
  returns: TimeSeriesData[];
  metrics: PerformanceMetrics;
  analysis: string; // LLM-generated analysis
}

export interface Trade {
  symbol: string;
  entryDate: Date;
  exitDate?: Date;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  side: 'long' | 'short';
  pnl?: number;
  pnlPercent?: number;
  reason: string; // entry/exit reason
}

export interface TimeSeriesData {
  date: Date;
  value: number;
}

export interface PerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  calmarRatio: number;
  winRate: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  consecutiveWins: number;
  consecutiveLosses: number;
}

export interface Insight {
  id: string;
  symbol?: string;
  insightType: 'technical' | 'portfolio' | 'sentiment';
  content: string;
  llmProvider: 'openai' | 'bedrock';
  confidenceScore: number;
  metadata: InsightMetadata;
  embedding?: number[]; // Vector embedding for similarity search
  createdAt: Date;
  expiresAt?: Date;
}

export interface InsightMetadata {
  sources: string[];
  indicators: string[];
  timeframe: string;
  marketConditions: string[];
  riskLevel: 'low' | 'medium' | 'high';
  actionable: boolean;
  tags: string[];
}