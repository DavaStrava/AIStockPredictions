/**
 * Portfolio Transactions Import API Route
 *
 * Bulk import transactions from CSV data.
 * Uses database transaction for atomicity - all transactions succeed or none do.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/connection';
import { getFMPProvider } from '@/lib/data-providers/fmp';
import {
  PortfolioService,
  PortfolioNotFoundError,
  PortfolioValidationError,
  InsufficientFundsError,
} from '@/lib/portfolio/PortfolioService';
import { getDemoUserId } from '@/lib/auth/demo-user';
import {
  createForbiddenResponse,
  checkRateLimit,
  createRateLimitResponse,
  getClientIdentifier,
} from '@/lib/api/utils';
import type { ParsedPortfolioTransaction, CSVImportResult, CSVValidationError } from '@/types/csv';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/portfolios/[id]/transactions/import - Bulk import transactions
 *
 * Request body:
 * - transactions: Array of ParsedPortfolioTransaction objects
 *
 * Uses a single database transaction to ensure atomicity.
 * If any transaction fails, the entire import is rolled back.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`portfolios:transactions:import:${clientId}`, {
    maxRequests: 10,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.resetIn);
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { transactions } = body as { transactions: ParsedPortfolioTransaction[] };

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No transactions provided',
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

    // Sort transactions by date (oldest first) for proper cash balance tracking
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
    );

    // Import all transactions within a single database transaction for atomicity
    const importResult = await db.transaction(async (client) => {
      const errors: CSVValidationError[] = [];
      let imported = 0;

      for (let i = 0; i < sortedTransactions.length; i++) {
        const tx = sortedTransactions[i];

        try {
          await portfolioService.addTransaction(
            {
              portfolioId: id,
              transactionType: tx.transactionType,
              assetSymbol: tx.symbol || undefined,
              quantity: tx.quantity || undefined,
              pricePerShare: tx.pricePerShare || undefined,
              totalAmount: tx.totalAmount,
              fees: tx.fees,
              transactionDate: new Date(tx.transactionDate),
              notes: tx.notes,
              // Skip cash/holdings validation for historical imports
              skipValidation: true,
            },
            client // Pass the transaction client for atomicity
          );

          imported++;
        } catch (error) {
          // On any error, throw to trigger rollback of the entire import
          let message = 'Unknown error';
          if (error instanceof PortfolioValidationError) {
            message = error.message;
          } else if (error instanceof InsufficientFundsError) {
            message = error.message;
          } else if (error instanceof Error) {
            message = error.message;
          }

          errors.push({
            row: i + 1,
            field: '',
            value: tx.symbol || '',
            message,
          });

          // Throw to trigger rollback - all or nothing
          throw new Error(
            `Import failed at row ${i + 1}: ${message}. ` +
              `${imported} transactions would have been imported but all changes have been rolled back.`
          );
        }
      }

      return { imported, errors };
    });

    const result: CSVImportResult = {
      success: true,
      imported: importResult.imported,
      failed: 0,
      errors: [],
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Portfolio transactions import error:', error);

    if (error instanceof PortfolioNotFoundError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 404 }
      );
    }

    // Return the error with details about what failed
    const message = error instanceof Error ? error.message : 'Failed to import transactions';

    return NextResponse.json(
      {
        success: false,
        imported: 0,
        failed: 0,
        errors: [{ row: 0, field: '', value: '', message }],
        error: message,
      } as CSVImportResult & { error: string },
      { status: 400 }
    );
  }
}
