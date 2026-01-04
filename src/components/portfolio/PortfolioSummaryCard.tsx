'use client';

/**
 * PortfolioSummaryCard Component
 *
 * Displays high-level portfolio statistics in the dashboard header.
 * Shows: Total Equity, Cash Balance, Day Change, Total Return, and Daily Alpha.
 */

import { TrendingUp, TrendingDown, Wallet, PiggyBank, Activity, Target } from 'lucide-react';
import { PortfolioSummary } from '@/types/portfolio';

interface PortfolioSummaryCardProps {
  summary: PortfolioSummary | null;
  loading?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  valueColor?: 'positive' | 'negative' | 'neutral';
  loading?: boolean;
}

function StatCard({ label, value, subValue, icon, valueColor = 'neutral', loading }: StatCardProps) {
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
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50 hover:border-slate-600/50 transition-colors">
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

export function PortfolioSummaryCard({ summary, loading }: PortfolioSummaryCardProps) {
  if (!summary && !loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700/50 text-center">
        <p className="text-slate-400">No portfolio data available</p>
      </div>
    );
  }

  const dayChangeColor = (summary?.dayChange ?? 0) >= 0 ? 'positive' : 'negative';
  const totalReturnColor = (summary?.totalReturn ?? 0) >= 0 ? 'positive' : 'negative';
  const alphaColor =
    summary?.dailyAlpha === null
      ? 'neutral'
      : (summary?.dailyAlpha ?? 0) >= 0
        ? 'positive'
        : 'negative';

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatCard
        label="Total Equity"
        value={formatCurrency(summary?.totalEquity ?? 0)}
        icon={<Wallet className="w-5 h-5" />}
        loading={loading}
      />

      <StatCard
        label="Holdings Value"
        value={formatCurrency(summary?.holdingsValue ?? 0)}
        subValue={`${summary?.holdingsCount ?? 0} positions`}
        icon={<PiggyBank className="w-5 h-5" />}
        loading={loading}
      />

      <StatCard
        label="Cash Balance"
        value={formatCurrency(summary?.cashBalance ?? 0)}
        icon={<Wallet className="w-5 h-5" />}
        loading={loading}
      />

      <StatCard
        label="Day Change"
        value={formatCurrency(summary?.dayChange ?? 0)}
        subValue={formatPercent(summary?.dayChangePercent ?? 0)}
        icon={
          (summary?.dayChange ?? 0) >= 0 ? (
            <TrendingUp className="w-5 h-5" />
          ) : (
            <TrendingDown className="w-5 h-5" />
          )
        }
        valueColor={dayChangeColor}
        loading={loading}
      />

      <StatCard
        label="Total Return"
        value={formatCurrency(summary?.totalReturn ?? 0)}
        subValue={formatPercent(summary?.totalReturnPercent ?? 0)}
        icon={<Activity className="w-5 h-5" />}
        valueColor={totalReturnColor}
        loading={loading}
      />

      <StatCard
        label="Daily Alpha"
        value={summary?.dailyAlpha !== null ? formatPercent(summary?.dailyAlpha ?? 0) : 'N/A'}
        subValue="vs S&P 500"
        icon={<Target className="w-5 h-5" />}
        valueColor={alphaColor}
        loading={loading}
      />
    </div>
  );
}

export default PortfolioSummaryCard;


