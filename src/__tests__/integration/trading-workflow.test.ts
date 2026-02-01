/**
 * Trading Workflow Integration Tests
 *
 * These tests verify complete user workflows through the API:
 * - Search for a stock
 * - Get analysis
 * - Create a trade
 * - Monitor trade
 * - Close trade with profit/loss
 *
 * Run with: npm test -- trading-workflow.test
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  createMockGetRequest,
  createMockPostRequest,
  createMockPatchRequest,
  createRouteParams,
} from '../utils';
import {
  createTestHeaders,
  getResponseJson,
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
import { GET as searchStocks } from '@/app/api/search/route';
import { GET as getAnalysis } from '@/app/api/analysis/route';
import { GET as getPredictions } from '@/app/api/predictions/route';
import { GET as getTrades, POST as createTrade } from '@/app/api/trades/route';
import { GET as getTradeById, PATCH as closeTrade } from '@/app/api/trades/[id]/route';
import { GET as getTradeStats } from '@/app/api/trades/stats/route';

describe('Complete Trading Workflow', () => {
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

  describe('Workflow: Research → Trade → Close', () => {
    it('should complete full workflow: search → analyze → trade → close', async () => {
      // Step 1: Search for a stock
      mockFmpProvider.searchStocks.mockResolvedValueOnce([
        {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          exchange: 'NASDAQ',
          type: 'stock',
          currency: 'USD',
        },
      ]);

      const searchRequest = createMockGetRequest('/api/search', { q: 'AAPL' }, headers);
      const searchResponse = await searchStocks(searchRequest);
      const searchJson = await getResponseJson<{ data: any[] }>(searchResponse);

      expect(searchResponse.status).toBe(200);
      expect(searchJson.data.length).toBeGreaterThan(0);
      expect(searchJson.data[0].symbol).toBe('AAPL');

      // Step 2: Get technical analysis
      mockFmpProvider.getHistoricalData.mockResolvedValueOnce(defaultFmpResponses.historicalData);
      mockFmpProvider.getQuote.mockResolvedValueOnce({
        price: 150,
        change: 2.5,
        changesPercentage: 1.7,
      });

      const analysisRequest = createMockGetRequest(
        '/api/analysis',
        { symbol: 'AAPL', timeframe: '1y' },
        headers
      );
      const analysisResponse = await getAnalysis(analysisRequest);
      const analysisJson = await getResponseJson<{
        data: any;
        priceData: any[];
        metadata: any;
      }>(analysisResponse);

      expect(analysisResponse.status).toBe(200);
      expect(analysisJson.data).toBeDefined();
      expect(analysisJson.priceData).toBeDefined();
      expect(analysisJson.metadata.symbol).toBe('AAPL');

      // Step 3: Get prediction
      const predictionRequest = createMockGetRequest(
        '/api/predictions',
        { symbols: 'AAPL' },
        headers
      );
      const predictionResponse = await getPredictions(predictionRequest);
      const predictionJson = await getResponseJson<{ data: any[] }>(predictionResponse);

      expect(predictionResponse.status).toBe(200);
      expect(Array.isArray(predictionJson.data)).toBe(true);

      // Step 4: Create a trade based on analysis
      const tradeData = {
        id: 'trade-workflow-1',
        user_id: 'demo-user-id',
        symbol: 'AAPL',
        side: 'LONG',
        status: 'OPEN',
        entry_price: '150.00',
        quantity: '10',
        entry_date: new Date().toISOString(),
        fees: '5.00',
        realized_pnl: null,
        notes: 'Based on technical analysis - bullish signal',
      };

      mockDbPool.query.mockResolvedValueOnce({ rows: [tradeData], rowCount: 1 });

      const createTradeRequest = createMockPostRequest(
        '/api/trades',
        {
          symbol: 'AAPL',
          side: 'LONG',
          entryPrice: 150,
          quantity: 10,
          fees: 5,
          notes: 'Based on technical analysis - bullish signal',
        },
        headers
      );
      const createTradeResponse = await createTrade(createTradeRequest);
      const createTradeJson = await getResponseJson<{ data: any }>(createTradeResponse);

      expect(createTradeResponse.status).toBe(200);
      expect(createTradeJson.data.symbol).toBe('AAPL');
      expect(createTradeJson.data.status).toBe('OPEN');

      const tradeId = createTradeJson.data.id;

      // Step 5: Check trade status
      mockDbPool.query.mockResolvedValueOnce({ rows: [tradeData], rowCount: 1 });
      mockFmpProvider.getQuote.mockResolvedValueOnce({
        price: 160,
        change: 10,
        changesPercentage: 6.67,
      });

      const getTradeRequest = createMockGetRequest(`/api/trades/${tradeId}`, {}, headers);
      const getTradeResponse = await getTradeById(
        getTradeRequest,
        createRouteParams({ id: tradeId })
      );
      const getTradeJson = await getResponseJson<{ data: any }>(getTradeResponse);

      expect(getTradeResponse.status).toBe(200);
      expect(getTradeJson.data.status).toBe('OPEN');

      // Step 6: Close trade with profit
      const closedTradeData = {
        ...tradeData,
        status: 'CLOSED',
        exit_price: '160.00',
        exit_date: new Date().toISOString(),
        realized_pnl: '95.00', // (160-150)*10 - 5 fees
      };

      mockDbPool.query.mockResolvedValueOnce({ rows: [tradeData], rowCount: 1 });
      mockDbPool.query.mockResolvedValueOnce({ rows: [closedTradeData], rowCount: 1 });

      const closeTradeRequest = createMockPatchRequest(
        `/api/trades/${tradeId}`,
        { exitPrice: 160 },
        headers
      );
      const closeTradeResponse = await closeTrade(
        closeTradeRequest,
        createRouteParams({ id: tradeId })
      );
      const closeTradeJson = await getResponseJson<{ data: any }>(closeTradeResponse);

      expect(closeTradeResponse.status).toBe(200);
      expect(closeTradeJson.data.status).toBe('CLOSED');
      expect(parseFloat(closeTradeJson.data.exit_price)).toBe(160);
      expect(parseFloat(closeTradeJson.data.realized_pnl)).toBe(95);

      // Step 7: Verify portfolio stats updated
      mockDbPool.query.mockResolvedValueOnce({
        rows: [
          {
            total_trades: '1',
            open_trades: '0',
            closed_trades: '1',
            total_pnl: '95.00',
            total_fees: '5.00',
            winning_trades: '1',
            losing_trades: '0',
            total_wins: '95.00',
            total_losses: '0',
            largest_win: '95.00',
            largest_loss: null,
          },
        ],
        rowCount: 1,
      });

      const statsRequest = createMockGetRequest('/api/trades/stats', {}, headers);
      const statsResponse = await getTradeStats(statsRequest);
      const statsJson = await getResponseJson<{ data: any }>(statsResponse);

      expect(statsResponse.status).toBe(200);
      expect(statsJson.data.totalTrades).toBe(1);
      expect(statsJson.data.closedTrades).toBe(1);
    });
  });

  describe('Workflow: Multiple Trades Management', () => {
    it('should handle multiple concurrent open trades', async () => {
      const trades = [
        {
          id: 'trade-1',
          symbol: 'AAPL',
          side: 'LONG',
          status: 'OPEN',
          entry_price: '150.00',
          quantity: '10',
        },
        {
          id: 'trade-2',
          symbol: 'GOOGL',
          side: 'LONG',
          status: 'OPEN',
          entry_price: '140.00',
          quantity: '5',
        },
        {
          id: 'trade-3',
          symbol: 'MSFT',
          side: 'SHORT',
          status: 'OPEN',
          entry_price: '380.00',
          quantity: '8',
        },
      ];

      mockDbPool.query.mockResolvedValueOnce({ rows: trades, rowCount: 3 });
      mockFmpProvider.getQuote.mockImplementation((symbol) => {
        const prices: Record<string, number> = { AAPL: 155, GOOGL: 145, MSFT: 375 };
        return Promise.resolve({ price: prices[symbol] || 100 });
      });

      const tradesRequest = createMockGetRequest('/api/trades', { status: 'OPEN' }, headers);
      const tradesResponse = await getTrades(tradesRequest);
      const tradesJson = await getResponseJson<{ data: any[] }>(tradesResponse);

      expect(tradesResponse.status).toBe(200);
      expect(tradesJson.data.length).toBe(3);
    });

    it('should track closed trades with mixed P&L', async () => {
      const closedTrades = [
        { id: 'trade-1', symbol: 'AAPL', realized_pnl: '100.00' }, // Win
        { id: 'trade-2', symbol: 'GOOGL', realized_pnl: '-50.00' }, // Loss
        { id: 'trade-3', symbol: 'MSFT', realized_pnl: '75.00' }, // Win
      ];

      mockDbPool.query.mockResolvedValueOnce({ rows: closedTrades, rowCount: 3 });

      const tradesRequest = createMockGetRequest('/api/trades', { status: 'CLOSED' }, headers);
      const tradesResponse = await getTrades(tradesRequest);
      const tradesJson = await getResponseJson<{ data: any[] }>(tradesResponse);

      expect(tradesResponse.status).toBe(200);
      expect(tradesJson.data.length).toBe(3);

      // Verify we can calculate total P&L
      const totalPnL = tradesJson.data.reduce((sum, trade) => {
        return sum + (parseFloat(trade.realized_pnl) || 0);
      }, 0);
      expect(totalPnL).toBe(125); // 100 - 50 + 75
    });
  });

  describe('Workflow: Trade Filtering and Analysis', () => {
    it('should filter trades by date range for period analysis', async () => {
      const tradesInRange = [
        {
          id: 'trade-1',
          symbol: 'AAPL',
          entry_date: '2024-06-15T10:00:00Z',
          status: 'CLOSED',
          realized_pnl: '100.00',
        },
        {
          id: 'trade-2',
          symbol: 'GOOGL',
          entry_date: '2024-06-20T14:00:00Z',
          status: 'CLOSED',
          realized_pnl: '-30.00',
        },
      ];

      mockDbPool.query.mockResolvedValueOnce({ rows: tradesInRange, rowCount: 2 });

      const tradesRequest = createMockGetRequest(
        '/api/trades',
        {
          startDate: '2024-06-01',
          endDate: '2024-06-30',
        },
        headers
      );
      const tradesResponse = await getTrades(tradesRequest);
      const tradesJson = await getResponseJson<{ data: any[] }>(tradesResponse);

      expect(tradesResponse.status).toBe(200);
      expect(tradesJson.data.length).toBe(2);
    });

    it('should filter trades by symbol for position analysis', async () => {
      const appleTrades = [
        { id: 'trade-1', symbol: 'AAPL', status: 'CLOSED', realized_pnl: '50.00' },
        { id: 'trade-2', symbol: 'AAPL', status: 'OPEN', entry_price: '155.00' },
      ];

      mockDbPool.query.mockResolvedValueOnce({ rows: appleTrades, rowCount: 2 });

      const tradesRequest = createMockGetRequest('/api/trades', { symbol: 'AAPL' }, headers);
      const tradesResponse = await getTrades(tradesRequest);
      const tradesJson = await getResponseJson<{ data: any[] }>(tradesResponse);

      expect(tradesResponse.status).toBe(200);
      expect(tradesJson.data.every((t) => t.symbol === 'AAPL')).toBe(true);
    });
  });

  describe('Workflow: SHORT Trade Scenario', () => {
    it('should handle profitable SHORT trade workflow', async () => {
      // Create SHORT trade expecting price drop
      const shortTradeData = {
        id: 'trade-short-1',
        user_id: 'demo-user-id',
        symbol: 'TSLA',
        side: 'SHORT',
        status: 'OPEN',
        entry_price: '250.00',
        quantity: '5',
        entry_date: new Date().toISOString(),
        fees: '5.00',
      };

      mockDbPool.query.mockResolvedValueOnce({ rows: [shortTradeData], rowCount: 1 });

      const createRequest = createMockPostRequest(
        '/api/trades',
        {
          symbol: 'TSLA',
          side: 'SHORT',
          entryPrice: 250,
          quantity: 5,
          fees: 5,
        },
        headers
      );
      const createResponse = await createTrade(createRequest);
      const createJson = await getResponseJson<{ data: any }>(createResponse);

      expect(createResponse.status).toBe(200);
      expect(createJson.data.side).toBe('SHORT');

      // Close SHORT trade at lower price (profit)
      const closedShortData = {
        ...shortTradeData,
        status: 'CLOSED',
        exit_price: '220.00',
        exit_date: new Date().toISOString(),
        realized_pnl: '145.00', // (250-220)*5 - 5 fees = 150 - 5 = 145
      };

      mockDbPool.query.mockResolvedValueOnce({ rows: [shortTradeData], rowCount: 1 });
      mockDbPool.query.mockResolvedValueOnce({ rows: [closedShortData], rowCount: 1 });

      const closeRequest = createMockPatchRequest(
        '/api/trades/trade-short-1',
        { exitPrice: 220 },
        headers
      );
      const closeResponse = await closeTrade(
        closeRequest,
        createRouteParams({ id: 'trade-short-1' })
      );
      const closeJson = await getResponseJson<{ data: any }>(closeResponse);

      expect(closeResponse.status).toBe(200);
      expect(closeJson.data.status).toBe('CLOSED');
      expect(parseFloat(closeJson.data.realized_pnl)).toBe(145);
    });

    it('should handle losing SHORT trade workflow', async () => {
      // Create SHORT trade
      const shortTradeData = {
        id: 'trade-short-2',
        user_id: 'demo-user-id',
        symbol: 'NVDA',
        side: 'SHORT',
        status: 'OPEN',
        entry_price: '500.00',
        quantity: '2',
        entry_date: new Date().toISOString(),
        fees: '5.00',
      };

      mockDbPool.query.mockResolvedValueOnce({ rows: [shortTradeData], rowCount: 1 });

      const createRequest = createMockPostRequest(
        '/api/trades',
        {
          symbol: 'NVDA',
          side: 'SHORT',
          entryPrice: 500,
          quantity: 2,
          fees: 5,
        },
        headers
      );
      await createTrade(createRequest);

      // Close SHORT at higher price (loss)
      const closedShortData = {
        ...shortTradeData,
        status: 'CLOSED',
        exit_price: '550.00',
        exit_date: new Date().toISOString(),
        realized_pnl: '-105.00', // (500-550)*2 - 5 = -100 - 5 = -105
      };

      mockDbPool.query.mockResolvedValueOnce({ rows: [shortTradeData], rowCount: 1 });
      mockDbPool.query.mockResolvedValueOnce({ rows: [closedShortData], rowCount: 1 });

      const closeRequest = createMockPatchRequest(
        '/api/trades/trade-short-2',
        { exitPrice: 550 },
        headers
      );
      const closeResponse = await closeTrade(
        closeRequest,
        createRouteParams({ id: 'trade-short-2' })
      );
      const closeJson = await getResponseJson<{ data: any }>(closeResponse);

      expect(closeResponse.status).toBe(200);
      expect(parseFloat(closeJson.data.realized_pnl)).toBe(-105);
    });
  });
});

describe('Edge Cases in Trading Workflow', () => {
  const headers = createTestHeaders();

  beforeEach(() => {
    vi.clearAllMocks();
    mockDbPool.query.mockResolvedValue(defaultDbResponses.trades);
    mockFmpProvider.getQuote.mockResolvedValue(defaultFmpResponses.quote);
    mockFmpProvider.getHistoricalData.mockResolvedValue(defaultFmpResponses.historicalData);
    mockFmpProvider.searchStocks.mockResolvedValue(defaultFmpResponses.searchResults);
    mockFmpProvider.getMultipleQuotes.mockResolvedValue([defaultFmpResponses.quote]);
  });

  it('should handle trade at exact entry price (breakeven minus fees)', async () => {
    const tradeData = {
      id: 'trade-breakeven',
      symbol: 'AAPL',
      side: 'LONG',
      status: 'OPEN',
      entry_price: '150.00',
      quantity: '10',
      fees: '5.00',
    };

    mockDbPool.query.mockResolvedValueOnce({ rows: [tradeData], rowCount: 1 });
    mockDbPool.query.mockResolvedValueOnce({
      rows: [
        {
          ...tradeData,
          status: 'CLOSED',
          exit_price: '150.00',
          realized_pnl: '-5.00', // Only fees lost
        },
      ],
      rowCount: 1,
    });

    const closeRequest = createMockPatchRequest(
      '/api/trades/trade-breakeven',
      { exitPrice: 150 },
      headers
    );
    const closeResponse = await closeTrade(
      closeRequest,
      createRouteParams({ id: 'trade-breakeven' })
    );
    const closeJson = await getResponseJson<{ data: any }>(closeResponse);

    expect(closeResponse.status).toBe(200);
    expect(parseFloat(closeJson.data.realized_pnl)).toBe(-5);
  });

  it('should handle very small price movements', async () => {
    const tradeData = {
      id: 'trade-small',
      symbol: 'BRK.A',
      side: 'LONG',
      status: 'OPEN',
      entry_price: '500000.00',
      quantity: '1',
      fees: '50.00',
    };

    mockDbPool.query.mockResolvedValueOnce({ rows: [tradeData], rowCount: 1 });
    mockDbPool.query.mockResolvedValueOnce({
      rows: [
        {
          ...tradeData,
          status: 'CLOSED',
          exit_price: '500100.00',
          realized_pnl: '50.00', // 100 gain - 50 fees
        },
      ],
      rowCount: 1,
    });

    const closeRequest = createMockPatchRequest(
      '/api/trades/trade-small',
      { exitPrice: 500100 },
      headers
    );
    const closeResponse = await closeTrade(closeRequest, createRouteParams({ id: 'trade-small' }));
    const closeJson = await getResponseJson<{ data: any }>(closeResponse);

    expect(closeResponse.status).toBe(200);
    expect(parseFloat(closeJson.data.realized_pnl)).toBe(50);
  });

  it('should handle large quantity trades', async () => {
    const tradeData = {
      id: 'trade-large',
      symbol: 'PLTR',
      side: 'LONG',
      status: 'OPEN',
      entry_price: '25.00',
      quantity: '10000',
      fees: '25.00',
    };

    mockDbPool.query.mockResolvedValueOnce({ rows: [tradeData], rowCount: 1 });
    mockDbPool.query.mockResolvedValueOnce({
      rows: [
        {
          ...tradeData,
          status: 'CLOSED',
          exit_price: '26.00',
          realized_pnl: '9975.00', // (26-25)*10000 - 25 = 10000 - 25
        },
      ],
      rowCount: 1,
    });

    const closeRequest = createMockPatchRequest(
      '/api/trades/trade-large',
      { exitPrice: 26 },
      headers
    );
    const closeResponse = await closeTrade(closeRequest, createRouteParams({ id: 'trade-large' }));
    const closeJson = await getResponseJson<{ data: any }>(closeResponse);

    expect(closeResponse.status).toBe(200);
    expect(parseFloat(closeJson.data.realized_pnl)).toBe(9975);
  });
});
