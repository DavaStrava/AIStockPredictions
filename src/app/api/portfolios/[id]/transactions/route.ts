import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/connection';
import { getFMPProvider } from '@/lib/data-providers/fmp';
import {
  PortfolioService,
  PortfolioValidationError,
  PortfolioNotFoundError,
  InsufficientFundsError,
} from '@/lib/portfolio/PortfolioService';
import { PortfolioTransactionType } from '@/types/portfolio';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/portfolios/[id]/transactions - List transactions with optional filtering
 *
 * Query parameters:
 * - type: Filter by transaction type (BUY, SELL, DEPOSIT, WITHDRAW, DIVIDEND)
 * - symbol: Filter by asset symbol
 * - startDate: Filter transactions from this date (ISO string)
 * - endDate: Filter transactions until this date (ISO string)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;

    const db = getDatabase();
    const fmpProvider = getFMPProvider();
    const portfolioService = new PortfolioService(db, fmpProvider);

    // Verify portfolio exists
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

    // Build filters
    const filters: {
      transactionType?: PortfolioTransactionType;
      symbol?: string;
      startDate?: Date;
      endDate?: Date;
    } = {};

    const typeParam = searchParams.get('type');
    if (typeParam) {
      const validTypes = ['BUY', 'SELL', 'DEPOSIT', 'WITHDRAW', 'DIVIDEND'];
      if (!validTypes.includes(typeParam)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid type filter. Must be one of: ${validTypes.join(', ')}`,
          },
          { status: 400 }
        );
      }
      filters.transactionType = typeParam as PortfolioTransactionType;
    }

    const symbol = searchParams.get('symbol');
    if (symbol) {
      filters.symbol = symbol;
    }

    const startDate = searchParams.get('startDate');
    if (startDate) {
      const parsed = new Date(startDate);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid startDate format. Use ISO date string',
          },
          { status: 400 }
        );
      }
      filters.startDate = parsed;
    }

    const endDate = searchParams.get('endDate');
    if (endDate) {
      const parsed = new Date(endDate);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid endDate format. Use ISO date string',
          },
          { status: 400 }
        );
      }
      filters.endDate = parsed;
    }

    const transactions = await portfolioService.getTransactions(id, filters);

    return NextResponse.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error('Portfolio transactions GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch transactions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/portfolios/[id]/transactions - Add a new transaction
 *
 * Request body:
 * - transactionType: 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAW' | 'DIVIDEND' (required)
 * - assetSymbol: Stock symbol (required for BUY/SELL/DIVIDEND)
 * - quantity: Number of shares (required for BUY/SELL)
 * - pricePerShare: Price per share (required for BUY/SELL)
 * - totalAmount: Total transaction amount (required)
 * - fees: Transaction fees (optional)
 * - transactionDate: Date of transaction (required, ISO string)
 * - notes: Transaction notes (optional)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      transactionType,
      assetSymbol,
      quantity,
      pricePerShare,
      totalAmount,
      fees,
      transactionDate,
      notes,
    } = body;

    const db = getDatabase();
    const fmpProvider = getFMPProvider();
    const portfolioService = new PortfolioService(db, fmpProvider);

    // Parse transaction date
    let parsedDate: Date;
    if (transactionDate) {
      parsedDate = new Date(transactionDate);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid transactionDate format. Use ISO date string',
            field: 'transactionDate',
          },
          { status: 400 }
        );
      }
    } else {
      parsedDate = new Date();
    }

    const transaction = await portfolioService.addTransaction({
      portfolioId: id,
      transactionType,
      assetSymbol: assetSymbol?.toUpperCase(),
      quantity,
      pricePerShare,
      totalAmount,
      fees,
      transactionDate: parsedDate,
      notes,
    });

    return NextResponse.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Portfolio transactions POST error:', error);

    if (error instanceof PortfolioNotFoundError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 404 }
      );
    }

    if (error instanceof InsufficientFundsError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: 'INSUFFICIENT_FUNDS',
        },
        { status: 400 }
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

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create transaction',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


