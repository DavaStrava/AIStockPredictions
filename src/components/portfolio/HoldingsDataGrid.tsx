'use client';

/**
 * HoldingsDataGrid Component
 *
 * Displays portfolio holdings in a sortable, filterable data grid.
 * Shows: Symbol, Price, Shares, Value, Weight, Target, Day Change, Total Return.
 */

import { useState, useMemo, useCallback } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { HoldingWithMarketData } from '@/types/portfolio';
import { HoldingRow } from './HoldingRow';

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

  const handleStartEdit = useCallback((symbol: string, currentTarget: number | null) => {
    setEditingSymbol(symbol);
    setEditingTarget(currentTarget?.toString() ?? '');
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingSymbol(null);
    setEditingTarget('');
  }, []);

  const handleEditingTargetChange = useCallback((value: string) => {
    setEditingTarget(value);
  }, []);

  const handleSaveTarget = useCallback(async (symbol: string) => {
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
  }, [editingTarget, onUpdateTarget]);

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
            {sortedHoldings.map((holding) => (
              <HoldingRow
                key={holding.symbol}
                holding={holding}
                isEditing={editingSymbol === holding.symbol}
                editingTarget={editingTarget}
                onStartEdit={handleStartEdit}
                onEditingTargetChange={handleEditingTargetChange}
                onSaveTarget={handleSaveTarget}
                onCancelEdit={handleCancelEdit}
                showTargetEdit={!!onUpdateTarget}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HoldingsDataGrid;





