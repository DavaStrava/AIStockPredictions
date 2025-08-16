import { PriceData, TechnicalSignal, WilliamsRResult } from '../types';

interface WilliamsRConfig {
  period: number;
  overbought: number; // typically -20
  oversold: number;   // typically -80
}

export function analyzeWilliamsR(
  data: PriceData[],
  symbol: string,
  config: WilliamsRConfig
): {
  results: WilliamsRResult[];
  signals: TechnicalSignal[];
} {
  const results: WilliamsRResult[] = [];
  const signals: TechnicalSignal[] = [];
  
  if (data.length < config.period) {
    return { results, signals };
  }
  
  for (let i = config.period - 1; i < data.length; i++) {
    const period = data.slice(i - config.period + 1, i + 1);
    const highestHigh = Math.max(...period.map(d => d.high));
    const lowestLow = Math.min(...period.map(d => d.low));
    const currentClose = data[i].close;
    
    // Williams %R formula: ((Highest High - Close) / (Highest High - Lowest Low)) * -100
    const williamsR = ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
    
    const date = data[i].date;
    const overbought = williamsR > config.overbought;
    const oversold = williamsR < config.oversold;
    
    // Generate signals
    if (i > config.period) {
      const prevResult = results[results.length - 1];
      
      // Bullish signal: Williams %R moves above oversold level
      if (williamsR > config.oversold && prevResult.value <= config.oversold) {
        signals.push({
          indicator: 'Williams %R',
          signal: 'buy',
          strength: 0.6,
          value: williamsR,
          timestamp: date,
          description: `Williams %R bullish reversal from oversold (${williamsR.toFixed(1)})`,
        });
      }
      // Bearish signal: Williams %R moves below overbought level
      else if (williamsR < config.overbought && prevResult.value >= config.overbought) {
        signals.push({
          indicator: 'Williams %R',
          signal: 'sell',
          strength: 0.6,
          value: williamsR,
          timestamp: date,
          description: `Williams %R bearish reversal from overbought (${williamsR.toFixed(1)})`,
        });
      }
    }
    
    results.push({
      date,
      value: williamsR,
      overbought,
      oversold,
    });
  }
  
  return { results, signals };
}