/**
 * Property Tests: API Validation Returns Appropriate Error Codes
 *
 * Feature: trading-journal, Property 9: API Validation Returns Appropriate Error Codes
 * Validates: Requirements 10.5, 10.6
 *
 * These tests verify that:
 * 1. API requests with invalid data return HTTP 400 with error details
 * 2. API requests referencing non-existent trades return HTTP 404
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { PATCH, GET } from '../[id]/route';

// Mock the database connection
const mockQuery = vi.fn();
vi.mock('@/lib/database/connection', () => ({
  getDatabase: vi.fn(() => ({
    query: mockQuery,
    getPool: vi.fn(),
    getClient: vi.fn(),
    transaction: vi.fn(),
    close: vi.fn(),
    healthCheck: vi.fn(),
  })),
}));

// Mock the FMP provider
vi.mock('@/lib/data-providers/fmp', () => ({
  getFMPProvider: vi.fn(() => ({
    getQuote: vi.fn(),
    getMultipleQuotes: vi.fn(),
    getHistoricalData: vi.fn(),
    searchStocks: vi.fn(),
    getCompanyProfile: vi.fn(),
    validateApiKey: vi.fn(),
  })),
}));

// Import mocked modules - getDatabase is mocked above

/**
 * Generate stock symbol (1-5 uppercase letters)
 */
