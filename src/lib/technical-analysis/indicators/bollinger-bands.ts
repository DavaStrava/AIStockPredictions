import { PriceData, BollingerBandsResult, TechnicalSignal } from '../types';
import { validatePriceData, calculateSMA, calculateStandardDeviation } from '../utils';

/**
 * Calculates Bollinger Bands - A volatility and mean reversion indicator
 * 
 * Bollinger Bands were developed by John Bollinger and consist of three lines:
 * 1. Middle Band: Simple Moving Average (typically 20-period)
 * 2. Upper Band: Middle Band + (Standard Deviation × multiplier, typically 2)
 * 3. Lower Band: Middle Band - (Standard Deviation × multiplier, typically 2)
 * 
 * Key Concepts:
 * - Bands expand during high volatility periods
 * - Bands contract during low volatility periods (squeeze)
 * - Price tends to bounce between the bands
 * - Price touching bands may indicate overbought/oversold conditions
 * - %B shows where price is relative to the bands (0 = lower band, 1 = upper band)
 * - Bandwidth measures the width of the bands (volatility indicator)
 * 
 * Trading Applications:
 * - Mean reversion: Price at bands may reverse toward middle
 * - Breakouts: Price breaking through bands with volume may continue
 * - Squeeze: Low bandwidth followed by expansion signals volatility breakout
 * - %B extremes: Values above 1 or below 0 indicate strong moves
 * 
 * @param data - Array of price data (OHLCV format)
 * @param period - Period for middle band SMA calculation (default: 20)
 * @param standardDeviations - Multiplier for standard deviation (default: 2)
 * @returns Array of Bollinger Bands results with all components and metrics
 * 
 * @throws {Error} When parameters are invalid or insufficient data
 * 
 * @example
 * ```typescript
 * const bbResults = calculateBollingerBands(priceData, 20, 2);
 * const latest = bbResults[bbResults.length - 1];
 * console.log(`Price at ${(latest.percentB * 100).toFixed(1)}% of band width`);
 * if (latest.squeeze) console.log('Bollinger Band squeeze detected!');
 * ```
 */
export function calculateBollingerBands(
  data: PriceData[],
  period: number = 20,
  standardDeviations: number = 2
): BollingerBandsResult[] {
  // Validate input data for completeness and consistency
  validatePriceData(data);
  
  // Ensure we have sufficient data for meaningful calculation
  if (period <= 0 || period > data.length) {
    throw new Error('Invalid period for Bollinger Bands calculation');
  }

  // Extract closing prices for Bollinger Bands calculation
  // Bollinger Bands typically use closing prices as they represent
  // the final consensus value for each trading period
  const closePrices = data.map(d => d.close);
  
  // Calculate the middle band (Simple Moving Average)
  // This serves as the baseline around which the bands are constructed
  const sma = calculateSMA(closePrices, period);
  
  // Calculate standard deviation for the same period
  // Standard deviation measures price volatility - higher values = more volatile
  const stdDev = calculateStandardDeviation(closePrices, period);
  
  const results: BollingerBandsResult[] = [];
  
  // Process each data point where we have sufficient history
  for (let i = 0; i < sma.length; i++) {
    // Calculate corresponding index in original data array
    const dataIndex = i + period - 1;
    
    // Get the middle band value (SMA)
    const middle = sma[i];
    
    // Calculate the deviation amount for this period
    // This determines how far the bands extend from the middle
    const deviation = stdDev[i] * standardDeviations;
    
    // Calculate upper and lower bands
    // Upper band = Middle + (Standard Deviation × Multiplier)
    // Lower band = Middle - (Standard Deviation × Multiplier)
    const upper = middle + deviation;
    const lower = middle - deviation;
    
    // Calculate %B (Percent B) - Shows where current price sits within the bands
    // %B = (Current Price - Lower Band) / (Upper Band - Lower Band)
    // Values: 0 = at lower band, 0.5 = at middle, 1 = at upper band
    // Values > 1 = above upper band, < 0 = below lower band
    const currentPrice = closePrices[dataIndex];
    const percentB = (currentPrice - lower) / (upper - lower);
    
    // Calculate Bandwidth - Measures the width of the bands relative to middle band
    // Bandwidth = (Upper Band - Lower Band) / Middle Band
    // Higher values = higher volatility, lower values = lower volatility
    const bandwidth = (upper - lower) / middle;
    
    // Detect Bollinger Band Squeeze
    // Squeeze occurs when bands contract significantly (low volatility)
    // Often precedes significant price moves when volatility expands
    // Threshold of 0.1 (10%) can be adjusted based on market and timeframe
    const squeeze = bandwidth < 0.1;
    
    // Create comprehensive Bollinger Bands result
    results.push({
      date: data[dataIndex].date,
      upper,        // Upper band value
      middle,       // Middle band value (SMA)
      lower,        // Lower band value
      bandwidth,    // Band width relative to middle (volatility measure)
      percentB,     // Price position within bands (0-1 scale, can exceed)
      squeeze,      // Boolean indicating if bands are in squeeze formation
    });
  }
  
  return results;
}

