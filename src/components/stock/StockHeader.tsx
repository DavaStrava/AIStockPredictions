/**
 * StockHeader Component
 *
 * Displays the stock symbol, company name, current price, change,
 * and market status badge.
 */

'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import type { StockHeaderProps, MarketStatus } from '@/types/stock';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCurrencyChange(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${formatCurrency(value)}`;
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function getMarketStatusConfig(status: MarketStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case 'open':
      return {
        label: 'Market Open',
        className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      };
    case 'pre-market':
      return {
        label: 'Pre-Market',
        className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      };
    case 'after-hours':
      return {
        label: 'After Hours',
        className: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      };
    case 'closed':
    default:
      return {
        label: 'Market Closed',
        className: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
      };
  }
}

export function StockHeader({
  symbol,
  companyName,
  price,
  change,
  changePercent,
  marketStatus,
}: StockHeaderProps) {
  const isPositive = change >= 0;
  const statusConfig = getMarketStatusConfig(marketStatus);

  return (
    <div className="mb-6">
      {/* Symbol and Company Name */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-lg font-bold">
            {symbol.substring(0, 2)}
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{symbol}</h1>
          <p className="text-slate-400">{companyName}</p>
        </div>
      </div>

      {/* Price and Change */}
      <div className="flex flex-wrap items-baseline gap-4">
        <span className="text-4xl font-bold text-slate-100">
          {formatCurrency(price)}
        </span>

        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
            isPositive ? 'bg-emerald-500/10' : 'bg-rose-500/10'
          }`}
        >
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-rose-400" />
          )}
          <span
            className={`font-semibold ${
              isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrencyChange(change)}
          </span>
          <span
            className={`font-semibold ${
              isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            ({formatPercent(changePercent)})
          </span>
        </div>

        {/* Market Status Badge */}
        <span
          className={`px-3 py-1 text-sm font-medium rounded-full border ${statusConfig.className}`}
        >
          {statusConfig.label}
        </span>
      </div>
    </div>
  );
}

export default StockHeader;
