/**
 * Unit Tests: GET /api/trades/stats Route
 *
 * Tests for the portfolio statistics endpoint including:
 * - Database health check behavior
 * - Successful statistics retrieval
 * - Error handling for various failure scenarios
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../route';

// Mock dependencies
const mockHealthCheck = vi.fn();
const mockQuery = vi.fn();
const mockGetPortfolioStats = vi.fn();
const mockGetDemoUserId = vi.fn();

vi.mock('@/lib/database/connection', () => ({
  getDatabase: vi.fn(() => ({
    healthCheck: mockHealthCheck,
    query: mockQuery,
    getPool: vi.fn(),
    getClient: vi.fn(),
    transaction: vi.fn(),
    close: vi.fn(),
  })),
}));

vi.mock('@/lib/data-providers/fmp', () => ({
  getFMPProvider: vi.fn(() => ({
    getQuote: vi.fn(),
    getMultipleQuotes: vi.fn(),
    getHistoricalData: vi.fn(),
    searchStocks: vi.fn(),
    getCompanyProfile: vi.fn(),
    validateApiKey: vi.fn(),
  })),
}));

// Mock TradeService as a class
vi.mock('@/lib/portfolio/TradeService', () => ({
  TradeService: class MockTradeService {
    getPortfolioStats = mockGetPortfolioStats;
  },
}));

vi.mock('@/lib/auth/demo-user', () => ({
  getDemoUserId: () => mockGetDemoUserId(),
}));

describe('GET /api/trades/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Database Health Check', () => {
    it('should return 503 when database health check fails', async () => {
      mockHealthCheck.mockResolvedValueOnce(false);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Database connection unavailable');
      expect(data.details).toContain('npm run db:setup');
    });

    it('should proceed with request when database is healthy', async () => {
      mockHealthCheck.mockResolvedValueOnce(true);
      mockGetDemoUserId.mockResolvedValueOnce('user-123');
      mockGetPortfolioStats.mockResolvedValueOnce({
        totalRealizedPnl: 1000,
        totalUnrealizedPnl: 500,
        totalTrades: 10,
        openTrades: 3,
        closedTrades: 7,
        winRate: 0.6,
        avgWin: 200,
        avgLoss: -100,
        bestTrade: 500,
        worstTrade: -200,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockHealthCheck).toHaveBeenCalledTimes(1);
    });
  });

  describe('Successful Requests', () => {
    it('should return portfolio statistics successfully', async () => {
      const mockStats = {
        totalRealizedPnl: 1500.50,
        totalUnrealizedPnl: 250.25,
        totalTrades: 15,
        openTrades: 5,
        closedTrades: 10,
        winRate: 0.7,
        avgWin: 300,
        avgLoss: -150,
        bestTrade: 800,
        worstTrade: -300,
      };

      mockHealthCheck.mockResolvedValueOnce(true);
      mockGetDemoUserId.mockResolvedValueOnce('user-456');
      mockGetPortfolioStats.mockResolvedValueOnce(mockStats);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockStats);
    });

    it('should return empty statistics when user has no trades', async () => {
      const emptyStats = {
        totalRealizedPnl: 0,
        totalUnrealizedPnl: 0,
        totalTrades: 0,
        openTrades: 0,
        closedTrades: 0,
        winRate: null,
        avgWin: null,
        avgLoss: null,
        bestTrade: null,
        worstTrade: null,
      };

      mockHealthCheck.mockResolvedValueOnce(true);
      mockGetDemoUserId.mockResolvedValueOnce('user-789');
      mockGetPortfolioStats.mockResolvedValueOnce(emptyStats);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.winRate).toBeNull();
      expect(data.data.totalTrades).toBe(0);
    });
  });

  describe('Error Handling - Connection Errors', () => {
    it('should return 503 with specific message for ECONNREFUSED error', async () => {
      mockHealthCheck.mockResolvedValueOnce(true);
      mockGetDemoUserId.mockRejectedValueOnce(new Error('connect ECONNREFUSED 127.0.0.1:5432'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Database connection failed');
      expect(data.details).toContain('ECONNREFUSED');
    });

    it('should return 503 with specific message for generic connection error', async () => {
      mockHealthCheck.mockResolvedValueOnce(true);
      mockGetDemoUserId.mockRejectedValueOnce(new Error('connection timeout'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Database connection failed');
    });
  });

  describe('Error Handling - Missing Tables', () => {
    it('should return 503 with migration instructions when tables do not exist', async () => {
      mockHealthCheck.mockResolvedValueOnce(true);
      mockGetDemoUserId.mockRejectedValueOnce(
        new Error('relation "trades" does not exist')
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Database tables not found. Please run migrations: npm run db:migrate');
      expect(data.details).toContain('relation');
      expect(data.details).toContain('does not exist');
    });

    it('should return 503 for missing users table', async () => {
      mockHealthCheck.mockResolvedValueOnce(true);
      mockGetDemoUserId.mockRejectedValueOnce(
        new Error('relation "users" does not exist')
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toContain('Database tables not found');
    });
  });

  describe('Error Handling - Authentication Errors', () => {
    it('should return 503 when authentication service is unavailable', async () => {
      mockHealthCheck.mockResolvedValueOnce(true);
      mockGetDemoUserId.mockRejectedValueOnce(
        new Error('Authentication service unavailable')
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.error).toBe('User authentication failed. Database may not be properly configured.');
      expect(data.details).toContain('Authentication service unavailable');
    });
  });

  describe('Error Handling - Generic Errors', () => {
    it('should return 500 for unexpected errors', async () => {
      mockHealthCheck.mockResolvedValueOnce(true);
      mockGetDemoUserId.mockResolvedValueOnce('user-123');
      mockGetPortfolioStats.mockRejectedValueOnce(new Error('Unexpected internal error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch portfolio statistics');
      expect(data.details).toBe('Unexpected internal error');
    });

    it('should handle non-Error objects gracefully', async () => {
      mockHealthCheck.mockResolvedValueOnce(true);
      mockGetDemoUserId.mockResolvedValueOnce('user-123');
      mockGetPortfolioStats.mockRejectedValueOnce('String error');

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch portfolio statistics');
      expect(data.details).toBe('Unknown error');
    });

    it('should handle null/undefined errors gracefully', async () => {
      mockHealthCheck.mockResolvedValueOnce(true);
      mockGetDemoUserId.mockResolvedValueOnce('user-123');
      mockGetPortfolioStats.mockRejectedValueOnce(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.details).toBe('Unknown error');
    });
  });

  describe('Error Logging', () => {
    it('should log errors to console', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const testError = new Error('Test error for logging');

      mockHealthCheck.mockResolvedValueOnce(true);
      mockGetDemoUserId.mockRejectedValueOnce(testError);

      await GET();

      expect(consoleSpy).toHaveBeenCalledWith('Trades stats GET error:', testError);
      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle health check throwing an error', async () => {
      mockHealthCheck.mockRejectedValueOnce(new Error('Health check failed'));

      const response = await GET();
      const data = await response.json();

      // When healthCheck throws, it should be caught by the outer try-catch
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should handle getPortfolioStats throwing after successful auth', async () => {
      mockHealthCheck.mockResolvedValueOnce(true);
      mockGetDemoUserId.mockResolvedValueOnce('user-123');
      mockGetPortfolioStats.mockRejectedValueOnce(new Error('Database query failed'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.details).toBe('Database query failed');
    });

    it('should handle statistics with negative P&L values', async () => {
      const negativeStats = {
        totalRealizedPnl: -5000,
        totalUnrealizedPnl: -2500,
        totalTrades: 20,
        openTrades: 8,
        closedTrades: 12,
        winRate: 0.25,
        avgWin: 100,
        avgLoss: -500,
        bestTrade: 200,
        worstTrade: -1500,
      };

      mockHealthCheck.mockResolvedValueOnce(true);
      mockGetDemoUserId.mockResolvedValueOnce('user-losing');
      mockGetPortfolioStats.mockResolvedValueOnce(negativeStats);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.totalRealizedPnl).toBe(-5000);
      expect(data.data.winRate).toBe(0.25);
    });

    it('should handle statistics with zero win rate', async () => {
      const zeroWinStats = {
        totalRealizedPnl: -1000,
        totalUnrealizedPnl: 0,
        totalTrades: 5,
        openTrades: 0,
        closedTrades: 5,
        winRate: 0,
        avgWin: null,
        avgLoss: -200,
        bestTrade: -50,
        worstTrade: -400,
      };

      mockHealthCheck.mockResolvedValueOnce(true);
      mockGetDemoUserId.mockResolvedValueOnce('user-zero-wins');
      mockGetPortfolioStats.mockResolvedValueOnce(zeroWinStats);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.winRate).toBe(0);
      expect(data.data.avgWin).toBeNull();
    });

    it('should handle statistics with 100% win rate', async () => {
      const perfectStats = {
        totalRealizedPnl: 10000,
        totalUnrealizedPnl: 500,
        totalTrades: 10,
        openTrades: 2,
        closedTrades: 8,
        winRate: 1,
        avgWin: 1250,
        avgLoss: null,
        bestTrade: 3000,
        worstTrade: 100,
      };

      mockHealthCheck.mockResolvedValueOnce(true);
      mockGetDemoUserId.mockResolvedValueOnce('user-perfect');
      mockGetPortfolioStats.mockResolvedValueOnce(perfectStats);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.winRate).toBe(1);
      expect(data.data.avgLoss).toBeNull();
    });
  });
});
