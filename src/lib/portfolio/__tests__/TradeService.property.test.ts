/**
 * Property Tests: Trade Creation and Validation
 *
 * Feature: trading-journal, Property 1: Trade Creation Preserves All Required Fields
 * Feature: trading-journal, Property 2: Input Validation Rejects Invalid Trades
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.4, 2.5
 *
 * These tests verify that:
 * 1. Trade creation preserves all provided fields with exact values
 * 2. Invalid trade requests are rejected with appropriate validation errors
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { TradeService, TradeValidationError } from '../TradeService';
import { CreateTradeRequest, TradeSide } from '@/types/models';

// Mock database connection
const createMockDb = () => ({
  query: vi.fn(),
  getPool: vi.fn(),
  getClient: vi.fn(),
  transaction: vi.fn(),
  close: vi.fn(),
  healthCheck: vi.fn(),
});

// Mock FMP provider
const createMockFmpProvider = () => ({
  getQuote: vi.fn(),
  getMultipleQuotes: vi.fn(),
  getHistoricalData: vi.fn(),
  searchStocks: vi.fn(),
  getCompanyProfile: vi.fn(),
  validateApiKey: vi.fn(),
});

/**
 * Generate stock symbol (1-5 uppercase letters)
 */
const stockSymbolArb = fc
  .array(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')), { minLength: 1, maxLength: 5 })
  .map((chars) => chars.join(''));

/**
 * Arbitrary for valid trade creation requests
 */
const validTradeRequestArb: fc.Arbitrary<CreateTradeRequest> = fc.record({
  userId: fc.uuid(),
  symbol: stockSymbolArb,
  side: fc.constantFrom<TradeSide>('LONG', 'SHORT'),
  entryPrice: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true, noDefaultInfinity: true }),
  quantity: fc.float({ min: Math.fround(0.01), max: Math.fround(1000000), noNaN: true, noDefaultInfinity: true }),
  fees: fc.option(fc.float({ min: 0, max: Math.fround(1000), noNaN: true, noDefaultInfinity: true }), { nil: undefined }),
  notes: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
  predictionId: fc.option(fc.uuid(), { nil: undefined }),
});

/**
 * Arbitrary for invalid entry prices (non-positive or invalid)
 */
const invalidEntryPriceArb = fc.oneof(
  fc.constant(0),
  fc.constant(-1),
  fc.float({ min: Math.fround(-100000), max: 0, noNaN: true, noDefaultInfinity: true }),
  fc.constant(NaN),
  fc.constant(Infinity),
  fc.constant(-Infinity)
);

/**
 * Arbitrary for invalid quantities (non-positive or invalid)
 */
const invalidQuantityArb = fc.oneof(
  fc.constant(0),
  fc.constant(-1),
  fc.float({ min: Math.fround(-100000), max: 0, noNaN: true, noDefaultInfinity: true }),
  fc.constant(NaN),
  fc.constant(Infinity),
  fc.constant(-Infinity)
);

/**
 * Arbitrary for invalid side values
 */
const invalidSideArb = fc.oneof(
  fc.constant('long'),
  fc.constant('short'),
  fc.constant('BUY'),
  fc.constant('SELL'),
  fc.constant(''),
  fc.constant(null),
  fc.constant(undefined)
);

