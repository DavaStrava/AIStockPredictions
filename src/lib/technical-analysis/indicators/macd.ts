import { PriceData, MACDResult, TechnicalSignal } from '../types';
import { validatePriceData, calculateEMA, detectCrossovers } from '../utils';

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * 
 * MACD is a trend-following momentum indicator that shows the relationship between
 * two moving averages of a security's price. The MACD is calculated by subtracting
 * the 26-period EMA from the 12-period EMA.
 */
export function calculateMACD(
  data: PriceData[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult[] {
  validatePriceData(data);
  
  if (fastPeriod >= slowPeriod) {
    throw new Error('Fast period must be less than slow period');
  }
  
  if (data.length < slowPeriod + signalPeriod) {
    throw new Error('Insufficient data for MACD calculation');
  }

  const closePrices = data.map(d => d.close);
  
  // Calculate EMAs
  const fastEMA = calculateEMA(closePrices, fastPeriod);
  const slowEMA = calculateEMA(closePrices, slowPeriod);
  
  // Calculate MACD line (fast EMA - slow EMA)
  const macdLine: number[] = [];
  const startIndex = slowPeriod - fastPeriod; // Offset to align EMAs
  
  for (let i = 0; i < slowEMA.length; i++) {
    const fastIndex = i + startIndex;
    if (fastIndex < fastEMA.length) {
      macdLine.push(fastEMA[fastIndex] - slowEMA[i]);
    }
  }
  
  // Calculate Signal line (EMA of MACD line)
  const signalLine = calculateEMA(macdLine, signalPeriod);
  
  // Calculate Histogram (MACD - Signal)
  const histogram: number[] = [];
  for (let i = 0; i < signalLine.length; i++) {
    const macdIndex = i + signalPeriod - 1;
    if (macdIndex < macdLine.length) {
      histogram.push(macdLine[macdIndex] - signalLine[i]);
    }
  }
  
  // Detect crossovers
  const crossovers = detectCrossovers(
    macdLine.slice(signalPeriod - 1),
    signalLine
  );
  
  const results: MACDResult[] = [];
  const dataStartIndex = slowPeriod + signalPeriod - 2;
  
  for (let i = 0; i < histogram.length; i++) {
    const dataIndex = dataStartIndex + i;
    if (dataIndex >= data.length) break;
    
    const macdIndex = i + signalPeriod - 1;
    
    results.push({
      date: data[dataIndex].date,
      macd: macdLine[macdIndex],
      signal: signalLine[i],
      histogram: histogram[i],
      crossover: i < crossovers.length ? crossovers[i] : 'none',
    });
  }
  
  return results;
}

/**
 * Generate MACD trading signals
 */
export function generateMACDSignals(
  macdResults: MACDResult[],
  symbol: string
): TechnicalSignal[] {
  const signals: TechnicalSignal[] = [];
  
  for (let i = 1; i < macdResults.length; i++) {
    const current = macdResults[i];
    const previous = macdResults[i - 1];
    
    // MACD line crossover signals
    if (current.crossover === 'bullish') {
      signals.push({
        indicator: 'MACD',
        signal: 'buy',
        strength: calculateMACDStrength(current, 'bullish'),
        value: current.macd,
        timestamp: current.date,
        description: `MACD bullish crossover - MACD line (${current.macd.toFixed(4)}) crossed above signal line (${current.signal.toFixed(4)})`,
      });
    } else if (current.crossover === 'bearish') {
      signals.push({
        indicator: 'MACD',
        signal: 'sell',
        strength: calculateMACDStrength(current, 'bearish'),
        value: current.macd,
        timestamp: current.date,
        description: `MACD bearish crossover - MACD line (${current.macd.toFixed(4)}) crossed below signal line (${current.signal.toFixed(4)})`,
      });
    }
    
    // Histogram momentum signals
    const histogramTurning = detectHistogramTurning(previous, current);
    if (histogramTurning) {
      const signal = histogramTurning === 'bullish' ? 'buy' : 'sell';
      const strength = Math.abs(current.histogram) / Math.max(Math.abs(current.macd), 0.001);
      
      signals.push({
        indicator: 'MACD',
        signal,
        strength: Math.min(0.8, Math.max(0.4, strength)),
        value: current.histogram,
        timestamp: current.date,
        description: `MACD histogram ${histogramTurning} momentum - histogram turning ${histogramTurning === 'bullish' ? 'positive' : 'negative'}`,
      });
    }
    
    // Zero line crossover signals
    const zeroLineCross = detectZeroLineCrossover(previous, current);
    if (zeroLineCross) {
      const signal = zeroLineCross === 'bullish' ? 'buy' : 'sell';
      
      signals.push({
        indicator: 'MACD',
        signal,
        strength: 0.7,
        value: current.macd,
        timestamp: current.date,
        description: `MACD zero line crossover - MACD line crossed ${zeroLineCross === 'bullish' ? 'above' : 'below'} zero line`,
      });
    }
  }
  
  return signals;
}

/**
 * Calculate MACD signal strength based on various factors
 */
function calculateMACDStrength(result: MACDResult, direction: 'bullish' | 'bearish'): number {
  // Base strength
  let strength = 0.6;
  
  // Increase strength based on MACD line distance from zero
  const macdDistance = Math.abs(result.macd);
  strength += Math.min(0.2, macdDistance * 0.1);
  
  // Increase strength based on histogram magnitude
  const histogramMagnitude = Math.abs(result.histogram);
  strength += Math.min(0.2, histogramMagnitude * 0.05);
  
  // Adjust based on direction consistency
  if (direction === 'bullish' && result.macd > 0 && result.histogram > 0) {
    strength += 0.1;
  } else if (direction === 'bearish' && result.macd < 0 && result.histogram < 0) {
    strength += 0.1;
  }
  
  return Math.min(1, strength);
}

/**
 * Detect histogram turning points (momentum changes)
 */
function detectHistogramTurning(
  previous: MACDResult,
  current: MACDResult
): 'bullish' | 'bearish' | null {
  // Bullish turning: histogram was negative and decreasing, now increasing
  if (previous.histogram < 0 && current.histogram < 0 && current.histogram > previous.histogram) {
    return 'bullish';
  }
  
  // Bearish turning: histogram was positive and increasing, now decreasing
  if (previous.histogram > 0 && current.histogram > 0 && current.histogram < previous.histogram) {
    return 'bearish';
  }
  
  return null;
}

/**
 * Detect MACD zero line crossovers
 */
function detectZeroLineCrossover(
  previous: MACDResult,
  current: MACDResult
): 'bullish' | 'bearish' | null {
  // Bullish: MACD crosses above zero line
  if (previous.macd <= 0 && current.macd > 0) {
    return 'bullish';
  }
  
  // Bearish: MACD crosses below zero line
  if (previous.macd >= 0 && current.macd < 0) {
    return 'bearish';
  }
  
  return null;
}

/**
 * Detect MACD divergences with price
 */
export function detectMACDDivergence(
  data: PriceData[],
  macdResults: MACDResult[],
  lookbackPeriod: number = 20
): MACDResult[] {
  if (macdResults.length < lookbackPeriod * 2) {
    return macdResults;
  }
  
  const results = [...macdResults];
  
  for (let i = lookbackPeriod; i < results.length - lookbackPeriod; i++) {
    const currentPrice = data[i].close;
    const currentMACD = results[i].macd;
    
    // Look for divergences in the lookback period
    for (let j = i - lookbackPeriod; j < i; j++) {
      const pastPrice = data[j].close;
      const pastMACD = results[j].macd;
      
      // Bullish divergence: price makes lower low, MACD makes higher low
      if (currentPrice < pastPrice && currentMACD > pastMACD && 
          currentMACD < 0 && pastMACD < 0) {
        // Add divergence information (could extend MACDResult type)
        // For now, we'll just note it in the crossover field if it's 'none'
        if (results[i].crossover === 'none') {
          results[i].crossover = 'bullish';
        }
      }
      
      // Bearish divergence: price makes higher high, MACD makes lower high
      if (currentPrice > pastPrice && currentMACD < pastMACD && 
          currentMACD > 0 && pastMACD > 0) {
        if (results[i].crossover === 'none') {
          results[i].crossover = 'bearish';
        }
      }
    }
  }
  
  return results;
}

/**
 * Calculate MACD with default parameters and generate signals
 */
export function analyzeMACD(
  data: PriceData[],
  symbol: string,
  config?: {
    fastPeriod?: number;
    slowPeriod?: number;
    signalPeriod?: number;
    detectDivergence?: boolean;
  }
): {
  results: MACDResult[];
  signals: TechnicalSignal[];
} {
  const {
    fastPeriod = 12,
    slowPeriod = 26,
    signalPeriod = 9,
    detectDivergence = true,
  } = config || {};
  
  let results = calculateMACD(data, fastPeriod, slowPeriod, signalPeriod);
  
  if (detectDivergence) {
    results = detectMACDDivergence(data, results);
  }
  
  const signals = generateMACDSignals(results, symbol);
  
  return { results, signals };
}