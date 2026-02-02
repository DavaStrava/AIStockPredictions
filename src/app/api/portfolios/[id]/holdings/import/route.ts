/**
 * Portfolio Holdings Import API Route
 *
 * Direct import of holdings snapshot to portfolio_holdings table.
 * No transactions are created - use for initial portfolio setup.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/connection';
import { getFMPProvider } from '@/lib/data-providers/fmp';
import { PortfolioService, PortfolioNotFoundError } from '@/lib/portfolio/PortfolioService';
import { getDemoUserId } from '@/lib/auth/demo-user';
import {
  createForbiddenResponse,
  checkRateLimit,
  createRateLimitResponse,
  getClientIdentifier,
} from '@/lib/api/utils';
import type { ParsedHolding, HoldingsImportResult } from '@/types/csv';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/portfolios/[id]/holdings/import - Import holdings snapshot
 *
 * Request body:
 * - holdings: Array of ParsedHolding objects
 *
 * Directly writes to portfolio_holdings table using UPSERT pattern.
 * Updates existing holdings or creates new ones.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`portfolios:holdings:import:${clientId}`, {
    maxRequests: 10,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.resetIn);
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { holdings } = body as { holdings: ParsedHolding[] };

    if (!Array.isArray(holdings) || holdings.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No holdings provided',
        },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const fmpProvider = getFMPProvider();
    const portfolioService = new PortfolioService(db, fmpProvider);

    // Get authenticated user
    const userId = await getDemoUserId();

    // Verify portfolio exists and belongs to user
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

    if (portfolio.userId !== userId) {
      return createForbiddenResponse();
    }

    // Import holdings
    const importResult = await portfolioService.importHoldings(id, holdings);

    const response: HoldingsImportResult = {
      success: importResult.success,
      imported: importResult.imported,
      updated: importResult.updated,
      failed: importResult.failed,
      errors: importResult.errors,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Holdings import error:', error);

    if (error instanceof PortfolioNotFoundError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 404 }
      );
    }

    const message = error instanceof Error ? error.message : 'Failed to import holdings';

    return NextResponse.json(
      {
        success: false,
        imported: 0,
        updated: 0,
        failed: 0,
        errors: [{ row: 0, field: '', value: '', message }],
        error: message,
      } as HoldingsImportResult & { error: string },
      { status: 400 }
    );
  }
}
