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
const mockGetDemoUserId = vi.fn();
const mockGetUserPortfolios = vi.fn();
const mockGetPortfolioSummary = vi.fn();
const mockGetHoldingsWithMarketData = vi.fn();

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
  LLMInsight: {},
}));

vi.mock('@/lib/auth/demo-user', () => ({
  getDemoUserId: () => mockGetDemoUserId(),
}));

vi.mock('@/lib/database/connection', () => ({
  getDatabase: () => ({}),
}));

vi.mock('@/lib/portfolio/PortfolioService', () => ({
  getPortfolioService: () => ({
    getUserPortfolios: mockGetUserPortfolios,
    getPortfolioSummary: mockGetPortfolioSummary,
    getHoldingsWithMarketData: mockGetHoldingsWithMarketData,
  }),
}));

// Import the route handlers after mocking
import { GET, POST } from '../route';

// Helper to create mock portfolio data
function createMockPortfolio(id: string = 'portfolio-1') {
  return { id, name: 'Test Portfolio', userId: 'user-1' };
}

function createMockPortfolioSummary() {
  return {
    totalEquity: 100000,
    cashBalance: 10000,
    holdingsCount: 5,
  };
}

function createMockHolding(symbol: string) {
  return {
    symbol,
    quantity: 100,
    averageCost: 150,
    currentPrice: 175,
    marketValue: 17500,
    totalGainLoss: 2500,
    totalGainLossPercent: 16.67,
  };
}

describe('Insights API Route - GET', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    mockGetHistoricalData.mockResolvedValue(createMockPriceData());
    mockAnalyze.mockReturnValue(createMockAnalysis());
    mockGenerateInsight.mockImplementation((type) =>
      Promise.resolve(createMockInsight(type))
    );

    // Portfolio service mocks - default: user has no portfolios
    mockGetDemoUserId.mockResolvedValue('user-1');
    mockGetUserPortfolios.mockResolvedValue([]);
    mockGetPortfolioSummary.mockResolvedValue(createMockPortfolioSummary());
    mockGetHoldingsWithMarketData.mockResolvedValue([]);
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

  it('should pass analysis data with priceContext to insight service', async () => {
    const mockAnalysisResult = createMockAnalysis();
    mockAnalyze.mockReturnValue(mockAnalysisResult);

    const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL&types=technical');
    await GET(request);

    // Analysis data should include priceContext now
    expect(mockGenerateInsight).toHaveBeenCalledWith(
      'technical',
      expect.objectContaining({
        ...mockAnalysisResult,
        priceContext: expect.any(Object),
      }),
      'AAPL'
    );
  });
});

