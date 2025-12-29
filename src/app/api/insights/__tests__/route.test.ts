/**
 * Insights API Route Tests
 * 
 * Tests for the /api/insights endpoint that generates AI-powered financial insights.
 * This test suite covers:
 * - GET endpoint: Fetches data and generates insights
 * - POST endpoint: Generates insights from provided analysis data
 * - Error handling for various failure scenarios
 * - Input validation and edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Helper to create mock price data
function createMockPriceData(count: number = 10) {
  return Array.from({ length: count }, (_, i) => ({
    date: new Date(2024, 0, i + 1),
    open: 100 + i,
    high: 105 + i,
    low: 95 + i,
    close: 102 + i,
    volume: 1000000 + i * 10000,
  }));
}

// Helper to create mock analysis result
function createMockAnalysis() {
  return {
    summary: {
      overall: 'bullish',
      strength: 0.7,
      confidence: 0.8,
      trendDirection: 'up',
      volatility: 'medium',
    },
    signals: [
      { indicator: 'RSI', signal: 'buy', strength: 0.8, value: 35 },
      { indicator: 'MACD', signal: 'buy', strength: 0.7, value: 0.5 },
    ],
    indicators: {
      rsi: [{ value: 35 }],
      macd: [{ value: 0.5 }],
    },
  };
}

// Helper to create mock insight
function createMockInsight(type: string) {
  return {
    type,
    content: `Mock ${type} insight content`,
    confidence: 0.75,
    provider: 'mock',
    metadata: {
      indicators_used: ['RSI', 'MACD'],
      timeframe: '1D',
      data_quality: 'high',
      market_conditions: 'bullish',
    },
  };
}

// Create mock functions
const mockGetHistoricalData = vi.fn();
const mockAnalyze = vi.fn();
const mockGenerateInsight = vi.fn();

// Mock the dependencies before importing the route
vi.mock('@/lib/data-providers/fmp', () => ({
  getFMPProvider: () => ({
    getHistoricalData: mockGetHistoricalData,
  }),
}));

vi.mock('@/lib/technical-analysis/engine', () => ({
  TechnicalAnalysisEngine: class MockEngine {
    analyze = mockAnalyze;
  },
}));

vi.mock('@/lib/ai/llm-providers', () => ({
  getLLMInsightService: () => ({
    generateInsight: mockGenerateInsight,
  }),
}));

// Import the route handlers after mocking
import { GET, POST } from '../route';

describe('Insights API Route - GET', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    mockGetHistoricalData.mockResolvedValue(createMockPriceData());
    mockAnalyze.mockReturnValue(createMockAnalysis());
    mockGenerateInsight.mockImplementation((type) => 
      Promise.resolve(createMockInsight(type))
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Successful Requests', () => {
    it('should return insights for default symbol (AAPL) when no symbol provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/insights');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.symbol).toBe('AAPL');
      expect(mockGetHistoricalData).toHaveBeenCalledWith('AAPL', '6month');
    });

    it('should return insights for specified symbol', async () => {
      const request = new NextRequest('http://localhost:3000/api/insights?symbol=GOOGL');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.symbol).toBe('GOOGL');
      expect(mockGetHistoricalData).toHaveBeenCalledWith('GOOGL', '6month');
    });

    it('should uppercase the symbol', async () => {
      const request = new NextRequest('http://localhost:3000/api/insights?symbol=msft');
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.symbol).toBe('MSFT');
      expect(mockGetHistoricalData).toHaveBeenCalledWith('MSFT', '6month');
    });

    it('should generate all three insight types by default', async () => {
      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL');
      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(mockGenerateInsight).toHaveBeenCalledTimes(3);
      expect(mockGenerateInsight).toHaveBeenCalledWith('technical', expect.any(Object), 'AAPL');
      expect(mockGenerateInsight).toHaveBeenCalledWith('portfolio', expect.any(Object), 'AAPL');
      expect(mockGenerateInsight).toHaveBeenCalledWith('sentiment', expect.any(Object), 'AAPL');
    });

    it('should generate only specified insight types', async () => {
      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL&types=technical,sentiment');
      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(mockGenerateInsight).toHaveBeenCalledTimes(2);
      expect(mockGenerateInsight).toHaveBeenCalledWith('technical', expect.any(Object), 'AAPL');
      expect(mockGenerateInsight).toHaveBeenCalledWith('sentiment', expect.any(Object), 'AAPL');
      expect(mockGenerateInsight).not.toHaveBeenCalledWith('portfolio', expect.any(Object), 'AAPL');
    });

    it('should include analysis summary in response', async () => {
      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL');
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.analysis).toBeDefined();
      expect(data.data.analysis.summary).toBeDefined();
      expect(data.data.analysis.signalCount).toBe(2);
      expect(data.data.analysis.indicatorCount).toBe(2);
    });

    it('should include metadata in response', async () => {
      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL');
      const response = await GET(request);
      const data = await response.json();

      expect(data.metadata).toBeDefined();
      expect(data.metadata.symbol).toBe('AAPL');
      expect(data.metadata.dataSource).toBe('Financial Modeling Prep + AI Analysis');
      expect(data.metadata.timestamp).toBeDefined();
      expect(data.metadata.insightTypes).toEqual(expect.arrayContaining(['technical', 'portfolio', 'sentiment']));
    });

    it('should filter out invalid insight types', async () => {
      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL&types=technical,invalid,sentiment');
      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      // Should only call for valid types
      expect(mockGenerateInsight).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 when no historical data found', async () => {
      mockGetHistoricalData.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/insights?symbol=INVALID');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('No historical data found');
    });

    it('should return 503 when FMP API fails', async () => {
      mockGetHistoricalData.mockRejectedValue(new Error('FMP API error: rate limit'));

      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch market data for analysis');
    });

    it('should continue generating other insights when one type fails', async () => {
      mockGenerateInsight
        .mockResolvedValueOnce(createMockInsight('technical'))
        .mockRejectedValueOnce(new Error('Portfolio insight failed'))
        .mockResolvedValueOnce(createMockInsight('sentiment'));

      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.insights.technical).toBeDefined();
      expect(data.data.insights.sentiment).toBeDefined();
      // Portfolio should be missing due to error
      expect(data.data.insights.portfolio).toBeUndefined();
    });

    it('should return 500 for unexpected errors', async () => {
      mockGetHistoricalData.mockRejectedValue(new Error('Unexpected database error'));

      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unexpected database error');
    });
  });
});

describe('Insights API Route - POST', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    mockGenerateInsight.mockImplementation((type) => 
      Promise.resolve(createMockInsight(type))
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Successful Requests', () => {
    it('should generate insights from provided analysis data', async () => {
      const body = {
        symbol: 'AAPL',
        analysis: createMockAnalysis(),
      };

      const request = new NextRequest('http://localhost:3000/api/insights', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.symbol).toBe('AAPL');
      expect(data.data.insights).toBeDefined();
    });

    it('should uppercase the symbol', async () => {
      const body = {
        symbol: 'googl',
        analysis: createMockAnalysis(),
      };

      const request = new NextRequest('http://localhost:3000/api/insights', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.data.symbol).toBe('GOOGL');
    });

    it('should generate all three insight types by default', async () => {
      const body = {
        symbol: 'AAPL',
        analysis: createMockAnalysis(),
      };

      const request = new NextRequest('http://localhost:3000/api/insights', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      await POST(request);

      expect(mockGenerateInsight).toHaveBeenCalledTimes(3);
      expect(mockGenerateInsight).toHaveBeenCalledWith('technical', expect.any(Object), 'AAPL');
      expect(mockGenerateInsight).toHaveBeenCalledWith('portfolio', expect.any(Object), 'AAPL');
      expect(mockGenerateInsight).toHaveBeenCalledWith('sentiment', expect.any(Object), 'AAPL');
    });

    it('should generate only specified insight types', async () => {
      const body = {
        symbol: 'AAPL',
        analysis: createMockAnalysis(),
        insightTypes: ['technical'],
      };

      const request = new NextRequest('http://localhost:3000/api/insights', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(mockGenerateInsight).toHaveBeenCalledTimes(1);
      expect(mockGenerateInsight).toHaveBeenCalledWith('technical', expect.any(Object), 'AAPL');
    });

    it('should include metadata in response', async () => {
      const body = {
        symbol: 'AAPL',
        analysis: createMockAnalysis(),
      };

      const request = new NextRequest('http://localhost:3000/api/insights', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.metadata).toBeDefined();
      expect(data.metadata.symbol).toBe('AAPL');
      expect(data.metadata.timestamp).toBeDefined();
      expect(data.metadata.insightTypes).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    it('should return 400 when symbol is missing', async () => {
      const body = {
        analysis: createMockAnalysis(),
      };

      const request = new NextRequest('http://localhost:3000/api/insights', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Symbol and analysis data are required');
    });

    it('should return 400 when analysis is missing', async () => {
      const body = {
        symbol: 'AAPL',
      };

      const request = new NextRequest('http://localhost:3000/api/insights', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Symbol and analysis data are required');
    });

    it('should return 400 when both symbol and analysis are missing', async () => {
      const body = {};

      const request = new NextRequest('http://localhost:3000/api/insights', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should filter out invalid insight types', async () => {
      const body = {
        symbol: 'AAPL',
        analysis: createMockAnalysis(),
        insightTypes: ['technical', 'invalid', 'portfolio'],
      };

      const request = new NextRequest('http://localhost:3000/api/insights', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      // Should only call for valid types
      expect(mockGenerateInsight).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should continue generating other insights when one type fails', async () => {
      mockGenerateInsight
        .mockResolvedValueOnce(createMockInsight('technical'))
        .mockRejectedValueOnce(new Error('Portfolio insight failed'))
        .mockResolvedValueOnce(createMockInsight('sentiment'));

      const body = {
        symbol: 'AAPL',
        analysis: createMockAnalysis(),
      };

      const request = new NextRequest('http://localhost:3000/api/insights', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.insights.technical).toBeDefined();
      expect(data.data.insights.sentiment).toBeDefined();
    });

    it('should return 500 for invalid JSON body', async () => {
      const request = new NextRequest('http://localhost:3000/api/insights', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to generate AI insights');
    });
  });
});

describe('Insights API Route - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockGetHistoricalData.mockResolvedValue(createMockPriceData());
    mockAnalyze.mockReturnValue(createMockAnalysis());
    mockGenerateInsight.mockImplementation((type) => 
      Promise.resolve(createMockInsight(type))
    );
  });

  it('should handle single insight type request', async () => {
    const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL&types=technical');
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(mockGenerateInsight).toHaveBeenCalledTimes(1);
    expect(data.data.insights.technical).toBeDefined();
  });

  it('should handle empty types parameter gracefully', async () => {
    const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL&types=');
    const response = await GET(request);
    const data = await response.json();

    // Empty types should result in no insights being generated
    expect(data.success).toBe(true);
  });

  it('should handle special characters in symbol by uppercasing', async () => {
    const request = new NextRequest('http://localhost:3000/api/insights?symbol=brk.b');
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.symbol).toBe('BRK.B');
  });

  it('should pass analysis data to insight service', async () => {
    const mockAnalysisResult = createMockAnalysis();
    mockAnalyze.mockReturnValue(mockAnalysisResult);

    const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL&types=technical');
    await GET(request);

    expect(mockGenerateInsight).toHaveBeenCalledWith(
      'technical',
      mockAnalysisResult,
      'AAPL'
    );
  });
});
