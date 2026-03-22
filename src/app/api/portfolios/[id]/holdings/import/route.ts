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
    const { holdings, cashBalance } = body as { holdings: ParsedHolding[]; cashBalance?: number };

    if (!Array.isArray(holdings) || holdings.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No holdings provided',
        },
        { status: 400 }
      );
    }

    // Validate cashBalance if provided
    if (cashBalance !== undefined && cashBalance !== null) {
      if (typeof cashBalance !== 'number' || !Number.isFinite(cashBalance)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid cash balance: must be a valid number',
          },
          { status: 400 }
        );
      }
      if (cashBalance < 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid cash balance: cannot be negative',
          },
          { status: 400 }
        );
      }
      if (cashBalance > 1_000_000_000) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid cash balance: exceeds maximum allowed value',
          },
          { status: 400 }
        );
      }
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

    // If cash balance provided, handle the DEPOSIT transaction
    // First remove any existing "Portfolio Export" deposits to avoid duplicates on re-import
    if (cashBalance && cashBalance > 0) {
      try {
        const PORTFOLIO_EXPORT_NOTE = 'Cash balance imported from Merrill Lynch Portfolio Export';

        // Find and delete existing portfolio export deposits
        const existingDeposits = await portfolioService.getTransactions(id, {
          transactionType: 'DEPOSIT',
        });

        for (const deposit of existingDeposits) {
          if (deposit.notes === PORTFOLIO_EXPORT_NOTE) {
            await portfolioService.deleteTransaction(deposit.id);
          }
        }

        // Create new deposit with current cash balance
        await portfolioService.addTransaction({
          portfolioId: id,
          transactionType: 'DEPOSIT',
          totalAmount: cashBalance,
          transactionDate: new Date(),
          notes: PORTFOLIO_EXPORT_NOTE,
        });
      } catch (cashError) {
        console.error('Failed to import cash balance:', cashError);
        // Don't fail the whole import if cash deposit fails
        importResult.errors.push({
          row: 0,
          field: 'cashBalance',
          value: String(cashBalance),
          message: `Failed to import cash balance: ${cashError instanceof Error ? cashError.message : 'Unknown error'}`,
        });
      }
    }

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
