/**
 * Single Transaction API Route
 *
 * GET, PUT, DELETE operations on a specific transaction.
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
  params: Promise<{ id: string; txnId: string }>;
}

/**
 * GET /api/portfolios/[id]/transactions/[txnId] - Get a single transaction
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, txnId } = await params;

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

    // Get the transaction
    const transaction = await portfolioService.getTransactionById(txnId);
    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Verify transaction belongs to this portfolio
    if (transaction.portfolioId !== id) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found in this portfolio' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Transaction GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch transaction',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/portfolios/[id]/transactions/[txnId] - Update a transaction
 *
 * Request body:
 * - transactionDate?: Date
 * - quantity?: number
 * - pricePerShare?: number
 * - fees?: number
 * - notes?: string (trade motivation/rationale)
 * - side?: 'LONG' | 'SHORT'
 * - tradeStatus?: 'OPEN' | 'CLOSED'
 * - exitPrice?: number
 * - exitDate?: Date
 * - settlementDate?: Date
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, txnId } = await params;
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

    // Get existing transaction
    const existing = await portfolioService.getTransactionById(txnId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Verify transaction belongs to this portfolio
    if (existing.portfolioId !== id) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found in this portfolio' },
        { status: 404 }
      );
    }

    // Build update request
    const updateData: Parameters<typeof portfolioService.updateTransaction>[1] = {};

    if (body.transactionDate !== undefined) {
      const parsed = new Date(body.transactionDate);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid transactionDate format' },
          { status: 400 }
        );
      }
      updateData.transactionDate = parsed;
    }

    if (body.quantity !== undefined) {
      if (typeof body.quantity !== 'number' || body.quantity <= 0) {
        return NextResponse.json(
          { success: false, error: 'Quantity must be a positive number' },
          { status: 400 }
        );
      }
      updateData.quantity = body.quantity;
    }

    if (body.pricePerShare !== undefined) {
      if (typeof body.pricePerShare !== 'number' || body.pricePerShare <= 0) {
        return NextResponse.json(
          { success: false, error: 'Price per share must be a positive number' },
          { status: 400 }
        );
      }
      updateData.pricePerShare = body.pricePerShare;
    }

    if (body.fees !== undefined) {
      if (typeof body.fees !== 'number' || body.fees < 0) {
        return NextResponse.json(
          { success: false, error: 'Fees must be a non-negative number' },
          { status: 400 }
        );
      }
      updateData.fees = body.fees;
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    if (body.side !== undefined) {
      if (!['LONG', 'SHORT'].includes(body.side)) {
        return NextResponse.json(
          { success: false, error: 'Side must be LONG or SHORT' },
          { status: 400 }
        );
      }
      updateData.side = body.side;
    }

    if (body.tradeStatus !== undefined) {
      if (!['OPEN', 'CLOSED'].includes(body.tradeStatus)) {
        return NextResponse.json(
          { success: false, error: 'Trade status must be OPEN or CLOSED' },
          { status: 400 }
        );
      }
      updateData.tradeStatus = body.tradeStatus;
    }

    if (body.exitPrice !== undefined) {
      if (typeof body.exitPrice !== 'number' || body.exitPrice <= 0) {
        return NextResponse.json(
          { success: false, error: 'Exit price must be a positive number' },
          { status: 400 }
        );
      }
      updateData.exitPrice = body.exitPrice;
    }

    if (body.exitDate !== undefined) {
      const parsed = new Date(body.exitDate);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid exitDate format' },
          { status: 400 }
        );
      }
      updateData.exitDate = parsed;
    }

    if (body.settlementDate !== undefined) {
      const parsed = new Date(body.settlementDate);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid settlementDate format' },
          { status: 400 }
        );
      }
      updateData.settlementDate = parsed;
    }

    const updated = await portfolioService.updateTransaction(txnId, updateData);

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Transaction PUT error:', error);

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
        error: 'Failed to update transaction',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/portfolios/[id]/transactions/[txnId] - Delete a transaction
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, txnId } = await params;

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

    // Get existing transaction
    const existing = await portfolioService.getTransactionById(txnId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Verify transaction belongs to this portfolio
    if (existing.portfolioId !== id) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found in this portfolio' },
        { status: 404 }
      );
    }

    await portfolioService.deleteTransaction(txnId);

    return NextResponse.json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    console.error('Transaction DELETE error:', error);

    if (error instanceof PortfolioValidationError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete transaction',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
