import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/connection';
import { getFMPProvider } from '@/lib/data-providers/fmp';
import {
  PortfolioService,
  PortfolioValidationError,
  PortfolioNotFoundError,
} from '@/lib/portfolio/PortfolioService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/portfolios/[id] - Get a single portfolio by ID
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = getDatabase();
    const fmpProvider = getFMPProvider();
    const portfolioService = new PortfolioService(db, fmpProvider);

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

    return NextResponse.json({
      success: true,
      data: portfolio,
    });
  } catch (error) {
    console.error('Portfolio GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch portfolio',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/portfolios/[id] - Update a portfolio
 *
 * Request body:
 * - name: Portfolio name (optional)
 * - description: Portfolio description (optional)
 * - currency: Currency code (optional)
 * - isDefault: Set as default portfolio (optional)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, currency, isDefault } = body;

    const db = getDatabase();
    const fmpProvider = getFMPProvider();
    const portfolioService = new PortfolioService(db, fmpProvider);

    const portfolio = await portfolioService.updatePortfolio(id, {
      name,
      description,
      currency,
      isDefault,
    });

    return NextResponse.json({
      success: true,
      data: portfolio,
    });
  } catch (error) {
    console.error('Portfolio PUT error:', error);

    if (error instanceof PortfolioNotFoundError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 404 }
      );
    }

    if (error instanceof PortfolioValidationError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          field: error.field,
          code: error.code,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update portfolio',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/portfolios/[id] - Delete a portfolio
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = getDatabase();
    const fmpProvider = getFMPProvider();
    const portfolioService = new PortfolioService(db, fmpProvider);

    await portfolioService.deletePortfolio(id);

    return NextResponse.json({
      success: true,
      message: 'Portfolio deleted successfully',
    });
  } catch (error) {
    console.error('Portfolio DELETE error:', error);

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
        error: 'Failed to delete portfolio',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

