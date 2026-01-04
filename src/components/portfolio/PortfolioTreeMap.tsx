'use client';

/**
 * PortfolioTreeMap Component
 *
 * Visualizes portfolio allocation as a tree map.
 * - Block size: Corresponds to portfolio weight
 * - Block color: Corresponds to day change % (green/red heatmap)
 */

import { useMemo } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { SectorAllocation } from '@/types/portfolio';

interface PortfolioTreeMapProps {
  allocation: SectorAllocation[];
  loading?: boolean;
}

interface TreeMapDataItem {
  name: string;
  size: number;
  value: number;
  dayChange: number;
  holdings?: TreeMapDataItem[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

// Color scale based on day change percentage
function getColorForChange(change: number): string {
  if (change >= 3) return '#10b981'; // emerald-500
  if (change >= 1.5) return '#34d399'; // emerald-400
  if (change >= 0.5) return '#6ee7b7'; // emerald-300
  if (change >= 0) return '#a7f3d0'; // emerald-200
  if (change >= -0.5) return '#fecaca'; // red-200
  if (change >= -1.5) return '#fca5a5'; // red-300
  if (change >= -3) return '#f87171'; // red-400
  return '#ef4444'; // red-500
}

// Custom content for tree map cells
interface TreeMapCellProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  dayChange?: number;
  value?: number;
  depth?: number;
}

function TreeMapCell(props: TreeMapCellProps) {
  const { x = 0, y = 0, width = 0, height = 0, name, dayChange = 0, value = 0, depth } = props;

  // Only render leaf nodes
  if (depth !== 1) return null;
  if (width < 30 || height < 30) return null;

  const color = getColorForChange(dayChange);

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        stroke="#1e293b"
        strokeWidth={2}
        rx={4}
        style={{ transition: 'fill 0.3s ease' }}
      />
      {width > 60 && height > 40 && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 8}
            textAnchor="middle"
            fill="#1e293b"
            className="font-bold"
            style={{ fontSize: Math.min(width / 6, 14), fontWeight: 700 }}
          >
            {name}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 10}
            textAnchor="middle"
            fill="#374151"
            style={{ fontSize: Math.min(width / 8, 11) }}
          >
            {formatCurrency(value)}
          </text>
          {width > 80 && height > 60 && (
            <text
              x={x + width / 2}
              y={y + height / 2 + 26}
              textAnchor="middle"
              fill="#374151"
              style={{ fontSize: Math.min(width / 9, 10) }}
            >
              {formatPercent(dayChange)}
            </text>
          )}
        </>
      )}
    </g>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: TreeMapDataItem;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 shadow-xl">
      <p className="font-bold text-slate-100 text-lg">{data.name}</p>
      <div className="mt-2 space-y-1">
        <p className="text-slate-300">
          Value:{' '}
          <span className="font-semibold text-slate-100">{formatCurrency(data.value)}</span>
        </p>
        <p className="text-slate-300">
          Weight:{' '}
          <span className="font-semibold text-slate-100">{data.size.toFixed(1)}%</span>
        </p>
        <p className="text-slate-300">
          Day Change:{' '}
          <span
            className={`font-semibold ${
              data.dayChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatPercent(data.dayChange)}
          </span>
        </p>
      </div>
    </div>
  );
}

export function PortfolioTreeMap({ allocation, loading }: PortfolioTreeMapProps) {
  const treeMapData = useMemo(() => {
    if (!allocation.length) return [];

    // Flatten for simpler tree map
    return allocation.flatMap((sector) =>
      sector.holdings.map((holding) => ({
        name: holding.symbol,
        size: holding.portfolioWeight,
        value: holding.marketValue,
        dayChange: holding.dayChangePercent,
      }))
    );
  }, [allocation]);

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8">
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-slate-700 rounded mb-4" />
          <div className="h-64 bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  if (treeMapData.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8 text-center">
        <p className="text-slate-400">No allocation data available</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
      <h3 className="text-lg font-semibold text-slate-100 mb-4">Portfolio Allocation</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={treeMapData}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="#1e293b"
            content={<TreeMapCell />}
          >
            <Tooltip content={<CustomTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-500" />
          <span className="text-xs text-slate-400">Positive</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-rose-500" />
          <span className="text-xs text-slate-400">Negative</span>
        </div>
        <span className="text-xs text-slate-500">Size = Portfolio Weight</span>
      </div>
    </div>
  );
}

export default PortfolioTreeMap;





