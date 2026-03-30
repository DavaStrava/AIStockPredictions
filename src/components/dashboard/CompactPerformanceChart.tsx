'use client';

/**
 * CompactPerformanceChart Component
 *
 * Dashboard-optimized version of the equity curve chart.
 * Shows a 90-day performance line vs S&P 500 benchmark.
 * Simplified controls with hover tooltips.
 */

import { useMemo } from 'react';
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
import { LineChart as LineChartIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { BenchmarkDataPoint } from '@/types/portfolio';
import { formatPercent } from '@/lib/formatters';

interface CompactPerformanceChartProps {
  data: BenchmarkDataPoint[];
  loading?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-slate-400 text-xs mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <p key={index} className="flex items-center gap-2 text-sm">
            <span
              className="w-2 h-2 rounded-full"
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

export function CompactPerformanceChart({ data, loading }: CompactPerformanceChartProps) {
  // Calculate summary stats
  const summary = useMemo(() => {
    if (!data.length) return null;

    const latest = data[data.length - 1];
    const portfolioReturn = latest.portfolioReturn;
    const spyReturn = latest.spyReturn;
    const alpha = portfolioReturn - spyReturn;

    return { portfolioReturn, spyReturn, alpha };
  }, [data]);

  // X-axis date formatter
  const xAxisFormatter = (value: string) => {
    const date = new Date(value);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 w-32 bg-slate-700 rounded" />
            <div className="h-5 w-24 bg-slate-700 rounded" />
          </div>
          <div className="h-[200px] bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <LineChartIcon className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold text-slate-100">Performance</h3>
        </div>
        <div className="flex flex-col items-center justify-center h-[200px] text-center">
          <LineChartIcon className="w-10 h-10 text-slate-600 mb-3" />
          <p className="text-slate-400">No performance history yet</p>
          <p className="text-slate-500 text-sm mt-1">
            Data will appear after daily snapshots are recorded
          </p>
        </div>
      </div>
    );
  }

  const isPositiveReturn = summary && summary.portfolioReturn >= 0;
  const isPositiveAlpha = summary && summary.alpha >= 0;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <LineChartIcon className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold text-slate-100">90-Day Performance</h3>
        </div>

        {summary && (
          <div className="flex items-center gap-4">
            {/* Portfolio Return */}
            <div className="flex items-center gap-1.5">
              {isPositiveReturn ? (
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-500" />
              )}
              <span
                className={`font-semibold ${
                  isPositiveReturn ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatPercent(summary.portfolioReturn)}
              </span>
            </div>

            {/* Alpha badge */}
            <div
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                isPositiveAlpha
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              Alpha: {formatPercent(summary.alpha)}
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickFormatter={xAxisFormatter}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickFormatter={(value: number) => `${value.toFixed(0)}%`}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Portfolio line */}
            <Line
              type="monotone"
              dataKey="portfolioReturn"
              name="Portfolio"
              stroke="#8b5cf6"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />

            {/* S&P 500 benchmark line */}
            <Line
              type="monotone"
              dataKey="spyReturn"
              name="S&P 500"
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeDasharray="6 3"
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />

            {/* Zero reference line */}
            <ReferenceLine y={0} stroke="#475569" strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-indigo-500 rounded" />
          <span className="text-xs text-slate-400">Portfolio</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-amber-500 rounded border-dashed" />
          <span className="text-xs text-slate-400">S&P 500</span>
        </div>
      </div>
    </div>
  );
}

export default CompactPerformanceChart;
