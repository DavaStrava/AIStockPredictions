/**
 * API Client Tests
 *
 * Unit tests for the typed API client.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiClient, ApiClientError } from '../client';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ApiClient', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient({ baseUrl: '/api' });
    mockFetch.mockClear();
  });

  describe('trades', () => {
    describe('list', () => {
      it('fetches trades successfully', async () => {
        const mockTrades = [
          {
            id: '1',
            symbol: 'AAPL',
            side: 'LONG',
            status: 'OPEN',
            entryPrice: 150,
            quantity: 10,
            entryDate: '2024-01-15T10:00:00Z',
            exitDate: null,
            fees: 0,
            realizedPnl: null,
            notes: null,
            predictionId: null,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z',
          },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockTrades }),
        });

        const trades = await client.trades.list();

        expect(mockFetch).toHaveBeenCalledWith('/api/trades', expect.any(Object));
        expect(trades).toHaveLength(1);
        expect(trades[0].symbol).toBe('AAPL');
        expect(trades[0].entryDate).toBeInstanceOf(Date);
      });

      it('applies filters to query params', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] }),
        });

        await client.trades.list({ status: 'OPEN', symbol: 'AAPL' });

        expect(mockFetch).toHaveBeenCalledWith(
          '/api/trades?status=OPEN&symbol=AAPL',
          expect.any(Object)
        );
      });
    });

    describe('create', () => {
      it('creates a trade successfully', async () => {
        const newTrade = {
          id: '1',
          userId: 'user-1',
          symbol: 'AAPL',
          side: 'LONG',
          status: 'OPEN',
          entryPrice: 150,
          quantity: 10,
          entryDate: '2024-01-15T10:00:00Z',
          exitDate: null,
          fees: 0,
          realizedPnl: null,
          notes: null,
          predictionId: null,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: newTrade }),
        });

        const trade = await client.trades.create({
          symbol: 'AAPL',
          side: 'LONG',
          entryPrice: 150,
          quantity: 10,
        });

        expect(mockFetch).toHaveBeenCalledWith('/api/trades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: 'AAPL',
            side: 'LONG',
            entryPrice: 150,
            quantity: 10,
          }),
          signal: undefined,
        });
        expect(trade.symbol).toBe('AAPL');
      });
    });

    describe('close', () => {
      it('closes a trade with exit price', async () => {
        const closedTrade = {
          id: '1',
          userId: 'user-1',
          symbol: 'AAPL',
          side: 'LONG',
          status: 'CLOSED',
          entryPrice: 150,
          quantity: 10,
          entryDate: '2024-01-15T10:00:00Z',
          exitDate: '2024-01-20T10:00:00Z',
          exitPrice: 160,
          fees: 0,
          realizedPnl: 100,
          notes: null,
          predictionId: null,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-20T10:00:00Z',
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: closedTrade }),
        });

        const trade = await client.trades.close('1', 160);

        expect(mockFetch).toHaveBeenCalledWith('/api/trades/1', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ exitPrice: 160 }),
          signal: undefined,
        });
        expect(trade.exitDate).toBeInstanceOf(Date);
      });
    });

    describe('stats', () => {
      it('fetches portfolio stats', async () => {
        const mockStats = {
          totalRealizedPnl: 1000,
          totalUnrealizedPnl: 500,
          totalTrades: 10,
          openTrades: 3,
          closedTrades: 7,
          winRate: 0.7,
          avgWin: 200,
          avgLoss: -100,
          bestTrade: 500,
          worstTrade: -200,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockStats }),
        });

        const stats = await client.trades.stats();

        expect(stats.totalRealizedPnl).toBe(1000);
        expect(stats.winRate).toBe(0.7);
      });
    });
  });

  describe('predictions', () => {
    it('fetches predictions without symbols', async () => {
      const mockPredictions = [
        {
          symbol: 'AAPL',
          currentPrice: 150,
          prediction: {
            direction: 'bullish',
            confidence: 0.8,
            targetPrice: 165,
            timeframe: '1m',
            reasoning: ['Strong momentum'],
          },
          signals: [],
          riskMetrics: {
            volatility: 'medium',
            support: 145,
            resistance: 160,
            stopLoss: 140,
          },
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockPredictions }),
      });

      const predictions = await client.predictions.list();

      expect(mockFetch).toHaveBeenCalledWith('/api/predictions', expect.any(Object));
      expect(predictions).toHaveLength(1);
      expect(predictions[0].symbol).toBe('AAPL');
    });

    it('fetches predictions with symbols', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await client.predictions.list('AAPL,GOOGL');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/predictions?symbols=AAPL%2CGOOGL',
        expect.any(Object)
      );
    });
  });

  describe('search', () => {
    it('searches stocks with query', async () => {
      const mockResults = [
        { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', currency: 'USD', type: 'stock' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockResults }),
      });

      const results = await client.search.stocks('Apple');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/search?q=Apple&limit=10',
        expect.any(Object)
      );
      expect(results).toHaveLength(1);
      expect(results[0].symbol).toBe('AAPL');
    });
  });

  describe('error handling', () => {
    it('throws ApiClientError on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ success: false, error: 'Trade not found' }),
      });

      try {
        await client.trades.get('invalid-id');
        expect.fail('Expected ApiClientError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiClientError);
        expect((error as ApiClientError).message).toBe('Trade not found');
        expect((error as ApiClientError).status).toBe(404);
      }
    });

    it('throws ApiClientError on API error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Validation failed',
            details: 'Symbol is required',
            field: 'symbol',
          }),
      });

      await expect(client.trades.create({ symbol: '', side: 'LONG', entryPrice: 100, quantity: 10 })).rejects.toThrow(
        ApiClientError
      );
    });
  });

  describe('request options', () => {
    it('passes abort signal to fetch', async () => {
      const controller = new AbortController();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await client.trades.list(undefined, { signal: controller.signal });

      expect(mockFetch).toHaveBeenCalledWith('/api/trades', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: undefined,
        signal: controller.signal,
      });
    });
  });
});
