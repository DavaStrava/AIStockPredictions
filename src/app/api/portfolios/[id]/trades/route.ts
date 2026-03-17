/**
 * Portfolio Trades API Route
 *
 * GET trades (BUY transactions with trade tracking) with unrealized P&L.
 * Used by the Trades tab in Portfolio Manager.
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
import { tradePositionsToTradesWithPnL } from '@/lib/portfolio/tradeAdapters';
import { TradeStatus } from '@/types/portfolio';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/portfolios/[id]/trades - List trades with unrealized P&L
 *
 * Query parameters:
 * - status: Filter by trade status (OPEN, CLOSED)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  // Rate limiting - 30 requests per minute (fetches external prices)
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`portfolios:trades:${clientId}`, {
    maxRequests: 30,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.resetIn);
  }

  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;

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

    // Parse filters
    const status = searchParams.get('status') as TradeStatus | null;
    const filters = status ? { status } : undefined;

    // Get trades with P&L
    const trades = await portfolioService.getTradePositionsWithPnL(id, filters);

    // Convert to TradeWithPnL format for UI compatibility
    const tradesWithPnL = tradePositionsToTradesWithPnL(trades);

    return NextResponse.json({
      success: true,
      data: tradesWithPnL,
    });
  } catch (error) {
    console.error('Trades GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch trades',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
