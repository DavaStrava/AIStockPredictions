/**
 * Portfolio Trade Stats API Route
 *
 * GET trade statistics including realized/unrealized P&L, win rate, etc.
 * Used by the Trades tab stats cards in Portfolio Manager.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/connection';
import { getFMPProvider } from '@/lib/data-providers/fmp';
import { PortfolioService } from '@/lib/portfolio/PortfolioService';
import { getDemoUserId } from '@/lib/auth/demo-user';
import {
  createForbiddenResponse,
  checkRateLimit,
  createRateLimitResponse,
  getClientIdentifier,
} from '@/lib/api/utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/portfolios/[id]/trades/stats - Get trade statistics
 *
 * Returns:
 * - totalRealizedPnl: Sum of realized P&L from closed trades
 * - totalUnrealizedPnl: Sum of unrealized P&L from open trades
 * - totalTrades: Count of all trades
 * - openTrades: Count of open trades
 * - closedTrades: Count of closed trades
 * - winRate: Percentage of profitable closed trades
 * - avgWin: Average profit on winning trades
 * - avgLoss: Average loss on losing trades
 * - bestTrade: Highest realized P&L
 * - worstTrade: Lowest realized P&L
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  // Rate limiting - 30 requests per minute (fetches external prices for unrealized P&L)
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`portfolios:trades:stats:${clientId}`, {
    maxRequests: 30,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.resetIn);
  }

  try {
    const { id } = await params;

    const db = getDatabase();
    const fmpProvider = getFMPProvider();
    const portfolioService = new PortfolioService(db, fmpProvider);

    // Get authenticated user
    const userId = await getDemoUserId();

    // Verify portfolio exists and belongs to user
    const portfolio = await portfolioService.getPortfolioById(id);
    if (!portfolio) {
      return NextResponse.json(
        { success: false, error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    if (portfolio.userId !== userId) {
      return createForbiddenResponse();
    }

    // Get trade statistics
    const stats = await portfolioService.getTradeStats(id);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Trade stats GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch trade statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
