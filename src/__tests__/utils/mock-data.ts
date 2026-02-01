/**
 * Mock Data Builders for Testing
 *
 * This module provides builder classes and factory functions for creating
 * test data. All date-based data is generated relative to the current date
 * to prevent test failures due to stale dates.
 */

import type {
  JournalTrade,
  TradeWithPnL,
  TradeSide,
  TradeStatus,
  PortfolioStats,
  PriceData,
} from '@/types';

/**
 * Extended PriceData with optional fields used in tests
 */
export interface MockPriceData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjustedClose?: number;
}

/**
 * Builder class for creating mock data with sensible defaults
 * and dynamic dates relative to "now".
 */
export class MockDataBuilder {
  /**
   * Creates a single price data point with dynamic date.
   *
   * @param daysAgo - Number of days ago for the date (0 = today)
   * @param overrides - Optional overrides for price fields
   *
   * @example
   * // Create today's price data
   * const today = MockDataBuilder.priceData(0);
   *
   * // Create price data from 5 days ago with custom close
   * const historical = MockDataBuilder.priceData(5, { close: 155.50 });
   */
  static priceData(daysAgo: number = 0, overrides: Partial<MockPriceData> = {}): MockPriceData {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(0, 0, 0, 0);

    // Generate realistic price data with small variations
    const basePrice = 150 + (daysAgo * 0.5); // Slight uptrend
    const volatility = 2;

    return {
      date,
      open: basePrice - volatility * 0.5,
      high: basePrice + volatility,
      low: basePrice - volatility,
      close: basePrice,
      volume: 1000000 + Math.floor(Math.random() * 500000),
      ...overrides,
    };
  }

  /**
   * Creates an array of price data points for the specified number of days.
   *
   * @param days - Number of days of data to generate
   * @param options - Options for customizing the data
   *
   * @example
   * // Create 90 days of price data
   * const priceData = MockDataBuilder.priceDataArray(90);
   *
   * // Create 30 days with custom base price
   * const priceData = MockDataBuilder.priceDataArray(30, { basePrice: 200 });
   */
  static priceDataArray(
    days: number = 90,
    options: { basePrice?: number; volatility?: number; trend?: 'up' | 'down' | 'flat' } = {}
  ): MockPriceData[] {
    const { basePrice = 150, volatility = 2, trend = 'up' } = options;
    const data: MockPriceData[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const trendFactor = trend === 'up' ? 0.5 : trend === 'down' ? -0.5 : 0;
      const dayPrice = basePrice + ((days - i) * trendFactor);
      const dailyVolatility = volatility * (0.5 + Math.random());

      data.push({
        date,
        open: dayPrice - dailyVolatility * 0.5,
        high: dayPrice + dailyVolatility,
        low: dayPrice - dailyVolatility,
        close: dayPrice + (Math.random() - 0.5) * dailyVolatility,
        volume: 1000000 + Math.floor(Math.random() * 500000),
      });
    }

    return data;
  }

  /**
   * Creates a mock trade (JournalTrade) with dynamic dates.
   *
   * @param overrides - Optional overrides for trade fields
   *
   * @example
   * // Create a default open trade
   * const trade = MockDataBuilder.trade();
   *
   * // Create a closed LONG trade
   * const closedTrade = MockDataBuilder.trade({
   *   status: 'CLOSED',
   *   exitPrice: 160,
   *   exitDate: new Date(),
   *   realizedPnl: 100
   * });
   */
  static trade(overrides: Partial<JournalTrade> = {}): JournalTrade {
    const now = new Date();
    const entryDate = new Date(now);
    entryDate.setDate(entryDate.getDate() - 5); // Entered 5 days ago

    return {
      id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: 'test-user-id',
      symbol: 'AAPL',
      side: 'LONG' as TradeSide,
      status: 'OPEN' as TradeStatus,
      entryPrice: 150,
      quantity: 10,
      entryDate,
      exitPrice: null,
      exitDate: null,
      fees: 5,
      realizedPnl: null,
      notes: null,
      predictionId: null,
      createdAt: entryDate,
      updatedAt: now,
      ...overrides,
    };
  }

  /**
   * Creates a mock trade with P&L calculations.
   *
   * @param overrides - Optional overrides
   *
   * @example
   * const trade = MockDataBuilder.tradeWithPnL({ currentPrice: 160 });
   */
  static tradeWithPnL(overrides: Partial<TradeWithPnL> = {}): TradeWithPnL {
    const baseTrade = this.trade(overrides);
    const currentPrice = overrides.currentPrice ?? 155;
    const unrealizedPnl =
      baseTrade.status === 'OPEN'
        ? (currentPrice - baseTrade.entryPrice) *
          baseTrade.quantity *
          (baseTrade.side === 'LONG' ? 1 : -1) -
          baseTrade.fees
        : undefined;

    return {
      ...baseTrade,
      currentPrice,
      unrealizedPnl,
      ...overrides,
    };
  }

