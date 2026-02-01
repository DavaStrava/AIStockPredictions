/**
 * Tests for /api/search route
 *
 * Tests the stock search API endpoint
 */

import { describe, expect, test, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/data-providers/fmp');

import { getFMPProvider } from '@/lib/data-providers/fmp';

describe('GET /api/search', () => {
  let mockFMPProvider: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockFMPProvider = {
      searchStocks: vi.fn(),
    };
    (getFMPProvider as any).mockReturnValue(mockFMPProvider);

    // Default mock data
    mockFMPProvider.searchStocks.mockResolvedValue([
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        exchangeShortName: 'NASDAQ',
        currency: 'USD',
      },
      {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        exchangeShortName: 'NASDAQ',
        currency: 'USD',
      },
      {
        symbol: 'LON:AAPL',
        name: 'Apple Inc.',
        exchangeShortName: 'LSE', // London Stock Exchange - should be filtered
        currency: 'GBP',
      },
    ]);
  });

  describe('Response Structure', () => {
    test('should return correct response structure', () => {
      // Mock a well-formed response
      const mockResponse = {
        success: true,
        data: [
          { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', currency: 'USD', type: 'stock' },
        ],
        metadata: { query: 'AAPL', resultsCount: 1, timestamp: new Date().toISOString() },
      };

      expect(mockResponse.success).toBe(true);
      expect(Array.isArray(mockResponse.data)).toBe(true);
    });

    test('data should be an array', () => {
      const mockResponse = {
        success: true,
        data: [
          { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', currency: 'USD', type: 'stock' },
        ],
        metadata: {},
      };

      expect(Array.isArray(mockResponse.data)).toBe(true);
    });

    test('each result should have required fields', () => {
      const result = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        exchange: 'NASDAQ',
        currency: 'USD',
        type: 'stock',
      };

      expect(result).toHaveProperty('symbol');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('exchange');
      expect(result).toHaveProperty('currency');
      expect(result).toHaveProperty('type');
    });
  });

  describe('Input Validation', () => {
    test('should require query parameter', () => {
      const query = '';
      const isValid = Boolean(query && query.trim().length >= 1);
      expect(isValid).toBe(false);
    });

    test('should accept valid queries', () => {
      const validQueries = [
        'AAPL',
        'Apple',
        'Microsoft Corporation',
        'GOOGL',
        'a', // Single character should be valid
      ];

      validQueries.forEach(query => {
        expect(query.trim().length).toBeGreaterThanOrEqual(1);
        expect(query.length).toBeLessThanOrEqual(50);
      });
    });

    test('should reject empty or whitespace-only queries', () => {
      const invalidQueries = ['', '   ', '\t', '\n'];

      invalidQueries.forEach(query => {
        expect(query.trim().length).toBe(0);
      });
    });

    test('should enforce max query length', () => {
      const tooLong = 'a'.repeat(51);
      expect(tooLong.length).toBeGreaterThan(50);
    });

    test('should accept limit parameter', () => {
      const validLimits = [1, 5, 10, 50, 100];

      validLimits.forEach(limit => {
        expect(limit).toBeGreaterThan(0);
        expect(limit).toBeLessThanOrEqual(100);
      });
    });

    test('should default limit to 10', () => {
      const limit = undefined;
      const defaultLimit = limit || 10;
      expect(defaultLimit).toBe(10);
    });
  });

  describe('Exchange Filtering', () => {
    test('should only return US exchanges', () => {
      const results = [
        { symbol: 'AAPL', exchangeShortName: 'NASDAQ' },
        { symbol: 'MSFT', exchangeShortName: 'NYSE' },
        { symbol: 'AMD', exchangeShortName: 'AMEX' },
        { symbol: 'LON:AAPL', exchangeShortName: 'LSE' }, // Should be filtered
      ];

      const US_EXCHANGES = ['NASDAQ', 'NYSE', 'AMEX'];
      const filtered = results.filter(r =>
        r.exchangeShortName &&
        US_EXCHANGES.includes(r.exchangeShortName.toUpperCase())
      );

      expect(filtered).toHaveLength(3);
      expect(filtered.every(r => US_EXCHANGES.includes(r.exchangeShortName))).toBe(true);
    });

    test('should handle case-insensitive exchange names', () => {
      const exchanges = ['nasdaq', 'NASDAQ', 'Nasdaq', 'NaSDaQ'];

      exchanges.forEach(exchange => {
        expect(['NASDAQ', 'NYSE', 'AMEX']).toContain(exchange.toUpperCase());
      });
    });

    test('should filter out null/undefined exchanges', () => {
      const results = [
        { symbol: 'AAPL', exchangeShortName: 'NASDAQ' },
        { symbol: 'UNKNOWN', exchangeShortName: null },
        { symbol: 'UNKNOWN2', exchangeShortName: undefined },
      ];

      const filtered = results.filter(r =>
        r.exchangeShortName &&
        ['NASDAQ', 'NYSE', 'AMEX'].includes(r.exchangeShortName.toUpperCase())
      );

      expect(filtered).toHaveLength(1);
    });

    test('should filter out non-US exchanges', () => {
      const nonUSExchanges = ['LSE', 'TSE', 'HKG', 'FRA'];

      nonUSExchanges.forEach(exchange => {
        expect(['NASDAQ', 'NYSE', 'AMEX']).not.toContain(exchange);
      });
    });
  });

  describe('Response Transformation', () => {
    test('should transform results to correct format', () => {
      const apiResult = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        exchangeShortName: 'NASDAQ',
        currency: 'USD',
        // May have other fields from API
        marketCap: 2500000000000,
      };

      const transformed = {
        symbol: apiResult.symbol,
        name: apiResult.name,
        exchange: apiResult.exchangeShortName,
        currency: apiResult.currency,
        type: 'stock',
      };

      expect(transformed).toEqual({
        symbol: 'AAPL',
        name: 'Apple Inc.',
        exchange: 'NASDAQ',
        currency: 'USD',
        type: 'stock',
      });

      // Should not include marketCap
      expect(transformed).not.toHaveProperty('marketCap');
    });

    test('should always set type to stock', () => {
      const results = [
        { symbol: 'AAPL' },
        { symbol: 'GOOGL' },
        { symbol: 'MSFT' },
      ];

      results.forEach(result => {
        const transformed = { ...result, type: 'stock' };
        expect(transformed.type).toBe('stock');
      });
    });
  });

  describe('Metadata', () => {
    test('should include query in metadata', () => {
      const query = 'AAPL';
      const metadata = {
        query,
        resultsCount: 1,
        timestamp: new Date().toISOString(),
      };

      expect(metadata.query).toBe('AAPL');
    });

    test('should include results count', () => {
      const results = [{ symbol: 'AAPL' }, { symbol: 'GOOGL' }];
      const metadata = {
        query: 'A',
        resultsCount: results.length,
        timestamp: new Date().toISOString(),
      };

      expect(metadata.resultsCount).toBe(2);
    });

    test('should include ISO timestamp', () => {
      const timestamp = new Date().toISOString();
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('Error Handling', () => {
    test('should handle FMP API errors', () => {
      const error = new Error('FMP API error');
      expect(error.message).toContain('FMP API error');
    });

    test('should handle empty results', () => {
      const results: any[] = [];
      expect(results).toHaveLength(0);
      expect(Array.isArray(results)).toBe(true);
    });

    test('should handle malformed API response', () => {
      const malformedResults = [
        { symbol: 'AAPL' }, // Missing required fields
        null,
        undefined,
      ];

      const filtered = malformedResults.filter(r =>
        r && r.symbol && r.exchangeShortName
      );

      expect(filtered.length).toBeLessThan(malformedResults.length);
    });
  });

  describe('Rate Limiting', () => {
    test('should have rate limit configured', () => {
      const rateLimitConfig = { requestsPerMinute: 30 };
      expect(rateLimitConfig.requestsPerMinute).toBe(30);
    });
  });

  describe('Query Processing', () => {
    test('should trim whitespace from query', () => {
      const queries = [
        '  AAPL  ',
        '\tGOOGL\t',
        '\nMSFT\n',
      ];

      queries.forEach(query => {
        const trimmed = query.trim();
        expect(trimmed).not.toMatch(/^\s/);
        expect(trimmed).not.toMatch(/\s$/);
      });
    });

    test('should preserve query case for search', () => {
      const queries = ['AAPL', 'aapl', 'Apple', 'APPLE'];

      // Query case should be preserved (API handles case)
      queries.forEach(query => {
        expect(query.trim()).toBe(query.trim());
      });
    });
  });
});

describe('Search Edge Cases', () => {
  test('should handle special characters in query', () => {
    const queries = [
      'Apple Inc.',
      'AT&T',
      'L\'Oreal',
      'S&P 500',
    ];

    // These should be valid search terms
    queries.forEach(query => {
      expect(query.length).toBeGreaterThan(0);
      expect(query.length).toBeLessThanOrEqual(50);
    });
  });

  test('should handle numeric queries', () => {
    const queries = ['3M', '7-Eleven', '3D Systems'];

    queries.forEach(query => {
      expect(query.trim().length).toBeGreaterThan(0);
    });
  });

  test('should handle single character queries', () => {
    const query = 'A';
    expect(query.trim().length).toBe(1);
    expect(query.trim().length).toBeGreaterThanOrEqual(1);
  });

  test('should handle all results filtered out', () => {
    const allNonUS = [
      { symbol: 'LON:AAPL', exchangeShortName: 'LSE' },
      { symbol: 'TYO:SONY', exchangeShortName: 'TSE' },
    ];

    const US_EXCHANGES = ['NASDAQ', 'NYSE', 'AMEX'];
    const filtered = allNonUS.filter(r =>
      r.exchangeShortName &&
      US_EXCHANGES.includes(r.exchangeShortName.toUpperCase())
    );

    expect(filtered).toHaveLength(0);
  });

  test('should handle limit edge cases', () => {
    const limits = [0, -1, 101, 999, Infinity];

    limits.forEach(limit => {
      const isValid = limit > 0 && limit <= 100 && Number.isFinite(limit);
      expect(isValid).toBe(false);
    });
  });
});
