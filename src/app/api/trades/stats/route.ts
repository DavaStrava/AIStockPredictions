/**
 * Portfolio Statistics API - Aggregated trade performance metrics
 *
 * Returns comprehensive portfolio statistics including P&L, win rates, and performance metrics.
 *
 * Requirements: 10.4
 */

import { NextRequest } from 'next/server';
import { getDatabase } from '@/lib/database/connection';
import { getFMPProvider } from '@/lib/data-providers/fmp';
import { TradeService } from '@/lib/portfolio/TradeService';
import { getDemoUserId } from '@/lib/auth/demo-user';
import {
  withMiddleware,
  withErrorHandling,
  withRateLimit,
  withLogging,
  ApiResponse,
  ApiError,
  RequestContext,
} from '@/lib/api/middleware';

/**
 * Custom error for service unavailability
 */
class ServiceUnavailableError extends ApiError {
  constructor(message: string, details?: string) {
    super(message, 503, undefined, 'SERVICE_UNAVAILABLE');
    this.name = 'ServiceUnavailableError';
    if (details) {
      this.message = `${message}. ${details}`;
    }
  }
}

/**
 * GET /api/trades/stats - Get portfolio statistics for the authenticated user
 *
 * Returns:
 * - totalRealizedPnl: Sum of realized P&L from all closed trades
 * - totalUnrealizedPnl: Sum of unrealized P&L from all open trades
 * - totalTrades: Total number of trades
 * - openTrades: Number of open trades
 * - closedTrades: Number of closed trades
 * - winRate: Percentage of profitable closed trades (null if no closed trades)
 * - avgWin: Average profit per winning trade (null if no winning trades)
 * - avgLoss: Average loss per losing trade (null if no losing trades)
 * - bestTrade: Highest realized P&L (null if no closed trades)
 * - worstTrade: Lowest realized P&L (null if no closed trades)
 *
 * Rate limit: 120 requests per minute
 */
export const GET = withMiddleware(
  withErrorHandling(),
  withLogging(),
  withRateLimit({ requestsPerMinute: 120 }),
  async (req: NextRequest, context: RequestContext) => {
    const db = getDatabase();

    // Check database health first
    const isHealthy = await db.healthCheck();
    if (!isHealthy) {
      throw new ServiceUnavailableError(
        'Database connection unavailable',
        'Please ensure the database is running and migrations have been applied. Run: npm run db:setup'
      );
    }

    const fmpProvider = getFMPProvider();
    const tradeService = new TradeService(db, fmpProvider);

    const userId = await getDemoUserId();

    try {
      const stats = await tradeService.getPortfolioStats(userId);
      return ApiResponse.success(stats);
    } catch (error) {
      // Map specific database errors to user-friendly messages
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('connection')) {
        throw new ServiceUnavailableError('Database connection failed');
      }

      if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
        throw new ServiceUnavailableError(
          'Database tables not found',
          'Please run migrations: npm run db:migrate'
        );
      }

      if (errorMessage.includes('Authentication service unavailable')) {
        throw new ServiceUnavailableError(
          'User authentication failed',
          'Database may not be properly configured'
        );
      }

      // Re-throw other errors to be handled by error middleware
      throw error;
    }
  }
);