  /**
   * Creates an array of mock trades.
   *
   * @param count - Number of trades to create
   * @param options - Options for customizing trades
   *
   * @example
   * const trades = MockDataBuilder.tradeArray(5, { status: 'CLOSED' });
   */
  static tradeArray(
    count: number = 5,
    options: { status?: TradeStatus; side?: TradeSide; symbols?: string[] } = {}
  ): JournalTrade[] {
    const { status, side, symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'] } = options;
    const trades: JournalTrade[] = [];

    for (let i = 0; i < count; i++) {
      const entryDate = new Date();
      entryDate.setDate(entryDate.getDate() - (count - i) * 3);

      const tradeStatus = status ?? (i % 2 === 0 ? 'OPEN' : 'CLOSED');
      const tradeSide = side ?? (i % 3 === 0 ? 'SHORT' : 'LONG');
      const symbol = symbols[i % symbols.length];
      const entryPrice = 100 + i * 10;

      trades.push(
        this.trade({
          id: `trade-${i + 1}`,
          symbol,
          side: tradeSide,
          status: tradeStatus,
          entryPrice,
          quantity: 10 + i * 5,
          entryDate,
          exitPrice: tradeStatus === 'CLOSED' ? entryPrice + (tradeSide === 'LONG' ? 10 : -10) : null,
          exitDate: tradeStatus === 'CLOSED' ? new Date() : null,
          realizedPnl: tradeStatus === 'CLOSED' ? (tradeSide === 'LONG' ? 95 : -105) : null,
        })
      );
    }

    return trades;
  }

  /**
   * Creates mock portfolio statistics.
   *
   * @param overrides - Optional overrides
   *
   * @example
   * const stats = MockDataBuilder.portfolioStats({ winRate: 0.6 });
   */
  static portfolioStats(overrides: Partial<PortfolioStats> = {}): PortfolioStats {
    return {
      totalRealizedPnl: 1500,
      totalUnrealizedPnl: 500,
      totalTrades: 20,
      openTrades: 5,
      closedTrades: 15,
      winRate: 0.65,
      avgWin: 200,
      avgLoss: -100,
      bestTrade: 500,
      worstTrade: -200,
      ...overrides,
    };
  }

  /**
   * Creates mock prediction data for dashboard tests.
   *
   * @param symbol - Stock symbol
   * @param overrides - Optional overrides
   */
  static prediction(
    symbol: string = 'AAPL',
    overrides: Partial<{
      currentPrice: number;
      direction: 'bullish' | 'neutral' | 'bearish';
      confidence: number;
      targetPrice: number;
    }> = {}
  ) {
    const currentPrice = overrides.currentPrice ?? 150;
    const direction = overrides.direction ?? 'bullish';
    const confidence = overrides.confidence ?? 0.85;

    return {
      symbol,
      currentPrice,
      prediction: {
        direction,
        confidence,
        targetPrice: overrides.targetPrice ?? currentPrice * (direction === 'bullish' ? 1.1 : 0.9),
        timeframe: '1 month',
        reasoning: ['Strong earnings', 'Positive sentiment'],
      },
      signals: [],
      riskMetrics: {
        volatility: 'medium',
        support: currentPrice * 0.95,
        resistance: currentPrice * 1.05,
        stopLoss: currentPrice * 0.93,
      },
    };
  }

  /**
   * Creates mock analysis data for dashboard tests.
   *
   * @param symbol - Stock symbol
   */
  static analysisData(symbol: string = 'AAPL') {
    const priceData = this.priceDataArray(30, { basePrice: 150 });

    return {
      symbol,
      summary: {
        trend: 'bullish',
        strength: 0.7,
        recommendation: 'buy',
      },
      signals: [
        { indicator: 'RSI', value: 65, signal: 'neutral', strength: 0.7, timestamp: new Date(), description: 'RSI neutral' },
        { indicator: 'MACD', value: 1.2, signal: 'bullish', strength: 0.8, timestamp: new Date(), description: 'MACD bullish' },
      ],
      indicators: {
        rsi: [{ value: 65, signal: 'neutral' }],
        macd: [{
          value: 1.2,
          signal: 'bullish',
          macd: 1.2,
          signal_line: 1.0,
          histogram: 0.2,
        }],
      },
      priceData: priceData.map(p => ({
        date: p.date.toISOString().split('T')[0],
        open: p.open,
        high: p.high,
        low: p.low,
        close: p.close,
        volume: p.volume,
      })),
    };
  }

  /**
   * Creates mock quote data for API tests.
   *
   * @param symbol - Stock symbol
   * @param overrides - Optional overrides
   */
  static quote(
    symbol: string = 'AAPL',
    overrides: Partial<{
      price: number;
      change: number;
      changesPercentage: number;
    }> = {}
  ) {
    return {
      symbol,
      price: overrides.price ?? 155.5,
      change: overrides.change ?? 3.5,
      changesPercentage: overrides.changesPercentage ?? 2.3,
      volume: 1100000,
      avgVolume: 1000000,
      marketCap: 2500000000000,
      pe: 28.5,
    };
  }
}

/**
 * Shorthand factory functions for common test data
 */
export const mockPriceData = MockDataBuilder.priceData.bind(MockDataBuilder);
export const mockPriceDataArray = MockDataBuilder.priceDataArray.bind(MockDataBuilder);
export const mockTrade = MockDataBuilder.trade.bind(MockDataBuilder);
export const mockTradeWithPnL = MockDataBuilder.tradeWithPnL.bind(MockDataBuilder);
export const mockTradeArray = MockDataBuilder.tradeArray.bind(MockDataBuilder);
export const mockPortfolioStats = MockDataBuilder.portfolioStats.bind(MockDataBuilder);
export const mockPrediction = MockDataBuilder.prediction.bind(MockDataBuilder);
export const mockAnalysisData = MockDataBuilder.analysisData.bind(MockDataBuilder);
export const mockQuote = MockDataBuilder.quote.bind(MockDataBuilder);
