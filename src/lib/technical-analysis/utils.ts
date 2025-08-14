import { PriceData } from './types';

/**
 * Validates price data array to ensure data integrity and consistency
 * 
 * This function performs comprehensive validation of OHLCV (Open, High, Low, Close, Volume) data
 * to prevent calculation errors in technical indicators. It checks for:
 * - Array existence and non-empty state
 * - Required fields presence (date, OHLCV)
 * - Logical price relationships (high >= low)
 * - Non-negative values for prices and volume
 * 
 * @param data - Array of price data points to validate
 * @throws {Error} When validation fails with descriptive error message
 * 
 * @example
 * ```typescript
 * const priceData = [
 *   { date: new Date(), open: 100, high: 105, low: 98, close: 103, volume: 1000000 }
 * ];
 * validatePriceData(priceData); // Passes validation
 * ```
 */
export function validatePriceData(data: PriceData[]): void {
  // Check if data exists and is a non-empty array
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Price data must be a non-empty array');
  }

  // Validate each data point for completeness and logical consistency
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    
    // Check for required fields - all OHLCV data must be present
    if (!item.date || !item.open || !item.high || !item.low || !item.close || !item.volume) {
      throw new Error(`Invalid price data at index ${i}: missing required fields`);
    }
    
    // Validate price relationships - high must be >= low (basic market logic)
    if (item.high < item.low) {
      throw new Error(`Invalid price data at index ${i}: high price cannot be less than low price`);
    }
    
    // Ensure all prices and volume are non-negative (no negative prices in real markets)
    if (item.open < 0 || item.high < 0 || item.low < 0 || item.close < 0 || item.volume < 0) {
      throw new Error(`Invalid price data at index ${i}: prices and volume cannot be negative`);
    }
  }
}

/**
 * Sorts price data by date in ascending order (oldest to newest)
 * 
 * Technical analysis requires chronologically ordered data for accurate calculations.
 * This function creates a new sorted array without modifying the original data.
 * 
 * @param data - Array of price data to sort
 * @returns New array sorted by date (ascending)
 * 
 * @example
 * ```typescript
 * const unsortedData = [
 *   { date: new Date('2024-01-02'), close: 100, ... },
 *   { date: new Date('2024-01-01'), close: 99, ... }
 * ];
 * const sorted = sortPriceData(unsortedData); // Oldest first
 * ```
 */
export function sortPriceData(data: PriceData[]): PriceData[] {
  // Create a shallow copy to avoid mutating the original array
  // Sort by timestamp (getTime() returns milliseconds since epoch)
  return [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Calculates Simple Moving Average (SMA) for a series of values
 * 
 * SMA is the arithmetic mean of values over a specified period. It's used to smooth
 * out price fluctuations and identify trend direction. Each point represents the
 * average of the last N periods.
 * 
 * Formula: SMA = (Sum of N periods) / N
 * 
 * @param values - Array of numerical values (typically closing prices)
 * @param period - Number of periods to average (must be > 0 and <= values.length)
 * @returns Array of SMA values (length = values.length - period + 1)
 * 
 * @throws {Error} When period is invalid
 * 
 * @example
 * ```typescript
 * const prices = [10, 12, 14, 16, 18];
 * const sma3 = calculateSMA(prices, 3); // [12, 14, 16] (3-period SMA)
 * ```
 */
export function calculateSMA(values: number[], period: number): number[] {
  // Validate period parameter
  if (period <= 0 || period > values.length) {
    throw new Error('Invalid period for SMA calculation');
  }

  const result: number[] = [];
  
  // Calculate SMA for each possible window
  // Start from index (period - 1) to have enough data for the first calculation
  for (let i = period - 1; i < values.length; i++) {
    // Extract the window of values for this period
    // slice(start, end) where end is exclusive
    const window = values.slice(i - period + 1, i + 1);
    
    // Calculate the sum of values in the window
    const sum = window.reduce((acc, val) => acc + val, 0);
    
    // Add the average to results
    result.push(sum / period);
  }
  
  return result;
}

/**
 * Calculates Exponential Moving Average (EMA) for a series of values
 * 
 * EMA gives more weight to recent prices, making it more responsive to new information
 * than SMA. It uses a smoothing factor (alpha) to determine how much weight to give
 * to the most recent price versus the previous EMA value.
 * 
 * Formula: 
 * - Multiplier = 2 / (period + 1)
 * - EMA[today] = (Price[today] × Multiplier) + (EMA[yesterday] × (1 - Multiplier))
 * - First EMA = SMA of first N periods
 * 
 * @param values - Array of numerical values (typically closing prices)
 * @param period - Number of periods for EMA calculation
 * @returns Array of EMA values (length = values.length - period + 1)
 * 
 * @throws {Error} When period is invalid
 * 
 * @example
 * ```typescript
 * const prices = [10, 12, 14, 16, 18, 20];
 * const ema3 = calculateEMA(prices, 3); // More weight on recent prices
 * ```
 */
export function calculateEMA(values: number[], period: number): number[] {
  // Validate input parameters
  if (period <= 0 || period > values.length) {
    throw new Error('Invalid period for EMA calculation');
  }

  const result: number[] = [];
  
  // Calculate the smoothing multiplier (alpha)
  // Higher periods = lower multiplier = more smoothing
  const multiplier = 2 / (period + 1);
  
  // Initialize EMA with SMA of the first 'period' values
  // This provides a stable starting point for the exponential calculation
  const firstSMA = values.slice(0, period).reduce((acc, val) => acc + val, 0) / period;
  result.push(firstSMA);
  
  // Calculate subsequent EMA values using the exponential formula
  for (let i = period; i < values.length; i++) {
    // EMA = (Current Price × Multiplier) + (Previous EMA × (1 - Multiplier))
    // This gives more weight to recent prices while maintaining historical context
    const currentPrice = values[i];
    const previousEMA = result[result.length - 1];
    const ema = (currentPrice * multiplier) + (previousEMA * (1 - multiplier));
    
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