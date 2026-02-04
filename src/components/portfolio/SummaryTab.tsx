'use client';

import { useMemo } from 'react';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Briefcase } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  PortfolioSummary,
  HoldingWithMarketData,
  BenchmarkDataPoint,
} from '@/types/portfolio';
import { formatCurrency, formatPercent } from '@/lib/formatters';

interface SummaryTabProps {
  summary: PortfolioSummary | null;
  holdings: HoldingWithMarketData[];
  history: BenchmarkDataPoint[];
  loading?: boolean;
}

function MetricCard({
  label,
  value,
  subValue,
  icon,
  valueColor = 'neutral',
  loading,
}: {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  valueColor?: 'positive' | 'negative' | 'neutral';
  loading?: boolean;
}) {
  const colorClasses = {
    positive: 'text-emerald-500',
    negative: 'text-rose-500',
    neutral: 'text-slate-100',
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
        <div className="animate-pulse">
          <div className="h-4 w-20 bg-slate-700 rounded mb-3" />
          <div className="h-7 w-32 bg-slate-700 rounded mb-2" />
          <div className="h-4 w-24 bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-400 text-sm font-medium">{label}</span>
        <span className="text-slate-500">{icon}</span>
      </div>
      <p className={`text-2xl font-bold tracking-tight ${colorClasses[valueColor]}`}>{value}</p>
      {subValue && (
        <p className={`text-sm mt-1 ${colorClasses[valueColor]} opacity-80`}>{subValue}</p>
      )}
    </div>
  );
}

export function SummaryTab({ summary, holdings, history, loading }: SummaryTabProps) {
  const estimatedAnnualIncome = useMemo(
    () => holdings.reduce((sum, h) => sum + h.estimatedAnnualIncome, 0),
    [holdings]
  );

  const { topPerformers, bottomPerformers } = useMemo(() => {
    const sorted = [...holdings].sort((a, b) => b.totalGainLossPercent - a.totalGainLossPercent);
    // Only show bottom performers separately when there are enough holdings to avoid overlap
    const top = sorted.slice(0, 3);
    const bottom = holdings.length >= 6 ? sorted.slice(-3).reverse() : [];
    return { topPerformers: top, bottomPerformers: bottom };
  }, [holdings]);

  const chartData = useMemo(() => {
    const slice = history.slice(-90);
    return slice.map((d) => ({
      date: d.date,
      return: d.portfolioReturn,
    }));
  }, [history]);

  // Pre-compute date labels to avoid repeated Date construction in tick formatter
  const dateLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of chartData) {
      if (!map.has(d.date)) {
        const dt = new Date(d.date);
        map.set(d.date, `${dt.getMonth() + 1}/${dt.getDate()}`);
      }
    }
    return map;
  }, [chartData]);

  const totalReturnColor: 'positive' | 'negative' = (summary?.totalReturn ?? 0) >= 0 ? 'positive' : 'negative';

  if (!summary && !loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700/50 text-center">
        <p className="text-slate-400">No portfolio data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Equity"
          value={formatCurrency(summary?.totalEquity ?? 0)}
          icon={<Wallet className="w-5 h-5" />}
          loading={loading}
        />
        <MetricCard
          label="Total Return"
          value={formatCurrency(summary?.totalReturn ?? 0)}
          subValue={formatPercent(summary?.totalReturnPercent ?? 0)}
          icon={
            (summary?.totalReturn ?? 0) >= 0 ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )
          }
          valueColor={totalReturnColor}
          loading={loading}
        />
        <MetricCard
          label="Est. Annual Income"
          value={formatCurrency(estimatedAnnualIncome)}
          subValue={
            summary && summary.totalEquity > 0
              ? `${((estimatedAnnualIncome / summary.totalEquity) * 100).toFixed(2)}% yield`
              : undefined
          }
          icon={<DollarSign className="w-5 h-5" />}
          loading={loading}
        />
        <MetricCard
          label="Holdings"
          value={String(summary?.holdingsCount ?? 0)}
          subValue={formatCurrency(summary?.holdingsValue ?? 0)}
          icon={<Briefcase className="w-5 h-5" />}
          loading={loading}
        />
      </div>

      {/* Mini Performance Chart */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5">
        <h3 className="text-sm font-medium text-slate-400 mb-4">Portfolio Performance (90 days)</h3>
        {loading ? (
          <div className="h-[200px] animate-pulse bg-slate-700/30 rounded-lg" />
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="summaryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => dateLabelMap.get(val) ?? ''}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val.toFixed(1)}%`}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                }}
                formatter={(value: number) => [`${value.toFixed(2)}%`, 'Return']}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Area
                type="monotone"
                dataKey="return"
                stroke="#6366f1"
                fill="url(#summaryGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">
            No performance data yet
          </div>
        )}
      </div>

      {/* Top & Bottom Performers */}
      {topPerformers.length > 0 && (
        <div className={`grid grid-cols-1 ${bottomPerformers.length > 0 ? 'md:grid-cols-2' : ''} gap-4`}>
          {/* Top Performers */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5">
            <h3 className="text-sm font-medium text-slate-400 mb-4">Top Performers</h3>
            <div className="space-y-3">
              {topPerformers.map((h) => (
                <div key={h.symbol} className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-slate-100">{h.symbol}</span>
                    {h.companyName && (
                      <span className="text-xs text-slate-500 ml-2">{h.companyName}</span>
                    )}
                  </div>
                  <span
                    className={`font-semibold ${h.totalGainLossPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                  >
                    {formatPercent(h.totalGainLossPercent)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Performers — only shown when portfolio has 6+ holdings to avoid overlap with top */}
          {bottomPerformers.length > 0 && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5">
              <h3 className="text-sm font-medium text-slate-400 mb-4">Bottom Performers</h3>
              <div className="space-y-3">
                {bottomPerformers.map((h) => (
                  <div key={h.symbol} className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-slate-100">{h.symbol}</span>
                      {h.companyName && (
                        <span className="text-xs text-slate-500 ml-2">{h.companyName}</span>
                      )}
                    </div>
                    <span
                      className={`font-semibold ${h.totalGainLossPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                    >
                      {formatPercent(h.totalGainLossPercent)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SummaryTab;
