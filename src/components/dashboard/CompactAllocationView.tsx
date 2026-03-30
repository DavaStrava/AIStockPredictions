'use client';

/**
 * CompactAllocationView Component
 *
 * Simplified sector allocation visualization using horizontal bars.
 * Shows top 5 sectors with "Other" grouping and performance colors.
 */

import { useMemo } from 'react';
import { PieChart, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { SectorAllocation } from '@/types/portfolio';
import { formatPercent, formatCurrency } from '@/lib/formatters';

interface CompactAllocationViewProps {
  allocation: SectorAllocation[];
  loading?: boolean;
  maxSectors?: number;
}

// Sector color palette
const SECTOR_COLORS: Record<string, string> = {
  'Technology': '#8b5cf6',
  'Healthcare': '#10b981',
  'Financial Services': '#f59e0b',
  'Consumer Cyclical': '#ec4899',
  'Communication Services': '#06b6d4',
  'Industrials': '#6366f1',
  'Consumer Defensive': '#84cc16',
  'Energy': '#f97316',
  'Real Estate': '#14b8a6',
  'Utilities': '#a855f7',
  'Basic Materials': '#eab308',
  'Other': '#64748b',
};

function getSectorColor(sector: string): string {
  return SECTOR_COLORS[sector] || '#64748b';
}

function AllocationBarSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="flex items-center justify-between mb-1">
            <div className="w-24 h-4 bg-slate-700 rounded" />
            <div className="w-16 h-4 bg-slate-700 rounded" />
          </div>
          <div className="h-3 bg-slate-700 rounded" />
        </div>
      ))}
    </div>
  );
}

interface SectorBarProps {
  sector: string;
  weight: number;
  dayChangePercent: number;
  marketValue: number;
  maxWeight: number;
}

function SectorBar({ sector, weight, dayChangePercent, marketValue, maxWeight }: SectorBarProps) {
  const color = getSectorColor(sector);
  const barWidth = (weight / maxWeight) * 100;
  const isPositive = dayChangePercent > 0;
  const isNegative = dayChangePercent < 0;

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-medium text-slate-200">{sector}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">{formatPercent(weight)}</span>
          <div className="flex items-center gap-1">
            {isPositive && <TrendingUp className="w-3 h-3 text-emerald-500" />}
            {isNegative && <TrendingDown className="w-3 h-3 text-rose-500" />}
            {!isPositive && !isNegative && <Minus className="w-3 h-3 text-slate-500" />}
            <span
              className={`text-xs font-medium ${
                isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-slate-500'
              }`}
            >
              {formatPercent(dayChangePercent)}
            </span>
          </div>
        </div>
      </div>
      <div className="relative h-3 bg-slate-700/50 rounded overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded transition-all duration-300 group-hover:opacity-80"
          style={{
            width: `${barWidth}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <div className="text-xs text-slate-500 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {formatCurrency(marketValue)}
      </div>
    </div>
  );
}

export function CompactAllocationView({
  allocation,
  loading,
  maxSectors = 5,
}: CompactAllocationViewProps) {
  // Process allocation data: sort by weight and group smaller sectors into "Other"
  const processedAllocation = useMemo(() => {
    if (!allocation.length) return [];

    const sorted = [...allocation].sort((a, b) => b.portfolioWeight - a.portfolioWeight);

    if (sorted.length <= maxSectors) {
      return sorted;
    }

    const topSectors = sorted.slice(0, maxSectors);
    const otherSectors = sorted.slice(maxSectors);

    // Calculate "Other" aggregate
    const otherWeight = otherSectors.reduce((sum, s) => sum + s.portfolioWeight, 0);
    const otherValue = otherSectors.reduce((sum, s) => sum + s.marketValue, 0);
    // Weighted average day change
    const otherDayChange = otherValue > 0
      ? otherSectors.reduce((sum, s) => sum + s.dayChangePercent * s.marketValue, 0) / otherValue
      : 0;

    const otherGroup: SectorAllocation = {
      sector: `Other (${otherSectors.length})`,
      portfolioWeight: otherWeight,
      marketValue: otherValue,
      dayChangePercent: otherDayChange,
      holdings: otherSectors.flatMap(s => s.holdings),
    };

    return [...topSectors, otherGroup];
  }, [allocation, maxSectors]);

  // Find max weight for scaling bars
  const maxWeight = useMemo(() => {
    if (!processedAllocation.length) return 100;
    return Math.max(...processedAllocation.map(s => s.portfolioWeight));
  }, [processedAllocation]);

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-slate-700 rounded animate-pulse" />
          <div className="w-32 h-5 bg-slate-700 rounded animate-pulse" />
        </div>
        <AllocationBarSkeleton />
      </div>
    );
  }

  if (allocation.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold text-slate-100">Sector Allocation</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <PieChart className="w-10 h-10 text-slate-600 mb-3" />
          <p className="text-slate-400">No allocation data</p>
          <p className="text-slate-500 text-sm mt-1">
            Add holdings to see sector breakdown
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PieChart className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold text-slate-100">Sector Allocation</h3>
        </div>
        <span className="text-sm text-slate-500">
          {allocation.length} sector{allocation.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-4">
        {processedAllocation.map((sector) => (
          <SectorBar
            key={sector.sector}
            sector={sector.sector}
            weight={sector.portfolioWeight}
            dayChangePercent={sector.dayChangePercent}
            marketValue={sector.marketValue}
            maxWeight={maxWeight}
          />
        ))}
      </div>

      {/* Color legend for top sectors */}
      <div className="mt-4 pt-3 border-t border-slate-700/50">
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {processedAllocation.slice(0, 4).map((sector) => (
            <div key={sector.sector} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getSectorColor(sector.sector) }}
              />
              <span className="text-xs text-slate-500">{sector.sector}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CompactAllocationView;
