/**
 * Trade Adapters - Type conversion utilities for Trade Tracker integration
 *
 * These adapters convert between the unified portfolio transaction types
 * and the TradeWithPnL types used by the Trade Tracker UI components.
 */

import { TradePosition, TradeStats } from '@/types/portfolio';
import { TradeWithPnL, TradeSide, TradeStatus } from '@/types/models';

/**
 * Converts a TradePosition (from PortfolioService) to TradeWithPnL (for UI components).
 * TradeWithPnL is used by TradeLogTable, TradeRow, and other Trade Tracker components.
 *
 * @param trade - The trade position from portfolio transactions
 * @param currentPrice - Optional current market price for unrealized P&L
 * @returns TradeWithPnL compatible with Trade Tracker UI
 */
export function tradePositionToTradeWithPnL(
  trade: TradePosition,
  currentPrice?: number
): TradeWithPnL {
  // Calculate unrealized P&L for open trades
  let unrealizedPnl: number | undefined;
  if (trade.status === 'OPEN' && currentPrice && currentPrice > 0) {
    if (trade.side === 'SHORT') {
      unrealizedPnl = (trade.entryPrice - currentPrice) * trade.quantity;
    } else {
      unrealizedPnl = (currentPrice - trade.entryPrice) * trade.quantity;
    }
  } else if (trade.unrealizedPnl !== undefined && trade.unrealizedPnl !== null) {
    unrealizedPnl = trade.unrealizedPnl;
  }

  return {
    id: trade.id,
    userId: trade.portfolioId, // Use portfolioId as userId for compatibility
    symbol: trade.symbol,
    side: trade.side as TradeSide,
    status: trade.status as TradeStatus,
    entryPrice: trade.entryPrice,
    quantity: trade.quantity,
    entryDate: trade.entryDate,
    exitPrice: trade.exitPrice,
    exitDate: trade.exitDate,
    fees: trade.fees,
    realizedPnl: trade.realizedPnl,
    notes: trade.notes,
    predictionId: null, // Not supported in portfolio transactions
    createdAt: trade.createdAt,
    updatedAt: trade.createdAt, // Use createdAt as fallback
    unrealizedPnl,
    currentPrice,
  };
}

/**
 * Converts an array of TradePositions to TradeWithPnL array.
 *
 * @param trades - Array of trade positions
 * @param priceMap - Optional map of symbol to current price
 * @returns Array of TradeWithPnL
 */
export function tradePositionsToTradesWithPnL(
  trades: TradePosition[],
  priceMap?: Map<string, number>
): TradeWithPnL[] {
  return trades.map(trade => {
    const currentPrice = priceMap?.get(trade.symbol) ?? trade.currentPrice ?? undefined;
    return tradePositionToTradeWithPnL(trade, currentPrice);
  });
}

/**
 * Formats trade statistics for display.
 *
 * @param stats - TradeStats from PortfolioService
 * @returns Formatted stats with display values
 */
export function formatTradeStats(stats: TradeStats): {
  totalRealizedPnl: string;
  totalUnrealizedPnl: string;
  totalPnl: string;
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  winRate: string;
  avgWin: string;
  avgLoss: string;
  bestTrade: string;
  worstTrade: string;
} {
  const formatCurrency = (value: number | null): string => {
    if (value === null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number | null): string => {
    if (value === null) return '-';
    return `${value.toFixed(1)}%`;
  };

  const totalPnl = stats.totalRealizedPnl + stats.totalUnrealizedPnl;

  return {
    totalRealizedPnl: formatCurrency(stats.totalRealizedPnl),
    totalUnrealizedPnl: formatCurrency(stats.totalUnrealizedPnl),
    totalPnl: formatCurrency(totalPnl),
    totalTrades: stats.totalTrades,
    openTrades: stats.openTrades,
    closedTrades: stats.closedTrades,
    winRate: formatPercent(stats.winRate),
    avgWin: formatCurrency(stats.avgWin),
    avgLoss: formatCurrency(stats.avgLoss),
    bestTrade: formatCurrency(stats.bestTrade),
    worstTrade: formatCurrency(stats.worstTrade),
  };
}

/**
 * Calculates P&L percentage for a trade.
 *
 * @param entryPrice - Entry price
 * @param exitOrCurrentPrice - Exit price (closed) or current price (open)
 * @param side - Trade side (LONG or SHORT)
 * @returns P&L percentage
 */
export function calculatePnLPercent(
  entryPrice: number,
  exitOrCurrentPrice: number,
  side: TradeSide | 'LONG' | 'SHORT'
): number {
  if (entryPrice <= 0) return 0;

  if (side === 'SHORT') {
    return ((entryPrice - exitOrCurrentPrice) / entryPrice) * 100;
  }
  return ((exitOrCurrentPrice - entryPrice) / entryPrice) * 100;
}

/**
 * Determines if a trade is profitable.
 *
 * @param pnl - P&L value (realized or unrealized)
 * @returns true if profitable, false if loss, null if no P&L
 */
export function isProfitable(pnl: number | null | undefined): boolean | null {
  if (pnl === null || pnl === undefined) return null;
  return pnl > 0;
}

/**
 * Gets the CSS color class for P&L display.
 *
 * @param pnl - P&L value
 * @returns Tailwind CSS color class
 */
export function getPnLColorClass(pnl: number | null | undefined): string {
  if (pnl === null || pnl === undefined || pnl === 0) return 'text-slate-400';
  return pnl > 0 ? 'text-emerald-400' : 'text-red-400';
}
