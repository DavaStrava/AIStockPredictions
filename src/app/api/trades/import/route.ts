/**
 * Trade Import API Route
 *
 * Bulk import trades from CSV data.
 * Uses database transaction for atomicity - all trades succeed or none do.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/connection';
import { getFMPProvider } from '@/lib/data-providers/fmp';
import { TradeService, TradeValidationError } from '@/lib/portfolio/TradeService';
import { getDemoUserId } from '@/lib/auth/demo-user';
import {
  checkRateLimit,
  createRateLimitResponse,
  getClientIdentifier,
} from '@/lib/api/utils';
import type { ParsedTrade, CSVImportResult } from '@/types/csv';

/**
 * POST /api/trades/import - Bulk import trades
 *
 * Request body:
 * - trades: Array of ParsedTrade objects
 *
 * Uses a single database transaction to ensure atomicity.
 * If any trade fails, the entire import is rolled back.
 */
export async function POST(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`trades:import:${clientId}`, {
    maxRequests: 10,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.resetIn);
  }

  try {
    const body = await request.json();
    const { trades } = body as { trades: ParsedTrade[] };

    if (!Array.isArray(trades) || trades.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No trades provided',
        },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const fmpProvider = getFMPProvider();
    const tradeService = new TradeService(db, fmpProvider);

    // Get authenticated user
    const userId = await getDemoUserId();

    // Sort trades by entry date (oldest first)
    const sortedTrades = [...trades].sort(
      (a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
    );

    // Import all trades within a single database transaction for atomicity
    const importResult = await db.transaction(async (client) => {
      let imported = 0;

      for (let i = 0; i < sortedTrades.length; i++) {
        const trade = sortedTrades[i];

        try {
          // Create the trade
          const createdTrade = await tradeService.createTrade(
            {
              userId,
              symbol: trade.symbol,
              side: trade.side,
              entryPrice: trade.entryPrice,
              quantity: trade.quantity,
              fees: trade.fees,
              notes: trade.notes || undefined,
            },
            client // Pass the transaction client for atomicity
          );

          // If trade has exit data, close it
          if (trade.status === 'CLOSED' && trade.exitPrice && trade.exitDate) {
            await tradeService.closeTrade(
              createdTrade.id,
              trade.exitPrice,
              client // Pass the transaction client for atomicity
            );
          }

          imported++;
        } catch (error) {
          // On any error, throw to trigger rollback of the entire import
          let message = 'Unknown error';
          if (error instanceof TradeValidationError) {
            message = error.message;
          } else if (error instanceof Error) {
            message = error.message;
          }

          // Throw to trigger rollback - all or nothing
          throw new Error(
            `Import failed at row ${i + 1} (${trade.symbol}): ${message}. ` +
              `${imported} trades would have been imported but all changes have been rolled back.`
          );
        }
      }

      return { imported };
    });

    const result: CSVImportResult = {
      success: true,
      imported: importResult.imported,
      failed: 0,
      errors: [],
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Trade import error:', error);

    // Return the error with details about what failed
    const message = error instanceof Error ? error.message : 'Failed to import trades';

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
