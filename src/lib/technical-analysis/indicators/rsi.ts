import { PriceData, RSIResult, TechnicalSignal } from '../types';
import { validatePriceData, calculateGainsAndLosses, calculateEMA } from '../utils';

/**
 * Calculates Relative Strength Index (RSI) - A momentum oscillator
 * 
 * RSI is one of the most popular technical indicators, developed by J. Welles Wilder Jr.
 * It measures the speed and change of price movements on a scale of 0 to 100.
 * 
 * Key Concepts:
 * - RSI > 70: Traditionally considered overbought (potential sell signal)
 * - RSI < 30: Traditionally considered oversold (potential buy signal)
 * - RSI around 50: Neutral momentum
 * 
 * The RSI calculation involves:
 * 1. Calculate price changes (gains and losses)
 * 2. Calculate average gains and losses over the period
 * 3. Calculate Relative Strength (RS) = Average Gain / Average Loss
 * 4. Calculate RSI = 100 - (100 / (1 + RS))
 * 
 * @param data - Array of price data (OHLCV format)
 * @param period - Number of periods for RSI calculation (default: 14, Wilder's original)
 * @param overbought - RSI level considered overbought (default: 70)
 * @param oversold - RSI level considered oversold (default: 30)
 * @returns Array of RSI results with signals and strength indicators
 * 
 * @throws {Error} When data is invalid or period is inappropriate
 * 
 * @example
 * ```typescript
 * const rsiResults = calculateRSI(priceData, 14, 70, 30);
 * const latestRSI = rsiResults[rsiResults.length - 1];
 * console.log(`RSI: ${latestRSI.value}, Signal: ${latestRSI.signal}`);
 * ```
 */
export function calculateRSI(
  data: PriceData[],
  period: number = 14,
  overbought: number = 70,
  oversold: number = 30
): RSIResult[] {
  // Validate input data for completeness and consistency
  validatePriceData(data);
  
  // Ensure we have enough data points for meaningful RSI calculation
  if (period <= 0 || period >= data.length) {
    throw new Error('Invalid period for RSI calculation');
  }

  // Extract closing prices for RSI calculation
  // RSI is typically calculated using closing prices as they represent
  // the final consensus of value for each trading period
  const closePrices = data.map(d => d.close);
  
  // Calculate gains and losses from price changes
  // This separates upward moves (gains) from downward moves (losses)
  const { gains, losses } = calculateGainsAndLosses(closePrices);
  
  // Calculate average gains and losses using EMA (Wilder's smoothing method)
  // Wilder used a modified EMA that gives equal weight to all periods
  // This provides smoother results than simple averages
  const avgGains = calculateEMA(gains, period);
  const avgLosses = calculateEMA(losses, period);
  
  const results: RSIResult[] = [];
  
  // Process each data point where we have sufficient history
  // Start from period index since we need enough data for EMA calculation
  for (let i = 0; i < avgGains.length; i++) {
    // Calculate the corresponding index in the original data array
    const dataIndex = i + period; // Adjust for the offset caused by EMA calculation
    
    // Safety check to prevent array bounds errors
    if (dataIndex >= data.length) break;
    
    const avgGain = avgGains[i];
    const avgLoss = avgLosses[i];
    
    // Calculate Relative Strength (RS)
    // RS = Average Gain / Average Loss
    // Handle division by zero case (no losses = maximum strength)
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    
    // Calculate RSI using the standard formula
    // RSI = 100 - (100 / (1 + RS))
    // This normalizes RS to a 0-100 scale
    const rsi = 100 - (100 / (1 + rs));
    
    // Generate trading signals based on RSI levels
    let signal: 'buy' | 'sell' | 'hold' = 'hold';
    let strength = 0.5; // Default neutral strength
    
    if (rsi <= oversold) {
      // Oversold condition - potential buying opportunity
      signal = 'buy';
      // Strength increases as RSI gets more oversold
      // Minimum strength of 0.6, increases as RSI approaches 0
      strength = Math.max(0.6, (oversold - rsi) / oversold + 0.5);
    } else if (rsi >= overbought) {
      // Overbought condition - potential selling opportunity
      signal = 'sell';
      // Strength increases as RSI gets more overbought
      // Minimum strength of 0.6, increases as RSI approaches 100
      strength = Math.max(0.6, (rsi - overbought) / (100 - overbought) + 0.5);
    } else {
      // Neutral zone (between oversold and overbought levels)
      // Calculate strength based on distance from neutral (50)
      const distanceFrom50 = Math.abs(rsi - 50);
      // Strength ranges from 0.3 (at RSI=50) to 0.7 (at boundaries)
      strength = 0.3 + (distanceFrom50 / 50) * 0.4;
    }
    
    // Create RSI result object with all relevant information
    results.push({
      date: data[dataIndex].date,
      value: rsi,
      signal,
      strength: Math.min(1, strength), // Cap strength at 1.0
      overbought: rsi >= overbought,
      oversold: rsi <= oversold,
      divergence: 'none', // Divergence analysis performed separately
    });
  }
  
  return results;
}

