import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/connection';
import { getFMPProvider } from '@/lib/data-providers/fmp';
import {
  TradeService,
  TradeValidationError,
  TradeNotFoundError,
  TradeStateError,
} from '@/lib/portfolio/TradeService';
import { getDemoUserId } from '@/lib/auth/demo-user';
import {
  createErrorResponse,
  createForbiddenResponse,
  checkRateLimit,
  createRateLimitResponse,
  getClientIdentifier,
} from '@/lib/api/utils';

/**
 * Verifies that the trade belongs to the authenticated user.
 * Returns the trade if authorized, null if not found.
 */
async function authorizeTradeAccess(
  tradeService: TradeService,
  tradeId: string,
  userId: string
): Promise<{ authorized: boolean; trade: Awaited<ReturnType<typeof tradeService.getTradeById>> | null }> {
  const trade = await tradeService.getTradeById(tradeId);

  if (!trade) {
    return { authorized: true, trade: null };
  }

  // Verify ownership
  if (trade.userId !== userId) {
    return { authorized: false, trade: null };
  }

  return { authorized: true, trade };
}

/**
 * PATCH /api/trades/[id] - Update or close a trade
 *
 * Request body:
 * - exitPrice: Exit price for closing the trade (triggers close operation)
 * - notes: Trade notes/motivation (for general updates)
 * - fees: Trade fees (for general updates)
 *
 * If exitPrice is provided, the trade will be closed.
 * Otherwise, notes/fees will be updated.
 *
 * Requirements: 10.3, 10.5, 10.6
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`trades:id:patch:${clientId}`, {
    maxRequests: 30,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.resetIn);
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { exitPrice, notes, fees } = body;

    const db = getDatabase();
    const fmpProvider = getFMPProvider();
    const tradeService = new TradeService(db, fmpProvider);

    // Get authenticated user
    const userId = await getDemoUserId();

    // Verify trade ownership before updating
    const { authorized, trade: existingTrade } = await authorizeTradeAccess(
      tradeService,
      id,
      userId
    );

    if (!authorized) {
      return createForbiddenResponse();
    }

    if (!existingTrade) {
      return NextResponse.json(
        {
          success: false,
          error: `Trade not found: ${id}`,
        },
        { status: 404 }
      );
    }

    let trade;

    // If exitPrice is provided, close the trade
    if (exitPrice !== undefined && exitPrice !== null) {
      trade = await tradeService.closeTrade(id, exitPrice);
    } else if (notes !== undefined || fees !== undefined) {
      // Otherwise, update notes/fees
      trade = await tradeService.updateTrade(id, { notes, fees });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid update fields provided. Use exitPrice to close, or notes/fees to update.',
          code: 'NO_FIELDS',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: trade,
    });
  } catch (error) {
    // Handle trade not found with 404
    if (error instanceof TradeNotFoundError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 404 }
      );
    }

    // Handle validation errors with 400
    if (error instanceof TradeValidationError) {
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

    // Handle state errors (e.g., closing already closed trade) with 400
    if (error instanceof TradeStateError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    return createErrorResponse(error, 'Failed to update trade', 500);
  }
}

/**
 * GET /api/trades/[id] - Get a single trade by ID
 *
 * Requirements: 10.6 (returns 404 for non-existent trade)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`trades:id:get:${clientId}`);
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.resetIn);
  }

  try {
    const { id } = await params;
    const db = getDatabase();
    const fmpProvider = getFMPProvider();
    const tradeService = new TradeService(db, fmpProvider);

    // Get authenticated user
    const userId = await getDemoUserId();

    // Verify trade ownership
    const { authorized, trade } = await authorizeTradeAccess(
      tradeService,
      id,
      userId
    );

    if (!authorized) {
      return createForbiddenResponse();
    }

    if (!trade) {
      return NextResponse.json(
        {
          success: false,
          error: `Trade not found: ${id}`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: trade,
    });
  } catch (error) {
    return createErrorResponse(error, 'Failed to fetch trade', 500);
  }
}

/**
 * DELETE /api/trades/[id] - Delete a trade
 *
 * Requirements: 10.7
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`trades:id:delete:${clientId}`, {
    maxRequests: 30,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.resetIn);
  }

  try {
    const { id } = await params;
    const db = getDatabase();
    const fmpProvider = getFMPProvider();
    const tradeService = new TradeService(db, fmpProvider);

    // Get authenticated user
    const userId = await getDemoUserId();

    // Delete the trade (authorization handled by service)
    const deleted = await tradeService.deleteTrade(id, userId);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: `Trade not found: ${id}`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Trade deleted successfully',
    });
  } catch (error) {
    return createErrorResponse(error, 'Failed to delete trade', 500);
  }
}
