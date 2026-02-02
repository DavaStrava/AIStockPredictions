/**
 * StockMetricsSidebar Component
 *
 * Displays key stock metrics including:
 * - 52-Week Range with visual bar
 * - Day's Range with visual bar
 * - Key metrics (Previous Close, Open, P/E, Market Cap, etc.)
 */

'use client';

import type { StockMetricsSidebarProps } from '@/types/stock';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatLargeNumber(value: number): string {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  }
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  }
  if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  }
  return formatCurrency(value);
}

function formatVolume(value: number): string {
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`;
  }
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`;
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`;
  }
  return value.toLocaleString();
}

interface RangeBarProps {
  label: string;
  low: number;
  high: number;
  current: number;
}

function RangeBar({ label, low, high, current }: RangeBarProps) {
  // Calculate position percentage (clamped between 0 and 100)
  const range = high - low;
  const position = range > 0 ? Math.max(0, Math.min(100, ((current - low) / range) * 100)) : 50;

  return (
    <div className="mb-6">
      <p className="text-sm text-slate-400 mb-2">{label}</p>
      <div className="relative">
        {/* Range bar */}
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500"
            style={{ width: '100%' }}
          />
        </div>
        {/* Marker */}
        <div
          className="absolute top-0 w-1 h-2 bg-white rounded-full shadow-lg transform -translate-x-1/2"
          style={{ left: `${position}%` }}
        />
      </div>
      {/* Labels */}
      <div className="flex justify-between mt-1.5">
        <span className="text-xs text-slate-500">{formatCurrency(low)}</span>
        <span className="text-xs text-slate-400 font-medium">{formatCurrency(current)}</span>
        <span className="text-xs text-slate-500">{formatCurrency(high)}</span>
      </div>
    </div>
  );
}

interface MetricRowProps {
  label: string;
  value: string | number | null;
}

function MetricRow({ label, value }: MetricRowProps) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-slate-700/50 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm text-slate-100 font-medium">
        {value !== null && value !== undefined ? value : '—'}
      </span>
    </div>
  );
}

export function StockMetricsSidebar({ quote }: StockMetricsSidebarProps) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
      <h3 className="text-lg font-semibold text-slate-100 mb-6">Key Statistics</h3>

      {/* 52-Week Range */}
      <RangeBar
        label="52-Week Range"
        low={quote.yearLow}
        high={quote.yearHigh}
        current={quote.price}
      />

      {/* Day's Range */}
      <RangeBar
        label="Day's Range"
        low={quote.dayLow}
        high={quote.dayHigh}
        current={quote.price}
      />

      {/* Key Metrics */}
      <div>
        <MetricRow label="Previous Close" value={formatCurrency(quote.previousClose)} />
        <MetricRow label="Open" value={formatCurrency(quote.open)} />
        <MetricRow
          label="P/E Ratio"
          value={quote.pe ? quote.pe.toFixed(2) : null}
        />
        <MetricRow label="Market Cap" value={formatLargeNumber(quote.marketCap)} />
        <MetricRow label="Volume" value={formatVolume(quote.volume)} />
        <MetricRow label="Avg Volume" value={formatVolume(quote.avgVolume)} />
        <MetricRow
          label="EPS"
          value={quote.eps ? formatCurrency(quote.eps) : null}
        />
        <MetricRow
          label="Dividend Yield"
          value={quote.dividendYield ? `${quote.dividendYield.toFixed(2)}%` : null}
        />
      </div>
    </div>
  );
}

export default StockMetricsSidebar;
