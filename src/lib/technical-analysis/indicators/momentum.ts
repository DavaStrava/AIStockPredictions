import { PriceData, StochasticResult, WilliamsRResult, ADXResult, TechnicalSignal } from '../types';
import { validatePriceData, calculateSMA, findHighestHigh, findLowestLow, calculateATR } from '../utils';

/**
 * Calculate Stochastic Oscillator
 * 
 * The Stochastic Oscillator compares a particular closing price of a security 
 * to a range of its prices over a certain period of time.
 */
export function calculateStochastic(
  data: PriceData[],
  kPeriod: number = 14,
  dPeriod: number = 3,
  overbought: number = 80,
  oversold: number = 20
): StochasticResult[] {
  validatePriceData(data);
  
  if (kPeriod <= 0 || kPeriod >= data.length) {
    throw new Error('Invalid K period for Stochastic calculation');
  }

  const results: StochasticResult[] = [];
  const kValues: number[] = [];
  
  // Calculate %K values
  for (let i = kPeriod - 1; i < data.length; i++) {
    const currentClose = data[i].close;
    const highestHigh = findHighestHigh(data, i - kPeriod + 1, kPeriod);
    const lowestLow = findLowestLow(data, i - kPeriod + 1, kPeriod);
    
    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    kValues.push(k);
  }
  
  // Calculate %D values (SMA of %K)
  const dValues = calculateSMA(kValues, dPeriod);
  
  // Generate results
  for (let i = 0; i < dValues.length; i++) {
    const dataIndex = i + kPeriod + dPeriod - 2;
    const kIndex = i + dPeriod - 1;
    
    const k = kValues[kIndex];
    const d = dValues[i];
    
    // Determine signal
    let signal: 'buy' | 'sell' | 'hold' = 'hold';
    
    if (k <= oversold && d <= oversold && k > d) {
      signal = 'buy';
    } else if (k >= overbought && d >= overbought && k < d) {
      signal = 'sell';
    }
    
    results.push({
      date: data[dataIndex].date,
      k,
      d,
      signal,
      overbought: k >= overbought,
      oversold: k <= oversold,
    });
  }
  
  return results;
}

/**
 * Calculate Williams %R
 * 
 * Williams %R is a momentum indicator that measures overbought and oversold levels.
 */
export function calculateWilliamsR(
  data: PriceData[],
  period: number = 14,
  overbought: number = -20,
  oversold: number = -80
): WilliamsRResult[] {
  validatePriceData(data);
  
  if (period <= 0 || period >= data.length) {
    throw new Error('Invalid period for Williams %R calculation');
  }

  const results: WilliamsRResult[] = [];
  
  for (let i = period - 1; i < data.length; i++) {
    const currentClose = data[i].close;
    const highestHigh = findHighestHigh(data, i - period + 1, period);
    const lowestLow = findLowestLow(data, i - period + 1, period);
    
    const williamsR = ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
    
    // Determine signal
    let signal: 'buy' | 'sell' | 'hold' = 'hold';
    let strength = 0.5;
    
    if (williamsR <= oversold) {
      signal = 'buy';
      strength = Math.min(0.9, 0.6 + Math.abs(williamsR - oversold) / 20);
    } else if (williamsR >= overbought) {
      signal = 'sell';
      strength = Math.min(0.9, 0.6 + Math.abs(williamsR - overbought) / 20);
    }
    
    results.push({
      date: data[i].date,
      value: williamsR,
      signal,
      strength,
      overbought: williamsR >= overbought,
      oversold: williamsR <= oversold,
    });
  }
  
  return results;
}

/**
 * Calculate ADX (Average Directional Index)
 * 
 * ADX measures the strength of a trend, regardless of direction.
 */
export function calculateADX(
  data: PriceData[],
  period: number = 14,
  strongTrend: number = 25
): ADXResult[] {
  validatePriceData(data);
  
  if (period <= 0 || period >= data.length - 1) {
    throw new Error('Invalid period for ADX calculation');
  }

  const results: ADXResult[] = [];
  const trueRanges: number[] = [];
  const plusDMs: number[] = [];
  const minusDMs: number[] = [];
  
  // Calculate True Range, +DM, and -DM
  for (let i = 1; i < data.length; i++) {
    const current = data[i];
    const previous = data[i - 1];
    
    // True Range
    const tr1 = current.high - current.low;
    const tr2 = Math.abs(current.high - previous.close);
    const tr3 = Math.abs(current.low - previous.close);
    const tr = Math.max(tr1, tr2, tr3);
    trueRanges.push(tr);
    
    // Directional Movement
    const highDiff = current.high - previous.high;
    const lowDiff = previous.low - current.low;
    
    const plusDM = (highDiff > lowDiff && highDiff > 0) ? highDiff : 0;
    const minusDM = (lowDiff > highDiff && lowDiff > 0) ? lowDiff : 0;
    
    plusDMs.push(plusDM);
    minusDMs.push(minusDM);
  }
  
  // Calculate smoothed values
  const smoothedTRs = calculateSMA(trueRanges, period);
  const smoothedPlusDMs = calculateSMA(plusDMs, period);
  const smoothedMinusDMs = calculateSMA(minusDMs, period);
  
  // Calculate DI+ and DI-
  const plusDIs: number[] = [];
  const minusDIs: number[] = [];
  
  for (let i = 0; i < smoothedTRs.length; i++) {
    const plusDI = (smoothedPlusDMs[i] / smoothedTRs[i]) * 100;
    const minusDI = (smoothedMinusDMs[i] / smoothedTRs[i]) * 100;
    
    plusDIs.push(plusDI);
    minusDIs.push(minusDI);
  }
  
  // Calculate DX and ADX
  const dxValues: number[] = [];
  
  for (let i = 0; i < plusDIs.length; i++) {
    const dx = Math.abs(plusDIs[i] - minusDIs[i]) / (plusDIs[i] + minusDIs[i]) * 100;
    dxValues.push(isNaN(dx) ? 0 : dx);
  }
  
  const adxValues = calculateSMA(dxValues, period);
  
  // Generate results
  for (let i = 0; i < adxValues.length; i++) {
    const dataIndex = i + (period * 2) - 1;
    const diIndex = i + period - 1;
    
    if (dataIndex >= data.length) break;
    
    const adx = adxValues[i];
    const plusDI = plusDIs[diIndex];
    const minusDI = minusDIs[diIndex];
    
    // Determine trend strength and direction
    let trend: 'strong' | 'weak' | 'no_trend' = 'no_trend';
    let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    
    if (adx >= strongTrend) {
      trend = 'strong';
      direction = plusDI > minusDI ? 'bullish' : 'bearish';
    } else if (adx >= 20) {
      trend = 'weak';
      direction = plusDI > minusDI ? 'bullish' : 'bearish';
    }
    
    results.push({
      date: data[dataIndex].date,
      adx,
      plusDI,
      minusDI,
      trend,
      direction,
    });
  }
  
  return results;
}

