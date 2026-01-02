'use client';

/**
 * HoldingsDataGrid Component
 *
 * Displays portfolio holdings in a sortable, filterable data grid.
 * Shows: Symbol, Price, Shares, Value, Weight, Target, Day Change, Total Return.
 */

import { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
  Target,
  Edit2,
} from 'lucide-react';
import { HoldingWithMarketData } from '@/types/portfolio';

interface HoldingsDataGridProps {
  holdings: HoldingWithMarketData[];
  loading?: boolean;
  onUpdateTarget?: (symbol: string, target: number | null) => Promise<void>;
}

type SortKey =
  | 'symbol'
  | 'currentPrice'
  | 'quantity'
  | 'marketValue'
  | 'portfolioWeight'
  | 'dayChangePercent'
  | 'totalGainLossPercent';

type SortDirection = 'asc' | 'desc';

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

function formatNumber(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}

export function HoldingsDataGrid({
  holdings,
  loading,
  onUpdateTarget,
}: HoldingsDataGridProps) {
  const [sortKey, setSortKey] = useState<SortKey>('marketValue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [editingSymbol, setEditingSymbol] = useState<string | null>(null);
  const [editingTarget, setEditingTarget] = useState<string>('');

  const sortedHoldings = useMemo(() => {
    return [...holdings].sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      // Handle null values
      if (aVal === null) aVal = -Infinity;
      if (bVal === null) bVal = -Infinity;

      // String comparison for symbol
      if (sortKey === 'symbol') {
        return sortDirection === 'asc'
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      }

      // Numeric comparison
      const numA = Number(aVal);
      const numB = Number(bVal);
      return sortDirection === 'asc' ? numA - numB : numB - numA;
    });
  }, [holdings, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const handleStartEdit = (symbol: string, currentTarget: number | null) => {
    setEditingSymbol(symbol);
    setEditingTarget(currentTarget?.toString() ?? '');
  };

  const handleSaveTarget = async (symbol: string) => {
    if (!onUpdateTarget) return;

    const target = editingTarget === '' ? null : parseFloat(editingTarget);
    if (target !== null && (isNaN(target) || target < 0 || target > 100)) {
      return;
    }

    try {
      await onUpdateTarget(symbol, target);
      setEditingSymbol(null);
    } catch (err) {
      console.error('Failed to update target:', err);
    }
  };

  const SortHeader = ({
    label,
    sortKeyValue,
    align = 'left',
  }: {
    label: string;
    sortKeyValue: SortKey;
    align?: 'left' | 'right';
  }) => (
    <th
      className={`px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200 transition-colors ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
      onClick={() => handleSort(sortKeyValue)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === sortKeyValue ? (
          sortDirection === 'asc' ? (
            <ArrowUp className="w-3 h-3" />
          ) : (
            <ArrowDown className="w-3 h-3" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-50" />
        )}
      </span>
    </th>
  );

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-slate-400 mt-4">Loading holdings...</p>
        </div>
      </div>
    );
  }

  if (holdings.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8 text-center">
        <p className="text-slate-400">No holdings yet. Add a BUY transaction to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-900/50 border-b border-slate-700/50">
            <tr>
              <SortHeader label="Symbol" sortKeyValue="symbol" />
              <SortHeader label="Price" sortKeyValue="currentPrice" align="right" />
              <SortHeader label="Shares" sortKeyValue="quantity" align="right" />
              <SortHeader label="Value" sortKeyValue="marketValue" align="right" />
              <SortHeader label="Weight" sortKeyValue="portfolioWeight" align="right" />
              <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">
                Target
              </th>
              <SortHeader label="Day" sortKeyValue="dayChangePercent" align="right" />
              <SortHeader label="Total" sortKeyValue="totalGainLossPercent" align="right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {sortedHoldings.map((holding) => {
              const isPositiveDay = holding.dayChangePercent >= 0;
              const isPositiveTotal = holding.totalGainLossPercent >= 0;
              const hasDrift = holding.driftPercent !== null && Math.abs(holding.driftPercent) > 2;
              const isEditing = editingSymbol === holding.symbol;

              return (
                <tr
                  key={holding.symbol}
                  className="hover:bg-slate-700/20 transition-colors"
                >
                  {/* Symbol */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {holding.symbol.substring(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-100">{holding.symbol}</p>
                        {holding.companyName && (
                          <p className="text-xs text-slate-500 truncate max-w-[150px]">
                            {holding.companyName}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="px-4 py-4 text-right">
                    <span className="text-slate-100 font-medium">
                      {formatCurrency(holding.currentPrice)}
                    </span>
                  </td>

                  {/* Shares */}
                  <td className="px-4 py-4 text-right">
                    <span className="text-slate-300">{formatNumber(holding.quantity)}</span>
                  </td>

                  {/* Value */}
                  <td className="px-4 py-4 text-right">
                    <span className="text-slate-100 font-medium">
                      {formatCurrency(holding.marketValue)}
                    </span>
                  </td>

                  {/* Weight */}
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all"
                          style={{ width: `${Math.min(holding.portfolioWeight, 100)}%` }}
                        />
                      </div>
                      <span className="text-slate-300 text-sm w-14 text-right">
                        {holding.portfolioWeight.toFixed(1)}%
                      </span>
                    </div>
                  </td>

                  {/* Target */}
                  <td className="px-4 py-4 text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-2">
                        <input
                          type="number"
                          value={editingTarget}
                          onChange={(e) => setEditingTarget(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveTarget(holding.symbol);
                            if (e.key === 'Escape') setEditingSymbol(null);
                          }}
                          className="w-16 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100 text-right"
                          placeholder="%"
                          min="0"
                          max="100"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveTarget(holding.symbol)}
                          className="p-1 bg-indigo-600 hover:bg-indigo-500 rounded text-white"
                        >
                          ✓
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        {holding.targetAllocationPercent !== null ? (
                          <>
                            <Target
                              className={`w-4 h-4 ${hasDrift ? 'text-amber-400' : 'text-slate-500'}`}
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
                        {onUpdateTarget && (
                          <button
                            onClick={() =>
                              handleStartEdit(holding.symbol, holding.targetAllocationPercent)
                            }
                            className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-slate-300 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Day Change */}
                  <td className="px-4 py-4 text-right">
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

                  {/* Total Return */}
                  <td className="px-4 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span
                        className={`font-medium ${
                          isPositiveTotal ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {formatCurrency(holding.totalGainLoss)}
                      </span>
                      <span
                        className={`text-xs ${
                          isPositiveTotal ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {formatPercent(holding.totalGainLossPercent)}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HoldingsDataGrid;

