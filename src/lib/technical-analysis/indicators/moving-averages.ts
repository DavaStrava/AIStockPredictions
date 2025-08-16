import { PriceData, MovingAverageResult, TechnicalSignal } from '../types';

export function analyzeMovingAverages(
  data: PriceData[],
  symbol: string,
  config: { periods: number[]; includeEMA?: boolean; detectCrossovers?: boolean }
) {
  const sma: MovingAverageResult[][] = [];
  const ema: MovingAverageResult[][] = [];
  const signals: TechnicalSignal[] = [];

  for (const period of config.periods) {
    const smaResults: MovingAverageResult[] = [];
    const emaResults: MovingAverageResult[] = [];

    for (let i = period - 1; i < data.length; i++) {
      // SMA calculation
      const smaSum = data.slice(i - period + 1, i + 1).reduce((sum, d) => sum + d.close, 0);
      const smaValue = smaSum / period;
      
      smaResults.push({
        date: data[i].date,
        value: smaValue,
        type: 'SMA',
        period,
      });

      // EMA calculation
      if (config.includeEMA) {
        const multiplier = 2 / (period + 1);
        let emaValue: number;
        
        if (i === period - 1) {
          emaValue = smaValue; // First EMA value is SMA
        } else {
          const prevEMA = emaResults[emaResults.length - 1]?.value || smaValue;
          emaValue = (data[i].close * multiplier) + (prevEMA * (1 - multiplier));
        }
        
        emaResults.push({
          date: data[i].date,
          value: emaValue,
          type: 'EMA',
          period,
        });
      }
    }

    sma.push(smaResults);
    if (config.includeEMA) {
      ema.push(emaResults);
    }
  }

  return { sma, ema, signals };
}