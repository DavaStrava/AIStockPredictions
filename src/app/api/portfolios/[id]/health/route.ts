import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/connection';
import { getFMPProvider } from '@/lib/data-providers/fmp';
import { PortfolioService, PortfolioNotFoundError } from '@/lib/portfolio/PortfolioService';
import { PortfolioHealthService } from '@/lib/portfolio/PortfolioHealthService';
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
 * GET /api/portfolios/[id]/health - Get portfolio health analysis
 *
 * Runs technical analysis on each holding's historical price data,
 * weights by portfolio allocation, and returns an overall health score.
 *
 * Rate limited to 10 req/min — this is an expensive endpoint.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`portfolios:health:get:${clientId}`, {
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

    const userId = await getDemoUserId();

    // Verify portfolio ownership
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

    const healthService = new PortfolioHealthService(portfolioService, fmpProvider);
    const health = await healthService.analyzePortfolioHealth(id);

    return NextResponse.json({
      success: true,
      data: health,
    });
  } catch (error) {
    if (error instanceof PortfolioNotFoundError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return createErrorResponse(error, 'Failed to analyze portfolio health', 500);
  }
}
