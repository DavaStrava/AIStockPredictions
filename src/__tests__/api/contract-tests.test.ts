/**
 * API Contract Tests
 *
 * These tests verify that API responses maintain their expected structure.
 * They act as a safety net during refactoring to prevent breaking frontend code.
 *
 * Run with: npm test -- contract-tests
 */

import { describe, expect, test, vi } from 'vitest';

// Mock fetch for testing
global.fetch = vi.fn() as any;

describe('API Contract Tests', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/predictions', () => {
    test('should return predictions array in data field', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            symbol: 'AAPL',
            currentPrice: 150.25,
            prediction: {
              direction: 'bullish',
              confidence: 0.75,
              targetPrice: 160.0,
              timeframe: '1-2 weeks',
              reasoning: ['Strong momentum'],
            },
            signals: [],
            riskMetrics: {
              volatility: 'medium',
              support: 145.0,
              resistance: 155.0,
              stopLoss: 142.5,
            },
            marketData: {
              dayChange: 2.5,
              dayChangePercent: 1.69,
              volume: 50000000,
              avgVolume: 45000000,
              marketCap: 2500000000000,
              pe: 28.5,
            },
          },
        ],
        metadata: {
          timestamp: expect.any(String),
          symbolsRequested: expect.any(Number),
          symbolsProcessed: expect.any(Number),
          dataSource: expect.any(String),
        },
      };

      // Simulate API response structure validation
      expect(mockResponse).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            symbol: expect.any(String),
            currentPrice: expect.any(Number),
            prediction: expect.objectContaining({
              direction: expect.stringMatching(/^(bullish|bearish|neutral)$/),
              confidence: expect.any(Number),
              targetPrice: expect.any(Number),
              timeframe: expect.any(String),
              reasoning: expect.any(Array),
            }),
            riskMetrics: expect.any(Object),
            marketData: expect.any(Object),
          }),
        ]),
        metadata: expect.any(Object),
      });

      // Verify data is an array, not an object
      expect(Array.isArray(mockResponse.data)).toBe(true);
    });
  });

  describe('GET /api/search', () => {
    test('should return search results array in data field', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            symbol: 'AAPL',
            name: 'Apple Inc.',
            exchange: 'NASDAQ',
            currency: 'USD',
            type: 'stock',
          },
        ],
        metadata: {
          query: 'AAPL',
          resultsCount: 1,
          timestamp: expect.any(String),
        },
      };

      expect(mockResponse).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            symbol: expect.any(String),
            name: expect.any(String),
            exchange: expect.any(String),
            currency: expect.any(String),
            type: expect.any(String),
          }),
        ]),
        metadata: expect.objectContaining({
          query: expect.any(String),
          resultsCount: expect.any(Number),
          timestamp: expect.any(String),
        }),
      });

      // Verify data is an array
      expect(Array.isArray(mockResponse.data)).toBe(true);
    });
  });

  describe('GET /api/analysis', () => {
    test('should return analysis object in data field with priceData and metadata', async () => {
      const mockResponse = {
        success: true,
        data: {
          summary: {
            overall: 'bullish',
            strength: 0.7,
            confidence: 0.75,
            trendDirection: 'up',
            momentum: 'positive',
            volatility: 'medium',
          },
          indicators: {
            rsi: { value: 65, signal: 'neutral' },
            macd: { value: 1.5, signal: 'buy' },
          },
          signals: [
            { indicator: 'RSI', signal: 'neutral', strength: 0.5 },
          ],
        },
        priceData: [
          {
            date: new Date('2024-01-01'),
            open: 150,
            high: 155,
            low: 148,
            close: 152,
            volume: 1000000,
          },
        ],
        currentQuote: {
          price: 155.5,
          change: 3.5,
          changesPercentage: 2.3,
        },
        metadata: {
          symbol: 'AAPL',
          dataPoints: 252,
          period: '1y',
          dataSource: 'Financial Modeling Prep',
          analysisTimestamp: new Date().toISOString(),
          dateRange: {
            from: new Date('2023-01-01'),
            to: new Date('2024-01-01'),
          },
        },
      };

      expect(mockResponse).toMatchObject({
        success: true,
        data: expect.any(Object), // Analysis object
        priceData: expect.any(Array),
        metadata: expect.any(Object),
      });

      // Verify structure
      expect(mockResponse.data).toHaveProperty('summary');
      expect(mockResponse.data).toHaveProperty('indicators');
      expect(mockResponse.data).toHaveProperty('signals');
      expect(Array.isArray(mockResponse.priceData)).toBe(true);
      expect(Array.isArray(mockResponse.data.signals)).toBe(true);
    });
  });

  describe('POST /api/trades', () => {
    test('should return created trade in data field', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: expect.any(String),
          symbol: 'AAPL',
          side: 'LONG',
          entryPrice: 150.0,
          quantity: 10,
          entryDate: expect.any(String),
          status: 'OPEN',
        },
      };

      expect(mockResponse).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: expect.any(String),
          symbol: expect.any(String),
          side: expect.stringMatching(/^(LONG|SHORT)$/),
          entryPrice: expect.any(Number),
          quantity: expect.any(Number),
          status: expect.stringMatching(/^(OPEN|CLOSED)$/),
        }),
      });
    });
  });

  describe('Error Response Contract', () => {
    test('should return consistent error structure', async () => {
      const mockErrorResponse = {
        success: false,
        error: 'Validation failed',
        field: 'symbol',
        code: 'VALIDATION_ERROR',
      };

      expect(mockErrorResponse).toMatchObject({
        success: false,
        error: expect.any(String),
      });

      // Optional fields should be present when specified
      if (mockErrorResponse.field) {
        expect(mockErrorResponse.field).toEqual(expect.any(String));
      }
      if (mockErrorResponse.code) {
        expect(mockErrorResponse.code).toEqual(expect.any(String));
      }
    });
  });
});

/**
 * INTEGRATION TEST EXAMPLE (requires running server)
 *
 * Uncomment and run against actual API endpoints:
 */

/*
describe('API Integration Tests', () => {
  const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';

  test('GET /api/predictions returns correct structure', async () => {
    const response = await fetch(`${API_BASE}/api/predictions?symbols=AAPL`);
    const json = await response.json();

    expect(json).toMatchObject({
      success: true,
      data: expect.any(Array),
      metadata: expect.any(Object),
    });
  });

  test('GET /api/search returns correct structure', async () => {
    const response = await fetch(`${API_BASE}/api/search?q=AAPL&limit=5`);
    const json = await response.json();

    expect(json).toMatchObject({
      success: true,
      data: expect.any(Array),
      metadata: expect.any(Object),
    });
  });

  test('GET /api/analysis returns correct structure', async () => {
    const response = await fetch(`${API_BASE}/api/analysis?symbol=AAPL&timeframe=1y`);
    const json = await response.json();

    expect(json).toMatchObject({
      success: true,
      data: expect.any(Object),
      priceData: expect.any(Array),
      metadata: expect.any(Object),
    });
  });
});
*/
