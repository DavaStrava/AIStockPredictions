// Core types for technical analysis

export interface PriceData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorResult {
  date: Date;
  value: number;
  signal?: 'buy' | 'sell' | 'hold';
  strength?: number; // 0-1 scale
}

export interface TechnicalSignal {
  indicator: string;
  signal: 'buy' | 'sell' | 'hold';
  strength: number; // 0-1 scale
  value: number;
  timestamp: Date;
  description: string;
}

// RSI specific types
export interface RSIResult extends IndicatorResult {
  overbought: boolean;
  oversold: boolean;
  divergence?: 'bullish' | 'bearish' | 'none';
}

// MACD specific types
export interface MACDResult {
  date: Date;
  macd: number;
  signal: number;
  histogram: number;
  crossover?: 'bullish' | 'bearish' | 'none';
}

// Bollinger Bands specific types
export interface BollingerBandsResult {
  date: Date;
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
  percentB: number;
  squeeze: boolean;
}

// Moving Average specific types
export interface MovingAverageResult extends IndicatorResult {
  type: 'SMA' | 'EMA';
  period: number;
}

// Stochastic specific types
export interface StochasticResult {
  date: Date;
  k: number;
  d: number;
  signal: 'buy' | 'sell' | 'hold';
  overbought: boolean;
  oversold: boolean;
}

// Williams %R specific types
export interface WilliamsRResult extends IndicatorResult {
  overbought: boolean;
  oversold: boolean;
}

// ADX specific types
export interface ADXResult {
  date: Date;
  adx: number;
  plusDI: number;
  minusDI: number;
  trend: 'strong' | 'weak' | 'no_trend';
  direction: 'bullish' | 'bearish' | 'neutral';
}

// Volume indicators
export interface OBVResult extends IndicatorResult {
  trend: 'bullish' | 'bearish' | 'neutral';
  divergence?: 'bullish' | 'bearish' | 'none';
}

export interface VolumePriceTrendResult extends IndicatorResult {
  trend: 'bullish' | 'bearish' | 'neutral';
}

export interface AccumulationDistributionResult extends IndicatorResult {
  trend: 'accumulation' | 'distribution' | 'neutral';
  divergence?: 'bullish' | 'bearish' | 'none';
}

// Comprehensive analysis result
export interface TechnicalAnalysisResult {
  symbol: string;
  timestamp: Date;
  signals: TechnicalSignal[];
  indicators: {
    rsi?: RSIResult[];
    macd?: MACDResult[];
    bollingerBands?: BollingerBandsResult[];
    sma?: MovingAverageResult[];
    ema?: MovingAverageResult[];
    stochastic?: StochasticResult[];
    williamsR?: WilliamsRResult[];
    adx?: ADXResult[];
    obv?: OBVResult[];
    volumePriceTrend?: VolumePriceTrendResult[];
    accumulationDistribution?: AccumulationDistributionResult[];
  };
  summary: {
    overall: 'bullish' | 'bearish' | 'neutral';
    strength: number; // 0-1 scale
    confidence: number; // 0-1 scale
    trendDirection: 'up' | 'down' | 'sideways';
    momentum: 'increasing' | 'decreasing' | 'stable';
    volatility: 'low' | 'medium' | 'high';
  };
}

// Configuration types
export interface IndicatorConfig {
  rsi?: {
    period: number;
    overbought: number;
    oversold: number;
  };
  macd?: {
    fastPeriod: number;
    slowPeriod: number;
    signalPeriod: number;
  };
  bollingerBands?: {
    period: number;
    standardDeviations: number;
  };
  movingAverages?: {
    periods: number[];
  };
  stochastic?: {
    kPeriod: number;
    dPeriod: number;
    overbought: number;
    oversold: number;
  };
  williamsR?: {
    period: number;
    overbought: number;
    oversold: number;
  };
  adx?: {
    period: number;
    strongTrend: number;
  };
}

export const DEFAULT_CONFIG: IndicatorConfig = {
  rsi: {
    period: 14,
    overbought: 70,
    oversold: 30,
  },
  macd: {
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
  },
  bollingerBands: {
    period: 20,
    standardDeviations: 2,
  },
  movingAverages: {
    periods: [20, 50, 200],
  },
  stochastic: {
    kPeriod: 14,
    dPeriod: 3,
    overbought: 80,
    oversold: 20,
  },
  williamsR: {
    period: 14,
    overbought: -20,
    oversold: -80,
  },
  adx: {
    period: 14,
    strongTrend: 25,
  },
};