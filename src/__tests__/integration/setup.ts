/**
 * Integration Test Setup
 *
 * This module provides setup utilities for integration tests that test
 * actual API route handlers. It provides database mocking, service mocking,
 * and test cleanup utilities.
 */

import { vi, beforeEach, afterEach, afterAll } from 'vitest';

/**
 * Mock database client for integration tests
 */
export const mockDbClient = {
  query: vi.fn(),
  connect: vi.fn(),
  end: vi.fn(),
};

/**
 * Mock database pool
 */
export const mockDbPool = {
  query: vi.fn(),
  connect: vi.fn().mockResolvedValue(mockDbClient),
  end: vi.fn(),
  healthCheck: vi.fn().mockResolvedValue(true),
};

/**
 * Mock FMP Provider
 */
export const mockFmpProvider = {
  getHistoricalData: vi.fn(),
  getQuote: vi.fn(),
  getMultipleQuotes: vi.fn(),
  searchStocks: vi.fn(),
  searchSymbols: vi.fn(),
  getMarketIndices: vi.fn(),
};

/**
 * Default mock database responses
 */
export const defaultDbResponses = {
  /**
   * Mock response for trade queries
   */
  trades: {
    rows: [],
    rowCount: 0,
  },

  /**
   * Mock response for a single trade insert
   */
  insertTrade: (overrides: Record<string, unknown> = {}) => ({
    rows: [
      {
        id: 'trade-123',
        user_id: 'demo-user-id',
        symbol: 'AAPL',
        side: 'LONG',
        status: 'OPEN',
        entry_price: '150.00',
        quantity: '10',
        entry_date: new Date().toISOString(),
        exit_price: null,
        exit_date: null,
        fees: '5.00',
        realized_pnl: null,
        notes: null,
        prediction_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...overrides,
      },
    ],
    rowCount: 1,
  }),

  /**
   * Mock response for watchlist queries
   */
  watchlists: {
    rows: [],
    rowCount: 0,
  },

  /**
   * Mock response for portfolio stats
   */
  portfolioStats: {
    rows: [
      {
        total_trades: '0',
        open_trades: '0',
        closed_trades: '0',
        total_pnl: '0',
        total_fees: '0',
        winning_trades: '0',
        losing_trades: '0',
        total_wins: '0',
        total_losses: '0',
        largest_win: null,
        largest_loss: null,
      },
    ],
    rowCount: 1,
  },
};

/**
 * Default mock FMP provider responses
 */
export const defaultFmpResponses = {
  quote: {
    price: 155.5,
    change: 3.5,
    changesPercentage: 2.3,
    volume: 1100000,
    avgVolume: 1000000,
    marketCap: 2500000000000,
    pe: 28.5,
  },

  historicalData: Array.from({ length: 90 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (89 - i));
    return {
      date,
      open: 150 + i * 0.1,
      high: 152 + i * 0.1,
      low: 148 + i * 0.1,
      close: 151 + i * 0.1,
      volume: 1000000 + Math.random() * 100000,
    };
  }),

  searchResults: [
    { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', type: 'stock', currency: 'USD' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', type: 'stock', currency: 'USD' },
  ],
};

/**
 * Setup mocks for database and external services
 */
export function setupIntegrationMocks() {
  // Reset all mocks
  vi.resetAllMocks();

  // Setup default database responses
  mockDbPool.query.mockResolvedValue(defaultDbResponses.trades);

  // Setup default FMP responses
  mockFmpProvider.getQuote.mockResolvedValue(defaultFmpResponses.quote);
  mockFmpProvider.getHistoricalData.mockResolvedValue(defaultFmpResponses.historicalData);
  mockFmpProvider.searchStocks.mockResolvedValue(defaultFmpResponses.searchResults);
  mockFmpProvider.getMultipleQuotes.mockResolvedValue([defaultFmpResponses.quote]);
}

/**
 * Clear all mocks after each test
 */
export function clearIntegrationMocks() {
  vi.clearAllMocks();
}

/**
 * Reset rate limit stores between tests
 * Note: This requires the rate limit store to be exposed for testing
 */
export function resetRateLimits() {
  // Rate limits are stored in memory maps in the middleware
  // For now, we use unique client IDs per test to avoid conflicts
}

/**
 * Generate a unique client ID for each test to avoid rate limit interference
 */
let testCounter = 0;
export function getTestClientId(): string {
  return `test-client-${++testCounter}-${Date.now()}`;
}

/**
 * Create mock headers with a unique client identifier
 */
export function createTestHeaders(): Record<string, string> {
  return {
    'X-Forwarded-For': getTestClientId(),
    'Content-Type': 'application/json',
  };
}

/**
 * Integration test setup hook - use in describe blocks
 *
 * @example
 * describe('API Integration Tests', () => {
 *   useIntegrationTestSetup();
 *
 *   it('should work', async () => {
 *     // test code
 *   });
 * });
 */
export function useIntegrationTestSetup() {
  beforeEach(() => {
    setupIntegrationMocks();
  });

  afterEach(() => {
    clearIntegrationMocks();
  });
}

/**
 * Helper to wait for async operations
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Helper to extract JSON from a Response object
 */
export async function getResponseJson<T = unknown>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

/**
 * Assert that a response is successful
 */
export async function assertSuccessResponse<T>(
  response: Response,
  expectedStatus: number = 200
): Promise<{ success: true; data: T }> {
  expect(response.status).toBe(expectedStatus);

  const json = await response.json();
  expect(json.success).toBe(true);
  expect(json.data).toBeDefined();

  return json;
}

/**
 * Assert that a response is an error
 */
export async function assertErrorResponse(
  response: Response,
  expectedStatus: number,
  expectedErrorMatch?: string | RegExp
): Promise<{ success: false; error: string }> {
  expect(response.status).toBe(expectedStatus);

  const json = await response.json();
  expect(json.success).toBe(false);
  expect(json.error).toBeDefined();

  if (expectedErrorMatch) {
    if (typeof expectedErrorMatch === 'string') {
      expect(json.error.toLowerCase()).toContain(expectedErrorMatch.toLowerCase());
    } else {
      expect(json.error).toMatch(expectedErrorMatch);
    }
  }

  return json;
}

/**
 * Type for API response
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  field?: string;
  code?: string;
}
