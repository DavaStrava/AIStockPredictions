// Main exports
export { TechnicalAnalysisEngine, analyzeTechnicals } from './engine';

// Types
export type {
  PriceData,
  TechnicalAnalysisResult,
  TechnicalSignal,
  IndicatorResult,
  RSIResult,
  MACDResult,
  BollingerBandsResult,
  MovingAverageResult,
  StochasticResult,
  WilliamsRResult,
  ADXResult,
  OBVResult,
  VolumePriceTrendResult,
  AccumulationDistributionResult,
  IndicatorConfig,
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