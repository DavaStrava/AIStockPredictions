import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/connection';
import { getFMPProvider } from '@/lib/data-providers/fmp';
import { TradeService } from '@/lib/portfolio/TradeService';
import { getDemoUserId } from '@/lib/auth/demo-user';
import {
  createErrorResponse,
  checkRateLimit,
  createRateLimitResponse,
  getClientIdentifier,
} from '@/lib/api/utils';

/**
 * POST /api/trades/bulk-delete - Delete multiple trades
 *
 * Request body:
 * - ids: string[] - Array of trade IDs to delete
 */
export async function POST(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`trades:bulk-delete:${clientId}`, {
    maxRequests: 10,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.resetIn);
  }

  try {
    const body = await request.json();
    const { ids } = body;

    // Validate input
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'ids must be a non-empty array of trade IDs',
        },
        { status: 400 }
      );
    }

    // Validate all IDs are strings
    if (!ids.every((id: unknown) => typeof id === 'string')) {
      return NextResponse.json(
        {
          success: false,
          error: 'All trade IDs must be strings',
        },
        { status: 400 }
      );
    }

    // Validate all IDs are valid UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!ids.every((id: string) => uuidRegex.test(id))) {
      return NextResponse.json(
        {
          success: false,
          error: 'All trade IDs must be valid UUIDs',
        },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const fmpProvider = getFMPProvider();
    const tradeService = new TradeService(db, fmpProvider);

    // Get authenticated user
    const userId = await getDemoUserId();

    // Delete the trades
    const deletedCount = await tradeService.deleteTrades(ids, userId);

    return NextResponse.json({
      success: true,
      data: { deletedCount },
    });
  } catch (error) {
    return createErrorResponse(error, 'Failed to delete trades', 500);
  }
}
