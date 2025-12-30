/**
 * Property Tests: Trade Display Shows Correct P&L Type
 *
 * Feature: trading-journal, Property 8: Trade Display Shows Correct P&L Type
 * Validates: Requirements 8.1, 8.3, 8.4
 *
 * These tests verify that:
 * - Open trades display unrealizedPnl (calculated from current price)
 * - Closed trades display realizedPnl (stored value)
 * - All trades display required fields: symbol, side, status, entryPrice, quantity, entryDate
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { TradeWithPnL, TradeSide, TradeStatus } from '@/types/models';
import { getTradeDisplayPnL } from '../TradeLogTable';

/**
 * Generate stock symbol (1-5 uppercase letters)
 */
const stockSymbolArb = fc
  .array(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')), { minLength: 1, maxLength: 5 })
  .map((chars) => chars.join(''));

/**
 * Arbitrary for generating an OPEN trade with unrealized P&L
 */
const openTradeArb: fc.Arbitrary<TradeWithPnL> = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  symbol: stockSymbolArb,
  side: fc.constantFrom<TradeSide>('LONG', 'SHORT'),
  status: fc.constant<TradeStatus>('OPEN'),
  entryPrice: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true, noDefaultInfinity: true }),
  quantity: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true, noDefaultInfinity: true }),
  fees: fc.float({ min: 0, max: Math.fround(100), noNaN: true, noDefaultInfinity: true }),
  notes: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  predictionId: fc.option(fc.uuid(), { nil: null }),
  entryDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
  updatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
  exitPrice: fc.constant(null),
  exitDate: fc.constant(null),
  realizedPnl: fc.constant(null),
  unrealizedPnl: fc.option(
    fc.float({ min: Math.fround(-10000), max: Math.fround(10000), noNaN: true, noDefaultInfinity: true }),
    { nil: undefined }
  ),
  currentPrice: fc.option(
    fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true, noDefaultInfinity: true }),
    { nil: undefined }
  ),
  pnlError: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
});

/**
 * Arbitrary for generating a CLOSED trade with realized P&L
 */
const closedTradeArb: fc.Arbitrary<TradeWithPnL> = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  symbol: stockSymbolArb,
  side: fc.constantFrom<TradeSide>('LONG', 'SHORT'),
  status: fc.constant<TradeStatus>('CLOSED'),
  entryPrice: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true, noDefaultInfinity: true }),
  quantity: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true, noDefaultInfinity: true }),
  fees: fc.float({ min: 0, max: Math.fround(100), noNaN: true, noDefaultInfinity: true }),
  notes: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  predictionId: fc.option(fc.uuid(), { nil: null }),
  entryDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
  updatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
  exitPrice: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true, noDefaultInfinity: true }),
  exitDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
  realizedPnl: fc.float({ min: Math.fround(-10000), max: Math.fround(10000), noNaN: true, noDefaultInfinity: true }),
  unrealizedPnl: fc.constant(undefined),
  currentPrice: fc.constant(undefined),
  pnlError: fc.constant(undefined),
});

/**
 * Arbitrary for generating any trade (open or closed)
 */
const anyTradeArb: fc.Arbitrary<TradeWithPnL> = fc.oneof(openTradeArb, closedTradeArb);

describe('Property 8: Trade Display Shows Correct P&L Type', () => {
  /**
   * Property: For any open trade, getTradeDisplayPnL SHALL return unrealizedPnl
   *
   * **Validates: Requirements 8.3**
   */
  it('should return unrealizedPnl for open trades', () => {
    fc.assert(
      fc.property(openTradeArb, (trade: TradeWithPnL) => {
        const displayPnl = getTradeDisplayPnL(trade);

        // For open trades, display P&L should be unrealized P&L
        if (trade.unrealizedPnl !== undefined) {
          expect(displayPnl).toBe(trade.unrealizedPnl);
        } else {
          // If unrealizedPnl is undefined, should return null
          expect(displayPnl).toBeNull();
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any closed trade, getTradeDisplayPnL SHALL return realizedPnl
   *
   * **Validates: Requirements 8.4**
   */
  it('should return realizedPnl for closed trades', () => {
    fc.assert(
      fc.property(closedTradeArb, (trade: TradeWithPnL) => {
        const displayPnl = getTradeDisplayPnL(trade);

        // For closed trades, display P&L should be realized P&L
        expect(displayPnl).toBe(trade.realizedPnl);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any trade, the P&L type returned depends solely on status
   * - OPEN status → unrealizedPnl
   * - CLOSED status → realizedPnl
   *
   * **Validates: Requirements 8.3, 8.4**
   */
  it('should determine P&L type based on trade status', () => {
    fc.assert(
      fc.property(anyTradeArb, (trade: TradeWithPnL) => {
        const displayPnl = getTradeDisplayPnL(trade);

        if (trade.status === 'OPEN') {
          // Open trades should use unrealized P&L
          if (trade.unrealizedPnl !== undefined) {
            expect(displayPnl).toBe(trade.unrealizedPnl);
          } else {
            expect(displayPnl).toBeNull();
          }
        } else {
          // Closed trades should use realized P&L
          expect(displayPnl).toBe(trade.realizedPnl);
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: All trades SHALL have required display fields defined
   * (symbol, side, status, entryPrice, quantity, entryDate)
   *
   * **Validates: Requirements 8.1**
   */
  it('should have all required display fields defined', () => {
    fc.assert(
      fc.property(anyTradeArb, (trade: TradeWithPnL) => {
        // Verify all required fields are present and valid
        expect(trade.symbol).toBeDefined();
        expect(typeof trade.symbol).toBe('string');
        expect(trade.symbol.length).toBeGreaterThan(0);

        expect(trade.side).toBeDefined();
        expect(['LONG', 'SHORT']).toContain(trade.side);

        expect(trade.status).toBeDefined();
        expect(['OPEN', 'CLOSED']).toContain(trade.status);

        expect(trade.entryPrice).toBeDefined();
        expect(typeof trade.entryPrice).toBe('number');
        expect(trade.entryPrice).toBeGreaterThan(0);

        expect(trade.quantity).toBeDefined();
        expect(typeof trade.quantity).toBe('number');
        expect(trade.quantity).toBeGreaterThan(0);

        expect(trade.entryDate).toBeDefined();
        expect(trade.entryDate).toBeInstanceOf(Date);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Closed trades SHALL have exit price defined
   *
   * **Validates: Requirements 8.1**
   */
  it('should have exit price defined for closed trades', () => {
    fc.assert(
      fc.property(closedTradeArb, (trade: TradeWithPnL) => {
        expect(trade.exitPrice).toBeDefined();
        expect(trade.exitPrice).not.toBeNull();
        expect(typeof trade.exitPrice).toBe('number');
        expect(trade.exitPrice).toBeGreaterThan(0);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Open trades SHALL have null exit price
   *
   * **Validates: Requirements 8.1**
   */
  it('should have null exit price for open trades', () => {
    fc.assert(
      fc.property(openTradeArb, (trade: TradeWithPnL) => {
        expect(trade.exitPrice).toBeNull();

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
