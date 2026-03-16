/**
 * Trade Matching Tests
 *
 * Tests for the FIFO trade matching logic used when importing
 * Merrill transactions as trades.
 */

import { describe, it, expect } from 'vitest';
import type { ParsedPortfolioTransaction, ParsedTrade } from '@/types/csv';

// Type with pre-computed timestamp for performance
type TxWithTimestamp = ParsedPortfolioTransaction & { _timestamp: number };

/**
 * FIFO trade matching logic extracted for testing.
 * Matches SELL transactions with BUY transactions respecting chronology.
 */
function matchTransactionsToTrades(
  transactions: ParsedPortfolioTransaction[]
): ParsedTrade[] {
  // Filter and add pre-computed timestamps
  const buyTrades: TxWithTimestamp[] = transactions
    .filter((t) => t.transactionType === 'BUY' && t.symbol && t.quantity && t.pricePerShare)
    .map((t) => ({ ...t, _timestamp: new Date(t.transactionDate).getTime() }));
  const sellTrades: TxWithTimestamp[] = transactions
    .filter((t) => t.transactionType === 'SELL' && t.symbol && t.quantity && t.pricePerShare)
    .map((t) => ({ ...t, _timestamp: new Date(t.transactionDate).getTime() }));

  // Sort both by timestamp (oldest first)
  buyTrades.sort((a, b) => a._timestamp - b._timestamp);
  sellTrades.sort((a, b) => a._timestamp - b._timestamp);

  // Track open buys per symbol (FIFO queue)
  const openBuysPerSymbol = new Map<string, TxWithTimestamp[]>();

  // Process all buys first to build the queue
  for (const buy of buyTrades) {
    const symbol = buy.symbol!;
    if (!openBuysPerSymbol.has(symbol)) {
      openBuysPerSymbol.set(symbol, []);
    }
    openBuysPerSymbol.get(symbol)!.push(buy);
  }

  const trades: ParsedTrade[] = [];

  // Process sells by matching against open buys (FIFO)
  for (const sell of sellTrades) {
    const symbol = sell.symbol!;
    const openBuys = openBuysPerSymbol.get(symbol);
    const sellDate = sell._timestamp;

    if (openBuys && openBuys.length > 0) {
      // Find the first BUY that occurred before this SELL
      const eligibleBuyIndex = openBuys.findIndex((buy) => buy._timestamp <= sellDate);

      if (eligibleBuyIndex === -1) {
        // No BUY occurred before this SELL - skip
        continue;
      }

      const matchedBuy = openBuys.splice(eligibleBuyIndex, 1)[0];
      const entryPrice = matchedBuy.pricePerShare!;
      const exitPrice = sell.pricePerShare!;
      const quantity = Math.min(matchedBuy.quantity!, sell.quantity!);
      const fees = (matchedBuy.fees || 0) + (sell.fees || 0);
      const realizedPnl = (exitPrice - entryPrice) * quantity - fees;

      trades.push({
        symbol,
        side: 'LONG' as const,
        status: 'CLOSED' as const,
        entryPrice,
        quantity,
        entryDate: matchedBuy.transactionDate,
        exitPrice,
        exitDate: sell.transactionDate,
        fees,
        realizedPnl,
        notes: null,
      });

      // Handle partial fills
      const remainingBuyQty = matchedBuy.quantity! - quantity;
      if (remainingBuyQty > 0) {
        openBuys.splice(eligibleBuyIndex, 0, {
          ...matchedBuy,
          quantity: remainingBuyQty,
        });
      }

      let remainingSellQty = sell.quantity! - quantity;
      while (remainingSellQty > 0) {
        const nextEligibleIndex = openBuys.findIndex((buy) => buy._timestamp <= sellDate);
        if (nextEligibleIndex === -1) break;

        const nextBuy = openBuys.splice(nextEligibleIndex, 1)[0];
        const matchQty = Math.min(nextBuy.quantity!, remainingSellQty);
        const nextEntryPrice = nextBuy.pricePerShare!;
        const nextFees = (nextBuy.fees || 0) + ((sell.fees || 0) * (matchQty / sell.quantity!));
        const nextPnl = (exitPrice - nextEntryPrice) * matchQty - nextFees;

        trades.push({
          symbol,
          side: 'LONG' as const,
          status: 'CLOSED' as const,
          entryPrice: nextEntryPrice,
          quantity: matchQty,
          entryDate: nextBuy.transactionDate,
          exitPrice,
          exitDate: sell.transactionDate,
          fees: nextFees,
          realizedPnl: nextPnl,
          notes: null,
        });

        remainingSellQty -= matchQty;
        const nextRemainingBuyQty = nextBuy.quantity! - matchQty;
        if (nextRemainingBuyQty > 0) {
          openBuys.splice(nextEligibleIndex, 0, {
            ...nextBuy,
            quantity: nextRemainingBuyQty,
          });
        }
      }
    }
  }

  // Add remaining open buys as OPEN trades
  for (const [, openBuys] of openBuysPerSymbol) {
    for (const buy of openBuys) {
      trades.push({
        symbol: buy.symbol!,
        side: 'LONG' as const,
        status: 'OPEN' as const,
        entryPrice: buy.pricePerShare!,
        quantity: buy.quantity!,
        entryDate: buy.transactionDate,
        exitPrice: null,
        exitDate: null,
        fees: buy.fees || 0,
        realizedPnl: null,
        notes: null,
      });
    }
  }

  return trades;
}

