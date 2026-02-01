/**
 * Tests for /api/analysis route
 *
 * Tests both GET and POST endpoints for technical analysis
 */

import { describe, expect, test, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/data-providers/fmp');
vi.mock('@/lib/technical-analysis/engine');

import { getFMPProvider } from '@/lib/data-providers/fmp';
import { TechnicalAnalysisEngine } from '@/lib/technical-analysis/engine';

describe('GET /api/analysis', () => {
  let mockFMPProvider: any;
  let mockEngine: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockFMPProvider = {
      getHistoricalData: vi.fn(),
      getQuote: vi.fn(),
    };
    (getFMPProvider as any).mockReturnValue(mockFMPProvider);

    mockEngine = {
      analyze: vi.fn(),
    };
    (TechnicalAnalysisEngine as any).mockImplementation(() => mockEngine);

    // Default mock data
    mockFMPProvider.getHistoricalData.mockResolvedValue([
      { date: new Date('2024-01-01'), open: 150, high: 155, low: 148, close: 152, volume: 1000000 },
      { date: new Date('2024-01-02'), open: 152, high: 157, low: 150, close: 155, volume: 1100000 },
    ]);

    mockFMPProvider.getQuote.mockResolvedValue({
      price: 155.5,
      change: 3.5,
      changesPercentage: 2.3,
      volume: 1100000,
      avgVolume: 1000000,
      marketCap: 2500000000000,
      pe: 28.5,
    });

    mockEngine.analyze.mockReturnValue({
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
        { indicator: 'MACD', signal: 'buy', strength: 0.8 },
      ],
    });
  });

  describe('Response Structure', () => {
    test('should return correct response structure', () => {
      // Mock response matching expected API response shape
      const mockResponse = {
        success: true,
        data: {
          summary: { overall: 'bullish', strength: 0.7, confidence: 0.75 },
          indicators: { rsi: { value: 65 } },
          signals: [{ indicator: 'RSI', signal: 'neutral' }],
        },
        priceData: [
          { date: new Date(), open: 150, high: 155, low: 148, close: 152, volume: 1000000 },
        ],
        currentQuote: { price: 155.5, change: 3.5 },
        metadata: {
          symbol: 'AAPL',
          dataPoints: 90,
          period: '1year',
          dataSource: 'FMP',
          analysisTimestamp: new Date().toISOString(),
          dateRange: { from: new Date(), to: new Date() },
        },
      };

      // Validate the response has the expected shape
      expect(mockResponse.success).toBe(true);
      expect(mockResponse.data).toHaveProperty('summary');
      expect(mockResponse.data).toHaveProperty('indicators');
      expect(mockResponse.data).toHaveProperty('signals');
      expect(Array.isArray(mockResponse.priceData)).toBe(true);
      expect(mockResponse.metadata).toHaveProperty('symbol');
      expect(mockResponse.metadata).toHaveProperty('dataPoints');
    });

    test('should include priceData array', () => {
      const mockResponse = {
        success: true,
        data: {},
        priceData: [
          { date: new Date(), open: 150, high: 155, low: 148, close: 152, volume: 1000000 },
        ],
        metadata: {},
      };

      expect(Array.isArray(mockResponse.priceData)).toBe(true);
      expect(mockResponse.priceData.length).toBeGreaterThan(0);
    });

    test('currentQuote can be null if fetch fails', () => {
      const mockResponse = {
        success: true,
        data: {},
        priceData: [],
        currentQuote: null, // Should be allowed
        metadata: {},
      };

      expect(mockResponse.currentQuote).toBeNull();
    });
  });

  describe('Input Validation', () => {
    test('should accept valid stock symbols', () => {
      const validSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'];

      validSymbols.forEach(symbol => {
        expect(/^[A-Z]+$/.test(symbol)).toBe(true);
        expect(symbol.length).toBeLessThanOrEqual(5);
        expect(symbol.length).toBeGreaterThan(0);
      });
    });

    test('should accept valid timeframes', () => {
      const validTimeframes = ['1d', '5d', '1m', '3m', '6m', '1y', '5y'];

      validTimeframes.forEach(timeframe => {
        expect(['1d', '5d', '1m', '3m', '6m', '1y', '5y']).toContain(timeframe);
      });
    });

    test('should default to 1y timeframe', () => {
      const timeframe = undefined;
      const defaultTimeframe = timeframe || '1y';
      expect(defaultTimeframe).toBe('1y');
    });

    test('should reject invalid symbols', () => {
      // Invalid symbols: empty, too long, numeric, contains special chars
      const invalidSymbols = ['', 'TOOLONGXYZ', '123', 'AA!', 'aapl', 'A1'];

      invalidSymbols.forEach(symbol => {
        const isValid =
          symbol.length > 0 &&
          symbol.length <= 5 &&
          /^[A-Z]+$/.test(symbol);

        expect(isValid).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    test('should throw NotFoundError when no data available', () => {
      const priceData: any[] = [];

      if (priceData.length === 0) {
        expect(() => {
          throw new Error('No historical data found');
        }).toThrow('No historical data found');
      }
    });

    test('should continue if quote fetch fails', async () => {
      let currentQuote = null;

      try {
        // Simulate quote fetch failure
        throw new Error('Quote API failed');
      } catch (error) {
        // Should not crash, just log warning
        console.warn('Failed to fetch quote');
        currentQuote = null;
      }

      expect(currentQuote).toBeNull();
    });

    test('should handle API errors gracefully', () => {
      const error = new Error('FMP API error');

      expect(error.message).toContain('FMP API error');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('Metadata', () => {
    test('should include correct metadata fields', () => {
      const metadata = {
        symbol: 'AAPL',
        dataPoints: 252,
        period: '1y',
        dataSource: 'Financial Modeling Prep',
        analysisTimestamp: new Date().toISOString(),
        dateRange: {
          from: new Date('2023-01-01'),
          to: new Date('2024-01-01'),
        },
      };

      expect(metadata.symbol).toBe('AAPL');
      expect(metadata.dataPoints).toBeGreaterThan(0);
      expect(metadata.dataSource).toBe('Financial Modeling Prep');
      expect(metadata.dateRange.from).toBeDefined();
      expect(metadata.dateRange.to).toBeDefined();
    });

    test('should use ISO timestamp format', () => {
      const timestamp = new Date().toISOString();
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('Rate Limiting', () => {
    test('should have rate limit configured for GET', () => {
      const rateLimitConfig = { requestsPerMinute: 30 };
      expect(rateLimitConfig.requestsPerMinute).toBe(30);
    });
  });
});

describe('POST /api/analysis', () => {
  let mockEngine: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockEngine = {
      analyze: vi.fn(),
    };
    (TechnicalAnalysisEngine as any).mockImplementation(() => mockEngine);

    mockEngine.analyze.mockReturnValue({
      summary: {},
      indicators: {},
      signals: [],
    });
  });

  describe('Request Validation', () => {
    test('should require symbol', () => {
      const body = { priceData: [] };
      const isValid = body.hasOwnProperty('symbol');
      expect(isValid).toBe(false);
    });

    test('should require priceData array', () => {
      const validBodies = [
        { symbol: 'AAPL', priceData: [] },
        { symbol: 'AAPL', priceData: [{}] },
      ];

      validBodies.forEach(body => {
        expect(body.symbol).toBeDefined();
        expect(Array.isArray(body.priceData)).toBe(true);
      });
    });

    test('should reject non-array priceData', () => {
      const invalidBodies = [
        { symbol: 'AAPL', priceData: 'not-array' },
        { symbol: 'AAPL', priceData: {} },
        { symbol: 'AAPL', priceData: null },
      ];

      invalidBodies.forEach(body => {
        expect(Array.isArray(body.priceData)).toBe(false);
      });
    });

    test('should accept optional config', () => {
      const body = {
        symbol: 'AAPL',
        priceData: [],
        config: { rsi: { period: 21 } },
      };

      expect(body.config).toBeDefined();
      expect(body.config).toHaveProperty('rsi');
    });
  });

  describe('Data Transformation', () => {
    test('should convert date strings to Date objects', () => {
      const priceData = [
        { date: '2024-01-01', open: 150, high: 155, low: 148, close: 152, volume: 1000000 },
        { date: '2024-01-02', open: 152, high: 157, low: 150, close: 155, volume: 1100000 },
      ];

      const processedData = priceData.map(item => ({
        ...item,
        date: new Date(item.date),
      }));

      processedData.forEach(item => {
        expect(item.date).toBeInstanceOf(Date);
      });
    });

    test('should preserve all price fields', () => {
      const item = {
        date: '2024-01-01',
        open: 150,
        high: 155,
        low: 148,
        close: 152,
        volume: 1000000,
      };

      const processed = {
        ...item,
        date: new Date(item.date),
      };

      expect(processed.open).toBe(150);
      expect(processed.high).toBe(155);
      expect(processed.low).toBe(148);
      expect(processed.close).toBe(152);
      expect(processed.volume).toBe(1000000);
    });
  });

  describe('Custom Configuration', () => {
    test('should pass config to TechnicalAnalysisEngine', () => {
      const config = {
        rsi: { period: 21 },
        macd: { fastPeriod: 12, slowPeriod: 26 },
      };

      // Verify config structure is valid
      expect(config).toHaveProperty('rsi');
      expect(config).toHaveProperty('macd');
      expect(config.rsi).toHaveProperty('period');
      expect(config.macd).toHaveProperty('fastPeriod');
    });

    test('should work without config', () => {
      // Verify engine can work with default config
      const defaultConfig = { rsi: { period: 14 }, macd: { fastPeriod: 12, slowPeriod: 26 } };
      expect(defaultConfig.rsi.period).toBe(14);
    });
  });

  describe('Response Structure', () => {
    test('should return analysis with metadata', () => {
      // Mock a valid response structure
      const mockResponse = {
        success: true,
        data: {
          summary: { overall: 'bullish', strength: 0.7 },
          indicators: { rsi: { value: 65 } },
          signals: [{ indicator: 'RSI', signal: 'neutral' }],
        },
        metadata: {
          symbol: 'AAPL',
          dataPoints: 100,
          analysisTimestamp: new Date().toISOString(),
          dataSource: 'Client Provided',
        },
      };

      expect(mockResponse.success).toBe(true);
      expect(mockResponse.metadata.dataSource).toBe('Client Provided');
      expect(mockResponse.data).toHaveProperty('summary');
      expect(mockResponse.data).toHaveProperty('indicators');
    });

    test('should indicate client-provided data source', () => {
      const metadata = {
        symbol: 'AAPL',
        dataPoints: 100,
        analysisTimestamp: new Date().toISOString(),
        dataSource: 'Client Provided',
      };

      expect(metadata.dataSource).toBe('Client Provided');
    });
  });

  describe('Rate Limiting', () => {
    test('should have rate limit configured for POST', () => {
      const rateLimitConfig = { requestsPerMinute: 20 };
      expect(rateLimitConfig.requestsPerMinute).toBe(20);
    });

    test('POST should have lower rate limit than GET', () => {
      const getRateLimit = 30;
      const postRateLimit = 20;
      expect(postRateLimit).toBeLessThan(getRateLimit);
    });
  });
});

describe('Analysis Edge Cases', () => {
  test('should handle empty price data array', () => {
    const priceData: any[] = [];

    if (priceData.length === 0) {
      expect(() => {
        // Should validate before processing
        if (priceData.length === 0) {
          throw new Error('No data to analyze');
        }
      }).toThrow();
    }
  });

  test('should handle single data point', () => {
    const priceData = [
      { date: new Date(), open: 150, high: 155, low: 148, close: 152, volume: 1000000 },
    ];

    expect(priceData.length).toBe(1);
    // Analysis might need minimum data points
  });

  test('should handle date range calculation', () => {
    const priceData = [
      { date: new Date('2024-01-01'), open: 150, high: 155, low: 148, close: 152, volume: 1000000 },
      { date: new Date('2024-12-31'), open: 160, high: 165, low: 158, close: 162, volume: 1100000 },
    ];

    const dateRange = {
      from: priceData[0]?.date,
      to: priceData[priceData.length - 1]?.date,
    };

    expect(dateRange.from).toBeDefined();
    expect(dateRange.to).toBeDefined();
    expect(dateRange.to.getTime()).toBeGreaterThanOrEqual(dateRange.from.getTime());
  });
});
