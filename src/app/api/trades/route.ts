import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/connection';
import { getFMPProvider } from '@/lib/data-providers/fmp';
import { TradeService, TradeValidationError } from '@/lib/portfolio/TradeService';
import { TradeFilters, TradeStatus } from '@/types/models';
import { getDemoUserId } from '@/lib/auth/demo-user';

/**
 * GET /api/trades - Fetch all trades for the authenticated user
 * 
 * Query parameters:
 * - status: Filter by trade status (OPEN or CLOSED)
 * - symbol: Filter by stock symbol
 * - startDate: Filter trades from this date (ISO string)
 * - endDate: Filter trades until this date (ISO string)
 * 
 * Requirements: 10.1
 */
export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    const fmpProvider = getFMPProvider();
    const tradeService = new TradeService(db, fmpProvider);

    // Parse query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const filters: TradeFilters = {};

    const status = searchParams.get('status');
    if (status) {
      if (status !== 'OPEN' && status !== 'CLOSED') {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid status filter. Must be OPEN or CLOSED',
          },
          { status: 400 }
        );
      }
      filters.status = status as TradeStatus;
    }

    const symbol = searchParams.get('symbol');
    if (symbol) {
      filters.symbol = symbol;
    }

    const startDate = searchParams.get('startDate');
    if (startDate) {
      const parsedDate = new Date(startDate);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid startDate format. Use ISO date string',
          },
          { status: 400 }
        );
      }
      filters.startDate = parsedDate;
    }

    const endDate = searchParams.get('endDate');
    if (endDate) {
      const parsedDate = new Date(endDate);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid endDate format. Use ISO date string',
          },
          { status: 400 }
        );
      }
      filters.endDate = parsedDate;
    }

    const userId = await getDemoUserId();
    const trades = await tradeService.getUserTrades(userId, filters);

    return NextResponse.json({
      success: true,
      data: trades,
    });
  } catch (error) {
    console.error('Trades GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch trades',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/trades - Create a new trade
 * 
 * Request body:
 * - symbol: Stock ticker symbol (required)
 * - side: Trade side - LONG or SHORT (required)
 * - entryPrice: Entry price (required, positive number)
 * - quantity: Number of shares (required, positive number)
 * - fees: Trading fees (optional, non-negative number)
 * - notes: Trade notes (optional)
 * - predictionId: ID of the prediction that inspired this trade (optional)
 * 
 * Requirements: 10.2, 10.5
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, side, entryPrice, quantity, fees, notes, predictionId } = body;

    const db = getDatabase();
    const fmpProvider = getFMPProvider();
    const tradeService = new TradeService(db, fmpProvider);

    const userId = await getDemoUserId();

    const trade = await tradeService.createTrade({
      userId,
      symbol,
      side,
      entryPrice,
      quantity,
      fees,
      notes,
      predictionId,
    });

    return NextResponse.json({
      success: true,
      data: trade,
    });
  } catch (error) {
    console.error('Trades POST error:', error);

    // Handle validation errors with 400 status
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

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create trade',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
