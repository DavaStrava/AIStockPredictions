/**
 * Technical Analysis Library
 * =========================
 * 
 * A comprehensive technical analysis library for financial markets that provides
 * professional-grade technical indicators, signal generation, and market analysis.
 * 
 * Features:
 * --------
 * - 11+ Technical Indicators across trend, momentum, and volume analysis
 * - Automated signal generation with strength ratings
 * - Market sentiment and trend analysis
 * - Consensus signal detection
 * - Configurable parameters for all indicators
 * - Performance optimized for real-time analysis
 * - Comprehensive error handling and data validation
 * 
 * Supported Indicators:
 * -------------------
 * Trend Indicators:
 * - RSI (Relative Strength Index)
 * - MACD (Moving Average Convergence Divergence)
 * - Bollinger Bands
 * - Simple Moving Average (SMA)
 * - Exponential Moving Average (EMA)
 * 
 * Momentum Indicators:
 * - Stochastic Oscillator
 * - Williams %R
 * - ADX (Average Directional Index)
 * 
 * Volume Indicators:
 * - OBV (On-Balance Volume)
 * - VPT (Volume Price Trend)
 * - A/D Line (Accumulation/Distribution)
 * 
 * Usage Examples:
 * --------------
 * 
 * Basic Analysis:
 * ```typescript
 * import { TechnicalAnalysisEngine } from './technical-analysis';
 * 
 * const engine = new TechnicalAnalysisEngine();
 * const analysis = engine.analyze(priceData, 'AAPL');
 * console.log(`Overall sentiment: ${analysis.summary.overall}`);
 * ```
 * 
 * Custom Configuration:
 * ```typescript
 * const engine = new TechnicalAnalysisEngine({
 *   rsi: { period: 21, overbought: 75, oversold: 25 },
 *   macd: { fastPeriod: 10, slowPeriod: 21, signalPeriod: 7 }
 * });
 * ```
 * 
 * Individual Indicators:
 * ```typescript
 * import { calculateRSI, calculateMACD } from './technical-analysis';
 * 
 * const rsiResults = calculateRSI(priceData, 14, 70, 30);
 * const macdResults = calculateMACD(priceData, 12, 26, 9);
 * ```
 * 
 * Signal Filtering:
 * ```typescript
 * const strongSignals = engine.getStrongSignals(analysis, 0.7);
 * const consensusSignals = engine.getConsensusSignals(analysis, 2);
 * ```
 * 
 * @author AI Stock Prediction System
 * @version 1.0.0
 * @license MIT
 */

// Main exports - Primary interface for the technical analysis system
export { TechnicalAnalysisEngine, analyzeTechnicals } from './engine';

// Type definitions - All interfaces and types used throughout the system
export type {
  PriceData,                          // Standard OHLCV price data structure
  TechnicalAnalysisResult,            // Complete analysis result structure
  TechnicalSignal,                    // Individual trading signal structure
  IndicatorResult,                    // Base indicator result interface
  RSIResult,                          // RSI-specific result structure
  MACDResult,                         // MACD-specific result structure
  BollingerBandsResult,              // Bollinger Bands result structure
  MovingAverageResult,               // Moving average result structure
  StochasticResult,                  // Stochastic oscillator result structure
  WilliamsRResult,                   // Williams %R result structure
  ADXResult,                         // ADX result structure
  OBVResult,                         // On-Balance Volume result structure
  VolumePriceTrendResult,            // Volume Price Trend result structure
  AccumulationDistributionResult,    // A/D Line result structure
  IndicatorConfig,                   // Configuration interface for all indicators
} from './types';

export { DEFAULT_CONFIG } from './types';

// Individual indicator analyzers
export {
  analyzeRSI,
  analyzeMACD,
  analyzeBollingerBands,
  analyzeMovingAverages,
  analyzeMomentum,
  analyzeVolume,
} from './engine';

// Individual indicator calculators
export { calculateRSI, detectRSIDivergence, generateRSISignals } from './indicators/rsi';
export { calculateMACD, generateMACDSignals, detectMACDDivergence } from './indicators/macd';
export { calculateBollingerBands, generateBollingerBandsSignals, detectBandWalking } from './indicators/bollinger-bands';
export { calculateSMAWithSignals, calculateEMAWithSignals, detectMovingAverageCrossovers } from './indicators/moving-averages';
export { calculateStochastic, calculateWilliamsR, calculateADX, generateMomentumSignals } from './indicators/momentum';
export { calculateOBV, calculateVolumePriceTrend, calculateAccumulationDistribution, generateVolumeSignals } from './indicators/volume';

// Utilities
export {
  validatePriceData,
  sortPriceData,
  calculateSMA,
  calculateEMA,
  calculateATR,
  calculateStandardDeviation,
  calculateCorrelation,
  generateSamplePriceData,
  detectCrossovers,
  findHighestHigh,
  findLowestLow,
} from './utils';