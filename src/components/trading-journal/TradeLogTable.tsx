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
 * Formats a number as currency
 */
function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '-';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats a date for display
 */
function formatDate(date: Date | null | undefined): string {
  if (!date) {
    return '-';
  }
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date instanceof Date ? date : new Date(date));
}

/**
 * Gets the P&L value for a trade (unrealized for open, realized for closed)
 */
export function getTradeDisplayPnL(trade: TradeWithPnL): number | null {
  if (trade.status === 'OPEN') {
    return trade.unrealizedPnl ?? null;
  }
  return trade.realizedPnl;
}

/**
 * Gets the P&L label for a trade
 */
function getPnLLabel(trade: TradeWithPnL): string {
  if (trade.status === 'OPEN') {
    return 'Unrealized';
  }
  return 'Realized';
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
          {sortedTrades.map((trade) => {
            const pnl = getTradeDisplayPnL(trade);
            const pnlLabel = getPnLLabel(trade);
            const isClosing = closingTradeId === trade.id;

            return (
              <tr
                key={trade.id}
                className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <td className="px-4 py-3 font-medium text-foreground">
                  {trade.symbol}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      trade.side === 'LONG'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}
                  >
                    {trade.side}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      trade.status === 'OPEN'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {trade.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-foreground">
                  {formatCurrency(trade.entryPrice)}
                </td>
                <td className="px-4 py-3 text-foreground">
                  {formatCurrency(trade.exitPrice)}
                </td>
                <td className="px-4 py-3 text-foreground">{trade.quantity}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span
                      className={`font-medium ${
                        pnl === null
                          ? 'text-gray-500'
                          : pnl >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {pnl !== null ? formatCurrency(pnl) : '-'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {pnlLabel}
                    </span>
                    {trade.pnlError && (
                      <span className="text-xs text-orange-500">
                        {trade.pnlError}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-foreground text-sm">
                  {formatDate(trade.entryDate)}
                </td>
                <td className="px-4 py-3">
                  {trade.status === 'OPEN' && (
                    <>
                      {isClosing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={closePrice}
                            onChange={(e) => setClosePrice(e.target.value)}
                            placeholder="Exit price"
                            className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-foreground"
                            aria-label="Exit price"
                          />
                          <button
                            onClick={() => handleCloseConfirm(trade.id)}
                            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            ✓
                          </button>
                          <button
                            onClick={handleCloseCancel}
                            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleCloseClick(trade.id)}
                          className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
                        >
                          Close
                        </button>
                      )}
                      {closeError && isClosing && (
                        <p className="text-xs text-red-500 mt-1">{closeError}</p>
                      )}
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default TradeLogTable;
