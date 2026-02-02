/**
 * StockChart Component
 *
 * Area chart displaying stock price history with time period selectors.
 * Uses Recharts with gradient fill and follows the slate/indigo theme.
 */

'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { StockChartProps, TimeRangeConfig } from '@/types/stock';

const TIME_RANGES: TimeRangeConfig[] = [
  { value: '1D', label: '1D', apiPeriod: '1day' },
  { value: '5D', label: '5D', apiPeriod: '5day' },
  { value: '1M', label: '1M', apiPeriod: '1month' },
  { value: '6M', label: '6M', apiPeriod: '6month' },
  { value: 'YTD', label: 'YTD', apiPeriod: '1year' },
  { value: '1Y', label: '1Y', apiPeriod: '1year' },
  { value: '5Y', label: '5Y', apiPeriod: '5year' },
  { value: 'MAX', label: 'MAX', apiPeriod: null },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      date: string;
      price: number;
    };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const date = new Date(data.date);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-slate-400 text-sm mb-1">{formattedDate}</p>
      <p className="text-slate-100 font-semibold text-lg">
        {formatCurrency(data.price)}
      </p>
    </div>
  );
}

export function StockChart({
  priceHistory,
  selectedRange,
  onRangeChange,
  loading,
}: StockChartProps) {
  // Calculate price change for color coding
  const priceChange = useMemo(() => {
    if (priceHistory.length < 2) return 0;
    const first = priceHistory[0].price;
    const last = priceHistory[priceHistory.length - 1].price;
    return last - first;
  }, [priceHistory]);

  const isPositive = priceChange >= 0;
  const gradientColor = isPositive ? '#10b981' : '#f43f5e';
  const strokeColor = isPositive ? '#10b981' : '#f43f5e';

  // Calculate Y-axis domain with padding
  const yDomain = useMemo(() => {
    if (priceHistory.length === 0) return [0, 100];
    const prices = priceHistory.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1;
    return [min - padding, max + padding];
  }, [priceHistory]);

  // Format X-axis labels based on time range
  const formatXAxis = (date: string) => {
    const d = new Date(date);
    switch (selectedRange) {
      case '1D':
      case '5D':
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case '1M':
      case '6M':
      case 'YTD':
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case '1Y':
      case '5Y':
      case 'MAX':
      default:
        return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
        <div className="animate-pulse">
          <div className="flex justify-between items-center mb-6">
            <div className="h-6 w-24 bg-slate-700 rounded" />
            <div className="flex gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-8 w-10 bg-slate-700 rounded-md" />
              ))}
            </div>
          </div>
          <div className="h-80 bg-slate-700 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h3 className="text-lg font-semibold text-slate-100">Price History</h3>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1 bg-slate-900/50 rounded-lg p-1">
          {TIME_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => onRangeChange(range.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                selectedRange === range.value
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {priceHistory.length === 0 ? (
        <div className="h-80 flex items-center justify-center text-slate-400">
          No price data available for this period.
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={priceHistory}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={gradientColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={gradientColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={formatXAxis}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
                domain={yDomain}
                tickLine={false}
                axisLine={false}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke={strokeColor}
                strokeWidth={2}
                fill="url(#priceGradient)"
                dot={false}
                activeDot={{
                  r: 4,
                  fill: strokeColor,
                  stroke: '#1e293b',
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default StockChart;