describe('Property 1: Trade Creation Preserves All Required Fields', () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let mockFmpProvider: ReturnType<typeof createMockFmpProvider>;
  let tradeService: TradeService;

  beforeEach(() => {
    mockDb = createMockDb();
    mockFmpProvider = createMockFmpProvider();
    tradeService = new TradeService(mockDb as any, mockFmpProvider as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property: For any valid trade creation request, the created trade SHALL contain
   * all provided fields with their exact values, plus system-generated fields.
   *
   * **Validates: Requirements 1.1, 1.2, 1.3, 2.1**
   */
  it('should preserve all provided fields in created trade', async () => {
    await fc.assert(
      fc.asyncProperty(validTradeRequestArb, async (request: CreateTradeRequest) => {
        // Reset mock before each iteration
        mockDb.query.mockReset();

        // Setup mock to return the trade with system-generated fields
        const mockCreatedTrade = {
          id: 'generated-uuid',
          user_id: request.userId,
          symbol: request.symbol.toUpperCase(),
          side: request.side,
          status: 'OPEN',
          entry_price: request.entryPrice.toString(),
          quantity: request.quantity.toString(),
          entry_date: new Date().toISOString(),
          exit_price: null,
          exit_date: null,
          fees: (request.fees ?? 0).toString(),
          realized_pnl: null,
          notes: request.notes || null,
          prediction_id: request.predictionId ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        mockDb.query.mockResolvedValueOnce({ rows: [mockCreatedTrade] });

        const result = await tradeService.createTrade(request);

        // Verify all provided fields are preserved
        expect(result.userId).toBe(request.userId);
        expect(result.symbol).toBe(request.symbol.toUpperCase());
        expect(result.side).toBe(request.side);
        expect(result.entryPrice).toBeCloseTo(request.entryPrice, 4);
        expect(result.quantity).toBeCloseTo(request.quantity, 4);
        expect(result.fees).toBeCloseTo(request.fees ?? 0, 2);
        // Notes: empty string becomes null in the database
        expect(result.notes).toBe(request.notes || null);
        expect(result.predictionId).toBe(request.predictionId ?? null);

        // Verify system-generated fields
        expect(result.status).toBe('OPEN');
        expect(result.id).toBeDefined();
        expect(result.entryDate).toBeInstanceOf(Date);
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.updatedAt).toBeInstanceOf(Date);
        expect(result.exitPrice).toBeNull();
        expect(result.exitDate).toBeNull();
        expect(result.realizedPnl).toBeNull();

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: The database query should receive all fields from the request
   *
   * **Validates: Requirements 1.1, 1.2, 1.3**
   */
  it('should pass all fields to database query', async () => {
    await fc.assert(
      fc.asyncProperty(validTradeRequestArb, async (request: CreateTradeRequest) => {
        // Reset mock before each iteration
        mockDb.query.mockReset();

        const mockCreatedTrade = {
          id: 'generated-uuid',
          user_id: request.userId,
          symbol: request.symbol.toUpperCase(),
          side: request.side,
          status: 'OPEN',
          entry_price: request.entryPrice.toString(),
          quantity: request.quantity.toString(),
          entry_date: new Date().toISOString(),
          exit_price: null,
          exit_date: null,
          fees: (request.fees ?? 0).toString(),
          realized_pnl: null,
          notes: request.notes || null,
          prediction_id: request.predictionId ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        mockDb.query.mockResolvedValueOnce({ rows: [mockCreatedTrade] });

        await tradeService.createTrade(request);

        // Verify the query was called with correct parameters
        expect(mockDb.query).toHaveBeenCalledTimes(1);
        const [, params] = mockDb.query.mock.calls[0];

        expect(params[0]).toBe(request.userId);
        expect(params[1]).toBe(request.symbol.toUpperCase());
        expect(params[2]).toBe(request.side);
        expect(params[3]).toBe(request.entryPrice);
        expect(params[4]).toBe(request.quantity);
        expect(params[5]).toBe(request.fees ?? 0);
        expect(params[6]).toBe(request.notes ?? null);
        expect(params[7]).toBe(request.predictionId ?? null);

        return true;
      }),
      { numRuns: 100 }
    );
  });
});

describe('Property 2: Input Validation Rejects Invalid Trades', () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let mockFmpProvider: ReturnType<typeof createMockFmpProvider>;
  let tradeService: TradeService;

  beforeEach(() => {
    mockDb = createMockDb();
    mockFmpProvider = createMockFmpProvider();
    tradeService = new TradeService(mockDb as any, mockFmpProvider as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property: For any trade request with non-positive entryPrice,
   * the Trade_Service SHALL return a validation error.
   *
   * **Validates: Requirements 1.4, 2.5**
   */
  it('should reject trades with invalid entry price', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        stockSymbolArb,
        fc.constantFrom<TradeSide>('LONG', 'SHORT'),
        invalidEntryPriceArb,
        fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true, noDefaultInfinity: true }),
        async (userId, symbol, side, invalidPrice, quantity) => {
          // Reset mock before each iteration
          mockDb.query.mockReset();

          const request: CreateTradeRequest = {
            userId,
            symbol,
            side,
            entryPrice: invalidPrice as number,
            quantity,
          };

          await expect(tradeService.createTrade(request)).rejects.toThrow(TradeValidationError);

          // Database should not be called
          expect(mockDb.query).not.toHaveBeenCalled();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any trade request with non-positive quantity,
   * the Trade_Service SHALL return a validation error.
   *
   * **Validates: Requirements 1.4, 2.5**
   */
  it('should reject trades with invalid quantity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        stockSymbolArb,
        fc.constantFrom<TradeSide>('LONG', 'SHORT'),
        fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true, noDefaultInfinity: true }),
        invalidQuantityArb,
        async (userId, symbol, side, entryPrice, invalidQuantity) => {
          // Reset mock before each iteration
          mockDb.query.mockReset();

          const request: CreateTradeRequest = {
            userId,
            symbol,
            side,
            entryPrice,
            quantity: invalidQuantity as number,
          };

          await expect(tradeService.createTrade(request)).rejects.toThrow(TradeValidationError);

          // Database should not be called
          expect(mockDb.query).not.toHaveBeenCalled();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any trade request with invalid side value,
   * the Trade_Service SHALL return a validation error.
   *
   * **Validates: Requirements 1.5, 2.4**
   */
  it('should reject trades with invalid side', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        stockSymbolArb,
        invalidSideArb,
        fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true, noDefaultInfinity: true }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true, noDefaultInfinity: true }),
        async (userId, symbol, invalidSide, entryPrice, quantity) => {
          // Reset mock before each iteration
          mockDb.query.mockReset();

          const request = {
            userId,
            symbol,
            side: invalidSide,
            entryPrice,
            quantity,
          } as unknown as CreateTradeRequest;

          await expect(tradeService.createTrade(request)).rejects.toThrow(TradeValidationError);

          // Database should not be called
          expect(mockDb.query).not.toHaveBeenCalled();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any trade request with missing required fields,
   * the Trade_Service SHALL return a validation error.
   *
   * **Validates: Requirements 2.4**
   */
  it('should reject trades with missing required fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('userId', 'symbol', 'side', 'entryPrice', 'quantity'),
        fc.uuid(),
        stockSymbolArb,
        fc.constantFrom<TradeSide>('LONG', 'SHORT'),
        fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true, noDefaultInfinity: true }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true, noDefaultInfinity: true }),
        async (missingField, userId, symbol, side, entryPrice, quantity) => {
          // Reset mock before each iteration
          mockDb.query.mockReset();

          const baseRequest: CreateTradeRequest = {
            userId,
            symbol,
            side,
            entryPrice,
            quantity,
          };

          // Create request with missing field
          const request = { ...baseRequest };
          delete (request as Record<string, unknown>)[missingField];

          await expect(tradeService.createTrade(request as CreateTradeRequest)).rejects.toThrow(
            TradeValidationError
          );

          // Database should not be called
          expect(mockDb.query).not.toHaveBeenCalled();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any trade request with negative fees,
   * the Trade_Service SHALL return a validation error.
   *
   * **Validates: Requirements 2.5**
   */
  it('should reject trades with negative fees', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        stockSymbolArb,
        fc.constantFrom<TradeSide>('LONG', 'SHORT'),
        fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true, noDefaultInfinity: true }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true, noDefaultInfinity: true }),
        fc.float({ min: Math.fround(-1000), max: Math.fround(-0.01), noNaN: true, noDefaultInfinity: true }),
        async (userId, symbol, side, entryPrice, quantity, negativeFees) => {
          // Reset mock before each iteration
          mockDb.query.mockReset();

          const request: CreateTradeRequest = {
            userId,
            symbol,
            side,
            entryPrice,
            quantity,
            fees: negativeFees,
          };

          await expect(tradeService.createTrade(request)).rejects.toThrow(TradeValidationError);

          // Database should not be called
          expect(mockDb.query).not.toHaveBeenCalled();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Property 4: Realized P&L Calculation Correctness', () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let mockFmpProvider: ReturnType<typeof createMockFmpProvider>;
  let tradeService: TradeService;

  beforeEach(() => {
    mockDb = createMockDb();
    mockFmpProvider = createMockFmpProvider();
    tradeService = new TradeService(mockDb as any, mockFmpProvider as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property: For any closed LONG trade, realized P&L SHALL equal
   * (exitPrice - entryPrice) × quantity - fees
   *
   * **Validates: Requirements 4.1, 4.3**
   */
  it('should calculate realized P&L correctly for LONG trades', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true, noDefaultInfinity: true }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true, noDefaultInfinity: true }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true, noDefaultInfinity: true }),
        fc.float({ min: 0, max: Math.fround(100), noNaN: true, noDefaultInfinity: true }),
        (entryPrice, exitPrice, quantity, fees) => {
          const trade = {
            id: 'test-id',
            userId: 'user-id',
            symbol: 'AAPL',
            side: 'LONG' as TradeSide,
            status: 'CLOSED' as const,
            entryPrice,
            exitPrice,
            quantity,
            fees,
            entryDate: new Date(),
            exitDate: new Date(),
            realizedPnl: null,
            notes: null,
            predictionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const result = tradeService.calculateRealizedPnL(trade);
          const expected = (exitPrice - entryPrice) * quantity - fees;

          // Use relative tolerance for floating point comparison
          expect(result).toBeCloseTo(expected, 4);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any closed SHORT trade, realized P&L SHALL equal
   * (entryPrice - exitPrice) × quantity - fees
   *
   * **Validates: Requirements 4.2, 4.3**
   */
  it('should calculate realized P&L correctly for SHORT trades', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true, noDefaultInfinity: true }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true, noDefaultInfinity: true }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true, noDefaultInfinity: true }),
        fc.float({ min: 0, max: Math.fround(100), noNaN: true, noDefaultInfinity: true }),
        (entryPrice, exitPrice, quantity, fees) => {
          const trade = {
            id: 'test-id',
            userId: 'user-id',
            symbol: 'AAPL',
            side: 'SHORT' as TradeSide,
            status: 'CLOSED' as const,
            entryPrice,
            exitPrice,
            quantity,
            fees,
            entryDate: new Date(),
            exitDate: new Date(),
            realizedPnl: null,
            notes: null,
            predictionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const result = tradeService.calculateRealizedPnL(trade);
          const expected = (entryPrice - exitPrice) * quantity - fees;

          // Use relative tolerance for floating point comparison
          expect(result).toBeCloseTo(expected, 4);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any trade without exit price, realized P&L SHALL be 0
   *
   * **Validates: Requirements 4.3**
   */
  it('should return 0 for trades without exit price', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true, noDefaultInfinity: true }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true, noDefaultInfinity: true }),
        fc.float({ min: 0, max: Math.fround(100), noNaN: true, noDefaultInfinity: true }),
        fc.constantFrom<TradeSide>('LONG', 'SHORT'),
        (entryPrice, quantity, fees, side) => {
          const trade = {
            id: 'test-id',
            userId: 'user-id',
            symbol: 'AAPL',
            side,
            status: 'OPEN' as const,
            entryPrice,
            exitPrice: null,
            quantity,
            fees,
            entryDate: new Date(),
            exitDate: null,
            realizedPnl: null,
            notes: null,
            predictionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const result = tradeService.calculateRealizedPnL(trade);
          expect(result).toBe(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 5: Unrealized P&L Calculation Correctness', () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let mockFmpProvider: ReturnType<typeof createMockFmpProvider>;
  let tradeService: TradeService;

  beforeEach(() => {
    mockDb = createMockDb();
    mockFmpProvider = createMockFmpProvider();
    tradeService = new TradeService(mockDb as any, mockFmpProvider as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property: For any open LONG trade, unrealized P&L SHALL equal
   * (currentPrice - entryPrice) × quantity - fees
   *
   * **Validates: Requirements 5.1**
   */
  it('should calculate unrealized P&L correctly for LONG trades', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true, noDefaultInfinity: true }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true, noDefaultInfinity: true }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true, noDefaultInfinity: true }),
        fc.float({ min: 0, max: Math.fround(100), noNaN: true, noDefaultInfinity: true }),
        (entryPrice, currentPrice, quantity, fees) => {
          const trade = {
            id: 'test-id',
            userId: 'user-id',
            symbol: 'AAPL',
            side: 'LONG' as TradeSide,
            status: 'OPEN' as const,
            entryPrice,
            exitPrice: null,
            quantity,
            fees,
            entryDate: new Date(),
            exitDate: null,
            realizedPnl: null,
            notes: null,
            predictionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const result = tradeService.calculateUnrealizedPnL(trade, currentPrice);
          const expected = (currentPrice - entryPrice) * quantity - fees;

          // Use relative tolerance for floating point comparison
          expect(result).toBeCloseTo(expected, 4);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any open SHORT trade, unrealized P&L SHALL equal
   * (entryPrice - currentPrice) × quantity - fees
   *
   * **Validates: Requirements 5.2**
   */
  it('should calculate unrealized P&L correctly for SHORT trades', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true, noDefaultInfinity: true }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true, noDefaultInfinity: true }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true, noDefaultInfinity: true }),
        fc.float({ min: 0, max: Math.fround(100), noNaN: true, noDefaultInfinity: true }),
        (entryPrice, currentPrice, quantity, fees) => {
          const trade = {
            id: 'test-id',
            userId: 'user-id',
            symbol: 'AAPL',
            side: 'SHORT' as TradeSide,
            status: 'OPEN' as const,
            entryPrice,
            exitPrice: null,
            quantity,
            fees,
            entryDate: new Date(),
            exitDate: null,
            realizedPnl: null,
            notes: null,
            predictionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const result = tradeService.calculateUnrealizedPnL(trade, currentPrice);
          const expected = (entryPrice - currentPrice) * quantity - fees;

          // Use relative tolerance for floating point comparison
          expect(result).toBeCloseTo(expected, 4);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Unrealized P&L with current price equal to entry price
   * should equal negative fees (for both LONG and SHORT)
   *
   * **Validates: Requirements 5.1, 5.2**
   */
  it('should return negative fees when current price equals entry price', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true, noDefaultInfinity: true }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true, noDefaultInfinity: true }),
        fc.float({ min: 0, max: Math.fround(100), noNaN: true, noDefaultInfinity: true }),
        fc.constantFrom<TradeSide>('LONG', 'SHORT'),
        (entryPrice, quantity, fees, side) => {
          const trade = {
            id: 'test-id',
            userId: 'user-id',
            symbol: 'AAPL',
            side,
            status: 'OPEN' as const,
            entryPrice,
            exitPrice: null,
            quantity,
            fees,
            entryDate: new Date(),
            exitDate: null,
            realizedPnl: null,
            notes: null,
            predictionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // When current price equals entry price, P&L should be -fees
          const result = tradeService.calculateUnrealizedPnL(trade, entryPrice);
          expect(result).toBeCloseTo(-fees, 4);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


import { TradeNotFoundError, TradeStateError } from '../TradeService';

describe('Property 3: Trade Closure Updates Status and Records Exit Data', () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let mockFmpProvider: ReturnType<typeof createMockFmpProvider>;
  let tradeService: TradeService;

  beforeEach(() => {
    mockDb = createMockDb();
    mockFmpProvider = createMockFmpProvider();
    tradeService = new TradeService(mockDb as any, mockFmpProvider as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property: For any open trade closed with a valid exit price,
   * the trade status SHALL become CLOSED, exitPrice SHALL equal the provided value,
   * exitDate SHALL be set, and realizedPnl SHALL be calculated and stored.
   *
   * **Validates: Requirements 3.1, 3.2**
   */
  it('should update status, exit price, exit date, and realized P&L when closing a trade', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        stockSymbolArb,
        fc.constantFrom<TradeSide>('LONG', 'SHORT'),
        fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true, noDefaultInfinity: true }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true, noDefaultInfinity: true }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true, noDefaultInfinity: true }),
        fc.float({ min: 0, max: Math.fround(100), noNaN: true, noDefaultInfinity: true }),
        async (tradeId, symbol, side, entryPrice, exitPrice, quantity, fees) => {
          // Reset mock before each iteration
          mockDb.query.mockReset();

          const existingTrade = {
            id: tradeId,
            user_id: 'user-id',
            symbol,
            side,
            status: 'OPEN',
            entry_price: entryPrice.toString(),
            quantity: quantity.toString(),
            entry_date: new Date().toISOString(),
            exit_price: null,
            exit_date: null,
            fees: fees.toString(),
            realized_pnl: null,
            notes: null,
            prediction_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          // Calculate expected realized P&L
          const expectedPnl =
            side === 'LONG'
              ? (exitPrice - entryPrice) * quantity - fees
              : (entryPrice - exitPrice) * quantity - fees;

          const closedTrade = {
            ...existingTrade,
            status: 'CLOSED',
            exit_price: exitPrice.toString(),
            exit_date: new Date().toISOString(),
            realized_pnl: expectedPnl.toString(),
          };

          // First query: getTradeById
          mockDb.query.mockResolvedValueOnce({ rows: [existingTrade] });
          // Second query: update trade
          mockDb.query.mockResolvedValueOnce({ rows: [closedTrade] });

          const result = await tradeService.closeTrade(tradeId, exitPrice);

          // Verify status is CLOSED
          expect(result.status).toBe('CLOSED');
          // Verify exit price is set
          expect(result.exitPrice).toBeCloseTo(exitPrice, 4);
          // Verify exit date is set
          expect(result.exitDate).toBeInstanceOf(Date);
          // Verify realized P&L is calculated correctly
          expect(result.realizedPnl).toBeCloseTo(expectedPnl, 4);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Closing an already closed trade SHALL throw TradeStateError
   *
   * **Validates: Requirements 3.3**
   */
  it('should throw TradeStateError when closing an already closed trade', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true, noDefaultInfinity: true }),
        async (tradeId, exitPrice) => {
          // Reset mock before each iteration
          mockDb.query.mockReset();

          const closedTrade = {
            id: tradeId,
            user_id: 'user-id',
            symbol: 'AAPL',
            side: 'LONG',
            status: 'CLOSED',
            entry_price: '100',
            quantity: '10',
            entry_date: new Date().toISOString(),
            exit_price: '110',
            exit_date: new Date().toISOString(),
            fees: '5',
            realized_pnl: '95',
            notes: null,
            prediction_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          mockDb.query.mockResolvedValueOnce({ rows: [closedTrade] });

          await expect(tradeService.closeTrade(tradeId, exitPrice)).rejects.toThrow(TradeStateError);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Closing a non-existent trade SHALL throw TradeNotFoundError
   *
   * **Validates: Requirements 3.3**
   */
  it('should throw TradeNotFoundError when trade does not exist', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true, noDefaultInfinity: true }),
        async (tradeId, exitPrice) => {
          // Reset mock before each iteration
          mockDb.query.mockReset();

          mockDb.query.mockResolvedValueOnce({ rows: [] });

          await expect(tradeService.closeTrade(tradeId, exitPrice)).rejects.toThrow(TradeNotFoundError);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Closing a trade with invalid exit price SHALL throw TradeValidationError
   *
   * **Validates: Requirements 3.4**
   */
  it('should throw TradeValidationError when exit price is invalid', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.oneof(
          fc.constant(0),
          fc.constant(-1),
          fc.float({ min: Math.fround(-10000), max: 0, noNaN: true, noDefaultInfinity: true }),
          fc.constant(NaN),
          fc.constant(Infinity),
          fc.constant(-Infinity)
        ),
        async (tradeId, invalidExitPrice) => {
          // Reset mock before each iteration
          mockDb.query.mockReset();

          await expect(tradeService.closeTrade(tradeId, invalidExitPrice as number)).rejects.toThrow(
            TradeValidationError
          );

          // Database should not be called for invalid exit price
          expect(mockDb.query).not.toHaveBeenCalled();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Property 6: Trade Filtering Returns Correct Subset', () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let mockFmpProvider: ReturnType<typeof createMockFmpProvider>;
  let tradeService: TradeService;

  beforeEach(() => {
    mockDb = createMockDb();
    mockFmpProvider = createMockFmpProvider();
    tradeService = new TradeService(mockDb as any, mockFmpProvider as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property: For any set of trades and status filter, the returned trades
   * SHALL include only trades matching the specified status.
   *
   * **Validates: Requirements 6.2**
   */
  it('should filter trades by status correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.constantFrom<'OPEN' | 'CLOSED'>('OPEN', 'CLOSED'),
        async (userId, filterStatus) => {
          // Reset mock before each iteration
          mockDb.query.mockReset();
          mockFmpProvider.getMultipleQuotes.mockReset();

          // Create mock trades with mixed statuses
          const mockTrades = [
            {
              id: 'trade-1',
              user_id: userId,
              symbol: 'AAPL',
              side: 'LONG',
              status: 'OPEN',
              entry_price: '100',
              quantity: '10',
              entry_date: new Date().toISOString(),
              exit_price: null,
              exit_date: null,
              fees: '5',
              realized_pnl: null,
              notes: null,
              prediction_id: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 'trade-2',
              user_id: userId,
              symbol: 'GOOGL',
              side: 'SHORT',
              status: 'CLOSED',
              entry_price: '200',
              quantity: '5',
              entry_date: new Date().toISOString(),
              exit_price: '180',
              exit_date: new Date().toISOString(),
              fees: '10',
              realized_pnl: '90',
              notes: null,
              prediction_id: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ];

          // Filter trades based on status
          const filteredTrades = mockTrades.filter((t) => t.status === filterStatus);
          mockDb.query.mockResolvedValueOnce({ rows: filteredTrades });

          // Mock FMP for open trades
          if (filterStatus === 'OPEN') {
            mockFmpProvider.getMultipleQuotes.mockResolvedValueOnce([{ symbol: 'AAPL', price: 105 }]);
          }

          const result = await tradeService.getUserTrades(userId, { status: filterStatus });

          // All returned trades should match the filter status
          for (const trade of result) {
            expect(trade.status).toBe(filterStatus);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any set of trades and symbol filter, the returned trades
   * SHALL include only trades matching the specified symbol.
   *
   * **Validates: Requirements 6.3**
   */
  it('should filter trades by symbol correctly', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), stockSymbolArb, async (userId, filterSymbol) => {
        // Reset mock before each iteration
        mockDb.query.mockReset();
        mockFmpProvider.getMultipleQuotes.mockReset();

        // Create mock trades with the filtered symbol
        const mockTrades = [
          {
            id: 'trade-1',
            user_id: userId,
            symbol: filterSymbol.toUpperCase(),
            side: 'LONG',
            status: 'CLOSED',
            entry_price: '100',
            quantity: '10',
            entry_date: new Date().toISOString(),
            exit_price: '110',
            exit_date: new Date().toISOString(),
            fees: '5',
            realized_pnl: '95',
            notes: null,
            prediction_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];

        mockDb.query.mockResolvedValueOnce({ rows: mockTrades });

        const result = await tradeService.getUserTrades(userId, { symbol: filterSymbol });

        // All returned trades should match the filter symbol
        for (const trade of result) {
          expect(trade.symbol).toBe(filterSymbol.toUpperCase());
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Trades SHALL be ordered by entryDate descending.
   *
   * **Validates: Requirements 6.1**
   */
  it('should return trades ordered by entry date descending', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (userId) => {
        // Reset mock before each iteration
        mockDb.query.mockReset();
        mockFmpProvider.getMultipleQuotes.mockReset();

        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

        // Create mock trades with different dates (already sorted by DB)
        const mockTrades = [
          {
            id: 'trade-1',
            user_id: userId,
            symbol: 'AAPL',
            side: 'LONG',
            status: 'CLOSED',
            entry_price: '100',
            quantity: '10',
            entry_date: now.toISOString(),
            exit_price: '110',
            exit_date: now.toISOString(),
            fees: '5',
            realized_pnl: '95',
            notes: null,
            prediction_id: null,
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
          },
          {
            id: 'trade-2',
            user_id: userId,
            symbol: 'GOOGL',
            side: 'SHORT',
            status: 'CLOSED',
            entry_price: '200',
            quantity: '5',
            entry_date: yesterday.toISOString(),
            exit_price: '180',
            exit_date: yesterday.toISOString(),
            fees: '10',
            realized_pnl: '90',
            notes: null,
            prediction_id: null,
            created_at: yesterday.toISOString(),
            updated_at: yesterday.toISOString(),
          },
          {
            id: 'trade-3',
            user_id: userId,
            symbol: 'MSFT',
            side: 'LONG',
            status: 'CLOSED',
            entry_price: '300',
            quantity: '3',
            entry_date: twoDaysAgo.toISOString(),
            exit_price: '320',
            exit_date: twoDaysAgo.toISOString(),
            fees: '8',
            realized_pnl: '52',
            notes: null,
            prediction_id: null,
            created_at: twoDaysAgo.toISOString(),
            updated_at: twoDaysAgo.toISOString(),
          },
        ];

        mockDb.query.mockResolvedValueOnce({ rows: mockTrades });

        const result = await tradeService.getUserTrades(userId);

        // Verify trades are ordered by entry date descending
        for (let i = 1; i < result.length; i++) {
          expect(result[i - 1].entryDate.getTime()).toBeGreaterThanOrEqual(result[i].entryDate.getTime());
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: When FMP API fails, open trades SHALL be returned with pnlError set.
   *
   * **Validates: Requirements 5.4**
   */
  it('should handle FMP API failures gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (userId) => {
        // Reset mock before each iteration
        mockDb.query.mockReset();
        mockFmpProvider.getMultipleQuotes.mockReset();

        const mockTrades = [
          {
            id: 'trade-1',
            user_id: userId,
            symbol: 'AAPL',
            side: 'LONG',
            status: 'OPEN',
            entry_price: '100',
            quantity: '10',
            entry_date: new Date().toISOString(),
            exit_price: null,
            exit_date: null,
            fees: '5',
            realized_pnl: null,
            notes: null,
            prediction_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];

        mockDb.query.mockResolvedValueOnce({ rows: mockTrades });
        mockFmpProvider.getMultipleQuotes.mockRejectedValueOnce(new Error('API Error'));

        // Suppress console.error for this test
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const result = await tradeService.getUserTrades(userId);

        consoleSpy.mockRestore();

        // Open trades should have pnlError set
        for (const trade of result) {
          if (trade.status === 'OPEN') {
            expect(trade.pnlError).toBe('Unable to fetch current price');
            expect(trade.unrealizedPnl).toBeUndefined();
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });
});


describe('Property 7: Portfolio Statistics Calculation Correctness', () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let mockFmpProvider: ReturnType<typeof createMockFmpProvider>;
  let tradeService: TradeService;

  beforeEach(() => {
    mockDb = createMockDb();
    mockFmpProvider = createMockFmpProvider();
    tradeService = new TradeService(mockDb as any, mockFmpProvider as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property: totalRealizedPnl SHALL equal the sum of realizedPnl for all closed trades.
   *
   * **Validates: Requirements 7.1**
   */
  it('should calculate total realized P&L correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.array(
          fc.float({ min: Math.fround(-1000), max: Math.fround(1000), noNaN: true, noDefaultInfinity: true }),
          { minLength: 1, maxLength: 10 }
        ),
        async (userId, pnlValues) => {
          // Reset mock before each iteration
          mockDb.query.mockReset();
          mockFmpProvider.getMultipleQuotes.mockReset();

          // Create mock closed trades with the given P&L values
          const mockTrades = pnlValues.map((pnl, index) => ({
            id: `trade-${index}`,
            user_id: userId,
            symbol: 'AAPL',
            side: 'LONG',
            status: 'CLOSED',
            entry_price: '100',
            quantity: '10',
            entry_date: new Date().toISOString(),
            exit_price: '110',
            exit_date: new Date().toISOString(),
            fees: '5',
            realized_pnl: pnl.toString(),
            notes: null,
            prediction_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          mockDb.query.mockResolvedValueOnce({ rows: mockTrades });

          const result = await tradeService.getPortfolioStats(userId);

          const expectedTotalPnl = pnlValues.reduce((sum, pnl) => sum + pnl, 0);
          expect(result.totalRealizedPnl).toBeCloseTo(expectedTotalPnl, 2);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: winRate SHALL equal (profitable closed trades / total closed trades),
   * or null if no closed trades.
   *
   * **Validates: Requirements 7.3, 7.6**
   */
  it('should calculate win rate correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.array(
          fc.float({ min: Math.fround(-1000), max: Math.fround(1000), noNaN: true, noDefaultInfinity: true }),
          { minLength: 0, maxLength: 10 }
        ),
        async (userId, pnlValues) => {
          // Reset mock before each iteration
          mockDb.query.mockReset();
          mockFmpProvider.getMultipleQuotes.mockReset();

          // Create mock closed trades with the given P&L values
          const mockTrades = pnlValues.map((pnl, index) => ({
            id: `trade-${index}`,
            user_id: userId,
            symbol: 'AAPL',
            side: 'LONG',
            status: 'CLOSED',
            entry_price: '100',
            quantity: '10',
            entry_date: new Date().toISOString(),
            exit_price: '110',
            exit_date: new Date().toISOString(),
            fees: '5',
            realized_pnl: pnl.toString(),
            notes: null,
            prediction_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          mockDb.query.mockResolvedValueOnce({ rows: mockTrades });

          const result = await tradeService.getPortfolioStats(userId);

          if (pnlValues.length === 0) {
            expect(result.winRate).toBeNull();
          } else {
            const winningTrades = pnlValues.filter((pnl) => pnl > 0).length;
            const expectedWinRate = winningTrades / pnlValues.length;
            expect(result.winRate).toBeCloseTo(expectedWinRate, 4);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: avgWin SHALL equal the average realizedPnl of profitable closed trades,
   * or null if none.
   *
   * **Validates: Requirements 7.4**
   */
  it('should calculate average win correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.array(
          fc.float({ min: Math.fround(-1000), max: Math.fround(1000), noNaN: true, noDefaultInfinity: true }),
          { minLength: 1, maxLength: 10 }
        ),
        async (userId, pnlValues) => {
          // Reset mock before each iteration
          mockDb.query.mockReset();
          mockFmpProvider.getMultipleQuotes.mockReset();

          // Create mock closed trades with the given P&L values
          const mockTrades = pnlValues.map((pnl, index) => ({
            id: `trade-${index}`,
            user_id: userId,
            symbol: 'AAPL',
            side: 'LONG',
            status: 'CLOSED',
            entry_price: '100',
            quantity: '10',
            entry_date: new Date().toISOString(),
            exit_price: '110',
            exit_date: new Date().toISOString(),
            fees: '5',
            realized_pnl: pnl.toString(),
            notes: null,
            prediction_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          mockDb.query.mockResolvedValueOnce({ rows: mockTrades });

          const result = await tradeService.getPortfolioStats(userId);

          const winningPnls = pnlValues.filter((pnl) => pnl > 0);
          if (winningPnls.length === 0) {
            expect(result.avgWin).toBeNull();
          } else {
            const expectedAvgWin = winningPnls.reduce((sum, pnl) => sum + pnl, 0) / winningPnls.length;
            expect(result.avgWin).toBeCloseTo(expectedAvgWin, 2);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: avgLoss SHALL equal the average realizedPnl of losing closed trades,
   * or null if none.
   *
   * **Validates: Requirements 7.5**
   */
  it('should calculate average loss correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.array(
          fc.float({ min: Math.fround(-1000), max: Math.fround(1000), noNaN: true, noDefaultInfinity: true }),
          { minLength: 1, maxLength: 10 }
        ),
        async (userId, pnlValues) => {
          // Reset mock before each iteration
          mockDb.query.mockReset();
          mockFmpProvider.getMultipleQuotes.mockReset();

          // Create mock closed trades with the given P&L values
          const mockTrades = pnlValues.map((pnl, index) => ({
            id: `trade-${index}`,
            user_id: userId,
            symbol: 'AAPL',
            side: 'LONG',
            status: 'CLOSED',
            entry_price: '100',
            quantity: '10',
            entry_date: new Date().toISOString(),
            exit_price: '110',
            exit_date: new Date().toISOString(),
            fees: '5',
            realized_pnl: pnl.toString(),
            notes: null,
            prediction_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          mockDb.query.mockResolvedValueOnce({ rows: mockTrades });

          const result = await tradeService.getPortfolioStats(userId);

          const losingPnls = pnlValues.filter((pnl) => pnl < 0);
          if (losingPnls.length === 0) {
            expect(result.avgLoss).toBeNull();
          } else {
            const expectedAvgLoss = losingPnls.reduce((sum, pnl) => sum + pnl, 0) / losingPnls.length;
            expect(result.avgLoss).toBeCloseTo(expectedAvgLoss, 2);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: totalUnrealizedPnl SHALL equal the sum of unrealizedPnl for all open trades.
   *
   * **Validates: Requirements 7.2**
   */
  it('should calculate total unrealized P&L correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.array(
          fc.record({
            entryPrice: fc.float({ min: Math.fround(1), max: Math.fround(1000), noNaN: true, noDefaultInfinity: true }),
            currentPrice: fc.float({ min: Math.fround(1), max: Math.fround(1000), noNaN: true, noDefaultInfinity: true }),
            quantity: fc.float({ min: Math.fround(1), max: Math.fround(100), noNaN: true, noDefaultInfinity: true }),
            fees: fc.float({ min: 0, max: Math.fround(50), noNaN: true, noDefaultInfinity: true }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (userId, openTradeData) => {
          // Reset mock before each iteration
          mockDb.query.mockReset();
          mockFmpProvider.getMultipleQuotes.mockReset();

          // Create mock open trades
          const mockTrades = openTradeData.map((data, index) => ({
            id: `trade-${index}`,
            user_id: userId,
            symbol: `SYM${index}`,
            side: 'LONG',
            status: 'OPEN',
            entry_price: data.entryPrice.toString(),
            quantity: data.quantity.toString(),
            entry_date: new Date().toISOString(),
            exit_price: null,
            exit_date: null,
            fees: data.fees.toString(),
            realized_pnl: null,
            notes: null,
            prediction_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          mockDb.query.mockResolvedValueOnce({ rows: mockTrades });

          // Mock FMP quotes
          const quotes = openTradeData.map((data, index) => ({
            symbol: `SYM${index}`,
            price: data.currentPrice,
          }));
          mockFmpProvider.getMultipleQuotes.mockResolvedValueOnce(quotes);

          const result = await tradeService.getPortfolioStats(userId);

          // Calculate expected total unrealized P&L
          const expectedTotalUnrealizedPnl = openTradeData.reduce((sum, data) => {
            const unrealizedPnl = (data.currentPrice - data.entryPrice) * data.quantity - data.fees;
            return sum + unrealizedPnl;
          }, 0);

          expect(result.totalUnrealizedPnl).toBeCloseTo(expectedTotalUnrealizedPnl, 2);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Trade counts SHALL be accurate.
   *
   * **Validates: Requirements 7.1, 7.2**
   */
  it('should count trades correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.integer({ min: 0, max: 5 }),
        fc.integer({ min: 0, max: 5 }),
        async (userId, openCount, closedCount) => {
          // Reset mock before each iteration
          mockDb.query.mockReset();
          mockFmpProvider.getMultipleQuotes.mockReset();

          // Create mock trades
          const openTrades = Array.from({ length: openCount }, (_, i) => ({
            id: `open-${i}`,
            user_id: userId,
            symbol: `SYM${i}`,
            side: 'LONG',
            status: 'OPEN',
            entry_price: '100',
            quantity: '10',
            entry_date: new Date().toISOString(),
            exit_price: null,
            exit_date: null,
            fees: '5',
            realized_pnl: null,
            notes: null,
            prediction_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          const closedTrades = Array.from({ length: closedCount }, (_, i) => ({
            id: `closed-${i}`,
            user_id: userId,
            symbol: 'AAPL',
            side: 'LONG',
            status: 'CLOSED',
            entry_price: '100',
            quantity: '10',
            entry_date: new Date().toISOString(),
            exit_price: '110',
            exit_date: new Date().toISOString(),
            fees: '5',
            realized_pnl: '95',
            notes: null,
            prediction_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          mockDb.query.mockResolvedValueOnce({ rows: [...openTrades, ...closedTrades] });

          // Mock FMP quotes for open trades
          if (openCount > 0) {
            const quotes = openTrades.map((t, i) => ({ symbol: `SYM${i}`, price: 105 }));
            mockFmpProvider.getMultipleQuotes.mockResolvedValueOnce(quotes);
          }

          const result = await tradeService.getPortfolioStats(userId);

          expect(result.totalTrades).toBe(openCount + closedCount);
          expect(result.openTrades).toBe(openCount);
          expect(result.closedTrades).toBe(closedCount);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
