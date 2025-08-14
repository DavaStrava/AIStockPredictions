import { PriceData } from './types';

/**
 * Validate price data array
 */
export function validatePriceData(data: PriceData[]): void {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Price data must be a non-empty array');
  }

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (!item.date || !item.open || !item.high || !item.low || !item.close || !item.volume) {
      throw new Error(`Invalid price data at index ${i}: missing required fields`);
    }
    
    if (item.high < item.low) {
      throw new Error(`Invalid price data at index ${i}: high price cannot be less than low price`);
    }
    
    if (item.open < 0 || item.high < 0 || item.low < 0 || item.close < 0 || item.volume < 0) {
      throw new Error(`Invalid price data at index ${i}: prices and volume cannot be negative`);
    }
  }
}

/**
 * Sort price data by date (ascending)
 */
export function sortPriceData(data: PriceData[]): PriceData[] {
  return [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Calculate Simple Moving Average
 */
export function calculateSMA(values: number[], period: number): number[] {
  if (period <= 0 || period > values.length) {
    throw new Error('Invalid period for SMA calculation');
  }

  const result: number[] = [];
  
  for (let i = period - 1; i < values.length; i++) {
    const sum = values.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0);
    result.push(sum / period);
  }
  
  return result;
}

/**
 * Calculate Exponential Moving Average
 */
export function calculateEMA(values: number[], period: number): number[] {
  if (period <= 0 || period > values.length) {
    throw new Error('Invalid period for EMA calculation');
  }

  const result: number[] = [];
  const multiplier = 2 / (period + 1);
  
  // First EMA value is SMA
  const firstSMA = values.slice(0, period).reduce((acc, val) => acc + val, 0) / period;
  result.push(firstSMA);
  
  // Calculate subsequent EMA values
  for (let i = period; i < values.length; i++) {
    const ema = (values[i] * multiplier) + (result[result.length - 1] * (1 - multiplier));
    result.push(ema);
  }
  
  return result;
}

/**
 * Calculate True Range
 */
export function calculateTrueRange(data: PriceData[]): number[] {
  const result: number[] = [];
  
  for (let i = 1; i < data.length; i++) {
    const current = data[i];
    const previous = data[i - 1];
    
    const tr1 = current.high - current.low;
    const tr2 = Math.abs(current.high - previous.close);
    const tr3 = Math.abs(current.low - previous.close);
    
    result.push(Math.max(tr1, tr2, tr3));
  }
  
  return result;
}

/**
 * Calculate Average True Range
 */
export function calculateATR(data: PriceData[], period: number): number[] {
  const trueRanges = calculateTrueRange(data);
  return calculateSMA(trueRanges, period);
}

/**
 * Calculate standard deviation
 */
export function calculateStandardDeviation(values: number[], period: number): number[] {
  const result: number[] = [];
  
  for (let i = period - 1; i < values.length; i++) {
    const slice = values.slice(i - period + 1, i + 1);
    const mean = slice.reduce((acc, val) => acc + val, 0) / period;
    const variance = slice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period;
    result.push(Math.sqrt(variance));
  }
  
  return result;
}

/**
 * Calculate price changes (returns)
 */
export function calculatePriceChanges(prices: number[]): number[] {
  const changes: number[] = [];
  
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  return changes;
}

/**
 * Calculate gains and losses for RSI
 */
export function calculateGainsAndLosses(prices: number[]): { gains: number[]; losses: number[] } {
  const changes = calculatePriceChanges(prices);
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (const change of changes) {
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  return { gains, losses };
}

/**
 * Find highest high in a period
 */
export function findHighestHigh(data: PriceData[], startIndex: number, period: number): number {
  let highest = data[startIndex].high;
  const endIndex = Math.min(startIndex + period, data.length);
  
  for (let i = startIndex; i < endIndex; i++) {
    if (data[i].high > highest) {
      highest = data[i].high;
    }
  }
  
  return highest;
}

/**
 * Find lowest low in a period
 */
export function findLowestLow(data: PriceData[], startIndex: number, period: number): number {
  let lowest = data[startIndex].low;
  const endIndex = Math.min(startIndex + period, data.length);
  
  for (let i = startIndex; i < endIndex; i++) {
    if (data[i].low < lowest) {
      lowest = data[i].low;
    }
  }
  
  return lowest;
}

/**
 * Detect crossovers between two series
 */
export function detectCrossovers(series1: number[], series2: number[]): ('bullish' | 'bearish' | 'none')[] {
  const result: ('bullish' | 'bearish' | 'none')[] = [];
  
  for (let i = 1; i < Math.min(series1.length, series2.length); i++) {
    const prevDiff = series1[i - 1] - series2[i - 1];
    const currDiff = series1[i] - series2[i];
    
    if (prevDiff <= 0 && currDiff > 0) {
      result.push('bullish'); // series1 crosses above series2
    } else if (prevDiff >= 0 && currDiff < 0) {
      result.push('bearish'); // series1 crosses below series2
    } else {
      result.push('none');
    }
  }
  
  return result;
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Normalize values to 0-1 scale
 */
export function normalizeValues(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  
  if (range === 0) return values.map(() => 0.5);
  
  return values.map(value => (value - min) / range);
}

/**
 * Calculate correlation between two series
 */
export function calculateCorrelation(series1: number[], series2: number[]): number {
  if (series1.length !== series2.length || series1.length === 0) {
    throw new Error('Series must have the same non-zero length');
  }
  
  const n = series1.length;
  const mean1 = series1.reduce((acc, val) => acc + val, 0) / n;
  const mean2 = series2.reduce((acc, val) => acc + val, 0) / n;
  
  let numerator = 0;
  let sum1Sq = 0;
  let sum2Sq = 0;
  
  for (let i = 0; i < n; i++) {
    const diff1 = series1[i] - mean1;
    const diff2 = series2[i] - mean2;
    
    numerator += diff1 * diff2;
    sum1Sq += diff1 * diff1;
    sum2Sq += diff2 * diff2;
  }
  
  const denominator = Math.sqrt(sum1Sq * sum2Sq);
  
  if (denominator === 0) return 0;
  
  return numerator / denominator;
}

/**
 * Generate sample price data for testing
 */
export function generateSamplePriceData(
  symbol: string,
  days: number,
  startPrice: number = 100,
  volatility: number = 0.02
): PriceData[] {
  const data: PriceData[] = [];
  let currentPrice = startPrice;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Generate random price movement
    const change = (Math.random() - 0.5) * 2 * volatility * currentPrice;
    const newPrice = Math.max(currentPrice + change, 0.01); // Ensure positive price
    
    // Generate OHLC data
    const high = newPrice * (1 + Math.random() * 0.02);
    const low = newPrice * (1 - Math.random() * 0.02);
    const open = currentPrice;
    const close = newPrice;
    const volume = Math.floor(Math.random() * 1000000) + 100000;
    
    data.push({
      date,
      open,
      high: Math.max(high, open, close),
      low: Math.min(low, open, close),
      close,
      volume,
    });
    
    currentPrice = newPrice;
  }
  
  return data;
}