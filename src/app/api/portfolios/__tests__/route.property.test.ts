/**
 * Property Tests: Portfolio API Validation
 *
 * Feature: portfolio-tracker, Property: API Validation Returns Appropriate Error Codes
 *
 * These tests verify that:
 * 1. API requests with invalid data return HTTP 400 with error details
 * 2. API requests referencing non-existent portfolios return HTTP 404
 * 3. Valid requests are processed successfully
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { GET, PUT, DELETE } from '../[id]/route';
import { POST as PostTransaction } from '../[id]/transactions/route';

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

// Mock demo user
vi.mock('@/lib/auth/demo-user', () => ({
  getDemoUserId: vi.fn(() => Promise.resolve('demo-user-123')),
}));

/**
 * Generate stock symbol (1-5 uppercase letters)
 */
const stockSymbolArb = fc
  .array(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')), { minLength: 1, maxLength: 5 })
  .map((chars) => chars.join(''));

/**
 * Generate valid portfolio name
 */
const portfolioNameArb = fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0);

/**
 * Generate invalid transaction types
 */
const invalidTransactionTypeArb = fc.oneof(
  fc.constant('BUY_SELL'),
  fc.constant('deposit'),
  fc.constant('TRANSFER'),
  fc.constant(''),
  fc.constant(null)
);

/**
 * Helper to create a mock NextRequest with JSON body
 */
function createMockRequest(body: unknown, url = 'http://localhost:3000/api/portfolios'): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

