import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/connection';
import { getFMPProvider } from '@/lib/data-providers/fmp';
import {
  PortfolioService,
  PortfolioValidationError,
  PortfolioNotFoundError,
} from '@/lib/portfolio/PortfolioService';
import { getDemoUserId } from '@/lib/auth/demo-user';
import {
  createErrorResponse,
  createForbiddenResponse,
  checkRateLimit,
  createRateLimitResponse,
  getClientIdentifier,
} from '@/lib/api/utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Verifies that the portfolio belongs to the authenticated user.
 * Returns the portfolio if authorized, null if not found, or throws on auth failure.
 */
async function authorizePortfolioAccess(
  portfolioService: PortfolioService,
  portfolioId: string,
  userId: string
): Promise<{ authorized: boolean; portfolio: Awaited<ReturnType<typeof portfolioService.getPortfolioById>> | null }> {
  const portfolio = await portfolioService.getPortfolioById(portfolioId);

  if (!portfolio) {
    return { authorized: true, portfolio: null };
  }

  // Verify ownership
  if (portfolio.userId !== userId) {
    return { authorized: false, portfolio: null };
  }

  return { authorized: true, portfolio };
}

/**
 * GET /api/portfolios/[id] - Get a single portfolio by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`portfolios:id:get:${clientId}`);
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.resetIn);
  }

  try {
    const { id } = await params;
    const db = getDatabase();
    const fmpProvider = getFMPProvider();
    const portfolioService = new PortfolioService(db, fmpProvider);

    // Get authenticated user
    const userId = await getDemoUserId();

    // Verify portfolio ownership
    const { authorized, portfolio } = await authorizePortfolioAccess(
      portfolioService,
      id,
      userId
    );

    if (!authorized) {
      return createForbiddenResponse();
    }

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
    return createErrorResponse(error, 'Failed to fetch portfolio', 500);
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
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`portfolios:id:put:${clientId}`, {
    maxRequests: 30,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.resetIn);
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, currency, isDefault } = body;

    const db = getDatabase();
    const fmpProvider = getFMPProvider();
    const portfolioService = new PortfolioService(db, fmpProvider);

    // Get authenticated user
    const userId = await getDemoUserId();

    // Verify portfolio ownership before updating
    const { authorized, portfolio: existingPortfolio } = await authorizePortfolioAccess(
      portfolioService,
      id,
      userId
    );

    if (!authorized) {
      return createForbiddenResponse();
    }

    if (!existingPortfolio) {
      return NextResponse.json(
        {
          success: false,
          error: 'Portfolio not found',
        },
        { status: 404 }
      );
    }

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

    return createErrorResponse(error, 'Failed to update portfolio', 500);
  }
}

/**
 * DELETE /api/portfolios/[id] - Delete a portfolio
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`portfolios:id:delete:${clientId}`, {
    maxRequests: 10,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.resetIn);
  }

  try {
    const { id } = await params;
    const db = getDatabase();
    const fmpProvider = getFMPProvider();
    const portfolioService = new PortfolioService(db, fmpProvider);

    // Get authenticated user
    const userId = await getDemoUserId();

    // Verify portfolio ownership before deleting
    const { authorized, portfolio } = await authorizePortfolioAccess(
      portfolioService,
      id,
      userId
    );

    if (!authorized) {
      return createForbiddenResponse();
    }

    if (!portfolio) {
      return NextResponse.json(
        {
          success: false,
          error: 'Portfolio not found',
        },
        { status: 404 }
      );
    }

    await portfolioService.deletePortfolio(id);

    return NextResponse.json({
      success: true,
      message: 'Portfolio deleted successfully',
    });
  } catch (error) {
    if (error instanceof PortfolioNotFoundError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 404 }
      );
    }

    return createErrorResponse(error, 'Failed to delete portfolio', 500);
  }
}
