/**
 * TradeStatsCards Component
 *
 * Displays trade statistics in a responsive grid of cards.
 * Used by the Trades tab in Portfolio Manager.
 */

'use client';

import { TradeStats } from '@/types/portfolio';

interface TradeStatsCardsProps {
  stats: TradeStats | null;
  loading?: boolean;
}

/**
 * Formats a number as currency
 */
function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '-';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats a percentage (value already in percentage form)
 */
function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '-';
  }
  return `${value.toFixed(1)}%`;
}

/**
 * Gets color class for P&L values
 */
function getPnLColorClass(value: number | null | undefined): string {
  if (value === null || value === undefined || value === 0) {
    return 'text-slate-300';
  }
  return value > 0 ? 'text-emerald-400' : 'text-red-400';
}

/**
 * Loading skeleton for a stat card
 */
function StatCardSkeleton() {
  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 animate-pulse">
      <div className="h-4 bg-slate-700 rounded w-24 mb-2" />
      <div className="h-7 bg-slate-700 rounded w-20" />
    </div>
  );
}

export function TradeStatsCards({ stats, loading }: TradeStatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const totalPnl = stats.totalRealizedPnl + stats.totalUnrealizedPnl;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {/* Total Realized P&L */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
        <p className="text-sm text-slate-400">Realized P&L</p>
        <p className={`text-xl font-bold ${getPnLColorClass(stats.totalRealizedPnl)}`}>
          {formatCurrency(stats.totalRealizedPnl)}
        </p>
      </div>

      {/* Total Unrealized P&L */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
        <p className="text-sm text-slate-400">Unrealized P&L</p>
        <p className={`text-xl font-bold ${getPnLColorClass(stats.totalUnrealizedPnl)}`}>
          {formatCurrency(stats.totalUnrealizedPnl)}
        </p>
      </div>

      {/* Win Rate */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
        <p className="text-sm text-slate-400">Win Rate</p>
        <p className="text-xl font-bold text-slate-200">
          {formatPercent(stats.winRate)}
        </p>
      </div>

      {/* Avg Win */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
        <p className="text-sm text-slate-400">Avg Win</p>
        <p className="text-xl font-bold text-emerald-400">
          {formatCurrency(stats.avgWin)}
        </p>
      </div>

      {/* Avg Loss */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
        <p className="text-sm text-slate-400">Avg Loss</p>
        <p className="text-xl font-bold text-red-400">
          {formatCurrency(stats.avgLoss)}
        </p>
      </div>

      {/* Total Trades */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
        <p className="text-sm text-slate-400">Total Trades</p>
        <p className="text-xl font-bold text-slate-200">
          {stats.totalTrades}
          <span className="text-sm font-normal text-slate-400 ml-1">
            ({stats.openTrades} open)
          </span>
        </p>
      </div>

      {/* Extended Stats Row (optional - shown on larger screens) */}
      <div className="hidden lg:block col-span-2 bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
        <p className="text-sm text-slate-400">Total P&L (Realized + Unrealized)</p>
        <p className={`text-xl font-bold ${getPnLColorClass(totalPnl)}`}>
          {formatCurrency(totalPnl)}
        </p>
      </div>

      {/* Best Trade */}
      <div className="hidden lg:block bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
        <p className="text-sm text-slate-400">Best Trade</p>
        <p className="text-xl font-bold text-emerald-400">
          {formatCurrency(stats.bestTrade)}
        </p>
      </div>

      {/* Worst Trade */}
      <div className="hidden lg:block bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
        <p className="text-sm text-slate-400">Worst Trade</p>
        <p className="text-xl font-bold text-red-400">
          {formatCurrency(stats.worstTrade)}
        </p>
      </div>
    </div>
  );
}

export default TradeStatsCards;