describe('Portfolio API Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/portfolios - Create Portfolio', () => {
    /**
     * Property: Valid portfolio creation requests should succeed
     */
    it('should create portfolio with valid name', async () => {
      await fc.assert(
        fc.asyncProperty(portfolioNameArb, async (name) => {
          const mockPortfolio = {
            id: 'portfolio-123',
            user_id: 'demo-user-123',
            name,
            description: null,
            currency: 'USD',
            is_default: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          mockQuery.mockReset();
          mockQuery.mockResolvedValueOnce({ rows: [mockPortfolio] });

          const request = createMockRequest({ name });
          const response = await POST(request);
          const data = await response.json();

          expect(response.status).toBe(200);
          expect(data.success).toBe(true);
          expect(data.data.name).toBe(name);

          return true;
        }),
        { numRuns: 50 }
      );
    });

    /**
     * Property: Empty name should return 400
     */
    it('should return 400 for empty portfolio name', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('', '   ', '\n', '\t'),
          async (invalidName) => {
            const request = createMockRequest({ name: invalidName });
            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error).toBeDefined();

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * Property: Missing name should return 400
     */
    it('should return 400 for missing portfolio name', async () => {
      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('GET /api/portfolios/[id] - Get Portfolio', () => {
    /**
     * Property: Non-existent portfolio should return 404
     */
    it('should return 404 for non-existent portfolio', async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (portfolioId) => {
          mockQuery.mockReset();
          mockQuery.mockResolvedValueOnce({ rows: [] });

          const request = new NextRequest(
            `http://localhost:3000/api/portfolios/${portfolioId}`,
            { method: 'GET' }
          );

          const response = await GET(request, { params: Promise.resolve({ id: portfolioId }) });
          const data = await response.json();

          expect(response.status).toBe(404);
          expect(data.success).toBe(false);
          expect(data.error).toContain('not found');

          return true;
        }),
        { numRuns: 50 }
      );
    });

    /**
     * Property: Existing portfolio should return 200
     */
    it('should return 200 for existing portfolio', async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), portfolioNameArb, async (portfolioId, name) => {
          const mockPortfolio = {
            id: portfolioId,
            user_id: 'demo-user-123',
            name,
            description: null,
            currency: 'USD',
            is_default: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          mockQuery.mockReset();
          mockQuery.mockResolvedValueOnce({ rows: [mockPortfolio] });

          const request = new NextRequest(
            `http://localhost:3000/api/portfolios/${portfolioId}`,
            { method: 'GET' }
          );

          const response = await GET(request, { params: Promise.resolve({ id: portfolioId }) });
          const data = await response.json();

          expect(response.status).toBe(200);
          expect(data.success).toBe(true);
          expect(data.data.id).toBe(portfolioId);

          return true;
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('DELETE /api/portfolios/[id] - Delete Portfolio', () => {
    /**
     * Property: Deleting non-existent portfolio should return 404
     */
    it('should return 404 when deleting non-existent portfolio', async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (portfolioId) => {
          mockQuery.mockReset();
          mockQuery.mockResolvedValueOnce({ rows: [] }); // Portfolio not found

          const request = new NextRequest(
            `http://localhost:3000/api/portfolios/${portfolioId}`,
            { method: 'DELETE' }
          );

          const response = await DELETE(request, { params: Promise.resolve({ id: portfolioId }) });
          const data = await response.json();

          expect(response.status).toBe(404);
          expect(data.success).toBe(false);

          return true;
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('PUT /api/portfolios/[id] - Update Portfolio', () => {
    /**
     * Property: Updating non-existent portfolio should return 404
     */
    it('should return 404 when updating non-existent portfolio', async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), portfolioNameArb, async (portfolioId, name) => {
          mockQuery.mockReset();
          mockQuery.mockResolvedValueOnce({ rows: [] }); // Portfolio not found

          const request = new NextRequest(
            `http://localhost:3000/api/portfolios/${portfolioId}`,
            {
              method: 'PUT',
              body: JSON.stringify({ name }),
              headers: { 'Content-Type': 'application/json' },
            }
          );

          const response = await PUT(request, { params: Promise.resolve({ id: portfolioId }) });
          const data = await response.json();

          expect(response.status).toBe(404);
          expect(data.success).toBe(false);

          return true;
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('POST /api/portfolios/[id]/transactions - Add Transaction', () => {
    /**
     * Property: Invalid transaction type should return 400
     */
    it('should return 400 for invalid transaction type', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          invalidTransactionTypeArb,
          fc.float({ min: Math.fround(100), max: Math.fround(10000), noNaN: true, noDefaultInfinity: true }),
          async (portfolioId, invalidType, amount) => {
            const request = new NextRequest(
              `http://localhost:3000/api/portfolios/${portfolioId}/transactions`,
              {
                method: 'POST',
                body: JSON.stringify({
                  transactionType: invalidType,
                  totalAmount: amount,
                  transactionDate: new Date().toISOString(),
                }),
                headers: { 'Content-Type': 'application/json' },
              }
            );

            const response = await PostTransaction(request, {
              params: Promise.resolve({ id: portfolioId }),
            });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Property: BUY without symbol should return 400
     */
    it('should return 400 for BUY transaction without symbol', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.float({ min: Math.fround(1), max: Math.fround(100), noNaN: true, noDefaultInfinity: true }),
          fc.float({ min: Math.fround(10), max: Math.fround(1000), noNaN: true, noDefaultInfinity: true }),
          async (portfolioId, quantity, price) => {
            const request = new NextRequest(
              `http://localhost:3000/api/portfolios/${portfolioId}/transactions`,
              {
                method: 'POST',
                body: JSON.stringify({
                  transactionType: 'BUY',
                  // Missing assetSymbol
                  quantity,
                  pricePerShare: price,
                  totalAmount: quantity * price,
                  transactionDate: new Date().toISOString(),
                }),
                headers: { 'Content-Type': 'application/json' },
              }
            );

            const response = await PostTransaction(request, {
              params: Promise.resolve({ id: portfolioId }),
            });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error).toContain('assetSymbol');

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Property: Negative totalAmount should return 400
     */
    it('should return 400 for negative totalAmount', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.float({ min: Math.fround(-10000), max: Math.fround(-0.01), noNaN: true, noDefaultInfinity: true }),
          async (portfolioId, negativeAmount) => {
            const request = new NextRequest(
              `http://localhost:3000/api/portfolios/${portfolioId}/transactions`,
              {
                method: 'POST',
                body: JSON.stringify({
                  transactionType: 'DEPOSIT',
                  totalAmount: negativeAmount,
                  transactionDate: new Date().toISOString(),
                }),
                headers: { 'Content-Type': 'application/json' },
              }
            );

            const response = await PostTransaction(request, {
              params: Promise.resolve({ id: portfolioId }),
            });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Property: Valid DEPOSIT transaction should succeed
     */
    it('should create valid DEPOSIT transaction', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.float({ min: Math.fround(100), max: Math.fround(100000), noNaN: true, noDefaultInfinity: true }),
          async (portfolioId, amount) => {
            const mockPortfolio = {
              id: portfolioId,
              user_id: 'demo-user-123',
              name: 'Test Portfolio',
              description: null,
              currency: 'USD',
              is_default: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            const mockTransaction = {
              id: 'txn-123',
              portfolio_id: portfolioId,
              asset_symbol: null,
              transaction_type: 'DEPOSIT',
              quantity: null,
              price_per_share: null,
              fees: '0',
              total_amount: String(amount),
              transaction_date: new Date().toISOString(),
              notes: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            mockQuery.mockReset();
            mockQuery.mockResolvedValueOnce({ rows: [mockPortfolio] }); // getPortfolioById
            mockQuery.mockResolvedValueOnce({ rows: [mockTransaction] }); // insert

            const request = new NextRequest(
              `http://localhost:3000/api/portfolios/${portfolioId}/transactions`,
              {
                method: 'POST',
                body: JSON.stringify({
                  transactionType: 'DEPOSIT',
                  totalAmount: amount,
                  transactionDate: new Date().toISOString(),
                }),
                headers: { 'Content-Type': 'application/json' },
              }
            );

            const response = await PostTransaction(request, {
              params: Promise.resolve({ id: portfolioId }),
            });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data.transactionType).toBe('DEPOSIT');

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});





