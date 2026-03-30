'use client';

/**
 * PortfolioHoldingsPreview Component
 *
 * Compact, scrollable view of top holdings sorted by portfolio weight.
 * Shows symbol, price, day change %, weight, total gain/loss, and mini sparkline.
 */

import { useMemo } from 'react';
import { Briefcase, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { HoldingWithMarketData } from '@/types/portfolio';
import { formatCurrency, formatPercent } from '@/lib/formatters';

interface PortfolioHoldingsPreviewProps {
  holdings: HoldingWithMarketData[];
  loading?: boolean;
  maxItems?: number;
  /** Callback when "View All" is clicked - navigates to portfolio tab */
  onViewAllClick?: () => void;
}

interface MiniSparklineProps {
  data: number[];
  width?: number;
  height?: number;
}

function MiniSparkline({ data, width = 60, height = 20 }: MiniSparklineProps) {
  if (!data || data.length < 2) {
    return <div className="w-[60px] h-[20px] bg-slate-700/30 rounded" />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  const isPositive = data[data.length - 1] > data[0];
  const color = isPositive ? '#10b981' : '#f43f5e';

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HoldingRowSkeleton() {
  return (
    <tr className="border-b border-slate-700/30">
      <td className="py-3 px-4">
        <div className="w-12 h-4 bg-slate-700 rounded animate-pulse" />
      </td>
      <td className="py-3 px-4">
        <div className="w-16 h-4 bg-slate-700 rounded animate-pulse" />
      </td>
      <td className="py-3 px-4">
        <div className="w-14 h-4 bg-slate-700 rounded animate-pulse" />
      </td>
      <td className="py-3 px-4">
        <div className="w-12 h-4 bg-slate-700 rounded animate-pulse" />
      </td>
      <td className="py-3 px-4">
        <div className="w-16 h-4 bg-slate-700 rounded animate-pulse" />
      </td>
      <td className="py-3 px-4">
        <div className="w-[60px] h-[20px] bg-slate-700 rounded animate-pulse" />
      </td>
    </tr>
  );
}

export function PortfolioHoldingsPreview({
  holdings,
  loading,
  maxItems = 8,
  onViewAllClick,
}: PortfolioHoldingsPreviewProps) {
  // Sort holdings by portfolio weight (descending) and take top N
  const topHoldings = useMemo(() => {
    return [...holdings]
      .sort((a, b) => b.portfolioWeight - a.portfolioWeight)
      .slice(0, maxItems);
  }, [holdings, maxItems]);

  const remainingCount = holdings.length - topHoldings.length;

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-slate-700 rounded animate-pulse" />
          <div className="w-32 h-5 bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left text-xs font-medium text-slate-500 uppercase py-2 px-4">Symbol</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase py-2 px-4">Price</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase py-2 px-4">Day %</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase py-2 px-4">Weight</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase py-2 px-4">Gain/Loss</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase py-2 px-4">7D</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <HoldingRowSkeleton key={i} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (holdings.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold text-slate-100">Holdings Overview</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Briefcase className="w-10 h-10 text-slate-600 mb-3" />
          <p className="text-slate-400">No holdings yet</p>
          <p className="text-slate-500 text-sm mt-1">
            Add your first position to see it here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold text-slate-100">Holdings Overview</h3>
          <span className="text-sm text-slate-500">
            ({holdings.length} position{holdings.length !== 1 ? 's' : ''})
          </span>
        </div>
        {onViewAllClick && (
          <button
            onClick={onViewAllClick}
            className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>View All</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="text-left text-xs font-medium text-slate-500 uppercase py-2 px-4">Symbol</th>
              <th className="text-right text-xs font-medium text-slate-500 uppercase py-2 px-4">Price</th>
              <th className="text-right text-xs font-medium text-slate-500 uppercase py-2 px-4">Day %</th>
              <th className="text-right text-xs font-medium text-slate-500 uppercase py-2 px-4">Weight</th>
              <th className="text-right text-xs font-medium text-slate-500 uppercase py-2 px-4">Gain/Loss</th>
              <th className="text-right text-xs font-medium text-slate-500 uppercase py-2 px-4">7D</th>
            </tr>
          </thead>
          <tbody>
            {topHoldings.map((holding) => {
              const dayChangeColor = holding.dayChangePercent >= 0 ? 'text-emerald-400' : 'text-rose-400';
              const gainLossColor = holding.totalGainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400';

              return (
                <tr
                  key={holding.symbol}
                  className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                >
                  {/* Symbol */}
                  <td className="py-3 px-4">
                    <div>
                      <span className="font-semibold text-slate-100">{holding.symbol}</span>
                      {holding.companyName && (
                        <p className="text-xs text-slate-500 truncate max-w-[150px]">
                          {holding.companyName}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Price */}
                  <td className="py-3 px-4 text-right">
                    <span className="text-slate-200">{formatCurrency(holding.currentPrice)}</span>
                  </td>

                  {/* Day Change % */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {holding.dayChangePercent >= 0 ? (
                        <TrendingUp className={`w-3 h-3 ${dayChangeColor}`} />
                      ) : (
                        <TrendingDown className={`w-3 h-3 ${dayChangeColor}`} />
                      )}
                      <span className={`font-medium ${dayChangeColor}`}>
                        {formatPercent(holding.dayChangePercent)}
                      </span>
                    </div>
                  </td>

                  {/* Weight */}
                  <td className="py-3 px-4 text-right">
                    <span className="text-slate-300">{formatPercent(holding.portfolioWeight)}</span>
                  </td>

                  {/* Gain/Loss */}
                  <td className="py-3 px-4 text-right">
                    <div>
                      <span className={`font-medium ${gainLossColor}`}>
                        {formatCurrency(holding.totalGainLoss)}
                      </span>
                      <p className={`text-xs ${gainLossColor} opacity-80`}>
                        {formatPercent(holding.totalGainLossPercent)}
                      </p>
                    </div>
                  </td>

                  {/* Sparkline */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end">
                      <MiniSparkline data={holding.sparklineData || []} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {remainingCount > 0 && onViewAllClick && (
        <div className="mt-4 pt-3 border-t border-slate-700/50 text-center">
          <button
            onClick={onViewAllClick}
            className="text-sm text-slate-400 hover:text-indigo-400 transition-colors"
          >
            + {remainingCount} more holding{remainingCount !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  );
}

export default PortfolioHoldingsPreview;
