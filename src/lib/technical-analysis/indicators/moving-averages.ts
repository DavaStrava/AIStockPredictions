import { PriceData, MovingAverageResult, TechnicalSignal } from '../types';
import { validatePriceData, calculateSMA, calculateEMA, detectCrossovers } from '../utils';

/**
 * Calculate Simple Moving Average with signals
 */
export function calculateSMAWithSignals(
  data: PriceData[],
  period: number
): MovingAverageResult[] {
  validatePriceData(data);
  
  const closePrices = data.map(d => d.close);
  const smaValues = calculateSMA(closePrices, period);
  
  const results: MovingAverageResult[] = [];
  
  for (let i = 0; i < smaValues.length; i++) {
    const dataIndex = i + period - 1;
    const currentPrice = closePrices[dataIndex];
    const smaValue = smaValues[i];
    
    // Determine signal based on price vs SMA
    let signal: 'buy' | 'sell' | 'hold' = 'hold';
    let strength = 0.5;
    
    const priceVsSMA = (currentPrice - smaValue) / smaValue;
    
    if (priceVsSMA > 0.02) { // Price 2% above SMA
      signal = 'buy';
      strength = Math.min(0.8, 0.5 + Math.abs(priceVsSMA) * 5);
    } else if (priceVsSMA < -0.02) { // Price 2% below SMA
      signal = 'sell';
      strength = Math.min(0.8, 0.5 + Math.abs(priceVsSMA) * 5);
    }
    
    results.push({
      date: data[dataIndex].date,
      value: smaValue,
      signal,
      strength,
      type: 'SMA',
      period,
    });
  }
  
  return results;
}/*
*
 * Calculate Exponential Moving Average with signals
 */
export function calculateEMAWithSignals(
  data: PriceData[],
  period: number
): MovingAverageResult[] {
  validatePriceData(data);
  
  const closePrices = data.map(d => d.close);
  const emaValues = calculateEMA(closePrices, period);
  
  const results: MovingAverageResult[] = [];
  
  for (let i = 0; i < emaValues.length; i++) {
    const dataIndex = i + period - 1;
    const currentPrice = closePrices[dataIndex];
    const emaValue = emaValues[i];
    
    // Determine signal based on price vs EMA
    let signal: 'buy' | 'sell' | 'hold' = 'hold';
    let strength = 0.5;
    
    const priceVsEMA = (currentPrice - emaValue) / emaValue;
    
    if (priceVsEMA > 0.015) { // Price 1.5% above EMA (more sensitive than SMA)
      signal = 'buy';
      strength = Math.min(0.8, 0.5 + Math.abs(priceVsEMA) * 6);
    } else if (priceVsEMA < -0.015) { // Price 1.5% below EMA
      signal = 'sell';
      strength = Math.min(0.8, 0.5 + Math.abs(priceVsEMA) * 6);
    }
    
    results.push({
      date: data[dataIndex].date,
      value: emaValue,
      signal,
      strength,
      type: 'EMA',
      period,
    });
  }
  
  return results;
}

/**
 * Detect moving average crossovers
 */
export function detectMovingAverageCrossovers(
  fastMA: MovingAverageResult[],
  slowMA: MovingAverageResult[]
): TechnicalSignal[] {
  const signals: TechnicalSignal[] = [];
  
  if (fastMA.length !== slowMA.length) {
    throw new Error('Moving average arrays must have the same length');
  }
  
  const fastValues = fastMA.map(ma => ma.value);
  const slowValues = slowMA.map(ma => ma.value);
  const crossovers = detectCrossovers(fastValues, slowValues);
  
  for (let i = 0; i < crossovers.length; i++) {
    const crossover = crossovers[i];
    
    if (crossover !== 'none') {
      const signal = crossover === 'bullish' ? 'buy' : 'sell';
      const strength = calculateCrossoverStrength(fastMA[i + 1], slowMA[i + 1]);
      
      signals.push({
        indicator: `MA Crossover (${fastMA[0].period}/${slowMA[0].period})`,
        signal,
        strength,
        value: fastMA[i + 1].value,
        timestamp: fastMA[i + 1].date,
        description: `${fastMA[0].type}${fastMA[0].period} crossed ${crossover === 'bullish' ? 'above' : 'below'} ${slowMA[0].type}${slowMA[0].period} - ${crossover} signal`,
      });
    }
  }
  
  return signals;
}

