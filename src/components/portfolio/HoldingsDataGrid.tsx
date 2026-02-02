'use client';

/**
 * HoldingsDataGrid Component
 *
 * Feature-rich data grid for portfolio holdings with:
 * - 13 sortable columns matching PRD specifications
 * - Column visibility toggle (dropdown)
 * - Sticky header on scroll
 * - Row hover highlighting
 */

import { useState, useMemo, useCallback } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Settings2, Check } from 'lucide-react';
import { HoldingWithMarketData } from '@/types/portfolio';
import { HoldingRow } from './HoldingRow';

interface HoldingsDataGridProps {
  holdings: HoldingWithMarketData[];
  loading?: boolean;
  onUpdateTarget?: (symbol: string, target: number | null) => Promise<void>;
}

// All sortable column keys - exported for use in HoldingRow
export type ColumnKey =
  | 'symbol'
  | 'currentPrice'
  | 'dayChange'
  | 'dayChangePercent'
  | 'portfolioWeight'
  | 'quantity'
  | 'averageCostBasis'
  | 'todayGain'
  | 'todayGainPercent'
  | 'estimatedAnnualIncome'
  | 'totalGainLoss'
  | 'totalGainLossPercent'
  | 'marketValue';

type SortDirection = 'asc' | 'desc';

// Column definition for visibility management
interface ColumnDef {
  key: ColumnKey;
  label: string;
  shortLabel?: string;
  align: 'left' | 'right';
  defaultVisible: boolean;
}

const COLUMNS: ColumnDef[] = [
  { key: 'symbol', label: 'Symbol', align: 'left', defaultVisible: true },
  { key: 'currentPrice', label: 'Price', align: 'right', defaultVisible: true },
  { key: 'dayChange', label: 'Change ($)', shortLabel: 'Chg $', align: 'right', defaultVisible: true },
  { key: 'dayChangePercent', label: 'Change %', shortLabel: 'Chg %', align: 'right', defaultVisible: true },
  { key: 'portfolioWeight', label: 'Weight', align: 'right', defaultVisible: true },
  { key: 'quantity', label: 'Shares', align: 'right', defaultVisible: true },
  { key: 'averageCostBasis', label: 'Avg Cost', shortLabel: 'Cost', align: 'right', defaultVisible: true },
  { key: 'todayGain', label: "Today's Gain ($)", shortLabel: "Today $", align: 'right', defaultVisible: false },
  { key: 'todayGainPercent', label: "Today's Gain %", shortLabel: "Today %", align: 'right', defaultVisible: false },
  { key: 'estimatedAnnualIncome', label: 'Est. Annual Income', shortLabel: 'Income', align: 'right', defaultVisible: false },
  { key: 'totalGainLoss', label: 'Total Change ($)', shortLabel: 'Total $', align: 'right', defaultVisible: true },
  { key: 'totalGainLossPercent', label: 'Total Change %', shortLabel: 'Total %', align: 'right', defaultVisible: true },
  { key: 'marketValue', label: 'Value', align: 'right', defaultVisible: true },
];

export function HoldingsDataGrid({
  holdings,
  loading,
  onUpdateTarget,
}: HoldingsDataGridProps) {
  const [sortKey, setSortKey] = useState<ColumnKey>('marketValue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [editingSymbol, setEditingSymbol] = useState<string | null>(null);
  const [editingTarget, setEditingTarget] = useState<string>('');
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(() => {
    return new Set(COLUMNS.filter(c => c.defaultVisible).map(c => c.key));
  });

  // Memoize visible columns array for stable reference (fixes HoldingRow memo)
  const visibleColumnsArray = useMemo(
    () => Array.from(visibleColumns),
    [visibleColumns]
  );

  const sortedHoldings = useMemo(() => {
    return [...holdings].sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      // Handle null/undefined values
      if (aVal === null || aVal === undefined) aVal = -Infinity;
      if (bVal === null || bVal === undefined) bVal = -Infinity;

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

  const handleSort = useCallback((key: ColumnKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  }, [sortKey]);

  const toggleColumn = useCallback((key: ColumnKey) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        // Don't allow hiding all columns - keep at least symbol and value
        if (key !== 'symbol' && key !== 'marketValue') {
          next.delete(key);
        }
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // Close column menu on Escape key
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && showColumnMenu) {
      setShowColumnMenu(false);
    }
  }, [showColumnMenu]);

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
    column,
  }: {
    column: ColumnDef;
  }) => (
    <th
      className={`px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200 transition-colors whitespace-nowrap ${
        column.align === 'right' ? 'text-right' : 'text-left'
      }`}
      onClick={() => handleSort(column.key)}
    >
      <span className="inline-flex items-center gap-1">
        {column.shortLabel || column.label}
        {sortKey === column.key ? (
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

  const activeColumns = COLUMNS.filter(c => visibleColumns.has(c.key));

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Column Visibility Toggle */}
      <div className="px-4 py-2 border-b border-slate-700/50 flex justify-between items-center">
        <span className="text-sm text-slate-400">
          {holdings.length} holding{holdings.length !== 1 ? 's' : ''}
        </span>
        <div className="relative" onKeyDown={handleKeyDown}>
          <button
            onClick={() => setShowColumnMenu(!showColumnMenu)}
            aria-label="Toggle column visibility"
            aria-expanded={showColumnMenu}
            aria-haspopup="menu"
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <Settings2 className="w-4 h-4" />
            <span>Columns</span>
          </button>

          {showColumnMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowColumnMenu(false)}
                aria-hidden="true"
              />
              <div
                className="absolute right-0 top-full mt-1 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 py-1"
                role="menu"
                aria-label="Column visibility options"
              >
                {COLUMNS.map(column => (
                  <button
                    key={column.key}
                    role="menuitemcheckbox"
                    aria-checked={visibleColumns.has(column.key)}
                    onClick={() => toggleColumn(column.key)}
                    disabled={column.key === 'symbol' || column.key === 'marketValue'}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-700/50 transition-colors ${
                      column.key === 'symbol' || column.key === 'marketValue'
                        ? 'text-slate-500 cursor-not-allowed'
                        : 'text-slate-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      visibleColumns.has(column.key)
                        ? 'bg-indigo-500 border-indigo-500'
                        : 'border-slate-600'
                    }`}>
                      {visibleColumns.has(column.key) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    {column.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Table with sticky header */}
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full">
          <thead className="bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-700/50">
            <tr>
              {activeColumns.map(column => (
                <SortHeader key={column.key} column={column} />
              ))}
              {/* Target column (not sortable) */}
              <th className="px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right whitespace-nowrap">
                Target
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {sortedHoldings.map((holding) => (
              <HoldingRow
                key={holding.symbol}
                holding={holding}
                visibleColumns={visibleColumnsArray}
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
