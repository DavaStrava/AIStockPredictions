import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/connection';
import { getFMPProvider } from '@/lib/data-providers/fmp';
import { PortfolioService, PortfolioNotFoundError } from '@/lib/portfolio/PortfolioService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/portfolios/[id]/allocation - Get sector allocation for tree map visualization
 *
 * Returns hierarchical data structure with:
 * - Sector-level aggregation (market value, portfolio weight)
 * - Per-holding details within each sector
 * - Day change percentage for color coding
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

    const allocation = await portfolioService.getSectorAllocation(id);

    // Calculate total market value
    const totalMarketValue = allocation.reduce((sum, sector) => sum + sector.marketValue, 0);

    return NextResponse.json({
      success: true,
      data: {
        sectors: allocation,
        totalMarketValue,
        sectorCount: allocation.length,
      },
    });
  } catch (error) {
    console.error('Portfolio allocation GET error:', error);

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
        error: 'Failed to fetch sector allocation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