/**
 * Calculate crossover signal strength
 */
function calculateCrossoverStrength(
  fastMA: MovingAverageResult,
  slowMA: MovingAverageResult
): number {
  const separation = Math.abs(fastMA.value - slowMA.value) / slowMA.value;
  
  // Base strength
  let strength = 0.7;
  
  // Increase strength based on separation
  strength += Math.min(0.2, separation * 10);
  
  // Increase strength if both MAs are trending in the same direction
  if ((fastMA.signal === 'buy' && slowMA.signal === 'buy') ||
      (fastMA.signal === 'sell' && slowMA.signal === 'sell')) {
    strength += 0.1;
  }
  
  return Math.min(1, strength);
}

/**
 * Analyze multiple moving averages and generate comprehensive signals
 */
export function analyzeMovingAverages(
  data: PriceData[],
  symbol: string,
  config?: {
    periods?: number[];
    includeEMA?: boolean;
    detectCrossovers?: boolean;
  }
): {
  sma: MovingAverageResult[][];
  ema?: MovingAverageResult[][];
  signals: TechnicalSignal[];
} {
  const {
    periods = [20, 50, 200],
    includeEMA = true,
    detectCrossovers = true,
  } = config || {};
  
  const smaResults: MovingAverageResult[][] = [];
  const emaResults: MovingAverageResult[][] = [];
  const signals: TechnicalSignal[] = [];
  
  // Calculate SMAs
  for (const period of periods) {
    if (data.length >= period) {
      const sma = calculateSMAWithSignals(data, period);
      smaResults.push(sma);
      
      // Add individual SMA signals
      const smaSignals = sma
        .filter(result => result.signal !== 'hold')
        .map(result => ({
          indicator: `SMA${period}`,
          signal: result.signal!,
          strength: result.strength!,
          value: result.value,
          timestamp: result.date,
          description: `Price ${result.signal === 'buy' ? 'above' : 'below'} SMA${period} (${result.value.toFixed(2)})`,
        }));
      
      signals.push(...smaSignals);
    }
  }
  
  // Calculate EMAs
  if (includeEMA) {
    for (const period of periods) {
      if (data.length >= period) {
        const ema = calculateEMAWithSignals(data, period);
        emaResults.push(ema);
        
        // Add individual EMA signals
        const emaSignals = ema
          .filter(result => result.signal !== 'hold')
          .map(result => ({
            indicator: `EMA${period}`,
            signal: result.signal!,
            strength: result.strength!,
            value: result.value,
            timestamp: result.date,
            description: `Price ${result.signal === 'buy' ? 'above' : 'below'} EMA${period} (${result.value.toFixed(2)})`,
          }));
        
        signals.push(...emaSignals);
      }
    }
  }
  
  // Detect crossovers between different periods
  if (detectCrossovers && smaResults.length >= 2) {
    for (let i = 0; i < smaResults.length - 1; i++) {
      for (let j = i + 1; j < smaResults.length; j++) {
        const crossoverSignals = detectMovingAverageCrossovers(smaResults[i], smaResults[j]);
        signals.push(...crossoverSignals);
      }
    }
    
    // EMA crossovers
    if (includeEMA && emaResults.length >= 2) {
      for (let i = 0; i < emaResults.length - 1; i++) {
        for (let j = i + 1; j < emaResults.length; j++) {
          const crossoverSignals = detectMovingAverageCrossovers(emaResults[i], emaResults[j]);
          signals.push(...crossoverSignals);
        }
      }
    }
  }
  
  return {
    sma: smaResults,
    ema: includeEMA ? emaResults : undefined,
    signals,
  };
}