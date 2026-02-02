/**
 * HoldingRow Component
 *
 * Renders a single row in the HoldingsDataGrid.
 * Supports dynamic column visibility and links symbol to stock detail page.
 * Memoized to prevent re-renders when other holdings change.
 */
'use client';

import { memo } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Edit2,
} from 'lucide-react';
import { HoldingWithMarketData } from '@/types/portfolio';
import type { ColumnKey } from './HoldingsDataGrid';

interface HoldingRowProps {
  holding: HoldingWithMarketData;
  /** Array of visible column keys (stable reference for memo optimization) */
  visibleColumns: ColumnKey[];
  isEditing: boolean;
  editingTarget: string;
  onStartEdit: (symbol: string, currentTarget: number | null) => void;
  onEditingTargetChange: (value: string) => void;
  onSaveTarget: (symbol: string) => void;
  onCancelEdit: () => void;
  showTargetEdit?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCurrencyCompact(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${formatCurrency(value)}`;
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}

export const HoldingRow = memo(function HoldingRow({
  holding,
  visibleColumns,
  isEditing,
  editingTarget,
  onStartEdit,
  onEditingTargetChange,
  onSaveTarget,
  onCancelEdit,
  showTargetEdit = true,
}: HoldingRowProps) {
  const isPositiveDay = holding.dayChangePercent >= 0;
  const isPositiveTotal = holding.totalGainLossPercent >= 0;
  const hasDrift = holding.driftPercent !== null && Math.abs(holding.driftPercent) > 2;

  return (
    <tr className="hover:bg-slate-700/20 transition-colors">
      {/* Symbol - Always clickable link to stock detail page */}
      {visibleColumns.includes('symbol') && (
        <td className="px-3 py-3">
          <Link href={`/stock/${holding.symbol}`} className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {holding.symbol.substring(0, 2)}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-100 group-hover:text-indigo-400 transition-colors">
                {holding.symbol}
              </p>
              {holding.companyName && (
                <p className="text-xs text-slate-500 truncate max-w-[140px]">
                  {holding.companyName}
                </p>
              )}
            </div>
          </Link>
        </td>
      )}

      {/* Price */}
      {visibleColumns.includes('currentPrice') && (
        <td className="px-3 py-3 text-right">
          <div className="flex flex-col items-end">
            <span className="text-slate-100 font-medium">
              {formatCurrency(holding.currentPrice)}
            </span>
            {holding.postMarketPrice !== undefined && (
              <span className="text-xs text-slate-500">
                AH: {formatCurrency(holding.postMarketPrice)}
              </span>
            )}
          </div>
        </td>
      )}

      {/* Day Change ($) */}
      {visibleColumns.includes('dayChange') && (
        <td className="px-3 py-3 text-right">
          <span className={`font-medium ${isPositiveDay ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrencyCompact(holding.dayChange)}
          </span>
        </td>
      )}

      {/* Day Change (%) */}
      {visibleColumns.includes('dayChangePercent') && (
        <td className="px-3 py-3 text-right">
          <div
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg ${
              isPositiveDay ? 'bg-emerald-500/10' : 'bg-rose-500/10'
            }`}
          >
            {isPositiveDay ? (
              <TrendingUp className="w-3 h-3 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3 h-3 text-rose-400" />
            )}
            <span
              className={`text-sm font-medium ${
                isPositiveDay ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatPercent(holding.dayChangePercent)}
            </span>
          </div>
        </td>
      )}

      {/* Weight */}
      {visibleColumns.includes('portfolioWeight') && (
        <td className="px-3 py-3 text-right">
          <div className="flex items-center justify-end gap-2">
            <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${Math.min(holding.portfolioWeight, 100)}%` }}
              />
            </div>
            <span className="text-slate-300 text-sm w-12 text-right">
              {holding.portfolioWeight.toFixed(1)}%
            </span>
          </div>
        </td>
      )}

      {/* Shares */}
      {visibleColumns.includes('quantity') && (
        <td className="px-3 py-3 text-right">
          <span className="text-slate-300">{formatNumber(holding.quantity)}</span>
        </td>
      )}

      {/* Avg Cost */}
      {visibleColumns.includes('averageCostBasis') && (
        <td className="px-3 py-3 text-right">
          <span className="text-slate-300">{formatCurrency(holding.averageCostBasis)}</span>
        </td>
      )}

      {/* Today's Gain ($) */}
      {visibleColumns.includes('todayGain') && (
        <td className="px-3 py-3 text-right">
          <span className={`font-medium ${holding.todayGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrencyCompact(holding.todayGain)}
          </span>
        </td>
      )}

      {/* Today's Gain (%) */}
      {visibleColumns.includes('todayGainPercent') && (
        <td className="px-3 py-3 text-right">
          <span className={`text-sm ${holding.todayGainPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatPercent(holding.todayGainPercent)}
          </span>
        </td>
      )}

      {/* Est. Annual Income */}
      {visibleColumns.includes('estimatedAnnualIncome') && (
        <td className="px-3 py-3 text-right">
          <span className="text-slate-300">
            {holding.estimatedAnnualIncome > 0 ? formatCurrency(holding.estimatedAnnualIncome) : '—'}
          </span>
        </td>
      )}

      {/* Total Change ($) */}
      {visibleColumns.includes('totalGainLoss') && (
        <td className="px-3 py-3 text-right">
          <span className={`font-medium ${isPositiveTotal ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrencyCompact(holding.totalGainLoss)}
          </span>
        </td>
      )}

      {/* Total Change (%) */}
      {visibleColumns.includes('totalGainLossPercent') && (
        <td className="px-3 py-3 text-right">
          <span className={`text-sm ${isPositiveTotal ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatPercent(holding.totalGainLossPercent)}
          </span>
        </td>
      )}

      {/* Value */}
      {visibleColumns.includes('marketValue') && (
        <td className="px-3 py-3 text-right">
          <span className="text-slate-100 font-medium">
            {formatCurrency(holding.marketValue)}
          </span>
        </td>
      )}

      {/* Target (always shown) */}
      <td className="px-3 py-3 text-right">
        {isEditing ? (
          <div className="flex items-center justify-end gap-2">
            <input
              type="number"
              value={editingTarget}
              onChange={(e) => onEditingTargetChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveTarget(holding.symbol);
                if (e.key === 'Escape') onCancelEdit();
              }}
              className="w-14 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100 text-right"
              placeholder="%"
              min="0"
              max="100"
              autoFocus
            />
            <button
              onClick={() => onSaveTarget(holding.symbol)}
              className="p-1 bg-indigo-600 hover:bg-indigo-500 rounded text-white"
            >
              ✓
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1">
            {holding.targetAllocationPercent !== null ? (
              <>
                <Target
                  className={`w-3.5 h-3.5 ${hasDrift ? 'text-amber-400' : 'text-slate-500'}`}
                />
                <span
                  className={`text-sm ${hasDrift ? 'text-amber-400' : 'text-slate-400'}`}
                >
                  {holding.targetAllocationPercent.toFixed(1)}%
                </span>
              </>
            ) : (
              <span className="text-slate-600">—</span>
            )}
            {showTargetEdit && (
              <button
                onClick={() =>
                  onStartEdit(holding.symbol, holding.targetAllocationPercent)
                }
                className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-slate-300 transition-colors"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  );
});