// Helper to create test transactions
function createTransaction(
  type: 'BUY' | 'SELL',
  symbol: string,
  quantity: number,
  price: number,
  date: string
): ParsedPortfolioTransaction {
  return {
    transactionType: type,
    symbol,
    quantity,
    pricePerShare: price,
    totalAmount: quantity * price,
    fees: 0,
    transactionDate: new Date(date),
    notes: '',
  };
}

describe('Trade Matching (FIFO with Chronology)', () => {
  describe('Basic matching', () => {
    it('should match BUY then SELL chronologically', () => {
      const transactions = [
        createTransaction('BUY', 'AAPL', 100, 150, '2026-01-10'),
        createTransaction('SELL', 'AAPL', 100, 160, '2026-01-15'),
      ];

      const trades = matchTransactionsToTrades(transactions);

      expect(trades).toHaveLength(1);
      expect(trades[0].status).toBe('CLOSED');
      expect(trades[0].entryPrice).toBe(150);
      expect(trades[0].exitPrice).toBe(160);
      expect(trades[0].realizedPnl).toBe(1000); // (160-150) * 100
    });

    it('should leave BUY as OPEN when no SELL follows', () => {
      const transactions = [
        createTransaction('BUY', 'AAPL', 100, 150, '2026-01-10'),
      ];

      const trades = matchTransactionsToTrades(transactions);

      expect(trades).toHaveLength(1);
      expect(trades[0].status).toBe('OPEN');
      expect(trades[0].entryPrice).toBe(150);
      expect(trades[0].exitPrice).toBeNull();
    });
  });

  describe('Chronological validation', () => {
    it('should skip SELL that occurs before any BUY', () => {
      const transactions = [
        createTransaction('SELL', 'TTMI', 350, 88, '2026-03-06'),
        createTransaction('BUY', 'TTMI', 150, 98.22, '2026-03-10'),
      ];

      const trades = matchTransactionsToTrades(transactions);

      // The SELL should be skipped (can't sell before buying)
      // The BUY should remain OPEN
      expect(trades).toHaveLength(1);
      expect(trades[0].status).toBe('OPEN');
      expect(trades[0].symbol).toBe('TTMI');
      expect(trades[0].quantity).toBe(150);
      expect(trades[0].entryPrice).toBe(98.22);
    });

    it('should only match SELLs with BUYs that occurred before', () => {
      const transactions = [
        createTransaction('BUY', 'AAPL', 50, 100, '2026-01-01'),
        createTransaction('SELL', 'AAPL', 100, 110, '2026-01-15'),
        createTransaction('BUY', 'AAPL', 50, 105, '2026-01-20'),
      ];

      const trades = matchTransactionsToTrades(transactions);

      // Should have 2 trades:
      // 1. CLOSED: BUY 50 @ 100 matched with partial SELL (50 shares)
      // 2. OPEN: BUY 50 @ 105 (occurred after the SELL, not matched)
      expect(trades).toHaveLength(2);

      const closedTrade = trades.find((t) => t.status === 'CLOSED');
      const openTrade = trades.find((t) => t.status === 'OPEN');

      expect(closedTrade).toBeDefined();
      expect(closedTrade!.quantity).toBe(50);
      expect(closedTrade!.entryPrice).toBe(100);

      expect(openTrade).toBeDefined();
      expect(openTrade!.quantity).toBe(50);
      expect(openTrade!.entryPrice).toBe(105);
    });
  });

  describe('FIFO ordering', () => {
    it('should match oldest BUY first (FIFO)', () => {
      const transactions = [
        createTransaction('BUY', 'AAPL', 50, 100, '2026-01-01'),
        createTransaction('BUY', 'AAPL', 50, 110, '2026-01-05'),
        createTransaction('SELL', 'AAPL', 50, 120, '2026-01-10'),
      ];

      const trades = matchTransactionsToTrades(transactions);

      // Should match with the FIRST buy (@ 100), leaving second buy open
      expect(trades).toHaveLength(2);

      const closedTrade = trades.find((t) => t.status === 'CLOSED');
      const openTrade = trades.find((t) => t.status === 'OPEN');

      expect(closedTrade!.entryPrice).toBe(100); // First BUY
      expect(closedTrade!.exitPrice).toBe(120);

      expect(openTrade!.entryPrice).toBe(110); // Second BUY remains open
    });
  });

  describe('Partial fills', () => {
    it('should handle SELL larger than single BUY', () => {
      const transactions = [
        createTransaction('BUY', 'AAPL', 30, 100, '2026-01-01'),
        createTransaction('BUY', 'AAPL', 30, 105, '2026-01-02'),
        createTransaction('SELL', 'AAPL', 50, 120, '2026-01-10'),
      ];

      const trades = matchTransactionsToTrades(transactions);

      // Should create 2 CLOSED trades (30 from first BUY, 20 from second)
      // Plus 1 OPEN trade (remaining 10 shares from second BUY)
      expect(trades).toHaveLength(3);

      const closedTrades = trades.filter((t) => t.status === 'CLOSED');
      const openTrades = trades.filter((t) => t.status === 'OPEN');

      expect(closedTrades).toHaveLength(2);
      expect(closedTrades[0].quantity).toBe(30);
      expect(closedTrades[0].entryPrice).toBe(100);
      expect(closedTrades[1].quantity).toBe(20);
      expect(closedTrades[1].entryPrice).toBe(105);

      expect(openTrades).toHaveLength(1);
      expect(openTrades[0].quantity).toBe(10);
      expect(openTrades[0].entryPrice).toBe(105);
    });

    it('should handle BUY larger than SELL', () => {
      const transactions = [
        createTransaction('BUY', 'AAPL', 100, 100, '2026-01-01'),
        createTransaction('SELL', 'AAPL', 30, 120, '2026-01-10'),
      ];

      const trades = matchTransactionsToTrades(transactions);

      // Should create 1 CLOSED (30 shares) and 1 OPEN (70 shares)
      expect(trades).toHaveLength(2);

      const closedTrade = trades.find((t) => t.status === 'CLOSED');
      const openTrade = trades.find((t) => t.status === 'OPEN');

      expect(closedTrade!.quantity).toBe(30);
      expect(openTrade!.quantity).toBe(70);
    });
  });

  describe('Multiple symbols', () => {
    it('should track symbols independently', () => {
      const transactions = [
        createTransaction('BUY', 'AAPL', 100, 150, '2026-01-01'),
        createTransaction('BUY', 'GOOGL', 50, 200, '2026-01-02'),
        createTransaction('SELL', 'AAPL', 100, 160, '2026-01-10'),
      ];

      const trades = matchTransactionsToTrades(transactions);

      expect(trades).toHaveLength(2);

      const aaplTrade = trades.find((t) => t.symbol === 'AAPL');
      const googlTrade = trades.find((t) => t.symbol === 'GOOGL');

      expect(aaplTrade!.status).toBe('CLOSED');
      expect(googlTrade!.status).toBe('OPEN');
    });
  });

  describe('P&L calculation', () => {
    it('should calculate positive P&L correctly', () => {
      const transactions = [
        createTransaction('BUY', 'AAPL', 100, 100, '2026-01-01'),
        createTransaction('SELL', 'AAPL', 100, 150, '2026-01-10'),
      ];

      const trades = matchTransactionsToTrades(transactions);

      expect(trades[0].realizedPnl).toBe(5000); // (150-100) * 100
    });

    it('should calculate negative P&L correctly', () => {
      const transactions = [
        createTransaction('BUY', 'AAPL', 100, 150, '2026-01-01'),
        createTransaction('SELL', 'AAPL', 100, 100, '2026-01-10'),
      ];

      const trades = matchTransactionsToTrades(transactions);

      expect(trades[0].realizedPnl).toBe(-5000); // (100-150) * 100
    });
  });
});
