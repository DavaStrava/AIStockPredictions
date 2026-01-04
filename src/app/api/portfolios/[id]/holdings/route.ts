import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/connection';
import { getFMPProvider } from '@/lib/data-providers/fmp';
import {
  PortfolioService,
  PortfolioNotFoundError,
  PortfolioValidationError,
} from '@/lib/portfolio/PortfolioService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/portfolios/[id]/holdings - Get all holdings with real-time market data
 *
 * Returns enriched holdings with:
 * - Current price and market value
 * - Portfolio weight and drift from target
 * - Day change ($ and %)
 * - Total gain/loss ($ and %)
 * - Sector information
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = getDatabase();
    const fmpProvider = getFMPProvider();
    const portfolioService = new PortfolioService(db, fmpProvider);

    // Verify portfolio exists
    const portfolio = await portfolioService.getPortfolioById(id);
    if (!portfolio) {
      return NextResponse.json(
        {
          success: false,
          error: 'Portfolio not found',
        },
        { status: 404 }
      );
    }

    const holdings = await portfolioService.getHoldingsWithMarketData(id);
    const totalMarketValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);

    return NextResponse.json({
      success: true,
      data: {
        holdings,
        totalMarketValue,
        lastUpdated: new Date(),
      },
    });
  } catch (error) {
    console.error('Portfolio holdings GET error:', error);

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
        error: 'Failed to fetch portfolio holdings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/portfolios/[id]/holdings - Update holding target allocation
 *
 * Query parameter:
 * - symbol: The stock symbol to update
 *
 * Request body:
 * - targetAllocationPercent: New target allocation (null to remove)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const symbol = request.nextUrl.searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        {
          success: false,
          error: 'symbol query parameter is required',
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { targetAllocationPercent } = body;

    const db = getDatabase();
    const fmpProvider = getFMPProvider();
    const portfolioService = new PortfolioService(db, fmpProvider);

    const holding = await portfolioService.updateHoldingTarget(
      id,
      symbol,
      targetAllocationPercent
    );

    return NextResponse.json({
      success: true,
      data: holding,
    });
  } catch (error) {
    console.error('Portfolio holdings PATCH error:', error);

    if (error instanceof PortfolioValidationError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          field: error.field,
          code: error.code,
        },
        { status: error.code === 'NOT_FOUND' ? 404 : 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update holding target',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


