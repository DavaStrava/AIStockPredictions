/**
 * ChartHelpText Component
 *
 * Displays context-sensitive help text based on the active chart type.
 */
'use client';

import { ChartHelpTextProps } from '@/types/components';

export function ChartHelpText({ activeChart }: ChartHelpTextProps) {
  return (
    <div className="mt-4 text-xs text-gray-500 space-y-1">
      {activeChart === 'price' && (
        <p>Blue line: Close price | Orange dashed: 20-day SMA | Purple dashed: 50-day SMA</p>
      )}
      {activeChart === 'rsi' && (
        <p>RSI above 70 (red zone) indicates overbought, below 30 (green zone) indicates oversold</p>
      )}
      {activeChart === 'macd' && (
        <p>MACD crossover above signal line suggests bullish momentum, below suggests bearish</p>
      )}
      {activeChart === 'bollinger' && (
        <p>Price touching upper band may indicate overbought, touching lower band may indicate oversold</p>
      )}
    </div>
  );
}
