'use client';

/**
 * PerformanceChart Component
 *
 * Line chart showing portfolio equity curve with benchmark comparison.
 * Displays normalized returns vs S&P 500 (SPY) and Nasdaq 100 (QQQ).
 */

import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BenchmarkDataPoint } from '@/types/portfolio';

interface PerformanceChartProps {
  data: BenchmarkDataPoint[];
  loading?: boolean;
  onFetchHistory?: (startDate?: string, endDate?: string) => Promise<void>;
}

type TimeRange = '1M' | '3M' | '6M' | '1Y' | 'ALL';

const TIME_RANGES: { value: TimeRange; label: string; days: number | null }[] = [
  { value: '1M', label: '1M', days: 30 },
  { value: '3M', label: '3M', days: 90 },
  { value: '6M', label: '6M', days: 180 },
  { value: '1Y', label: '1Y', days: 365 },
  { value: 'ALL', label: 'All', days: null },
];

interface ChartLine {
  key: 'portfolioReturn' | 'spyReturn' | 'qqqReturn';
  name: string;
  color: string;
  enabled: boolean;
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
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
                entry.value >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatPercent(entry.value)}
            </span>
          </p>
        ))}
      </div>
    </div>
  );
}

export function PerformanceChart({
  data,
  loading,
  onFetchHistory,
}: PerformanceChartProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1Y');
  const [lines, setLines] = useState<ChartLine[]>([
    { key: 'portfolioReturn', name: 'My Portfolio', color: '#8b5cf6', enabled: true },
    { key: 'spyReturn', name: 'S&P 500', color: '#f59e0b', enabled: true },
    { key: 'qqqReturn', name: 'Nasdaq 100', color: '#06b6d4', enabled: false },
  ]);

  const filteredData = useMemo(() => {
    if (!data.length) return [];

    const range = TIME_RANGES.find((r) => r.value === selectedRange);
    if (!range || range.days === null) return data;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - range.days);

    return data.filter((d) => new Date(d.date) >= cutoffDate);
  }, [data, selectedRange]);

  const handleRangeChange = async (range: TimeRange) => {
    setSelectedRange(range);

    if (onFetchHistory) {
      const rangeConfig = TIME_RANGES.find((r) => r.value === range);
      if (rangeConfig && rangeConfig.days) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - rangeConfig.days);
        await onFetchHistory(startDate.toISOString());
      } else {
        await onFetchHistory();
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

  // Calculate performance summary
  const summary = useMemo(() => {
    if (!filteredData.length) return null;

    const latest = filteredData[filteredData.length - 1];
    const portfolioReturn = latest.portfolioReturn;
    const spyReturn = latest.spyReturn;
    const alpha = portfolioReturn - spyReturn;

    return { portfolioReturn, spyReturn, alpha };
  }, [filteredData]);

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Performance</h3>
          {summary && (
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
                  summary.alpha >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                Alpha: {formatPercent(summary.alpha)}
              </span>
            </div>
          )}
        </div>

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
      </div>

      {/* Line Toggles */}
      <div className="flex items-center gap-4 mb-4">
        {lines.map((line) => (
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
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={filteredData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
              }}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={(value) => `${value.toFixed(0)}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
              }}
            />
            {lines
              .filter((line) => line.enabled)
              .map((line) => (
                <Line
                  key={line.key}
                  type="monotone"
                  dataKey={line.key}
                  name={line.name}
                  stroke={line.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              ))}
            {/* Zero line */}
            <Line
              type="monotone"
              dataKey={() => 0}
              stroke="#475569"
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
              name=""
              legendType="none"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default PerformanceChart;