/**
 * Detect RSI divergences
 * Bullish divergence: Price makes lower lows while RSI makes higher lows
 * Bearish divergence: Price makes higher highs while RSI makes lower highs
 */
export function detectRSIDivergence(
  data: PriceData[],
  rsiResults: RSIResult[],
  lookbackPeriod: number = 20
): RSIResult[] {
  if (rsiResults.length < lookbackPeriod * 2) {
    return rsiResults; // Not enough data for divergence analysis
  }
  
  const results = [...rsiResults];
  
  for (let i = lookbackPeriod; i < results.length - lookbackPeriod; i++) {
    const currentPrice = data[i].close;
    const currentRSI = results[i].value;
    
    // Look for local extremes in the lookback period
    let bullishDivergence = false;
    let bearishDivergence = false;
    
    // Check for bullish divergence (price lower low, RSI higher low)
    for (let j = i - lookbackPeriod; j < i; j++) {
      const pastPrice = data[j].close;
      const pastRSI = results[j].value;
      
      if (currentPrice < pastPrice && currentRSI > pastRSI && 
          currentRSI < 50 && pastRSI < 50) { // Both in oversold territory
        bullishDivergence = true;
        break;
      }
    }
    
    // Check for bearish divergence (price higher high, RSI lower high)
    for (let j = i - lookbackPeriod; j < i; j++) {
      const pastPrice = data[j].close;
      const pastRSI = results[j].value;
      
      if (currentPrice > pastPrice && currentRSI < pastRSI && 
          currentRSI > 50 && pastRSI > 50) { // Both in overbought territory
        bearishDivergence = true;
        break;
      }
    }
    
    if (bullishDivergence) {
      results[i].divergence = 'bullish';
      results[i].signal = 'buy';
      results[i].strength = Math.min(1, results[i].strength! + 0.2);
    } else if (bearishDivergence) {
      results[i].divergence = 'bearish';
      results[i].signal = 'sell';
      results[i].strength = Math.min(1, results[i].strength! + 0.2);
    }
  }
  
  return results;
}

/**
 * Generate RSI trading signals
 */
export function generateRSISignals(
  rsiResults: RSIResult[],
  symbol: string
): TechnicalSignal[] {
  const signals: TechnicalSignal[] = [];
  
  for (const result of rsiResults) {
    if (result.signal !== 'hold') {
      let description = '';
      
      if (result.signal === 'buy') {
        if (result.oversold) {
          description = `RSI oversold at ${result.value.toFixed(2)} - potential buying opportunity`;
        } else if (result.divergence === 'bullish') {
          description = `Bullish RSI divergence detected - price momentum may reverse upward`;
        } else {
          description = `RSI showing bullish momentum at ${result.value.toFixed(2)}`;
        }
      } else {
        if (result.overbought) {
          description = `RSI overbought at ${result.value.toFixed(2)} - potential selling opportunity`;
        } else if (result.divergence === 'bearish') {
          description = `Bearish RSI divergence detected - price momentum may reverse downward`;
        } else {
          description = `RSI showing bearish momentum at ${result.value.toFixed(2)}`;
        }
      }
      
      signals.push({
        indicator: 'RSI',
        signal: result.signal,
        strength: result.strength!,
        value: result.value,
        timestamp: result.date,
        description,
      });
    }
  }
  
  return signals;
}

/**
 * Calculate RSI with default parameters and generate signals
 */
export function analyzeRSI(
  data: PriceData[],
  symbol: string,
  config?: {
    period?: number;
    overbought?: number;
    oversold?: number;
    detectDivergence?: boolean;
  }
): {
  results: RSIResult[];
  signals: TechnicalSignal[];
} {
  const {
    period = 14,
    overbought = 70,
    oversold = 30,
    detectDivergence = true,
  } = config || {};
  
  let results = calculateRSI(data, period, overbought, oversold);
  
  if (detectDivergence) {
    results = detectRSIDivergence(data, results);
  }
  
  const signals = generateRSISignals(results, symbol);
  
  return { results, signals };
}