'use client';

/**
 * TradeLogTable Component
 * Displays trades in a sortable table with P&L information.
 * Shows unrealized P&L for open trades, realized P&L for closed trades.
 * Supports multi-select for bulk deletion.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import { useState, useCallback, useMemo } from 'react';
import { TradeWithPnL } from '@/types/models';
import { TradeRow } from './TradeRow';

export type SortColumn =
  | 'symbol'
  | 'side'
  | 'status'
  | 'entryPrice'
  | 'exitPrice'
  | 'quantity'
  | 'pnl'
  | 'entryDate';

export type SortDirection = 'asc' | 'desc';

export interface TradeLogTableProps {
  trades: TradeWithPnL[];
  onCloseTrade: (tradeId: string, exitPrice: number, quantity: number) => void;
  onDeleteTrades: (tradeIds: string[]) => Promise<void>;
  loading?: boolean;
}

/**
 * Gets the P&L value for a trade (unrealized for open, realized for closed)
 * Exported for use in sorting logic
 */
export function getTradeDisplayPnL(trade: TradeWithPnL): number | null {
  if (trade.status === 'OPEN') {
    return trade.unrealizedPnl ?? null;
  }
  return trade.realizedPnl;
}

export function TradeLogTable({
  trades,
  onCloseTrade,
  onDeleteTrades,
  loading = false,
}: TradeLogTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('entryDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [closingTradeId, setClosingTradeId] = useState<string | null>(null);
  const [closePrice, setClosePrice] = useState('');
  const [closeQuantity, setCloseQuantity] = useState('');
  const [closeError, setCloseError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSort = useCallback((column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }, [sortColumn]);

  const sortedTrades = useMemo(() => {
    const sorted = [...trades].sort((a, b) => {
      let aValue: string | number | Date | null;
      let bValue: string | number | Date | null;

      switch (sortColumn) {
        case 'symbol':
          aValue = a.symbol;
          bValue = b.symbol;
          break;
        case 'side':
          aValue = a.side;
          bValue = b.side;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'entryPrice':
          aValue = a.entryPrice;
          bValue = b.entryPrice;
          break;
        case 'exitPrice':
          aValue = a.exitPrice ?? 0;
          bValue = b.exitPrice ?? 0;
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'pnl':
          aValue = getTradeDisplayPnL(a) ?? 0;
          bValue = getTradeDisplayPnL(b) ?? 0;
          break;
        case 'entryDate':
          aValue = a.entryDate;
          bValue = b.entryDate;
          break;
        default:
          return 0;
      }

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;
      if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else {
        comparison = (aValue as number) - (bValue as number);
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [trades, sortColumn, sortDirection]);

  const handleCloseClick = (tradeId: string) => {
    const trade = trades.find((t) => t.id === tradeId);
    setClosingTradeId(tradeId);
    setClosePrice('');
    setCloseQuantity(trade ? String(trade.quantity) : '');
    setCloseError(null);
  };

  const handleCloseCancel = () => {
    setClosingTradeId(null);
    setClosePrice('');
    setCloseQuantity('');
    setCloseError(null);
  };

  const handleCloseConfirm = async (tradeId: string) => {
    const trade = trades.find((t) => t.id === tradeId);
    if (!trade) return;

    const price = parseFloat(closePrice);
    if (isNaN(price) || price <= 0) {
      setCloseError('Please enter a valid positive price');
      return;
    }

    const quantity = parseFloat(closeQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      setCloseError('Please enter a valid quantity');
      return;
    }

    if (quantity > trade.quantity) {
      setCloseError(`Quantity cannot exceed ${trade.quantity}`);
      return;
    }

    try {
      onCloseTrade(tradeId, price, quantity);
      setClosingTradeId(null);
      setClosePrice('');
      setCloseQuantity('');
      setCloseError(null);
    } catch {
      setCloseError('Failed to sell position');
    }
  };

  // Selection handlers
  const handleSelectChange = useCallback((tradeId: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(tradeId);
      } else {
        next.delete(tradeId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(sortedTrades.map((t) => t.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [sortedTrades]);

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.size} trade(s)? This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await onDeleteTrades(Array.from(selectedIds));
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Failed to delete trades:', error);
      alert('Failed to delete trades. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const allSelected = sortedTrades.length > 0 && selectedIds.size === sortedTrades.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < sortedTrades.length;

  const SortHeader = ({
    column,
    children,
  }: {
    column: SortColumn;
    children: React.ReactNode;
  }) => (
    <th
      className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
      onClick={() => handleSort(column)}
      role="columnheader"
      aria-sort={
        sortColumn === column
          ? sortDirection === 'asc'
            ? 'ascending'
            : 'descending'
          : 'none'
      }
    >
      <div className="flex items-center gap-1">
        {children}
        {sortColumn === column && (
          <span className="text-blue-600 dark:text-blue-400">
            {sortDirection === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Loading trades...
        </span>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          No trades yet. Start by logging your first trade!
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <span className="text-sm text-blue-700 dark:text-blue-300">
            {selectedIds.size} trade(s) selected
          </span>
          <button
            onClick={handleDeleteSelected}
            disabled={isDeleting}
            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                Deleting...
              </>
            ) : (
              <>Delete Selected</>
            )}
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse" role="grid">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              {/* Select all checkbox */}
              <th className="px-4 py-3 w-12">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                  aria-label="Select all trades"
                />
              </th>
              <SortHeader column="symbol">Symbol</SortHeader>
              <SortHeader column="side">Side</SortHeader>
              <SortHeader column="status">Status</SortHeader>
              <SortHeader column="entryPrice">Entry Price</SortHeader>
              <SortHeader column="exitPrice">Sell Price</SortHeader>
              <SortHeader column="quantity">Quantity</SortHeader>
              <SortHeader column="pnl">P&L</SortHeader>
              <SortHeader column="entryDate">Entry Date</SortHeader>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedTrades.map((trade) => (
              <TradeRow
                key={trade.id}
                trade={trade}
                isSelected={selectedIds.has(trade.id)}
                isClosing={closingTradeId === trade.id}
                closePrice={closePrice}
                closeQuantity={closeQuantity}
                closeError={closeError}
                onSelectChange={handleSelectChange}
                onCloseClick={handleCloseClick}
                onCloseCancel={handleCloseCancel}
                onCloseConfirm={handleCloseConfirm}
                onClosePriceChange={setClosePrice}
                onCloseQuantityChange={setCloseQuantity}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TradeLogTable;