/**
 * Generate Bollinger Bands trading signals
 */
export function generateBollingerBandsSignals(
  data: PriceData[],
  bollingerResults: BollingerBandsResult[],
  symbol: string
): TechnicalSignal[] {
  const signals: TechnicalSignal[] = [];
  
  for (let i = 1; i < bollingerResults.length; i++) {
    const current = bollingerResults[i];
    const previous = bollingerResults[i - 1];
    const currentPrice = data[i + 19].close; // Adjust for period offset
    const previousPrice = data[i + 18].close;
    
    // Band touch/bounce signals
    const bandTouch = detectBandTouch(currentPrice, previousPrice, current, previous);
    if (bandTouch) {
      const signal = bandTouch === 'upper' ? 'sell' : 'buy';
      const strength = calculateBandTouchStrength(current, bandTouch);
      
      signals.push({
        indicator: 'Bollinger Bands',
        signal,
        strength,
        value: currentPrice,
        timestamp: current.date,
        description: `Price touched ${bandTouch} Bollinger Band - potential ${signal === 'buy' ? 'bounce up' : 'bounce down'}`,
      });
    }
    
    // Band breakout signals
    const breakout = detectBandBreakout(currentPrice, previousPrice, current, previous);
    if (breakout) {
      const signal = breakout === 'upper' ? 'buy' : 'sell';
      const strength = calculateBreakoutStrength(current, breakout);
      
      signals.push({
        indicator: 'Bollinger Bands',
        signal,
        strength,
        value: currentPrice,
        timestamp: current.date,
        description: `Price broke ${breakout === 'upper' ? 'above upper' : 'below lower'} Bollinger Band - potential ${breakout === 'upper' ? 'upward' : 'downward'} momentum`,
      });
    }
    
    // Squeeze signals (low volatility followed by expansion)
    const squeezeBreakout = detectSqueezeBreakout(previous, current);
    if (squeezeBreakout) {
      signals.push({
        indicator: 'Bollinger Bands',
        signal: 'hold',
        strength: 0.6,
        value: current.bandwidth,
        timestamp: current.date,
        description: `Bollinger Band squeeze ending - volatility expansion expected`,
      });
    }
    
    // %B extreme signals
    const percentBSignal = analyzePercentB(current);
    if (percentBSignal) {
      signals.push({
        indicator: 'Bollinger Bands',
        signal: percentBSignal.signal,
        strength: percentBSignal.strength,
        value: current.percentB,
        timestamp: current.date,
        description: percentBSignal.description,
      });
    }
  }
  
  return signals;
}

/**
 * Detect when price touches the bands
 */
function detectBandTouch(
  currentPrice: number,
  previousPrice: number,
  current: BollingerBandsResult,
  previous: BollingerBandsResult
): 'upper' | 'lower' | null {
  const tolerance = 0.001; // 0.1% tolerance
  
  // Upper band touch
  if (Math.abs(currentPrice - current.upper) / current.upper < tolerance &&
      Math.abs(previousPrice - previous.upper) / previous.upper >= tolerance) {
    return 'upper';
  }
  
  // Lower band touch
  if (Math.abs(currentPrice - current.lower) / current.lower < tolerance &&
      Math.abs(previousPrice - previous.lower) / previous.lower >= tolerance) {
    return 'lower';
  }
  
  return null;
}

/**
 * Detect when price breaks out of the bands
 */
function detectBandBreakout(
  currentPrice: number,
  previousPrice: number,
  current: BollingerBandsResult,
  previous: BollingerBandsResult
): 'upper' | 'lower' | null {
  // Upper breakout
  if (currentPrice > current.upper && previousPrice <= previous.upper) {
    return 'upper';
  }
  
  // Lower breakout
  if (currentPrice < current.lower && previousPrice >= previous.lower) {
    return 'lower';
  }
  
  return null;
}

/**
 * Calculate strength of band touch signal
 */
