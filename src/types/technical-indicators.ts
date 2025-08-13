// Technical indicator types and configurations

// Base technical indicator interface
export interface TechnicalIndicator {
  name: string;
  value: number;
  signal?: 'buy' | 'sell' | 'hold';
  strength?: number; // 0-1 scale
  timestamp: Date;
}

// Trend indicators
export interface MovingAverage extends TechnicalIndicator {
  period: number;
  type: 'SMA' | 'EMA' | 'WMA' | 'VWMA';
}

export interface MACD extends TechnicalIndicator {
  macd: number;
  signalLine: number; // Renamed to avoid conflict with base signal property
  histogram: number;
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
}

export interface ADX extends TechnicalIndicator {
  adx: number;
  plusDI: number;
  minusDI: number;
  period: number;
  trend: 'strong' | 'weak' | 'no_trend';
}

// Momentum indicators
export interface RSI extends TechnicalIndicator {
  period: number;
  overbought: number; // typically 70
  oversold: number; // typically 30
  condition: 'overbought' | 'oversold' | 'neutral';
}

export interface Stochastic extends TechnicalIndicator {
  k: number;
  d: number;
  kPeriod: number;
  dPeriod: number;
  overbought: number; // typically 80
  oversold: number; // typically 20
  condition: 'overbought' | 'oversold' | 'neutral';
}

export interface WilliamsR extends TechnicalIndicator {
  period: number;
  overbought: number; // typically -20
  oversold: number; // typically -80
  condition: 'overbought' | 'oversold' | 'neutral';
}

// Volatility indicators
export interface BollingerBands extends TechnicalIndicator {
  upper: number;
  middle: number; // SMA
  lower: number;
  period: number;
  standardDeviations: number;
  bandwidth: number;
  percentB: number;
  squeeze: boolean;
}

export interface ATR extends TechnicalIndicator {
  period: number;
  volatility: 'low' | 'medium' | 'high';
}

export interface KeltnerChannels extends TechnicalIndicator {
  upper: number;
  middle: number; // EMA
  lower: number;
  period: number;
  atrMultiplier: number;
}

// Volume indicators
export interface OBV extends TechnicalIndicator {
  trend: 'bullish' | 'bearish' | 'neutral';
  divergence?: 'bullish' | 'bearish' | 'none';
}

export interface VolumePriceTrend extends TechnicalIndicator {
  trend: 'bullish' | 'bearish' | 'neutral';
}

export interface AccumulationDistribution extends TechnicalIndicator {
  trend: 'accumulation' | 'distribution' | 'neutral';
  divergence?: 'bullish' | 'bearish' | 'none';
}

export interface VolumeWeightedAveragePrice extends TechnicalIndicator {
  period: number;
  pricePosition: 'above' | 'below' | 'at';
}

// Chart pattern recognition
export interface ChartPattern {
  name: string;
  type: 'reversal' | 'continuation';
  reliability: number; // 0-1 scale
  targetPrice?: number;
  stopLoss?: number;
  timeframe: string;
  confidence: number;
  description: string;
}

export interface SupportResistance {
  type: 'support' | 'resistance';
  level: number;
  strength: number; // 0-1 scale
  touches: number;
  lastTouch: Date;
  timeframe: string;
}

// Candlestick patterns
export interface CandlestickPattern {
  name: string;
  type: 'bullish' | 'bearish' | 'neutral';
  reliability: number;
  confirmation: boolean;
  description: string;
  timeframe: string;
}

// Technical analysis summary
export interface TechnicalAnalysisSummary {
  overall: 'bullish' | 'bearish' | 'neutral';
  trend: {
    shortTerm: 'bullish' | 'bearish' | 'neutral';
    mediumTerm: 'bullish' | 'bearish' | 'neutral';
    longTerm: 'bullish' | 'bearish' | 'neutral';
  };
  momentum: {
    signal: 'bullish' | 'bearish' | 'neutral';
    strength: number;
    indicators: string[];
  };
  volatility: {
    level: 'low' | 'medium' | 'high';
    expanding: boolean;
    indicators: string[];
  };
  volume: {
    trend: 'increasing' | 'decreasing' | 'stable';
    confirmation: boolean;
    indicators: string[];
  };
  keyLevels: {
    support: number[];
    resistance: number[];
    pivot: number;
  };
  patterns: {
    chart: ChartPattern[];
    candlestick: CandlestickPattern[];
  };
  signals: TechnicalSignal[];
}

export interface TechnicalSignal {
  type: 'entry' | 'exit' | 'warning';
  direction: 'buy' | 'sell';
  strength: number; // 0-1 scale
  confidence: number; // 0-1 scale
  source: string; // indicator name
  description: string;
  targetPrice?: number;
  stopLoss?: number;
  timeframe: string;
  timestamp: Date;
}

// Indicator configuration for calculations
export interface IndicatorConfig {
  name: string;
  parameters: Record<string, number>;
  enabled: boolean;
  weight?: number; // for composite signals
}

export interface TechnicalAnalysisConfig {
  indicators: {
    trend: IndicatorConfig[];
    momentum: IndicatorConfig[];
    volatility: IndicatorConfig[];
    volume: IndicatorConfig[];
  };
  patterns: {
    chart: boolean;
    candlestick: boolean;
  };
  timeframes: string[];
  signalThresholds: {
    strong: number;
    moderate: number;
    weak: number;
  };
}

// Market regime detection
export interface MarketRegime {
  type: 'bull' | 'bear' | 'sideways' | 'volatile';
  confidence: number;
  duration: number; // days
  characteristics: string[];
  indicators: Record<string, number>;
  startDate: Date;
  description: string;
}

// Sector and market analysis
export interface SectorAnalysis {
  sector: string;
  performance: {
    day: number;
    week: number;
    month: number;
    quarter: number;
    year: number;
  };
  technicalBias: 'bullish' | 'bearish' | 'neutral';
  momentum: number;
  relativeStrength: number;
  topPerformers: string[];
  bottomPerformers: string[];
}

export interface MarketBreadth {
  advanceDeclineRatio: number;
  newHighsNewLows: number;
  upVolumeDownVolume: number;
  bullishPercent: number;
  vixLevel: number;
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
  breadthThrust: boolean;
}