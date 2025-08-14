import { PriceData, RSIResult, TechnicalSignal } from '../types';
import { validatePriceData, calculateGainsAndLosses, calculateEMA } from '../utils';

/**
 * Calculate Relative Strength Index (RSI)
 * 
 * RSI is a momentum oscillator that measures the speed and change of price movements.
 * RSI oscillates between 0 and 100. Traditionally, RSI is considered overbought when above 70
 * and oversold when below 30.
 */
export function calculateRSI(
  data: PriceData[],
  period: number = 14,
  overbought: number = 70,
  oversold: number = 30
): RSIResult[] {
  validatePriceData(data);
  
  if (period <= 0 || period >= data.length) {
    throw new Error('Invalid period for RSI calculation');
  }

  const closePrices = data.map(d => d.close);
  const { gains, losses } = calculateGainsAndLosses(closePrices);
  
  // Calculate average gains and losses using EMA (Wilder's smoothing)
  const avgGains = calculateEMA(gains, period);
  const avgLosses = calculateEMA(losses, period);
  
  const results: RSIResult[] = [];
  
  // Start from period index since we need enough data for EMA
  for (let i = 0; i < avgGains.length; i++) {
    const dataIndex = i + period; // Adjust for the offset
    
    if (dataIndex >= data.length) break;
    
    const avgGain = avgGains[i];
    const avgLoss = avgLosses[i];
    
    // Calculate RS (Relative Strength)
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    
    // Calculate RSI
    const rsi = 100 - (100 / (1 + rs));
    
    // Determine signal
    let signal: 'buy' | 'sell' | 'hold' = 'hold';
    let strength = 0.5;
    
    if (rsi <= oversold) {
      signal = 'buy';
      strength = Math.max(0.6, (oversold - rsi) / oversold + 0.5);
    } else if (rsi >= overbought) {
      signal = 'sell';
      strength = Math.max(0.6, (rsi - overbought) / (100 - overbought) + 0.5);
    } else {
      // Neutral zone - calculate strength based on distance from 50
      const distanceFrom50 = Math.abs(rsi - 50);
      strength = 0.3 + (distanceFrom50 / 50) * 0.4; // 0.3 to 0.7 range
    }
    
    results.push({
      date: data[dataIndex].date,
      value: rsi,
      signal,
      strength: Math.min(1, strength),
      overbought: rsi >= overbought,
      oversold: rsi <= oversold,
      divergence: 'none', // Will be calculated separately if needed
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