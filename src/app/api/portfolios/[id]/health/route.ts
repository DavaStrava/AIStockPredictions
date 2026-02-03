import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/connection';
import { getFMPProvider } from '@/lib/data-providers/fmp';
import { PortfolioService, PortfolioNotFoundError } from '@/lib/portfolio/PortfolioService';
import { PortfolioHealthService } from '@/lib/portfolio/PortfolioHealthService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/portfolios/[id]/health - Get portfolio health analysis
 *
 * Runs technical analysis on each holding's historical price data,
 * weights by portfolio allocation, and returns an overall health score.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = getDatabase();
    const fmpProvider = getFMPProvider();
    const portfolioService = new PortfolioService(db, fmpProvider);
    const healthService = new PortfolioHealthService(portfolioService, fmpProvider);

    const health = await healthService.analyzePortfolioHealth(id);

    return NextResponse.json({
      success: true,
      data: health,
    });
  } catch (error) {
    console.error('Portfolio health GET error:', error);

    if (error instanceof PortfolioNotFoundError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to analyze portfolio health',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