function calculateBandTouchStrength(
  result: BollingerBandsResult,
  touchType: 'upper' | 'lower'
): number {
  let strength = 0.6;
  
  // Increase strength if %B is extreme
  if (touchType === 'upper' && result.percentB > 0.95) {
    strength += 0.2;
  } else if (touchType === 'lower' && result.percentB < 0.05) {
    strength += 0.2;
  }
  
  // Increase strength during squeeze (low volatility)
  if (result.squeeze) {
    strength += 0.1;
  }
  
  return Math.min(1, strength);
}

/**
 * Calculate strength of breakout signal
 */
function calculateBreakoutStrength(
  result: BollingerBandsResult,
  breakoutType: 'upper' | 'lower'
): number {
  let strength = 0.7;
  
  // Increase strength based on how far the breakout is
  const extremeness = breakoutType === 'upper' ? 
    Math.max(0, result.percentB - 1) : 
    Math.max(0, -result.percentB);
  
  strength += Math.min(0.2, extremeness * 2);
  
  // Increase strength if breaking out of a squeeze
  if (result.squeeze) {
    strength += 0.1;
  }
  
  return Math.min(1, strength);
}

/**
 * Detect squeeze breakout (volatility expansion after contraction)
 */
function detectSqueezeBreakout(
  previous: BollingerBandsResult,
  current: BollingerBandsResult
): boolean {
  // Squeeze ending: was in squeeze, now expanding
  return previous.squeeze && !current.squeeze && current.bandwidth > previous.bandwidth * 1.2;
}

/**
 * Analyze %B for extreme readings
 */
function analyzePercentB(result: BollingerBandsResult): {
  signal: 'buy' | 'sell';
  strength: number;
  description: string;
} | null {
  // Extremely oversold
  if (result.percentB < 0.05) {
    return {
      signal: 'buy',
      strength: 0.7,
      description: `%B at ${(result.percentB * 100).toFixed(1)}% - extremely oversold condition`,
    };
  }
  
  // Extremely overbought
  if (result.percentB > 0.95) {
    return {
      signal: 'sell',
      strength: 0.7,
      description: `%B at ${(result.percentB * 100).toFixed(1)}% - extremely overbought condition`,
    };
  }
  
  return null;
}

/**
 * Detect Bollinger Band walking (trending market)
 */
export function detectBandWalking(
  data: PriceData[],
  bollingerResults: BollingerBandsResult[],
  minPeriods: number = 3
): ('upper' | 'lower' | null)[] {
  const walkingSignals: ('upper' | 'lower' | null)[] = [];
  
  for (let i = 0; i < bollingerResults.length; i++) {
    const dataIndex = i + 19; // Adjust for period offset
    if (dataIndex >= data.length) break;
    
    const currentPrice = data[dataIndex].close;
    const result = bollingerResults[i];
    
    // Check for upper band walking
    if (i >= minPeriods - 1) {
      let upperWalking = true;
      let lowerWalking = true;
      
      for (let j = 0; j < minPeriods; j++) {
        const checkIndex = i - j;
        const checkDataIndex = checkIndex + 19;
        const checkPrice = data[checkDataIndex].close;
        const checkResult = bollingerResults[checkIndex];
        
        if (checkPrice < checkResult.upper * 0.98) { // 2% tolerance
          upperWalking = false;
        }
        if (checkPrice > checkResult.lower * 1.02) { // 2% tolerance
          lowerWalking = false;
        }
      }
      
      if (upperWalking) {
        walkingSignals.push('upper');
      } else if (lowerWalking) {
        walkingSignals.push('lower');
      } else {
        walkingSignals.push(null);
      }
    } else {
      walkingSignals.push(null);
    }
  }
  
  return walkingSignals;
}

/**
 * Calculate Bollinger Bands with default parameters and generate signals
 */
export function analyzeBollingerBands(
  data: PriceData[],
  symbol: string,
  config?: {
    period?: number;
    standardDeviations?: number;
    detectWalking?: boolean;
  }
): {
  results: BollingerBandsResult[];
  signals: TechnicalSignal[];
  walking?: ('upper' | 'lower' | null)[];
} {
  const {
    period = 20,
    standardDeviations = 2,
    detectWalking = true,
  } = config || {};
  
  const results = calculateBollingerBands(data, period, standardDeviations);
  const signals = generateBollingerBandsSignals(data, results, symbol);
  
  let walking: ('upper' | 'lower' | null)[] | undefined;
  if (detectWalking) {
    walking = detectBandWalking(data, results);
  }
  
  return { results, signals, walking };
}