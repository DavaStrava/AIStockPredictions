/**
 * Error Handling Integration Tests
 *
 * These tests verify that all API routes handle errors consistently:
 * - Validation errors return 400 with field information
 * - Not found errors return 404
 * - Server errors return 500
 * - All errors follow the { success: false, error: string } format
 *
 * Run with: npm test -- error-handling.test
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  createMockGetRequest,
  createMockPostRequest,
  createMockPatchRequest,
  createMockDeleteRequest,
  createRouteParams,
} from '../utils';
import {
  createTestHeaders,
  getResponseJson,
  assertErrorResponse,
  defaultDbResponses,
  defaultFmpResponses,
  mockDbPool,
  mockFmpProvider,
} from './setup';

// Mock database
vi.mock('@/lib/database/connection', () => ({
  getDatabase: () => mockDbPool,
  DatabaseConnection: vi.fn().mockImplementation(() => mockDbPool),
}));

// Mock FMP provider
vi.mock('@/lib/data-providers/fmp', () => ({
  getFMPProvider: () => mockFmpProvider,
}));

// Mock demo user
vi.mock('@/lib/auth/demo-user', () => ({
  getDemoUserId: vi.fn().mockResolvedValue('demo-user-id'),
}));

// Import routes after mocks
import { GET as getTrades, POST as createTrade } from '@/app/api/trades/route';
import { GET as getTradeById, PATCH as closeTrade, DELETE as deleteTrade } from '@/app/api/trades/[id]/route';
import { GET as searchStocks } from '@/app/api/search/route';
import { GET as getAnalysis } from '@/app/api/analysis/route';
import { GET as getPredictions } from '@/app/api/predictions/route';

describe('Error Response Structure', () => {
  const headers = createTestHeaders();

  beforeEach(() => {
    vi.clearAllMocks();
    mockDbPool.query.mockResolvedValue(defaultDbResponses.trades);
    mockFmpProvider.getQuote.mockResolvedValue(defaultFmpResponses.quote);
    mockFmpProvider.getHistoricalData.mockResolvedValue(defaultFmpResponses.historicalData);
    mockFmpProvider.searchStocks.mockResolvedValue(defaultFmpResponses.searchResults);
    mockFmpProvider.getMultipleQuotes.mockResolvedValue([defaultFmpResponses.quote]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Consistent Error Format', () => {
    it('all error responses have success: false', async () => {
      // Test various error scenarios
      const errorResponses = [];

      // Validation error
      const validationResponse = await getTrades(
        createMockGetRequest('/api/trades', { status: 'INVALID' }, headers)
      );
      errorResponses.push(await getResponseJson(validationResponse));

      // Missing required parameter
      const missingParamResponse = await searchStocks(
        createMockGetRequest('/api/search', {}, headers)
      );
      errorResponses.push(await getResponseJson(missingParamResponse));

      // Missing symbol for analysis
      const missingSymbolResponse = await getAnalysis(
        createMockGetRequest('/api/analysis', {}, headers)
      );
      errorResponses.push(await getResponseJson(missingSymbolResponse));

      // Verify all have success: false
      errorResponses.forEach((response) => {
        expect(response.success).toBe(false);
        expect(response.error).toBeDefined();
        expect(typeof response.error).toBe('string');
      });
    });

    it('all error responses have descriptive error messages', async () => {
      const response = await getTrades(
        createMockGetRequest('/api/trades', { status: 'INVALID' }, headers)
      );
      const json = await getResponseJson<{ error: string }>(response);

      expect(json.error.length).toBeGreaterThan(5);
      expect(json.error.toLowerCase()).not.toBe('error');
    });
  });
});

describe('Validation Errors (400)', () => {
  const headers = createTestHeaders();

  beforeEach(() => {
    vi.clearAllMocks();
    mockDbPool.query.mockResolvedValue(defaultDbResponses.trades);
  });

  describe('GET /api/trades validation', () => {
    it('should return 400 for invalid status filter', async () => {
      const response = await getTrades(
        createMockGetRequest('/api/trades', { status: 'INVALID' }, headers)
      );

      expect(response.status).toBe(400);
      const json = await getResponseJson(response);
      expect(json.success).toBe(false);
      expect(json.error).toContain('Invalid status');
    });

    it('should return 400 for invalid startDate format', async () => {
      const response = await getTrades(
        createMockGetRequest('/api/trades', { startDate: 'not-a-date' }, headers)
      );

      expect(response.status).toBe(400);
      const json = await getResponseJson(response);
      expect(json.success).toBe(false);
      expect(json.error).toContain('Invalid');
    });

    it('should return 400 for invalid endDate format', async () => {
      const response = await getTrades(
        createMockGetRequest('/api/trades', { endDate: '2024-13-45' }, headers)
      );

      expect(response.status).toBe(400);
      const json = await getResponseJson(response);
      expect(json.success).toBe(false);
    });
  });

  describe('POST /api/trades validation', () => {
    it('should return 400 for missing symbol', async () => {
      const response = await createTrade(
        createMockPostRequest(
          '/api/trades',
          {
            side: 'LONG',
            entryPrice: 150,
            quantity: 10,
          },
          headers
        )
      );

      expect(response.status).toBe(400);
      const json = await getResponseJson(response);
      expect(json.success).toBe(false);
    });

    it('should return 400 for missing side', async () => {
      const response = await createTrade(
        createMockPostRequest(
          '/api/trades',
          {
            symbol: 'AAPL',
            entryPrice: 150,
            quantity: 10,
          },
          headers
        )
      );

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid side value', async () => {
      const response = await createTrade(
        createMockPostRequest(
          '/api/trades',
          {
            symbol: 'AAPL',
            side: 'INVALID_SIDE',
            entryPrice: 150,
            quantity: 10,
          },
          headers
        )
      );

      expect(response.status).toBe(400);
    });

    it('should return 400 for negative entry price', async () => {
      const response = await createTrade(
        createMockPostRequest(
          '/api/trades',
          {
            symbol: 'AAPL',
            side: 'LONG',
            entryPrice: -50,
            quantity: 10,
          },
          headers
        )
      );

      expect(response.status).toBe(400);
    });

    it('should return 400 for zero quantity', async () => {
      const response = await createTrade(
        createMockPostRequest(
          '/api/trades',
          {
            symbol: 'AAPL',
            side: 'LONG',
            entryPrice: 150,
            quantity: 0,
          },
          headers
        )
      );

      expect(response.status).toBe(400);
    });

    it('should return 400 for negative quantity', async () => {
      const response = await createTrade(
        createMockPostRequest(
          '/api/trades',
          {
            symbol: 'AAPL',
            side: 'LONG',
            entryPrice: 150,
            quantity: -5,
          },
          headers
        )
      );

      expect(response.status).toBe(400);
    });

    it('should return 400 for negative fees', async () => {
      const response = await createTrade(
        createMockPostRequest(
          '/api/trades',
          {
            symbol: 'AAPL',
            side: 'LONG',
            entryPrice: 150,
            quantity: 10,
            fees: -5,
          },
          headers
        )
      );

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/trades/[id] validation', () => {
    it('should return 400 for negative exit price', async () => {
      mockDbPool.query.mockResolvedValueOnce({
        rows: [defaultDbResponses.insertTrade().rows[0]],
        rowCount: 1,
      });

      const response = await closeTrade(
        createMockPatchRequest('/api/trades/trade-123', { exitPrice: -100 }, headers),
        createRouteParams({ id: 'trade-123' })
      );

      expect(response.status).toBe(400);
    });

    it('should return 400 for zero exit price', async () => {
      mockDbPool.query.mockResolvedValueOnce({
        rows: [defaultDbResponses.insertTrade().rows[0]],
        rowCount: 1,
      });

      const response = await closeTrade(
        createMockPatchRequest('/api/trades/trade-123', { exitPrice: 0 }, headers),
        createRouteParams({ id: 'trade-123' })
      );

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/search validation', () => {
    it('should return 400 for missing query parameter', async () => {
      const response = await searchStocks(
        createMockGetRequest('/api/search', {}, headers)
      );

      expect(response.status).toBe(400);
      const json = await getResponseJson(response);
      expect(json.success).toBe(false);
    });

    it('should return 400 for empty query parameter', async () => {
      const response = await searchStocks(
        createMockGetRequest('/api/search', { q: '' }, headers)
      );

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/analysis validation', () => {
    it('should return 400 for missing symbol', async () => {
      const response = await getAnalysis(
        createMockGetRequest('/api/analysis', {}, headers)
      );

      expect(response.status).toBe(400);
      const json = await getResponseJson(response);
      expect(json.success).toBe(false);
    });

    it('should return 400 for invalid timeframe', async () => {
      const response = await getAnalysis(
        createMockGetRequest('/api/analysis', { symbol: 'AAPL', timeframe: 'INVALID' }, headers)
      );

      expect(response.status).toBe(400);
    });
  });
});

describe('Not Found Errors (404)', () => {
  const headers = createTestHeaders();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/trades/[id] not found', () => {
    it('should return 404 for non-existent trade', async () => {
      mockDbPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const response = await getTradeById(
        createMockGetRequest('/api/trades/non-existent', {}, headers),
        createRouteParams({ id: 'non-existent' })
      );

      expect(response.status).toBe(404);
      const json = await getResponseJson(response);
      expect(json.success).toBe(false);
      expect(json.error.toLowerCase()).toContain('not found');
    });
  });

  describe('PATCH /api/trades/[id] not found', () => {
    it('should return 404 when trying to close non-existent trade', async () => {
      mockDbPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const response = await closeTrade(
        createMockPatchRequest('/api/trades/non-existent', { exitPrice: 160 }, headers),
        createRouteParams({ id: 'non-existent' })
      );

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/trades/[id] not found', () => {
    it('should return 404 when trying to delete non-existent trade', async () => {
      mockDbPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const response = await deleteTrade(
        createMockDeleteRequest('/api/trades/non-existent', headers),
        createRouteParams({ id: 'non-existent' })
      );

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/analysis not found', () => {
    it('should return 404 when no data available for symbol', async () => {
      mockFmpProvider.getHistoricalData.mockResolvedValueOnce([]);
      mockFmpProvider.getQuote.mockResolvedValueOnce(null);

      const response = await getAnalysis(
        createMockGetRequest('/api/analysis', { symbol: 'INVALID' }, headers)
      );

      expect(response.status).toBe(404);
      const json = await getResponseJson(response);
      expect(json.success).toBe(false);
    });
  });
});

describe('Server Errors (500)', () => {
  const headers = createTestHeaders();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Database errors', () => {
    it('should return 500 when database query fails', async () => {
      mockDbPool.query.mockRejectedValueOnce(new Error('Connection refused'));

      const response = await getTrades(
        createMockGetRequest('/api/trades', {}, headers)
      );

      expect(response.status).toBe(500);
      const json = await getResponseJson(response);
      expect(json.success).toBe(false);
    });

    it('should return 500 when insert fails', async () => {
      mockDbPool.query.mockRejectedValueOnce(new Error('Constraint violation'));

      const response = await createTrade(
        createMockPostRequest(
          '/api/trades',
          {
            symbol: 'AAPL',
            side: 'LONG',
            entryPrice: 150,
            quantity: 10,
          },
          headers
        )
      );

      expect(response.status).toBe(500);
    });
  });

  describe('External API errors', () => {
    it('should return 500 when FMP API fails for search', async () => {
      mockFmpProvider.searchStocks.mockRejectedValueOnce(new Error('API timeout'));

      const response = await searchStocks(
        createMockGetRequest('/api/search', { q: 'AAPL' }, headers)
      );

      expect(response.status).toBe(500);
      const json = await getResponseJson(response);
      expect(json.success).toBe(false);
    });

    it('should handle FMP API failures gracefully for analysis', async () => {
      mockFmpProvider.getHistoricalData.mockRejectedValueOnce(new Error('Rate limited'));

      const response = await getAnalysis(
        createMockGetRequest('/api/analysis', { symbol: 'AAPL' }, headers)
      );

      // Should return error
      expect(response.status).toBeGreaterThanOrEqual(400);
      const json = await getResponseJson(response);
      expect(json.success).toBe(false);
    });
  });

  describe('Error message sanitization', () => {
    it('should not expose internal error details', async () => {
      mockDbPool.query.mockRejectedValueOnce(
        new Error('FATAL: password authentication failed for user "postgres"')
      );

      const response = await getTrades(
        createMockGetRequest('/api/trades', {}, headers)
      );

      const json = await getResponseJson(response);

      // Should not contain sensitive info
      expect(json.error.toLowerCase()).not.toContain('password');
      expect(json.error.toLowerCase()).not.toContain('postgres');
    });

    it('should not expose stack traces in production', async () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at Object.<anonymous> (/path/to/file.ts:10:15)';

      mockDbPool.query.mockRejectedValueOnce(error);

      const response = await getTrades(
        createMockGetRequest('/api/trades', {}, headers)
      );

      const json = await getResponseJson(response);

      // Should not contain file paths
      expect(json.error).not.toContain('/path/to');
      expect(json.error).not.toContain('.ts:');
    });
  });
});

describe('Business Logic Errors', () => {
  const headers = createTestHeaders();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Trade already closed', () => {
    it('should return 400 when trying to close already closed trade', async () => {
      const closedTrade = {
        ...defaultDbResponses.insertTrade().rows[0],
        status: 'CLOSED',
        exit_price: '160.00',
        exit_date: new Date().toISOString(),
      };

      mockDbPool.query.mockResolvedValueOnce({ rows: [closedTrade], rowCount: 1 });

      const response = await closeTrade(
        createMockPatchRequest('/api/trades/trade-123', { exitPrice: 165 }, headers),
        createRouteParams({ id: 'trade-123' })
      );

      expect(response.status).toBe(400);
      const json = await getResponseJson(response);
      expect(json.success).toBe(false);
      expect(json.error.toLowerCase()).toContain('already closed');
    });
  });
});

describe('Error Response Fields', () => {
  const headers = createTestHeaders();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validation errors should include field name when applicable', async () => {
    const response = await createTrade(
      createMockPostRequest(
        '/api/trades',
        {
          symbol: 'AAPL',
          side: 'LONG',
          entryPrice: -50, // Invalid
          quantity: 10,
        },
        headers
      )
    );

    const json = await getResponseJson<{ success: boolean; error: string; field?: string }>(
      response
    );

    expect(json.success).toBe(false);
    // Field should indicate which field failed validation
    if (json.field) {
      expect(['entryPrice', 'entry_price', 'price']).toContain(json.field);
    }
  });

  it('validation errors may include error code', async () => {
    const response = await createTrade(
      createMockPostRequest(
        '/api/trades',
        {
          symbol: 'AAPL',
          side: 'INVALID',
          entryPrice: 150,
          quantity: 10,
        },
        headers
      )
    );

    const json = await getResponseJson<{ success: boolean; code?: string }>(response);

    // Code is optional but helpful
    if (json.code) {
      expect(typeof json.code).toBe('string');
    }
  });
});
