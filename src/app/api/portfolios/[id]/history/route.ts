import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/connection';
import { getFMPProvider } from '@/lib/data-providers/fmp';
import { PortfolioService, PortfolioNotFoundError } from '@/lib/portfolio/PortfolioService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/portfolios/[id]/history - Get performance history for equity curve and benchmarking
 *
 * Query parameters:
 * - startDate: Start date for history (optional, ISO string)
 * - endDate: End date for history (optional, ISO string)
 *
 * Returns time-series data with:
 * - Portfolio value and return
 * - S&P 500 (SPY) return
 * - Nasdaq 100 (QQQ) return
 *
 * All returns are normalized to the start date for comparison.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;

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

    // Build filters
    const filters: {
      startDate?: Date;
      endDate?: Date;
    } = {};

    const startDate = searchParams.get('startDate');
    if (startDate) {
      const parsed = new Date(startDate);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid startDate format. Use ISO date string',
          },
          { status: 400 }
        );
      }
      filters.startDate = parsed;
    }

    const endDate = searchParams.get('endDate');
    if (endDate) {
      const parsed = new Date(endDate);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid endDate format. Use ISO date string',
          },
          { status: 400 }
        );
      }
      filters.endDate = parsed;
    }

    const history = await portfolioService.getPerformanceHistory(id, filters);

    return NextResponse.json({
      success: true,
      data: {
        data: history,
        startDate: history.length > 0 ? history[0].date : null,
        endDate: history.length > 0 ? history[history.length - 1].date : null,
      },
    });
  } catch (error) {
    console.error('Portfolio history GET error:', error);

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
        error: 'Failed to fetch performance history',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/portfolios/[id]/history - Record a daily performance snapshot
 *
 * This endpoint should be called at market close to record daily performance.
 * In production, this would be triggered by a scheduled Lambda/cron job.
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const db = getDatabase();
    const fmpProvider = getFMPProvider();
    const portfolioService = new PortfolioService(db, fmpProvider);

    const performance = await portfolioService.recordDailyPerformance(id);

    return NextResponse.json({
      success: true,
      data: performance,
    });
  } catch (error) {
    console.error('Portfolio history POST error:', error);

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
        error: 'Failed to record daily performance',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}





