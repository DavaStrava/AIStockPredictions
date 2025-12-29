'use client';

import { PriceData, TechnicalAnalysisResult } from '@/lib/technical-analysis/types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

/**
 * Props interface for SimpleStockChart component
 * Matches the expected props from StockDashboard for seamless integration
 */
interface SimpleStockChartProps {
  symbol: string;
  priceData: PriceData[];
  analysis?: TechnicalAnalysisResult;
}

/**
 * Internal chart data structure for Recharts
 */
interface ChartDataPoint {
  date: string;
  close: number;
}

/**
 * Formats volume with appropriate magnitude suffix (B/M/K)
 * @param volume - Raw volume number
 * @returns Formatted string with magnitude suffix
 */
export function formatVolume(volume: number): string {
  if (volume >= 1_000_000_000) return `${(volume / 1_000_000_000).toFixed(1)}B`;
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(1)}K`;
  return volume.toString();
}

/**
 * SimpleStockChart Component
 * 
 * A lightweight price chart component for the "Quick Price Overview" section.
 * Displays an area chart with key metrics (price, change, high/low, volume).
 * 
 * Features:
 * - Graceful handling of null/undefined/empty data
 * - Responsive chart that adapts to container width
 * - Dark mode support via Tailwind CSS
 * - Key metrics with conditional color styling
 */
export default function SimpleStockChart({
  symbol,
  priceData,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  analysis,
}: SimpleStockChartProps) {
  // Null-safe data access with fallback to empty array
  const safeData = priceData || [];

  // Guard clause for empty symbol
  if (!symbol || symbol.trim() === '') {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        Select a stock to view price overview
      </div>
    );
  }

  // Guard clause for empty priceData
  if (safeData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No price data available
      </div>
    );
  }

  // Calculate key metrics
  const currentData = safeData[safeData.length - 1];
  const firstData = safeData[0];

  const currentPrice = currentData.close;
  const priceChange = currentPrice - firstData.close;
  const priceChangePercent = ((priceChange) / firstData.close) * 100;
  const dailyHigh = currentData.high;
  const dailyLow = currentData.low;
  const volume = currentData.volume;

  // Determine color classes based on price change
  const isPositive = priceChange >= 0;
  const changeColorClass = isPositive
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400';

  // Transform priceData to chart data format
  const chartData: ChartDataPoint[] = safeData.map((data) => ({
    date: data.date.toLocaleDateString(),
    close: data.close,
  }));

  return (
    <div className="space-y-4">
      {/* Key Metrics Header */}
      <div className="flex flex-wrap items-baseline gap-4">
        {/* Current Price */}
        <div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            ${currentPrice.toFixed(2)}
          </span>
          <span className={`ml-2 text-sm font-medium ${changeColorClass}`}>
            {isPositive ? '+' : ''}${priceChange.toFixed(2)} ({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%)
          </span>
        </div>

        {/* High/Low/Volume */}
        <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>H: ${dailyHigh.toFixed(2)}</span>
          <span>L: ${dailyLow.toFixed(2)}</span>
          <span>Vol: {formatVolume(volume)}</span>
        </div>
      </div>

      {/* Area Chart */}
      <div className="h-64 min-h-[256px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              className="text-gray-500 dark:text-gray-400"
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
              className="text-gray-500 dark:text-gray-400"
            />
            <Tooltip
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{
                backgroundColor: 'var(--tooltip-bg, #fff)',
                border: '1px solid var(--tooltip-border, #e5e7eb)',
                borderRadius: '8px',
              }}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.2}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
