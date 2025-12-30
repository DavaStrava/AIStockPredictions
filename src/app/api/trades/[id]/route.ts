import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/connection';
import { getFMPProvider } from '@/lib/data-providers/fmp';
import {
  TradeService,
  TradeValidationError,
  TradeNotFoundError,
  TradeStateError,
} from '@/lib/portfolio/TradeService';

/**
 * PATCH /api/trades/[id] - Update or close a trade
 * 
 * Request body:
 * - exitPrice: Exit price for closing the trade (required for closing)
 * 
 * Requirements: 10.3, 10.5, 10.6
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { exitPrice } = body;

    const db = getDatabase();
    const fmpProvider = getFMPProvider();
    const tradeService = new TradeService(db, fmpProvider);

    // Currently only supporting closing trades via PATCH
    // exitPrice is required for closing
    if (exitPrice === undefined || exitPrice === null) {
      return NextResponse.json(
        {
          success: false,
          error: 'exitPrice is required to close a trade',
          field: 'exitPrice',
          code: 'REQUIRED',
        },
        { status: 400 }
      );
    }

    const trade = await tradeService.closeTrade(id, exitPrice);

    return NextResponse.json({
      success: true,
      data: trade,
    });
  } catch (error) {
    console.error('Trade PATCH error:', error);

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

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update trade',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
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
  try {
    const { id } = await params;
    const db = getDatabase();
    const fmpProvider = getFMPProvider();
    const tradeService = new TradeService(db, fmpProvider);

    const trade = await tradeService.getTradeById(id);

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
    console.error('Trade GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch trade',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
