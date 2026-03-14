/**
 * Sell Position API Route
 *
 * POST to sell shares from an open position.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/connection';
import { getFMPProvider } from '@/lib/data-providers/fmp';
import {
  PortfolioService,
  PortfolioValidationError,
  PortfolioNotFoundError,
} from '@/lib/portfolio/PortfolioService';
import { getDemoUserId } from '@/lib/auth/demo-user';
import { createForbiddenResponse } from '@/lib/api/utils';

interface RouteParams {
  params: Promise<{ id: string; symbol: string }>;
}

/**
 * POST /api/portfolios/[id]/positions/[symbol]/sell - Sell shares from position
 *
 * Request body:
 * - quantity?: number (if not specified, sells all shares)
 * - pricePerShare: number (required)
 * - fees?: number
 * - transactionDate: string (ISO date, required)
 * - notes?: string
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, symbol } = await params;
    const body = await request.json();

    const db = getDatabase();
    const fmpProvider = getFMPProvider();
    const portfolioService = new PortfolioService(db, fmpProvider);

    // Get authenticated user
    const userId = await getDemoUserId();

    // Verify portfolio exists and belongs to user
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

    // Validate required fields
    if (!body.pricePerShare || typeof body.pricePerShare !== 'number' || body.pricePerShare <= 0) {
      return NextResponse.json(
        { success: false, error: 'pricePerShare is required and must be a positive number' },
        { status: 400 }
      );
    }

    if (!body.transactionDate) {
      return NextResponse.json(
        { success: false, error: 'transactionDate is required' },
        { status: 400 }
      );
    }

    const transactionDate = new Date(body.transactionDate);
    if (isNaN(transactionDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid transactionDate format' },
        { status: 400 }
      );
    }

    // Validate optional fields
    if (body.quantity !== undefined) {
      if (typeof body.quantity !== 'number' || body.quantity <= 0) {
        return NextResponse.json(
          { success: false, error: 'quantity must be a positive number' },
          { status: 400 }
        );
      }
    }

    if (body.fees !== undefined) {
      if (typeof body.fees !== 'number' || body.fees < 0) {
        return NextResponse.json(
          { success: false, error: 'fees must be a non-negative number' },
          { status: 400 }
        );
      }
    }

    // Execute the sell
    const transaction = await portfolioService.sellPosition(id, {
      symbol: symbol.toUpperCase(),
      quantity: body.quantity,
      pricePerShare: body.pricePerShare,
      fees: body.fees,
      transactionDate,
      notes: body.notes,
    });

    return NextResponse.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Sell position error:', error);

    if (error instanceof PortfolioNotFoundError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
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
        error: 'Failed to sell position',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
