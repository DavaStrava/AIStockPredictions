import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/connection';
import { getFMPProvider } from '@/lib/data-providers/fmp';
import { PortfolioService, PortfolioNotFoundError } from '@/lib/portfolio/PortfolioService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/portfolios/[id]/summary - Get portfolio summary with aggregate stats
 *
 * Returns:
 * - totalEquity: Total portfolio value (holdings + cash)
 * - cashBalance: Available cash
 * - holdingsValue: Total market value of holdings
 * - holdingsCount: Number of distinct holdings
 * - dayChange: Dollar change today
 * - dayChangePercent: Percentage change today
 * - totalReturn: Total return in dollars
 * - totalReturnPercent: Total return percentage
 * - dailyAlpha: Portfolio return vs S&P 500
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = getDatabase();
    const fmpProvider = getFMPProvider();
    const portfolioService = new PortfolioService(db, fmpProvider);

    const summary = await portfolioService.getPortfolioSummary(id);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Portfolio summary GET error:', error);

    if (error instanceof PortfolioNotFoundError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch portfolio summary',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

