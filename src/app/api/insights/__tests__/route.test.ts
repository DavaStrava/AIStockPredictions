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
import { GET, POST } from '../route';

// Mock the dependencies
vi.mock('@/lib/data-providers/fmp', () => ({
  getFMPProvider: vi.fn(),
}));

vi.mock('@/lib/technical-analysis/engine', () => ({
  TechnicalAnalysisEngine: vi.fn().mockImplementation(() => ({
    analyze: vi.fn(),
  })),
}));

vi.mock('@/lib/ai/llm-providers', () => ({
  getLLMInsightService: vi.fn(),
}));

// Import mocked modules
import { getFMPProvider } from '@/lib/data-providers/fmp';
import { TechnicalAnalysisEngine } from '@/lib/technical-analysis/engine';
import { getLLMInsightService } from '@/lib/ai/llm-providers';

// Type assertions for mocks
const mockGetFMPProvider = getFMPProvider as ReturnType<typeof vi.fn>;
const mockTechnicalAnalysisEngine = TechnicalAnalysisEngine as ReturnType<typeof vi.fn>;
const mockGetLLMInsightService = getLLMInsightService as ReturnType<typeof vi.fn>;

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

describe('Insights API Route - GET', () => {
  let mockFmpProvider: any;
  let mockEngine: any;
  let mockInsightService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup FMP provider mock
    mockFmpProvider = {
      getHistoricalData: vi.fn().mockResolvedValue(createMockPriceData()),
    };
    mockGetFMPProvider.mockReturnValue(mockFmpProvider);

    // Setup engine mock
    mockEngine = {
      analyze: vi.fn().mockReturnValue(createMockAnalysis()),
    };
    mockTechnicalAnalysisEngine.mockImplementation(() => mockEngine);

    // Setup insight service mock
    mockInsightService = {
      generateInsight: vi.fn().mockImplementation((type) => 
        Promise.resolve(createMockInsight(type))
      ),
    };
    mockGetLLMInsightService.mockReturnValue(mockInsightService);
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
      expect(mockFmpProvider.getHistoricalData).toHaveBeenCalledWith('AAPL', '6month');
    });

    it('should return insights for specified symbol', async () => {
      const request = new NextRequest('http://localhost:3000/api/insights?symbol=GOOGL');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.symbol).toBe('GOOGL');
      expect(mockFmpProvider.getHistoricalData).toHaveBeenCalledWith('GOOGL', '6month');
    });

    it('should uppercase the symbol', async () => {
      const request = new NextRequest('http://localhost:3000/api/insights?symbol=msft');
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.symbol).toBe('MSFT');
      expect(mockFmpProvider.getHistoricalData).toHaveBeenCalledWith('MSFT', '6month');
    });

    it('should generate all three insight types by default', async () => {
      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL');
      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(mockInsightService.generateInsight).toHaveBeenCalledTimes(3);
      expect(mockInsightService.generateInsight).toHaveBeenCalledWith('technical', expect.any(Object), 'AAPL');
      expect(mockInsightService.generateInsight).toHaveBeenCalledWith('portfolio', expect.any(Object), 'AAPL');
      expect(mockInsightService.generateInsight).toHaveBeenCalledWith('sentiment', expect.any(Object), 'AAPL');
    });

    it('should generate only specified insight types', async () => {
      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL&types=technical,sentiment');
      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(mockInsightService.generateInsight).toHaveBeenCalledTimes(2);
      expect(mockInsightService.generateInsight).toHaveBeenCalledWith('technical', expect.any(Object), 'AAPL');
      expect(mockInsightService.generateInsight).toHaveBeenCalledWith('sentiment', expect.any(Object), 'AAPL');
      expect(mockInsightService.generateInsight).not.toHaveBeenCalledWith('portfolio', expect.any(Object), 'AAPL');
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
      expect(mockInsightService.generateInsight).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 when no historical data found', async () => {
      mockFmpProvider.getHistoricalData.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/insights?symbol=INVALID');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('No historical data found');
    });

    it('should return 503 when FMP API fails', async () => {
      mockFmpProvider.getHistoricalData.mockRejectedValue(new Error('FMP API error: rate limit'));

      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch market data for analysis');
    });

    it('should return 503 when all LLM providers fail', async () => {
      mockFmpProvider.getHistoricalData.mockResolvedValue(createMockPriceData());
      mockInsightService.generateInsight.mockRejectedValue(new Error('All LLM providers failed'));

      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.error).toBe('AI analysis temporarily unavailable. Please try again later.');
    });

    it('should continue generating other insights when one type fails', async () => {
      mockInsightService.generateInsight
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
      mockFmpProvider.getHistoricalData.mockRejectedValue(new Error('Unexpected database error'));

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
  let mockInsightService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup insight service mock
    mockInsightService = {
      generateInsight: vi.fn().mockImplementation((type) => 
        Promise.resolve(createMockInsight(type))
      ),
    };
    mockGetLLMInsightService.mockReturnValue(mockInsightService);
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

      expect(mockInsightService.generateInsight).toHaveBeenCalledTimes(3);
      expect(mockInsightService.generateInsight).toHaveBeenCalledWith('technical', expect.any(Object), 'AAPL');
      expect(mockInsightService.generateInsight).toHaveBeenCalledWith('portfolio', expect.any(Object), 'AAPL');
      expect(mockInsightService.generateInsight).toHaveBeenCalledWith('sentiment', expect.any(Object), 'AAPL');
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
      expect(mockInsightService.generateInsight).toHaveBeenCalledTimes(1);
      expect(mockInsightService.generateInsight).toHaveBeenCalledWith('technical', expect.any(Object), 'AAPL');
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
      expect(mockInsightService.generateInsight).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should continue generating other insights when one type fails', async () => {
      mockInsightService.generateInsight
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

    it('should return 500 for unexpected errors', async () => {
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

describe('Insights API Route - Rate Limiting Behavior', () => {
  let mockInsightService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Setup insight service mock with timing tracking
    mockInsightService = {
      generateInsight: vi.fn().mockImplementation((type) => 
        Promise.resolve(createMockInsight(type))
      ),
    };
    mockGetLLMInsightService.mockReturnValue(mockInsightService);

    // Setup FMP provider mock
    const mockFmpProvider = {
      getHistoricalData: vi.fn().mockResolvedValue(createMockPriceData()),
    };
    mockGetFMPProvider.mockReturnValue(mockFmpProvider);

    // Setup engine mock
    const mockEngine = {
      analyze: vi.fn().mockReturnValue(createMockAnalysis()),
    };
    mockTechnicalAnalysisEngine.mockImplementation(() => mockEngine);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should add delay between insight generation requests', async () => {
    const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL');
    
    // Start the request
    const responsePromise = GET(request);
    
    // Fast-forward through the delays
    await vi.runAllTimersAsync();
    
    const response = await responsePromise;
    const data = await response.json();

    expect(data.success).toBe(true);
    // All three insight types should have been generated
    expect(mockInsightService.generateInsight).toHaveBeenCalledTimes(3);
  });
});