describe('Insights API Route - Portfolio Context', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    mockGetHistoricalData.mockResolvedValue(createMockPriceData());
    mockAnalyze.mockReturnValue(createMockAnalysis());
    mockGenerateInsight.mockImplementation((type) =>
      Promise.resolve(createMockInsight(type))
    );

    // Portfolio service mocks
    mockGetDemoUserId.mockResolvedValue('user-1');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Portfolio Context Fetching', () => {
    it('should fetch portfolio context when portfolio insight is requested', async () => {
      mockGetUserPortfolios.mockResolvedValue([createMockPortfolio()]);
      mockGetPortfolioSummary.mockResolvedValue(createMockPortfolioSummary());
      mockGetHoldingsWithMarketData.mockResolvedValue([createMockHolding('AAPL')]);

      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL&types=portfolio');
      await GET(request);

      expect(mockGetUserPortfolios).toHaveBeenCalled();
      expect(mockGetPortfolioSummary).toHaveBeenCalled();
      expect(mockGetHoldingsWithMarketData).toHaveBeenCalled();
    });

    it('should NOT fetch portfolio context when only technical insight is requested', async () => {
      mockGetUserPortfolios.mockResolvedValue([createMockPortfolio()]);

      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL&types=technical');
      await GET(request);

      expect(mockGetUserPortfolios).not.toHaveBeenCalled();
    });

    it('should pass portfolioContext to generateInsight for portfolio type', async () => {
      mockGetUserPortfolios.mockResolvedValue([createMockPortfolio()]);
      mockGetPortfolioSummary.mockResolvedValue(createMockPortfolioSummary());
      mockGetHoldingsWithMarketData.mockResolvedValue([createMockHolding('AAPL')]);

      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL&types=portfolio');
      await GET(request);

      expect(mockGenerateInsight).toHaveBeenCalledWith(
        'portfolio',
        expect.objectContaining({
          portfolioContext: expect.objectContaining({
            isHeld: true,
            portfolio: expect.objectContaining({
              totalValue: 100000,
              cashAvailable: 10000,
              positionsCount: 5,
            }),
            position: expect.objectContaining({
              shares: 100,
              avgCostBasis: 150,
              currentPrice: 175,
            }),
          }),
        }),
        'AAPL'
      );
    });

    it('should set isHeld to false when user does not hold the stock', async () => {
      mockGetUserPortfolios.mockResolvedValue([createMockPortfolio()]);
      mockGetPortfolioSummary.mockResolvedValue(createMockPortfolioSummary());
      mockGetHoldingsWithMarketData.mockResolvedValue([createMockHolding('GOOGL')]); // Different stock

      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL&types=portfolio');
      await GET(request);

      expect(mockGenerateInsight).toHaveBeenCalledWith(
        'portfolio',
        expect.objectContaining({
          portfolioContext: expect.objectContaining({
            isHeld: false,
            position: null,
          }),
        }),
        'AAPL'
      );
    });

    it('should aggregate data across multiple portfolios', async () => {
      mockGetUserPortfolios.mockResolvedValue([
        createMockPortfolio('portfolio-1'),
        createMockPortfolio('portfolio-2'),
      ]);
      mockGetPortfolioSummary
        .mockResolvedValueOnce({ totalEquity: 50000, cashBalance: 5000, holdingsCount: 3 })
        .mockResolvedValueOnce({ totalEquity: 50000, cashBalance: 5000, holdingsCount: 2 });
      mockGetHoldingsWithMarketData
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([createMockHolding('AAPL')]);

      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL&types=portfolio');
      await GET(request);

      expect(mockGenerateInsight).toHaveBeenCalledWith(
        'portfolio',
        expect.objectContaining({
          portfolioContext: expect.objectContaining({
            portfolio: expect.objectContaining({
              totalValue: 100000, // 50000 + 50000
              cashAvailable: 10000, // 5000 + 5000
              positionsCount: 5, // 3 + 2
            }),
            isHeld: true,
          }),
        }),
        'AAPL'
      );
    });

    it('should provide fallback context when user has no portfolios', async () => {
      mockGetUserPortfolios.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL&types=portfolio');
      await GET(request);

      // Should still call generateInsight with fallback context
      expect(mockGenerateInsight).toHaveBeenCalledWith(
        'portfolio',
        expect.objectContaining({
          portfolioContext: expect.objectContaining({
            isHeld: false,
            portfolio: expect.objectContaining({
              totalValue: 0,
              cashAvailable: 0,
              positionsCount: 0,
            }),
          }),
        }),
        'AAPL'
      );
    });

    it('should handle portfolio service errors gracefully', async () => {
      mockGetUserPortfolios.mockResolvedValue([createMockPortfolio()]);
      mockGetPortfolioSummary.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL&types=portfolio');
      const response = await GET(request);
      const data = await response.json();

      // Should still succeed with fallback context
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should set position_held metadata on portfolio insights', async () => {
      mockGetUserPortfolios.mockResolvedValue([createMockPortfolio()]);
      mockGetPortfolioSummary.mockResolvedValue(createMockPortfolioSummary());
      mockGetHoldingsWithMarketData.mockResolvedValue([createMockHolding('AAPL')]);

      // Mock generateInsight to return an insight with mutable metadata
      mockGenerateInsight.mockImplementation((type) => {
        const insight = createMockInsight(type);
        return Promise.resolve(insight);
      });

      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL&types=portfolio');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.insights.portfolio.metadata.position_held).toBe(true);
    });

    it('should match symbol case-insensitively when checking holdings', async () => {
      mockGetUserPortfolios.mockResolvedValue([createMockPortfolio()]);
      mockGetPortfolioSummary.mockResolvedValue(createMockPortfolioSummary());
      mockGetHoldingsWithMarketData.mockResolvedValue([createMockHolding('aapl')]); // lowercase

      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL&types=portfolio');
      await GET(request);

      expect(mockGenerateInsight).toHaveBeenCalledWith(
        'portfolio',
        expect.objectContaining({
          portfolioContext: expect.objectContaining({
            isHeld: true,
          }),
        }),
        'AAPL'
      );
    });
  });

  describe('Parallel Portfolio Fetching', () => {
    it('should fetch portfolio summaries and holdings in parallel', async () => {
      let summaryCallTime = 0;
      let holdingsCallTime = 0;

      mockGetUserPortfolios.mockResolvedValue([createMockPortfolio()]);
      mockGetPortfolioSummary.mockImplementation(async () => {
        summaryCallTime = Date.now();
        await new Promise(r => setTimeout(r, 10));
        return createMockPortfolioSummary();
      });
      mockGetHoldingsWithMarketData.mockImplementation(async () => {
        holdingsCallTime = Date.now();
        await new Promise(r => setTimeout(r, 10));
        return [createMockHolding('AAPL')];
      });

      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL&types=portfolio');
      await GET(request);

      // Both calls should happen nearly simultaneously (within 5ms)
      expect(Math.abs(summaryCallTime - holdingsCallTime)).toBeLessThan(5);
    });

    it('should continue with other portfolios if one fails', async () => {
      mockGetUserPortfolios.mockResolvedValue([
        createMockPortfolio('portfolio-1'),
        createMockPortfolio('portfolio-2'),
      ]);

      // First portfolio fails
      mockGetPortfolioSummary
        .mockRejectedValueOnce(new Error('Portfolio 1 error'))
        .mockResolvedValueOnce({ totalEquity: 50000, cashBalance: 5000, holdingsCount: 3 });
      mockGetHoldingsWithMarketData
        .mockRejectedValueOnce(new Error('Portfolio 1 error'))
        .mockResolvedValueOnce([createMockHolding('AAPL')]);

      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL&types=portfolio');
      await GET(request);

      // Should still have data from portfolio-2
      expect(mockGenerateInsight).toHaveBeenCalledWith(
        'portfolio',
        expect.objectContaining({
          portfolioContext: expect.objectContaining({
            portfolio: expect.objectContaining({
              totalValue: 50000,
            }),
            isHeld: true,
          }),
        }),
        'AAPL'
      );
    });
  });
});

