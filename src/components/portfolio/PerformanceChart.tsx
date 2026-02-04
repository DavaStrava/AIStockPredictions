'use client';

/**
 * PerformanceChart Component
 *
 * Line chart showing portfolio equity curve with benchmark comparison.
 * Displays normalized returns vs S&P 500 (SPY) and Nasdaq 100 (QQQ).
 * Supports time period selection, data aggregation, and percent/absolute display.
 */

import { useState, useMemo, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { BenchmarkDataPoint } from '@/types/portfolio';
import { formatPercent, formatCurrency } from '@/lib/formatters';

// --- Types ---

interface PerformanceChartProps {
  data: BenchmarkDataPoint[];
  loading?: boolean;
  onFetchHistory?: (startDate?: string, endDate?: string) => Promise<void>;
}

export type TimeRange = '1M' | '3M' | '6M' | 'YTD' | '1Y' | 'ALL';
export type Aggregation = 'daily' | 'weekly' | 'monthly';
export type DisplayMode = 'percent' | 'absolute';

export const TIME_RANGES: { value: TimeRange; label: string; days: number | null }[] = [
  { value: '1M', label: '1M', days: 30 },
  { value: '3M', label: '3M', days: 90 },
  { value: '6M', label: '6M', days: 180 },
  { value: 'YTD', label: 'YTD', days: null },
  { value: '1Y', label: '1Y', days: 365 },
  { value: 'ALL', label: 'All', days: null },
];

interface ChartLine {
  key: 'portfolioReturn' | 'spyReturn' | 'qqqReturn' | 'portfolioValue';
  name: string;
  color: string;
  enabled: boolean;
}

// --- Aggregation helpers (exported for testing) ---

export function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getUTCFullYear();
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const dayOfYear = Math.floor((d.getTime() - jan1.getTime()) / 86400000) + 1;
  const weekNum = Math.ceil(dayOfYear / 7);
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

export function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function aggregateData(
  data: BenchmarkDataPoint[],
  aggregation: Aggregation
): BenchmarkDataPoint[] {
  if (aggregation === 'daily' || data.length === 0) return data;

  const keyFn = aggregation === 'weekly' ? getWeekKey : getMonthKey;
  const groups = new Map<string, BenchmarkDataPoint>();

  for (const point of data) {
    const key = keyFn(point.date);
    groups.set(key, point); // last point per group (data is sorted ascending)
  }

  return Array.from(groups.values());
}

// --- Compact currency formatter for Y-axis ---

function formatCompactCurrency(value: number): string {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}k`;
  return `${sign}$${abs.toFixed(0)}`;
}

// --- Custom Tooltip ---

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
  displayMode: DisplayMode;
}

function CustomTooltip({ active, payload, label, displayMode }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 shadow-xl">
      <p className="text-slate-400 text-sm mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <p key={index} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-300">{entry.name}:</span>
            <span
              className={`font-semibold ${
                displayMode === 'absolute'
                  ? 'text-slate-100'
                  : entry.value >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
              }`}
            >
              {displayMode === 'absolute'
                ? formatCurrency(entry.value)
                : formatPercent(entry.value)}
            </span>
          </p>
        ))}
      </div>
    </div>
  );
}

// --- Main Component ---

export function PerformanceChart({
  data,
  loading,
  onFetchHistory,
}: PerformanceChartProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1Y');
  const [aggregation, setAggregation] = useState<Aggregation>('daily');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('percent');
  const [lines, setLines] = useState<ChartLine[]>([
    { key: 'portfolioReturn', name: 'My Portfolio', color: '#8b5cf6', enabled: true },
    { key: 'spyReturn', name: 'S&P 500', color: '#f59e0b', enabled: true },
    { key: 'qqqReturn', name: 'Nasdaq 100', color: '#06b6d4', enabled: true },
  ]);

  // Filter data by selected time range
  const filteredData = useMemo(() => {
    if (!data.length) return [];

    if (selectedRange === 'YTD') {
      const yearStart = new Date(new Date().getFullYear(), 0, 1);
      return data.filter((d) => new Date(d.date) >= yearStart);
    }

    const range = TIME_RANGES.find((r) => r.value === selectedRange);
    if (!range || range.days === null) return data;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - range.days);

    return data.filter((d) => new Date(d.date) >= cutoffDate);
  }, [data, selectedRange]);

  // Aggregate filtered data
  const chartData = useMemo(
    () => aggregateData(filteredData, aggregation),
    [filteredData, aggregation]
  );

  // Determine which lines to render based on display mode
  const effectiveLines = useMemo(() => {
    if (displayMode === 'absolute') {
      return [
        { key: 'portfolioValue' as const, name: 'Portfolio Value', color: '#8b5cf6', enabled: true },
      ];
    }
    return lines;
  }, [displayMode, lines]);

  const handleRangeChange = async (range: TimeRange) => {
    setSelectedRange(range);

    if (onFetchHistory) {
      if (range === 'YTD') {
        const yearStart = new Date(new Date().getFullYear(), 0, 1);
        await onFetchHistory(yearStart.toISOString());
      } else {
        const rangeConfig = TIME_RANGES.find((r) => r.value === range);
        if (rangeConfig && rangeConfig.days) {
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - rangeConfig.days);
          await onFetchHistory(startDate.toISOString());
        } else {
          await onFetchHistory();
        }
      }
    }
  };

  const toggleLine = (key: ChartLine['key']) => {
    setLines((prev) =>
      prev.map((line) =>
        line.key === key ? { ...line, enabled: !line.enabled } : line
      )
    );
  };

  // Calculate performance summary from aggregated chart data
  const summary = useMemo(() => {
    if (!chartData.length) return null;

    const latest = chartData[chartData.length - 1];
    const portfolioReturn = latest.portfolioReturn;
    const spyReturn = latest.spyReturn;
    const qqqReturn = latest.qqqReturn;
    const spyAlpha = portfolioReturn - spyReturn;
    const qqqAlpha = portfolioReturn - qqqReturn;

    return { portfolioReturn, spyReturn, qqqReturn, spyAlpha, qqqAlpha };
  }, [chartData]);

  // X-axis date formatter adapts to aggregation
  const xAxisFormatter = useCallback((value: string) => {
    const date = new Date(value);
    if (aggregation === 'monthly') {
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, [aggregation]);

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
        <div className="animate-pulse">
          <div className="h-6 w-48 bg-slate-700 rounded mb-4" />
          <div className="h-80 bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8 text-center">
        <p className="text-slate-400">
          No performance history yet. Data will appear after daily snapshots are recorded.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
      {/* Row 1: Title + summary | Time range + Aggregation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Performance</h3>
          {summary && displayMode === 'percent' && (
            <div className="flex items-center gap-4 mt-1">
              <span
                className={`text-sm ${
                  summary.portfolioReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                Portfolio: {formatPercent(summary.portfolioReturn)}
              </span>
              <span
                className={`text-sm ${
                  summary.spyAlpha >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                Alpha: {formatPercent(summary.spyAlpha)}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-slate-900/50 rounded-lg p-1">
            {TIME_RANGES.map((range) => (
              <button
                key={range.value}
                onClick={() => handleRangeChange(range.value)}
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

          {/* Divider */}
          <div className="w-px h-6 bg-slate-700" />

          {/* Aggregation Selector */}
          <div className="flex items-center gap-1 bg-slate-900/50 rounded-lg p-1">
            {(['daily', 'weekly', 'monthly'] as Aggregation[]).map((agg) => (
              <button
                key={agg}
                onClick={() => setAggregation(agg)}
                className={`px-2.5 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  aggregation === agg
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {agg[0].toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Display mode toggle | Line toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        {/* Display Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-900/50 rounded-lg p-1">
          <button
            onClick={() => setDisplayMode('percent')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              displayMode === 'percent'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            %
          </button>
          <button
            onClick={() => setDisplayMode('absolute')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              displayMode === 'absolute'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            $
          </button>
        </div>

        {/* Line Toggles - hidden in absolute mode since benchmarks aren't comparable */}
        {displayMode === 'percent' && (
          <div className="flex items-center gap-3 flex-wrap">
            {lines.map((line) => {
              const isBenchmark = line.key === 'spyReturn' || line.key === 'qqqReturn';
              const alpha =
                line.key === 'spyReturn'
                  ? summary?.spyAlpha
                  : line.key === 'qqqReturn'
                    ? summary?.qqqAlpha
                    : undefined;

              return (
                <button
                  key={line.key}
                  onClick={() => toggleLine(line.key)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                    line.enabled
                      ? 'bg-slate-700/50 text-slate-100'
                      : 'bg-slate-800/50 text-slate-500'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: line.enabled ? line.color : '#475569',
                    }}
                  />
                  <span className="text-sm">{line.name}</span>
                  {isBenchmark && line.enabled && alpha !== undefined && (
                    <span
                      className={`text-xs font-medium ${
                        alpha >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatPercent(alpha)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={xAxisFormatter}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={
                displayMode === 'absolute'
                  ? formatCompactCurrency
                  : (value: number) => `${value.toFixed(0)}%`
              }
            />
            <Tooltip content={<CustomTooltip displayMode={displayMode} />} />
            {effectiveLines
              .filter((line) => line.enabled)
              .map((line) => {
                const isPortfolio =
                  line.key === 'portfolioReturn' || line.key === 'portfolioValue';
                return (
                  <Line
                    key={line.key}
                    type="monotone"
                    dataKey={line.key}
                    name={line.name}
                    stroke={line.color}
                    strokeWidth={isPortfolio ? 3 : 1.5}
                    strokeDasharray={isPortfolio ? undefined : '6 3'}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                );
              })}
            {/* Zero reference line in percent mode */}
            {displayMode === 'percent' && (
              <ReferenceLine y={0} stroke="#475569" strokeDasharray="4 4" />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default PerformanceChart;
