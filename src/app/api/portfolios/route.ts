import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/connection';
import { getFMPProvider } from '@/lib/data-providers/fmp';
import { PortfolioService, PortfolioValidationError } from '@/lib/portfolio/PortfolioService';
import { getDemoUserId } from '@/lib/auth/demo-user';

/**
 * GET /api/portfolios - List all portfolios for the authenticated user
 */
export async function GET() {
  try {
    const db = getDatabase();
    const fmpProvider = getFMPProvider();
    const portfolioService = new PortfolioService(db, fmpProvider);

    const userId = await getDemoUserId();
    const portfolios = await portfolioService.getUserPortfolios(userId);

    const defaultPortfolio = portfolios.find((p) => p.isDefault);

    return NextResponse.json({
      success: true,
      data: {
        portfolios,
        defaultPortfolioId: defaultPortfolio?.id,
      },
    });
  } catch (error) {
    console.error('Portfolios GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch portfolios',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/portfolios - Create a new portfolio
 *
 * Request body:
 * - name: Portfolio name (required)
 * - description: Portfolio description (optional)
 * - currency: Currency code (optional, default: USD)
 * - isDefault: Set as default portfolio (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, currency, isDefault } = body;

    const db = getDatabase();
    const fmpProvider = getFMPProvider();
    const portfolioService = new PortfolioService(db, fmpProvider);

    const userId = await getDemoUserId();

    const portfolio = await portfolioService.createPortfolio({
      userId,
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
    console.error('Portfolios POST error:', error);

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
        error: 'Failed to create portfolio',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}





