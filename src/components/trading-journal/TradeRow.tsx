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
  isSelected: boolean;
  isClosing: boolean;
  closePrice: string;
  closeQuantity: string;
  closeError: string | null;
  onSelectChange: (tradeId: string, selected: boolean) => void;
  onCloseClick: (tradeId: string) => void;
  onCloseCancel: () => void;
  onCloseConfirm: (tradeId: string) => void;
  onClosePriceChange: (value: string) => void;
  onCloseQuantityChange: (value: string) => void;
  onEditClick?: (trade: TradeWithPnL) => void;
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
  isSelected,
  isClosing,
  closePrice,
  closeQuantity,
  closeError,
  onSelectChange,
  onCloseClick,
  onCloseCancel,
  onCloseConfirm,
  onClosePriceChange,
  onCloseQuantityChange,
  onEditClick,
}: TradeRowProps) {
  const pnl = getTradeDisplayPnL(trade);
  const pnlLabel = getPnLLabel(trade);

  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
      {/* Selection checkbox */}
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelectChange(trade.id, e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
          aria-label={`Select trade ${trade.symbol}`}
        />
      </td>
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
          {trade.status === 'OPEN' ? 'OPEN' : 'SOLD'}
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
        <div className="flex items-center gap-2">
          {/* Edit button - always visible */}
          {onEditClick && (
            <button
              onClick={() => onEditClick(trade)}
              className="px-2 py-1 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
              title={trade.notes ? 'Edit notes' : 'Add notes'}
            >
              {trade.notes ? '📝' : '➕'}
            </button>
          )}

          {/* Sell button - only for OPEN trades */}
          {trade.status === 'OPEN' && (
            <>
              {isClosing ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={closePrice}
                      onChange={(e) => onClosePriceChange(e.target.value)}
                      placeholder="Sell price"
                      className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-foreground"
                      aria-label="Sell price"
                    />
                    <input
                      type="number"
                      step="1"
                      min="1"
                      max={trade.quantity}
                      value={closeQuantity}
                      onChange={(e) => onCloseQuantityChange(e.target.value)}
                      placeholder="Qty"
                      className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-foreground"
                      aria-label="Sell quantity"
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
                  <span className="text-xs text-gray-500">
                    Max: {trade.quantity} shares
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => onCloseClick(trade.id)}
                  className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
                >
                  Sell Position
                </button>
              )}
              {closeError && isClosing && (
                <p className="text-xs text-red-500 mt-1">{closeError}</p>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );
});
