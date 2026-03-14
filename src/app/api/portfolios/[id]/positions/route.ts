/**
 * Portfolio Positions API Route
 *
 * GET open positions with unrealized P&L.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/connection';
import { getFMPProvider } from '@/lib/data-providers/fmp';
import { PortfolioService } from '@/lib/portfolio/PortfolioService';
import { getDemoUserId } from '@/lib/auth/demo-user';
import { createForbiddenResponse } from '@/lib/api/utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/portfolios/[id]/positions - List open positions with unrealized P&L
 *
 * Query parameters:
 * - includeMarketData: Include current price and unrealized P&L (default: true)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Check if market data should be included
    const includeMarketData = searchParams.get('includeMarketData') !== 'false';

    // Get positions
    const positions = includeMarketData
      ? await portfolioService.getOpenPositionsWithMarketData(id)
      : await portfolioService.getOpenPositions(id);

    // Calculate summary statistics
    let totalUnrealizedPnl = 0;
    let totalCostBasis = 0;
    let totalMarketValue = 0;

    if (includeMarketData) {
      for (const position of positions) {
        totalUnrealizedPnl += position.unrealizedPnl || 0;
        totalCostBasis += position.totalCostBasis;
        totalMarketValue += position.marketValue || 0;
      }
    } else {
      for (const position of positions) {
        totalCostBasis += position.totalCostBasis;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        positions,
        summary: {
          totalPositions: positions.length,
          totalCostBasis,
          totalMarketValue: includeMarketData ? totalMarketValue : undefined,
          totalUnrealizedPnl: includeMarketData ? totalUnrealizedPnl : undefined,
          totalUnrealizedPnlPercent: includeMarketData && totalCostBasis > 0
            ? (totalUnrealizedPnl / totalCostBasis) * 100
            : undefined,
        },
      },
    });
  } catch (error) {
    console.error('Positions GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch positions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
