import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PortfolioHealthService } from '../PortfolioHealthService';
import { PortfolioService } from '../PortfolioService';
import { FMPDataProvider } from '../../data-providers/fmp';
import { TechnicalAnalysisEngine } from '../../technical-analysis/engine';
import { HoldingWithMarketData } from '@/types/portfolio';
import { PriceData, TechnicalAnalysisResult } from '../../technical-analysis/types';

// ============================================================================
// Mocks
// ============================================================================

const mockGetHoldingsWithMarketData = vi.fn();
const mockPortfolioService = {
  getHoldingsWithMarketData: mockGetHoldingsWithMarketData,
} as unknown as PortfolioService;

const mockGetHistoricalData = vi.fn();
const mockFmpProvider = {
  getHistoricalData: mockGetHistoricalData,
} as unknown as FMPDataProvider;

const mockAnalyze = vi.fn();
const mockEngine = {
  analyze: mockAnalyze,
} as unknown as TechnicalAnalysisEngine;

// ============================================================================
// Helpers
// ============================================================================

function makeHolding(overrides: Partial<HoldingWithMarketData> = {}): HoldingWithMarketData {
  return {
    id: '1',
    portfolioId: 'p1',
    symbol: 'AAPL',
    quantity: 10,
    averageCostBasis: 150,
    totalCostBasis: 1500,
    targetAllocationPercent: null,
    sector: 'Technology',
    firstPurchaseDate: new Date(),
    lastTransactionDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    currentPrice: 175,
    marketValue: 1750,
    portfolioWeight: 0.5,
    driftPercent: null,
    dayChange: 2,
    dayChangePercent: 1.15,
    totalGainLoss: 250,
    totalGainLossPercent: 16.67,
    previousClose: 173,
    priceStatus: 'live' as const,
    todayGain: 20,
    todayGainPercent: 1.15,
    estimatedAnnualIncome: 0,
    dividendYield: 0,
    yearHigh: 200,
    yearLow: 120,
    companyName: 'Apple Inc.',
    ...overrides,
  };
}

function makePriceData(count = 30): PriceData[] {
  const data: PriceData[] = [];
  const baseDate = new Date('2024-01-01');
  for (let i = 0; i < count; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    data.push({
      date: d,
      open: 150 + i * 0.5,
      high: 152 + i * 0.5,
      low: 149 + i * 0.5,
      close: 151 + i * 0.5,
      volume: 1000000,
    });
  }
  return data;
}

