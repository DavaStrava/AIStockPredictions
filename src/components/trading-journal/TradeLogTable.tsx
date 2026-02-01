'use client';

/**
 * TradeLogTable Component
 * Displays trades in a sortable table with P&L information.
 * Shows unrealized P&L for open trades, realized P&L for closed trades.
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
  onCloseTrade: (tradeId: string) => void;
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
  loading = false,
}: TradeLogTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('entryDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [closingTradeId, setClosingTradeId] = useState<string | null>(null);
  const [closePrice, setClosePrice] = useState('');
  const [closeError, setCloseError] = useState<string | null>(null);

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
    setClosingTradeId(tradeId);
    setClosePrice('');
    setCloseError(null);
  };

  const handleCloseCancel = () => {
    setClosingTradeId(null);
    setClosePrice('');
    setCloseError(null);
  };

  const handleCloseConfirm = async (tradeId: string) => {
    const price = parseFloat(closePrice);
    if (isNaN(price) || price <= 0) {
      setCloseError('Please enter a valid positive price');
      return;
    }

    try {
      onCloseTrade(tradeId);
      setClosingTradeId(null);
      setClosePrice('');
      setCloseError(null);
    } catch {
      setCloseError('Failed to close trade');
    }
  };

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
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" role="grid">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <SortHeader column="symbol">Symbol</SortHeader>
            <SortHeader column="side">Side</SortHeader>
            <SortHeader column="status">Status</SortHeader>
            <SortHeader column="entryPrice">Entry Price</SortHeader>
            <SortHeader column="exitPrice">Exit Price</SortHeader>
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
              isClosing={closingTradeId === trade.id}
              closePrice={closePrice}
              closeError={closeError}
              onCloseClick={handleCloseClick}
              onCloseCancel={handleCloseCancel}
              onCloseConfirm={handleCloseConfirm}
              onClosePriceChange={setClosePrice}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TradeLogTable;
