import { PriceData, TechnicalSignal, StochasticResult } from '../types';

interface StochasticConfig {
  kPeriod: number;
  dPeriod: number;
  overbought: number;
  oversold: number;
}

export function analyzeStochastic(
  data: PriceData[],
  symbol: string,
  config: StochasticConfig
): {
  results: StochasticResult[];
  signals: TechnicalSignal[];
} {
  const results: StochasticResult[] = [];
  const signals: TechnicalSignal[] = [];
  
  if (data.length < config.kPeriod + config.dPeriod) {
    return { results, signals };
  }
  
  // Calculate %K values first
  const kValues: number[] = [];
  
  for (let i = config.kPeriod - 1; i < data.length; i++) {
    const period = data.slice(i - config.kPeriod + 1, i + 1);
    const highestHigh = Math.max(...period.map(d => d.high));
    const lowestLow = Math.min(...period.map(d => d.low));
    const currentClose = data[i].close;
    
    const kValue = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    kValues.push(kValue);
  }
  
  // Calculate %D values (SMA of %K)
  for (let i = config.dPeriod - 1; i < kValues.length; i++) {
    const kPeriodValues = kValues.slice(i - config.dPeriod + 1, i + 1);
    const dValue = kPeriodValues.reduce((sum, val) => sum + val, 0) / config.dPeriod;
    const kValue = kValues[i];
    
    const dataIndex = i + config.kPeriod - 1;
    const date = data[dataIndex].date;
    
    // Determine conditions
    const overbought = kValue > config.overbought && dValue > config.overbought;
    const oversold = kValue < config.oversold && dValue < config.oversold;
    
    // Determine signal
    let signal: 'buy' | 'sell' | 'hold' = 'hold';
    
    if (i > 0) {
      const prevK = kValues[i - 1];
      const prevDPeriodValues = kValues.slice(i - config.dPeriod, i);
      const prevD = prevDPeriodValues.reduce((sum, val) => sum + val, 0) / config.dPeriod;
      
      // Bullish crossover in oversold territory
      if (kValue > dValue && prevK <= prevD && oversold) {
        signal = 'buy';
        signals.push({
          indicator: 'Stochastic',
          signal: 'buy',
          strength: 0.7,
          value: kValue,
          timestamp: date,
          description: `Stochastic bullish crossover in oversold territory (%K: ${kValue.toFixed(1)}, %D: ${dValue.toFixed(1)})`,
        });
      }
      // Bearish crossover in overbought territory
      else if (kValue < dValue && prevK >= prevD && overbought) {
        signal = 'sell';
        signals.push({
          indicator: 'Stochastic',
          signal: 'sell',
          strength: 0.7,
          value: kValue,
          timestamp: date,
          description: `Stochastic bearish crossover in overbought territory (%K: ${kValue.toFixed(1)}, %D: ${dValue.toFixed(1)})`,
        });
      }
    }
    
    results.push({
      date,
      k: kValue,
      d: dValue,
      signal,
      overbought,
      oversold,
    });
  }
  
  return { results, signals };
}