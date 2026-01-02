import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/connection';
import { getFMPProvider } from '@/lib/data-providers/fmp';
import { PortfolioService, PortfolioNotFoundError } from '@/lib/portfolio/PortfolioService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/portfolios/[id]/rebalance - Get rebalancing suggestions
 *
 * Query parameters:
 * - threshold: Drift percentage threshold to trigger rebalancing (default: 2)
 *
 * Returns suggestions for holdings that have drifted from their target allocation.
 * Only holdings with a target allocation set will be included.
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

    // Parse threshold parameter
    let threshold = 2;
    const thresholdParam = searchParams.get('threshold');
    if (thresholdParam) {
      const parsed = parseFloat(thresholdParam);
      if (isNaN(parsed) || parsed < 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'threshold must be a non-negative number',
          },
          { status: 400 }
        );
      }
      threshold = parsed;
    }

    const suggestions = await portfolioService.getRebalanceSuggestions(id, threshold);

    // Calculate total drift
    const totalDrift = suggestions.reduce((sum, s) => sum + Math.abs(s.driftPercent), 0);

    return NextResponse.json({
      success: true,
      data: {
        suggestions,
        totalDrift,
        rebalanceThreshold: threshold,
      },
    });
  } catch (error) {
    console.error('Portfolio rebalance GET error:', error);

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
        error: 'Failed to calculate rebalancing suggestions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