const stockSymbolArb = fc
  .array(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')), { minLength: 1, maxLength: 5 })
  .map((chars) => chars.join(''));

/**
 * Arbitrary for invalid entry prices (non-positive or invalid)
 */
const invalidEntryPriceArb = fc.oneof(
  fc.constant(0),
  fc.constant(-1),
  fc.float({ min: Math.fround(-100000), max: 0, noNaN: true, noDefaultInfinity: true }),
  fc.constant('not-a-number'),
  fc.constant(null)
);

/**
 * Arbitrary for invalid quantities (non-positive or invalid)
 */
const invalidQuantityArb = fc.oneof(
  fc.constant(0),
  fc.constant(-1),
  fc.float({ min: Math.fround(-100000), max: 0, noNaN: true, noDefaultInfinity: true }),
  fc.constant('not-a-number'),
  fc.constant(null)
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

/**
 * Helper to create a mock NextRequest with JSON body
 */
function createMockRequest(body: unknown, url = 'http://localhost:3000/api/trades'): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Helper to create a mock NextRequest for PATCH
 */
function createMockPatchRequest(body: unknown, url = 'http://localhost:3000/api/trades/123'): NextRequest {
  return new NextRequest(url, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

describe('Property 9: API Validation Returns Appropriate Error Codes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.mockReset();
    // Enable demo mode for tests by setting NODE_ENV to development
    vi.stubEnv('NODE_ENV', 'development');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  /**
   * Property: For any POST /api/trades request with invalid entry price,
   * the API SHALL return HTTP 400 with error details.
   *
   * **Validates: Requirements 10.5**
   */
  it('should return 400 for invalid entry price in POST /api/trades', async () => {
    await fc.assert(
      fc.asyncProperty(
        stockSymbolArb,
        fc.constantFrom('LONG', 'SHORT'),
        invalidEntryPriceArb,
        fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true, noDefaultInfinity: true }),
        async (symbol, side, invalidPrice, quantity) => {
          const request = createMockRequest({
            symbol,
            side,
            entryPrice: invalidPrice,
            quantity,
          });

          const response = await POST(request);
          const data = await response.json();

          // Should return 400 status
          expect(response.status).toBe(400);
          // Should include error details
          expect(data.success).toBe(false);
          expect(data.error).toBeDefined();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any POST /api/trades request with invalid quantity,
   * the API SHALL return HTTP 400 with error details.
   *
   * **Validates: Requirements 10.5**
   */
  it('should return 400 for invalid quantity in POST /api/trades', async () => {
    await fc.assert(
      fc.asyncProperty(
        stockSymbolArb,
        fc.constantFrom('LONG', 'SHORT'),
        fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true, noDefaultInfinity: true }),
        invalidQuantityArb,
        async (symbol, side, entryPrice, invalidQuantity) => {
          const request = createMockRequest({
            symbol,
            side,
            entryPrice,
            quantity: invalidQuantity,
          });

          const response = await POST(request);
          const data = await response.json();

          // Should return 400 status
          expect(response.status).toBe(400);
          // Should include error details
          expect(data.success).toBe(false);
          expect(data.error).toBeDefined();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any POST /api/trades request with invalid side,
   * the API SHALL return HTTP 400 with error details.
   *
   * **Validates: Requirements 10.5**
   */
  it('should return 400 for invalid side in POST /api/trades', async () => {
    await fc.assert(
      fc.asyncProperty(
        stockSymbolArb,
        invalidSideArb,
        fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true, noDefaultInfinity: true }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true, noDefaultInfinity: true }),
        async (symbol, invalidSide, entryPrice, quantity) => {
          const request = createMockRequest({
            symbol,
            side: invalidSide,
            entryPrice,
            quantity,
          });

          const response = await POST(request);
          const data = await response.json();

          // Should return 400 status
          expect(response.status).toBe(400);
          // Should include error details
          expect(data.success).toBe(false);
          expect(data.error).toBeDefined();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any POST /api/trades request with missing required fields,
   * the API SHALL return HTTP 400 with error details.
   *
   * **Validates: Requirements 10.5**
   */
  it('should return 400 for missing required fields in POST /api/trades', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('symbol', 'side', 'entryPrice', 'quantity'),
        stockSymbolArb,
        fc.constantFrom('LONG', 'SHORT'),
        fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true, noDefaultInfinity: true }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true, noDefaultInfinity: true }),
        async (missingField, symbol, side, entryPrice, quantity) => {
          const body: Record<string, unknown> = {
            symbol,
            side,
            entryPrice,
            quantity,
          };

          // Remove the field to test missing required field
          delete body[missingField];

          const request = createMockRequest(body);

          const response = await POST(request);
          const data = await response.json();

          // Should return 400 status
          expect(response.status).toBe(400);
          // Should include error details
          expect(data.success).toBe(false);
          expect(data.error).toBeDefined();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any PATCH /api/trades/[id] request referencing a non-existent trade,
   * the API SHALL return HTTP 404.
   *
   * **Validates: Requirements 10.6**
   */
  it('should return 404 for non-existent trade in PATCH /api/trades/[id]', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true, noDefaultInfinity: true }),
        async (tradeId, exitPrice) => {
          // Reset and mock database to return no rows (trade not found)
          mockQuery.mockReset();
          mockQuery.mockResolvedValueOnce({ rows: [] });

          const request = createMockPatchRequest(
            { exitPrice },
            `http://localhost:3000/api/trades/${tradeId}`
          );

          const response = await PATCH(request, { params: Promise.resolve({ id: tradeId }) });
          const data = await response.json();

          // Should return 404 status
          expect(response.status).toBe(404);
          // Should include error message
          expect(data.success).toBe(false);
          expect(data.error).toContain('not found');

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any GET /api/trades/[id] request referencing a non-existent trade,
   * the API SHALL return HTTP 404.
   *
   * **Validates: Requirements 10.6**
   */
  it('should return 404 for non-existent trade in GET /api/trades/[id]', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (tradeId) => {
        // Reset and mock database to return no rows (trade not found)
        mockQuery.mockReset();
        mockQuery.mockResolvedValueOnce({ rows: [] });

        const request = new NextRequest(`http://localhost:3000/api/trades/${tradeId}`, {
          method: 'GET',
        });

        const response = await GET(request, { params: Promise.resolve({ id: tradeId }) });
        const data = await response.json();

        // Should return 404 status
        expect(response.status).toBe(404);
        // Should include error message
        expect(data.success).toBe(false);
        expect(data.error).toContain('not found');

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any PATCH /api/trades/[id] request with invalid exit price,
   * the API SHALL return HTTP 400 with error details.
   *
   * **Validates: Requirements 10.5**
   */
  it('should return 400 for invalid exit price in PATCH /api/trades/[id]', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.oneof(
          fc.constant(0),
          fc.constant(-1),
          fc.float({ min: Math.fround(-100000), max: 0, noNaN: true, noDefaultInfinity: true })
        ),
        async (tradeId, invalidExitPrice) => {
          // Mock database to return an open trade
          const openTrade = {
            id: tradeId,
            user_id: 'user-id',
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
          };

          // Reset and mock database to return an open trade
          mockQuery.mockReset();
          mockQuery.mockResolvedValueOnce({ rows: [openTrade] });

          const request = createMockPatchRequest(
            { exitPrice: invalidExitPrice },
            `http://localhost:3000/api/trades/${tradeId}`
          );

          const response = await PATCH(request, { params: Promise.resolve({ id: tradeId }) });
          const data = await response.json();

          // Should return 400 status
          expect(response.status).toBe(400);
          // Should include error details
          expect(data.success).toBe(false);
          expect(data.error).toBeDefined();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any PATCH /api/trades/[id] request without exit price,
   * the API SHALL return HTTP 400 with error details.
   *
   * **Validates: Requirements 10.5**
   */
  it('should return 400 for missing exit price in PATCH /api/trades/[id]', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (tradeId) => {
        const request = createMockPatchRequest({}, `http://localhost:3000/api/trades/${tradeId}`);

        const response = await PATCH(request, { params: Promise.resolve({ id: tradeId }) });
        const data = await response.json();

        // Should return 400 status
        expect(response.status).toBe(400);
        // Should include error details
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
        expect(data.field).toBe('exitPrice');

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