/**
 * Generate momentum indicator signals
 */
export function generateMomentumSignals(
  stochastic?: StochasticResult[],
  williamsR?: WilliamsRResult[],
  adx?: ADXResult[],
  symbol: string = ''
): TechnicalSignal[] {
  const signals: TechnicalSignal[] = [];
  
  // Stochastic signals
  if (stochastic) {
    for (const result of stochastic) {
      if (result.signal !== 'hold') {
        let description = '';
        let strength = 0.6;
        
        if (result.signal === 'buy' && result.oversold) {
          description = `Stochastic oversold crossover - %K (${result.k.toFixed(1)}) crossed above %D (${result.d.toFixed(1)})`;
          strength = 0.7;
        } else if (result.signal === 'sell' && result.overbought) {
          description = `Stochastic overbought crossover - %K (${result.k.toFixed(1)}) crossed below %D (${result.d.toFixed(1)})`;
          strength = 0.7;
        }
        
        if (description) {
          signals.push({
            indicator: 'Stochastic',
            signal: result.signal,
            strength,
            value: result.k,
            timestamp: result.date,
            description,
          });
        }
      }
    }
  }
  
  // Williams %R signals
  if (williamsR) {
    for (const result of williamsR) {
      if (result.signal !== 'hold') {
        let description = '';
        
        if (result.signal === 'buy' && result.oversold) {
          description = `Williams %R oversold at ${result.value.toFixed(1)}% - potential reversal`;
        } else if (result.signal === 'sell' && result.overbought) {
          description = `Williams %R overbought at ${result.value.toFixed(1)}% - potential reversal`;
        }
        
        if (description) {
          signals.push({
            indicator: 'Williams %R',
            signal: result.signal,
            strength: result.strength!,
            value: result.value,
            timestamp: result.date,
            description,
          });
        }
      }
    }
  }
  
  // ADX signals
  if (adx) {
    for (const result of adx) {
      if (result.trend === 'strong') {
        const signal = result.direction === 'bullish' ? 'buy' : 'sell';
        const strength = Math.min(0.8, 0.5 + (result.adx - 25) / 50);
        
        signals.push({
          indicator: 'ADX',
          signal,
          strength,
          value: result.adx,
          timestamp: result.date,
          description: `Strong ${result.direction} trend detected - ADX at ${result.adx.toFixed(1)}`,
        });
      }
    }
  }
  
  return signals;
}

/**
 * Analyze all momentum indicators
 */
export function analyzeMomentum(
  data: PriceData[],
  symbol: string,
  config?: {
    stochastic?: { kPeriod: number; dPeriod: number; overbought: number; oversold: number };
    williamsR?: { period: number; overbought: number; oversold: number };
    adx?: { period: number; strongTrend: number };
  }
): {
  stochastic: StochasticResult[];
  williamsR: WilliamsRResult[];
  adx: ADXResult[];
  signals: TechnicalSignal[];
} {
  const stochasticConfig = config?.stochastic || { kPeriod: 14, dPeriod: 3, overbought: 80, oversold: 20 };
  const williamsRConfig = config?.williamsR || { period: 14, overbought: -20, oversold: -80 };
  const adxConfig = config?.adx || { period: 14, strongTrend: 25 };
  
  const stochastic = calculateStochastic(
    data,
    stochasticConfig.kPeriod,
    stochasticConfig.dPeriod,
    stochasticConfig.overbought,
    stochasticConfig.oversold
  );
  
  const williamsR = calculateWilliamsR(
    data,
    williamsRConfig.period,
    williamsRConfig.overbought,
    williamsRConfig.oversold
  );
  
  const adx = calculateADX(
    data,
    adxConfig.period,
    adxConfig.strongTrend
  );
  
  const signals = generateMomentumSignals(stochastic, williamsR, adx, symbol);
  
  return { stochastic, williamsR, adx, signals };
}