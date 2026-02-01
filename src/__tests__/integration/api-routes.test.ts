/**
 * API Route Integration Tests
 *
 * These tests verify that API routes work correctly end-to-end by importing
 * the actual route handlers and calling them with mock requests. This tests
 * the full request/response cycle including middleware, validation, and error handling.
 *
 * Run with: npm test -- api-routes.test
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
  assertSuccessResponse,
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

// Import routes AFTER mocks are set up
import { GET as getTrades, POST as createTrade } from '@/app/api/trades/route';
import { GET as getTradeById, PATCH as closeTrade, DELETE as deleteTrade } from '@/app/api/trades/[id]/route';
import { GET as getTradeStats } from '@/app/api/trades/stats/route';
import { GET as searchStocks } from '@/app/api/search/route';
import { GET as getAnalysis } from '@/app/api/analysis/route';
import { GET as getPredictions } from '@/app/api/predictions/route';

describe('API Route Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock responses
    mockDbPool.query.mockResolvedValue(defaultDbResponses.trades);
    mockFmpProvider.getQuote.mockResolvedValue(defaultFmpResponses.quote);
    mockFmpProvider.getHistoricalData.mockResolvedValue(defaultFmpResponses.historicalData);
    mockFmpProvider.searchStocks.mockResolvedValue(defaultFmpResponses.searchResults);
    mockFmpProvider.getMultipleQuotes.mockResolvedValue([defaultFmpResponses.quote]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/trades', () => {
    it('should return trades list with correct structure', async () => {
      const mockTrades = [
        {
          id: 'trade-1',
          user_id: 'demo-user-id',
          symbol: 'AAPL',
          side: 'LONG',
          status: 'OPEN',
          entry_price: '150.00',
          quantity: '10',
          entry_date: new Date().toISOString(),
          fees: '5.00',
        },
      ];

      mockDbPool.query.mockResolvedValueOnce({ rows: mockTrades, rowCount: 1 });

      const request = createMockGetRequest('/api/trades', {}, createTestHeaders());
      const response = await getTrades(request);

      expect(response.status).toBe(200);
      const json = await getResponseJson<{ success: boolean; data: any[] }>(response);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
    });

    it('should filter by status', async () => {
      mockDbPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const request = createMockGetRequest('/api/trades', { status: 'OPEN' }, createTestHeaders());
      const response = await getTrades(request);

      expect(response.status).toBe(200);
      expect(mockDbPool.query).toHaveBeenCalled();
    });

    it('should reject invalid status filter', async () => {
      const request = createMockGetRequest('/api/trades', { status: 'INVALID' }, createTestHeaders());
      const response = await getTrades(request);

      expect(response.status).toBe(400);
      const json = await getResponseJson(response);
      expect(json.success).toBe(false);
      expect(json.error).toContain('Invalid status');
    });

    it('should filter by symbol', async () => {
      mockDbPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const request = createMockGetRequest('/api/trades', { symbol: 'AAPL' }, createTestHeaders());
      const response = await getTrades(request);

      expect(response.status).toBe(200);
    });

    it('should filter by date range', async () => {
      mockDbPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const request = createMockGetRequest(
        '/api/trades',
        {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        },
        createTestHeaders()
      );
      const response = await getTrades(request);

      expect(response.status).toBe(200);
    });

    it('should reject invalid date format', async () => {
      const request = createMockGetRequest(
        '/api/trades',
        { startDate: 'not-a-date' },
        createTestHeaders()
      );
      const response = await getTrades(request);

      expect(response.status).toBe(400);
      const json = await getResponseJson(response);
      expect(json.error).toContain('Invalid');
    });
  });

  describe('POST /api/trades', () => {
    it('should create a trade with valid data', async () => {
      mockDbPool.query.mockResolvedValueOnce(defaultDbResponses.insertTrade());

      const request = createMockPostRequest(
        '/api/trades',
        {
          symbol: 'AAPL',
          side: 'LONG',
          entryPrice: 150,
          quantity: 10,
          fees: 5,
        },
        createTestHeaders()
      );
      const response = await createTrade(request);

      expect(response.status).toBe(200);
      const json = await getResponseJson<{ success: boolean; data: any }>(response);
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
      expect(json.data.symbol).toBe('AAPL');
    });

    it('should reject missing required fields', async () => {
      const request = createMockPostRequest(
        '/api/trades',
        {
          symbol: 'AAPL',
          // Missing side, entryPrice, quantity
        },
        createTestHeaders()
      );
      const response = await createTrade(request);

      expect(response.status).toBe(400);
      const json = await getResponseJson(response);
      expect(json.success).toBe(false);
    });

    it('should reject invalid entry price', async () => {
      const request = createMockPostRequest(
        '/api/trades',
        {
          symbol: 'AAPL',
          side: 'LONG',
          entryPrice: -50, // Invalid negative price
          quantity: 10,
        },
        createTestHeaders()
      );
      const response = await createTrade(request);

      expect(response.status).toBe(400);
      const json = await getResponseJson(response);
      expect(json.success).toBe(false);
    });

    it('should reject invalid quantity', async () => {
      const request = createMockPostRequest(
        '/api/trades',
        {
          symbol: 'AAPL',
          side: 'LONG',
          entryPrice: 150,
          quantity: 0, // Invalid zero quantity
        },
        createTestHeaders()
      );
      const response = await createTrade(request);

      expect(response.status).toBe(400);
    });

    it('should accept optional fields', async () => {
      mockDbPool.query.mockResolvedValueOnce(
        defaultDbResponses.insertTrade({ notes: 'Test trade' })
      );

      const request = createMockPostRequest(
        '/api/trades',
        {
          symbol: 'AAPL',
          side: 'LONG',
          entryPrice: 150,
          quantity: 10,
          fees: 5,
          notes: 'Test trade',
        },
        createTestHeaders()
      );
      const response = await createTrade(request);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/trades/[id]', () => {
    it('should return a single trade', async () => {
      mockDbPool.query.mockResolvedValueOnce({
        rows: [defaultDbResponses.insertTrade().rows[0]],
        rowCount: 1,
      });

      const request = createMockGetRequest('/api/trades/trade-123', {}, createTestHeaders());
      const response = await getTradeById(request, createRouteParams({ id: 'trade-123' }));

      expect(response.status).toBe(200);
      const json = await getResponseJson<{ success: boolean; data: any }>(response);
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
    });

    it('should return 404 for non-existent trade', async () => {
      mockDbPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const request = createMockGetRequest('/api/trades/non-existent', {}, createTestHeaders());
      const response = await getTradeById(request, createRouteParams({ id: 'non-existent' }));

      expect(response.status).toBe(404);
      const json = await getResponseJson(response);
      expect(json.success).toBe(false);
    });
  });

  describe('PATCH /api/trades/[id]', () => {
    it('should close a trade with exit price', async () => {
      // First query returns the open trade
      mockDbPool.query.mockResolvedValueOnce({
        rows: [defaultDbResponses.insertTrade().rows[0]],
        rowCount: 1,
      });
      // Second query updates the trade
      mockDbPool.query.mockResolvedValueOnce({
        rows: [
          {
            ...defaultDbResponses.insertTrade().rows[0],
            status: 'CLOSED',
            exit_price: '160.00',
            exit_date: new Date().toISOString(),
            realized_pnl: '95.00',
          },
        ],
        rowCount: 1,
      });

      const request = createMockPatchRequest(
        '/api/trades/trade-123',
        { exitPrice: 160 },
        createTestHeaders()
      );
      const response = await closeTrade(request, createRouteParams({ id: 'trade-123' }));

      expect(response.status).toBe(200);
      const json = await getResponseJson<{ success: boolean; data: any }>(response);
      expect(json.success).toBe(true);
    });

    it('should reject invalid exit price', async () => {
      mockDbPool.query.mockResolvedValueOnce({
        rows: [defaultDbResponses.insertTrade().rows[0]],
        rowCount: 1,
      });

      const request = createMockPatchRequest(
        '/api/trades/trade-123',
        { exitPrice: -50 }, // Invalid negative
        createTestHeaders()
      );
      const response = await closeTrade(request, createRouteParams({ id: 'trade-123' }));

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent trade', async () => {
      mockDbPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const request = createMockPatchRequest(
        '/api/trades/non-existent',
        { exitPrice: 160 },
        createTestHeaders()
      );
      const response = await closeTrade(request, createRouteParams({ id: 'non-existent' }));

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/trades/[id]', () => {
    it('should delete a trade', async () => {
      mockDbPool.query.mockResolvedValueOnce({
        rows: [defaultDbResponses.insertTrade().rows[0]],
        rowCount: 1,
      });
      mockDbPool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const request = createMockDeleteRequest('/api/trades/trade-123', createTestHeaders());
      const response = await deleteTrade(request, createRouteParams({ id: 'trade-123' }));

      expect(response.status).toBe(200);
      const json = await getResponseJson(response);
      expect(json.success).toBe(true);
    });

    it('should return 404 for non-existent trade', async () => {
      mockDbPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const request = createMockDeleteRequest('/api/trades/non-existent', createTestHeaders());
      const response = await deleteTrade(request, createRouteParams({ id: 'non-existent' }));

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/trades/stats', () => {
    it('should return portfolio statistics', async () => {
      mockDbPool.query.mockResolvedValueOnce(defaultDbResponses.portfolioStats);

      const request = createMockGetRequest('/api/trades/stats', {}, createTestHeaders());
      const response = await getTradeStats(request);

      expect(response.status).toBe(200);
      const json = await getResponseJson<{ success: boolean; data: any }>(response);
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
      expect(json.data).toHaveProperty('totalTrades');
    });
  });

  describe('GET /api/search', () => {
    it('should return search results array', async () => {
      mockFmpProvider.searchStocks.mockResolvedValueOnce(defaultFmpResponses.searchResults);

      const request = createMockGetRequest('/api/search', { q: 'AAPL' }, createTestHeaders());
      const response = await searchStocks(request);

      expect(response.status).toBe(200);
      const json = await getResponseJson<{ success: boolean; data: any[] }>(response);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
    });

    it('should require query parameter', async () => {
      const request = createMockGetRequest('/api/search', {}, createTestHeaders());
      const response = await searchStocks(request);

      expect(response.status).toBe(400);
      const json = await getResponseJson(response);
      expect(json.success).toBe(false);
    });

    it('should limit results', async () => {
      mockFmpProvider.searchStocks.mockResolvedValueOnce(defaultFmpResponses.searchResults);

      const request = createMockGetRequest('/api/search', { q: 'A', limit: '5' }, createTestHeaders());
      const response = await searchStocks(request);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/analysis', () => {
    it('should return analysis with correct structure', async () => {
      const request = createMockGetRequest(
        '/api/analysis',
        { symbol: 'AAPL', timeframe: '1y' },
        createTestHeaders()
      );
      const response = await getAnalysis(request);

      expect(response.status).toBe(200);
      const json = await getResponseJson<{
        success: boolean;
        data: any;
        priceData: any[];
        metadata: any;
      }>(response);
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
      expect(Array.isArray(json.priceData)).toBe(true);
      expect(json.metadata).toBeDefined();
    });

    it('should require symbol parameter', async () => {
      const request = createMockGetRequest('/api/analysis', {}, createTestHeaders());
      const response = await getAnalysis(request);

      expect(response.status).toBe(400);
      const json = await getResponseJson(response);
      expect(json.success).toBe(false);
    });

    it('should accept valid timeframes', async () => {
      const validTimeframes = ['1d', '5d', '1m', '3m', '6m', '1y', '5y'];

      for (const timeframe of validTimeframes) {
        mockFmpProvider.getHistoricalData.mockResolvedValueOnce(defaultFmpResponses.historicalData);
        mockFmpProvider.getQuote.mockResolvedValueOnce(defaultFmpResponses.quote);

        const request = createMockGetRequest(
          '/api/analysis',
          { symbol: 'AAPL', timeframe },
          createTestHeaders()
        );
        const response = await getAnalysis(request);

        expect(response.status).toBe(200);
      }
    });
  });

  describe('GET /api/predictions', () => {
    it('should return predictions array in data field', async () => {
      const request = createMockGetRequest(
        '/api/predictions',
        { symbols: 'AAPL,GOOGL' },
        createTestHeaders()
      );
      const response = await getPredictions(request);

      expect(response.status).toBe(200);
      const json = await getResponseJson<{
        success: boolean;
        data: any[];
        metadata: any;
      }>(response);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.metadata).toBeDefined();
    });

    it('should use default symbols when none provided', async () => {
      const request = createMockGetRequest('/api/predictions', {}, createTestHeaders());
      const response = await getPredictions(request);

      expect(response.status).toBe(200);
      const json = await getResponseJson(response);
      expect(json.success).toBe(true);
    });
  });
});

describe('API Response Structure Contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbPool.query.mockResolvedValue(defaultDbResponses.trades);
    mockFmpProvider.getQuote.mockResolvedValue(defaultFmpResponses.quote);
    mockFmpProvider.getHistoricalData.mockResolvedValue(defaultFmpResponses.historicalData);
    mockFmpProvider.searchStocks.mockResolvedValue(defaultFmpResponses.searchResults);
    mockFmpProvider.getMultipleQuotes.mockResolvedValue([defaultFmpResponses.quote]);
  });

  it('all routes return { success: boolean, data: ... } format', async () => {
    // Test trades list
    mockDbPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    const tradesResponse = await getTrades(
      createMockGetRequest('/api/trades', {}, createTestHeaders())
    );
    const tradesJson = await getResponseJson<{ success: boolean }>(tradesResponse);
    expect(tradesJson).toHaveProperty('success');

    // Test search
    const searchResponse = await searchStocks(
      createMockGetRequest('/api/search', { q: 'AAPL' }, createTestHeaders())
    );
    const searchJson = await getResponseJson<{ success: boolean }>(searchResponse);
    expect(searchJson).toHaveProperty('success');

    // Test analysis
    const analysisResponse = await getAnalysis(
      createMockGetRequest('/api/analysis', { symbol: 'AAPL' }, createTestHeaders())
    );
    const analysisJson = await getResponseJson<{ success: boolean }>(analysisResponse);
    expect(analysisJson).toHaveProperty('success');

    // Test predictions
    const predictionsResponse = await getPredictions(
      createMockGetRequest('/api/predictions', {}, createTestHeaders())
    );
    const predictionsJson = await getResponseJson<{ success: boolean }>(predictionsResponse);
    expect(predictionsJson).toHaveProperty('success');
  });

  it('error responses include error message', async () => {
    // Test validation error
    const response = await getTrades(
      createMockGetRequest('/api/trades', { status: 'INVALID' }, createTestHeaders())
    );
    const json = await getResponseJson<{ success: boolean; error: string }>(response);

    expect(json.success).toBe(false);
    expect(json.error).toBeDefined();
    expect(typeof json.error).toBe('string');
  });
});