function makeAnalysisResult(
  overall: 'bullish' | 'bearish' | 'neutral' = 'bullish',
  strength = 0.7
): TechnicalAnalysisResult {
  return {
    symbol: 'AAPL',
    timestamp: new Date(),
    signals: [
      {
        indicator: 'RSI',
        signal: overall === 'bearish' ? 'sell' : 'buy',
        strength,
        value: overall === 'bearish' ? 75 : 30,
        timestamp: new Date(),
        description: 'Test signal',
      },
      {
        indicator: 'MACD',
        signal: overall === 'bearish' ? 'sell' : 'buy',
        strength: strength * 0.8,
        value: 1.5,
        timestamp: new Date(),
        description: 'Test MACD signal',
      },
    ],
    indicators: {},
    summary: {
      overall,
      strength,
      confidence: 0.6,
      trendDirection: overall === 'bullish' ? 'up' : overall === 'bearish' ? 'down' : 'sideways',
      momentum: 'stable',
      volatility: 'medium',
    },
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('PortfolioHealthService', () => {
  let service: PortfolioHealthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PortfolioHealthService(mockPortfolioService, mockFmpProvider, mockEngine);
  });

  it('analyzes a single bullish holding correctly', async () => {
    const holding = makeHolding({ symbol: 'AAPL', portfolioWeight: 1.0 });
    mockGetHoldingsWithMarketData.mockResolvedValue([holding]);
    mockGetHistoricalData.mockResolvedValue(makePriceData());
    mockAnalyze.mockReturnValue(makeAnalysisResult('bullish', 0.7));

    const result = await service.analyzePortfolioHealth('p1');

    expect(result.portfolioId).toBe('p1');
    expect(result.holdingsAnalyzed).toBe(1);
    expect(result.holdingsSkipped).toBe(0);
    expect(result.overallRating).toBe('bullish');
    expect(result.overallScore).toBeGreaterThanOrEqual(67);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.holdings).toHaveLength(1);
    expect(result.holdings[0].symbol).toBe('AAPL');
    expect(result.holdings[0].rating).toBe('bullish');
    expect(result.holdings[0].topSignals.length).toBeGreaterThan(0);
    expect(result.ratingBreakdown.bullish.count).toBe(1);
  });

  it('analyzes a bearish holding correctly', async () => {
    const holding = makeHolding({ symbol: 'XYZ', portfolioWeight: 1.0 });
    mockGetHoldingsWithMarketData.mockResolvedValue([holding]);
    mockGetHistoricalData.mockResolvedValue(makePriceData());
    mockAnalyze.mockReturnValue(makeAnalysisResult('bearish', 0.8));

    const result = await service.analyzePortfolioHealth('p1');

    expect(result.overallRating).toBe('bearish');
    expect(result.overallScore).toBeLessThanOrEqual(33);
    expect(result.ratingBreakdown.bearish.count).toBe(1);
  });

  it('calculates weighted score from multiple holdings', async () => {
    const holdingA = makeHolding({ symbol: 'AAPL', portfolioWeight: 0.7 });
    const holdingB = makeHolding({ symbol: 'MSFT', portfolioWeight: 0.3, companyName: 'Microsoft' });
    mockGetHoldingsWithMarketData.mockResolvedValue([holdingA, holdingB]);
    mockGetHistoricalData.mockResolvedValue(makePriceData());

    // AAPL bullish, MSFT bearish
    mockAnalyze
      .mockReturnValueOnce(makeAnalysisResult('bullish', 0.8))
      .mockReturnValueOnce(makeAnalysisResult('bearish', 0.6));

    const result = await service.analyzePortfolioHealth('p1');

    expect(result.holdingsAnalyzed).toBe(2);
    expect(result.holdings).toHaveLength(2);
    expect(result.ratingBreakdown.bullish.count).toBe(1);
    expect(result.ratingBreakdown.bearish.count).toBe(1);

    // Weighted score should be between the two individual scores
    const bullishScore = 67 + 0.8 * 33; // ~93.4
    const bearishScore = 33 - 0.6 * 33; // ~13.2
    const expectedWeighted = (bullishScore * 0.7 + bearishScore * 0.3) / (0.7 + 0.3);
    expect(result.overallScore).toBeCloseTo(expectedWeighted, 0);
  });

  it('handles failed holdings gracefully', async () => {
    const holdingA = makeHolding({ symbol: 'AAPL', portfolioWeight: 0.5 });
    const holdingB = makeHolding({ symbol: 'FAIL', portfolioWeight: 0.5 });
    mockGetHoldingsWithMarketData.mockResolvedValue([holdingA, holdingB]);

    // AAPL succeeds, FAIL rejects
    mockGetHistoricalData
      .mockResolvedValueOnce(makePriceData())
      .mockRejectedValueOnce(new Error('API failure'));
    mockAnalyze.mockReturnValue(makeAnalysisResult('neutral', 0.5));

    const result = await service.analyzePortfolioHealth('p1');

    expect(result.holdingsAnalyzed).toBe(1);
    expect(result.holdingsSkipped).toBe(1);
    expect(result.holdings).toHaveLength(1);
  });

  it('handles empty portfolio', async () => {
    mockGetHoldingsWithMarketData.mockResolvedValue([]);

    const result = await service.analyzePortfolioHealth('p1');

    expect(result.holdingsAnalyzed).toBe(0);
    expect(result.holdingsSkipped).toBe(0);
    expect(result.overallScore).toBe(50);
    expect(result.overallRating).toBe('neutral');
  });

  it('generates diagnostic messages', async () => {
    const holding = makeHolding({ symbol: 'AAPL', portfolioWeight: 1.0 });
    mockGetHoldingsWithMarketData.mockResolvedValue([holding]);
    mockGetHistoricalData.mockResolvedValue(makePriceData());
    mockAnalyze.mockReturnValue(makeAnalysisResult('bullish', 0.7));

    const result = await service.analyzePortfolioHealth('p1');

    expect(result.holdings[0].diagnosticMessage).toContain('AAPL');
    expect(result.holdings[0].diagnosticMessage).toContain('positive');
    expect(result.holdings[0].diagnosticMessage).toContain('upward');
  });

  it('rating breakdown percentages sum correctly', async () => {
    const holdings = [
      makeHolding({ symbol: 'A', portfolioWeight: 0.33 }),
      makeHolding({ symbol: 'B', portfolioWeight: 0.33 }),
      makeHolding({ symbol: 'C', portfolioWeight: 0.34 }),
    ];
    mockGetHoldingsWithMarketData.mockResolvedValue(holdings);
    mockGetHistoricalData.mockResolvedValue(makePriceData());

    mockAnalyze
      .mockReturnValueOnce(makeAnalysisResult('bullish', 0.8))
      .mockReturnValueOnce(makeAnalysisResult('neutral', 0.5))
      .mockReturnValueOnce(makeAnalysisResult('bearish', 0.6));

    const result = await service.analyzePortfolioHealth('p1');

    const { bullish, neutral, bearish } = result.ratingBreakdown;
    expect(bullish.count + neutral.count + bearish.count).toBe(3);
    // Percentages should approximately sum to 100 (rounding may cause slight variance)
    expect(bullish.percent + neutral.percent + bearish.percent).toBeGreaterThanOrEqual(99);
    expect(bullish.percent + neutral.percent + bearish.percent).toBeLessThanOrEqual(102);
  });

  it('includes analyzedAt timestamp', async () => {
    mockGetHoldingsWithMarketData.mockResolvedValue([]);

    const before = new Date();
    const result = await service.analyzePortfolioHealth('p1');
    const after = new Date();

    expect(new Date(result.analyzedAt).getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(new Date(result.analyzedAt).getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('limits topSignals to 3', async () => {
    const holding = makeHolding({ symbol: 'AAPL', portfolioWeight: 1.0 });
    mockGetHoldingsWithMarketData.mockResolvedValue([holding]);
    mockGetHistoricalData.mockResolvedValue(makePriceData());

    const analysis = makeAnalysisResult('bullish', 0.7);
    // Add extra signals
    analysis.signals.push(
      { indicator: 'BB', signal: 'buy', strength: 0.6, value: 1, timestamp: new Date(), description: 'BB' },
      { indicator: 'SMA', signal: 'buy', strength: 0.5, value: 1, timestamp: new Date(), description: 'SMA' },
      { indicator: 'Stoch', signal: 'sell', strength: 0.4, value: 1, timestamp: new Date(), description: 'Stoch' },
    );
    mockAnalyze.mockReturnValue(analysis);

    const result = await service.analyzePortfolioHealth('p1');
    expect(result.holdings[0].topSignals).toHaveLength(3);
  });
});