describe('Insights API Route - Price Context', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockAnalyze.mockReturnValue(createMockAnalysis());
    mockGenerateInsight.mockImplementation((type) =>
      Promise.resolve(createMockInsight(type))
    );
    mockGetDemoUserId.mockResolvedValue('user-1');
    mockGetUserPortfolios.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Helper to create price data with specific dates
   * @param daysBack - Number of days of data to create
   * @param basePrice - Starting price (most recent)
   */
  function createPriceDataWithDates(daysBack: number, basePrice: number = 100) {
    const now = new Date();
    return Array.from({ length: daysBack }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      // Price decreases going back in time (for predictable tests)
      const price = basePrice - (i * 0.5);
      return {
        date,
        open: price - 1,
        high: price + 2,
        low: price - 2,
        close: price,
        volume: 1000000,
      };
    });
  }

  describe('Price Context Calculation', () => {
    it('should pass priceContext to generateInsight for technical type', async () => {
      const priceData = createPriceDataWithDates(60);
      mockGetHistoricalData.mockResolvedValue(priceData);

      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL&types=technical');
      await GET(request);

      expect(mockGenerateInsight).toHaveBeenCalledWith(
        'technical',
        expect.objectContaining({
          priceContext: expect.objectContaining({
            currentPrice: expect.any(Number),
            priceChange1W: expect.any(Number),
            priceChange1WPercent: expect.any(Number),
            priceChange1M: expect.any(Number),
            priceChange1MPercent: expect.any(Number),
            high1M: expect.any(Number),
            low1M: expect.any(Number),
            high3M: expect.any(Number),
            low3M: expect.any(Number),
          }),
        }),
        'AAPL'
      );
    });

    it('should calculate correct current price from most recent data', async () => {
      const now = new Date();
      const priceData = [
        { date: now, close: 150.50, open: 149, high: 152, low: 148, volume: 1000000 },
        { date: new Date(now.getTime() - 24 * 60 * 60 * 1000), close: 148, open: 147, high: 150, low: 146, volume: 1000000 },
      ];
      mockGetHistoricalData.mockResolvedValue(priceData);

      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL&types=technical');
      await GET(request);

      expect(mockGenerateInsight).toHaveBeenCalledWith(
        'technical',
        expect.objectContaining({
          priceContext: expect.objectContaining({
            currentPrice: 150.50,
          }),
        }),
        'AAPL'
      );
    });

    it('should calculate correct percentage changes for positive movement', async () => {
      const now = new Date();
      // Today: $110, 1 week ago: $100, 1 month ago: $90
      const priceData = [
        { date: now, close: 110, open: 109, high: 112, low: 108, volume: 1000000 },
        { date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), close: 100, open: 99, high: 102, low: 98, volume: 1000000 },
        { date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), close: 90, open: 89, high: 92, low: 88, volume: 1000000 },
      ];
      mockGetHistoricalData.mockResolvedValue(priceData);

      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL&types=technical');
      await GET(request);

      const call = mockGenerateInsight.mock.calls[0];
      const priceContext = call[1].priceContext;

      // 1-week: (110 - 100) / 100 = 10%
      expect(priceContext.priceChange1WPercent).toBeCloseTo(10, 1);
      // 1-month: (110 - 90) / 90 = 22.22%
      expect(priceContext.priceChange1MPercent).toBeCloseTo(22.22, 1);
    });

    it('should calculate correct percentage changes for negative movement', async () => {
      const now = new Date();
      // Today: $90, 1 week ago: $100
      const priceData = [
        { date: now, close: 90, open: 91, high: 93, low: 88, volume: 1000000 },
        { date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), close: 100, open: 99, high: 102, low: 98, volume: 1000000 },
      ];
      mockGetHistoricalData.mockResolvedValue(priceData);

      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL&types=technical');
      await GET(request);

      const call = mockGenerateInsight.mock.calls[0];
      const priceContext = call[1].priceContext;

      // (90 - 100) / 100 = -10%
      expect(priceContext.priceChange1WPercent).toBeCloseTo(-10, 1);
      expect(priceContext.priceChange1W).toBeCloseTo(-10, 1);
    });

    it('should calculate correct high and low values for 1-month period', async () => {
      const now = new Date();
      const priceData = [
        { date: now, close: 100, open: 99, high: 105, low: 95, volume: 1000000 },
        { date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), close: 120, open: 115, high: 125, low: 110, volume: 1000000 },
        { date: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), close: 80, open: 85, high: 90, low: 75, volume: 1000000 },
      ];
      mockGetHistoricalData.mockResolvedValue(priceData);

      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL&types=technical');
      await GET(request);

      const call = mockGenerateInsight.mock.calls[0];
      const priceContext = call[1].priceContext;

      expect(priceContext.high1M).toBe(120);
      expect(priceContext.low1M).toBe(80);
    });

    it('should include priceContext in portfolio insights', async () => {
      const priceData = createPriceDataWithDates(60);
      mockGetHistoricalData.mockResolvedValue(priceData);

      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL&types=portfolio');
      await GET(request);

      expect(mockGenerateInsight).toHaveBeenCalledWith(
        'portfolio',
        expect.objectContaining({
          priceContext: expect.objectContaining({
            currentPrice: expect.any(Number),
          }),
        }),
        'AAPL'
      );
    });

    it('should include priceContext in sentiment insights', async () => {
      const priceData = createPriceDataWithDates(60);
      mockGetHistoricalData.mockResolvedValue(priceData);

      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL&types=sentiment');
      await GET(request);

      expect(mockGenerateInsight).toHaveBeenCalledWith(
        'sentiment',
        expect.objectContaining({
          priceContext: expect.objectContaining({
            currentPrice: expect.any(Number),
          }),
        }),
        'AAPL'
      );
    });
  });

  describe('Price Context Edge Cases', () => {
    it('should handle minimal data (2 data points)', async () => {
      const now = new Date();
      const priceData = [
        { date: now, close: 100, open: 99, high: 105, low: 95, volume: 1000000 },
        { date: new Date(now.getTime() - 24 * 60 * 60 * 1000), close: 98, open: 97, high: 100, low: 96, volume: 1000000 },
      ];
      mockGetHistoricalData.mockResolvedValue(priceData);

      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL&types=technical');
      await GET(request);

      expect(mockGenerateInsight).toHaveBeenCalledWith(
        'technical',
        expect.objectContaining({
          priceContext: expect.objectContaining({
            currentPrice: 100,
          }),
        }),
        'AAPL'
      );
    });

    it('should pass null priceContext when only 1 data point exists', async () => {
      const priceData = [
        { date: new Date(), close: 100, open: 99, high: 105, low: 95, volume: 1000000 },
      ];
      mockGetHistoricalData.mockResolvedValue(priceData);

      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL&types=technical');
      await GET(request);

      expect(mockGenerateInsight).toHaveBeenCalledWith(
        'technical',
        expect.objectContaining({
          priceContext: null,
        }),
        'AAPL'
      );
    });

    it('should use fallback prices when no data exists for 1-week horizon', async () => {
      const now = new Date();
      // Only 3 days of data - no data from 1 week ago
      const priceData = [
        { date: now, close: 100, open: 99, high: 105, low: 95, volume: 1000000 },
        { date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), close: 99, open: 98, high: 101, low: 97, volume: 1000000 },
        { date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), close: 98, open: 97, high: 100, low: 96, volume: 1000000 },
      ];
      mockGetHistoricalData.mockResolvedValue(priceData);

      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL&types=technical');
      await GET(request);

      // Should not crash and should calculate using available data
      expect(mockGenerateInsight).toHaveBeenCalledWith(
        'technical',
        expect.objectContaining({
          priceContext: expect.objectContaining({
            currentPrice: 100,
            // Uses fallback: sorted[Math.min(5, length-1)] = sorted[2] = 98
            priceChange1W: expect.any(Number),
          }),
        }),
        'AAPL'
      );
    });

    it('should handle unsorted price data by sorting correctly', async () => {
      const now = new Date();
      // Data provided out of chronological order
      const priceData = [
        { date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), close: 80, open: 79, high: 85, low: 75, volume: 1000000 },
        { date: now, close: 100, open: 99, high: 105, low: 95, volume: 1000000 },
        { date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), close: 90, open: 89, high: 95, low: 85, volume: 1000000 },
      ];
      mockGetHistoricalData.mockResolvedValue(priceData);

      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL&types=technical');
      await GET(request);

      const call = mockGenerateInsight.mock.calls[0];
      const priceContext = call[1].priceContext;

      // Should identify most recent as current price
      expect(priceContext.currentPrice).toBe(100);
      // High should be the highest close
      expect(priceContext.high1M).toBe(100);
      // Low should be the lowest close
      expect(priceContext.low1M).toBe(80);
    });

    it('should handle price data with gaps (weekends/holidays)', async () => {
      const now = new Date();
      // Simulate missing weekend data
      const priceData = [
        { date: now, close: 100, open: 99, high: 105, low: 95, volume: 1000000 }, // Friday
        { date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), close: 98, open: 97, high: 100, low: 96, volume: 1000000 }, // Tuesday
        { date: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), close: 97, open: 96, high: 99, low: 95, volume: 1000000 }, // Monday
        { date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), close: 95, open: 94, high: 97, low: 93, volume: 1000000 }, // Previous Friday
      ];
      mockGetHistoricalData.mockResolvedValue(priceData);

      const request = new NextRequest('http://localhost:3000/api/insights?symbol=AAPL&types=technical');
      await GET(request);

      const call = mockGenerateInsight.mock.calls[0];
      const priceContext = call[1].priceContext;

      // Should find the data point from ~1 week ago
      expect(priceContext.currentPrice).toBe(100);
      // 1-week change: (100 - 95) / 95 ≈ 5.26%
      expect(priceContext.priceChange1WPercent).toBeCloseTo(5.26, 1);
    });
  });
});
