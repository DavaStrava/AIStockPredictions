'use client';

/**
 * TopMoversCard Component
 *
 * Displays today's top gainers and losers from portfolio holdings.
 * Shows symbol, day change %, and dollar change with color coding.
 */

import { TrendingUp, TrendingDown } from 'lucide-react';
import { HoldingWithMarketData } from '@/types/portfolio';
import { formatCurrency, formatPercent } from '@/lib/formatters';

interface TopMoversCardProps {
  gainers: HoldingWithMarketData[];
  losers: HoldingWithMarketData[];
  loading?: boolean;
}

interface MoverRowProps {
  holding: HoldingWithMarketData;
  type: 'gainer' | 'loser';
}

function MoverRow({ holding, type }: MoverRowProps) {
  const isGainer = type === 'gainer';
  const colorClass = isGainer ? 'text-emerald-500' : 'text-rose-500';
  const bgClass = isGainer ? 'bg-emerald-500/10' : 'bg-rose-500/10';

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${bgClass}`}>
      <div className="flex items-center gap-3">
        <div className={`p-1.5 rounded-md ${isGainer ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
          {isGainer ? (
            <TrendingUp className={`w-4 h-4 ${colorClass}`} />
          ) : (
            <TrendingDown className={`w-4 h-4 ${colorClass}`} />
          )}
        </div>
        <div>
          <span className="font-semibold text-slate-100">{holding.symbol}</span>
          {holding.companyName && (
            <p className="text-xs text-slate-500 truncate max-w-[120px]">
              {holding.companyName}
            </p>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className={`font-semibold ${colorClass}`}>
          {formatPercent(holding.dayChangePercent)}
        </p>
        <p className={`text-xs ${colorClass} opacity-80`}>
          {formatCurrency(holding.dayChange * holding.quantity)}
        </p>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-700 rounded-md" />
            <div>
              <div className="w-12 h-4 bg-slate-700 rounded mb-1" />
              <div className="w-20 h-3 bg-slate-700 rounded" />
            </div>
          </div>
          <div className="text-right">
            <div className="w-12 h-4 bg-slate-700 rounded mb-1" />
            <div className="w-16 h-3 bg-slate-700 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TopMoversCard({ gainers, losers, loading }: TopMoversCardProps) {
  const hasGainers = gainers.length > 0;
  const hasLosers = losers.length > 0;
  const hasData = hasGainers || hasLosers;

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-slate-700 rounded animate-pulse" />
          <div className="w-32 h-5 bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="w-16 h-4 bg-slate-700 rounded mb-3 animate-pulse" />
            <LoadingSkeleton />
          </div>
          <div>
            <div className="w-16 h-4 bg-slate-700 rounded mb-3 animate-pulse" />
            <LoadingSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          <TrendingDown className="w-5 h-5 text-rose-500 -ml-1" />
        </div>
        <h3 className="text-lg font-semibold text-slate-100">Top Movers Today</h3>
      </div>

      {!hasData ? (
        <div className="text-center py-8">
          <p className="text-slate-400">No market movement data available</p>
          <p className="text-slate-500 text-sm mt-1">Add holdings to see today's movers</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Gainers */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-400">Gainers</span>
            </div>
            {hasGainers ? (
              <div className="space-y-2">
                {gainers.map((holding) => (
                  <MoverRow key={holding.symbol} holding={holding} type="gainer" />
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm p-3 bg-slate-700/20 rounded-lg">
                No gainers today
              </p>
            )}
          </div>

          {/* Losers */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-rose-500" />
              <span className="text-sm font-medium text-rose-400">Losers</span>
            </div>
            {hasLosers ? (
              <div className="space-y-2">
                {losers.map((holding) => (
                  <MoverRow key={holding.symbol} holding={holding} type="loser" />
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm p-3 bg-slate-700/20 rounded-lg">
                No losers today
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TopMoversCard;
