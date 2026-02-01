/**
 * TradeRow Component
 *
 * Renders a single row in the TradeLogTable.
 * Memoized to prevent re-renders when other trades change.
 */
'use client';

import { memo } from 'react';
import { TradeWithPnL } from '@/types/models';

interface TradeRowProps {
  trade: TradeWithPnL;
  isClosing: boolean;
  closePrice: string;
  closeError: string | null;
  onCloseClick: (tradeId: string) => void;
  onCloseCancel: () => void;
  onCloseConfirm: (tradeId: string) => void;
  onClosePriceChange: (value: string) => void;
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
function getTradeDisplayPnL(trade: TradeWithPnL): number | null {
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

export const TradeRow = memo(function TradeRow({
  trade,
  isClosing,
  closePrice,
  closeError,
  onCloseClick,
  onCloseCancel,
  onCloseConfirm,
  onClosePriceChange,
}: TradeRowProps) {
  const pnl = getTradeDisplayPnL(trade);
  const pnlLabel = getPnLLabel(trade);

  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <td className="px-4 py-3 font-medium text-foreground">{trade.symbol}</td>
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
            <span className="text-xs text-orange-500">{trade.pnlError}</span>
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
                  onChange={(e) => onClosePriceChange(e.target.value)}
                  placeholder="Exit price"
                  className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-foreground"
                  aria-label="Exit price"
                />
                <button
                  onClick={() => onCloseConfirm(trade.id)}
                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                >
                  ✓
                </button>
                <button
                  onClick={onCloseCancel}
                  className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => onCloseClick(trade.id)}
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
});
