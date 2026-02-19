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
import type { PortfolioTransactionType } from '@/types/portfolio';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Valid transaction types for validation
 */
const VALID_TRANSACTION_TYPES: PortfolioTransactionType[] = [
  'BUY',
  'SELL',
  'DEPOSIT',
  'WITHDRAW',
  'DIVIDEND',
];

/**
 * Maximum limits for security
 */
const MAX_TRANSACTIONS_PER_IMPORT = 10000;
const MAX_STRING_LENGTH = 500;
const MAX_SYMBOL_LENGTH = 10;

/**
 * Validates a single transaction object
 */
function validateTransaction(
  tx: unknown,
  index: number
): { valid: true; data: ParsedPortfolioTransaction } | { valid: false; error: CSVValidationError } {
  if (!tx || typeof tx !== 'object') {
    return {
      valid: false,
      error: { row: index + 1, field: '', value: '', message: 'Transaction must be an object' },
    };
  }

  const t = tx as Record<string, unknown>;

  // Validate transactionType (required)
  if (!t.transactionType || typeof t.transactionType !== 'string') {
    return {
      valid: false,
      error: {
        row: index + 1,
        field: 'transactionType',
        value: String(t.transactionType ?? ''),
        message: 'Transaction type is required and must be a string',
      },
    };
  }

  if (!VALID_TRANSACTION_TYPES.includes(t.transactionType as PortfolioTransactionType)) {
    return {
      valid: false,
      error: {
        row: index + 1,
        field: 'transactionType',
        value: t.transactionType,
        message: `Invalid transaction type. Must be one of: ${VALID_TRANSACTION_TYPES.join(', ')}`,
      },
    };
  }

  // Validate totalAmount (required, must be a positive number)
  if (typeof t.totalAmount !== 'number' || !isFinite(t.totalAmount) || t.totalAmount < 0) {
    return {
      valid: false,
      error: {
        row: index + 1,
        field: 'totalAmount',
        value: String(t.totalAmount ?? ''),
        message: 'Total amount must be a non-negative number',
      },
    };
  }

  // Validate transactionDate (required)
  if (!t.transactionDate) {
    return {
      valid: false,
      error: {
        row: index + 1,
        field: 'transactionDate',
        value: '',
        message: 'Transaction date is required',
      },
    };
  }

  // Parse the date
  const parsedDate = new Date(t.transactionDate as string | number | Date);
  if (isNaN(parsedDate.getTime())) {
    return {
      valid: false,
      error: {
        row: index + 1,
        field: 'transactionDate',
        value: String(t.transactionDate),
        message: 'Invalid transaction date format',
      },
    };
  }

  // Validate fees (optional, must be a number if provided)
  const fees = t.fees !== undefined && t.fees !== null ? t.fees : 0;
  if (typeof fees !== 'number' || !isFinite(fees) || fees < 0) {
    return {
      valid: false,
      error: {
        row: index + 1,
        field: 'fees',
        value: String(t.fees ?? ''),
        message: 'Fees must be a non-negative number',
      },
    };
  }

  // For BUY/SELL transactions, validate additional fields
  const isBuySell = t.transactionType === 'BUY' || t.transactionType === 'SELL';

  // Validate symbol
  let symbol: string | null = null;
  if (t.symbol !== null && t.symbol !== undefined) {
    if (typeof t.symbol !== 'string') {
      return {
        valid: false,
        error: {
          row: index + 1,
          field: 'symbol',
          value: String(t.symbol),
          message: 'Symbol must be a string',
        },
      };
    }
    if (t.symbol.length > MAX_SYMBOL_LENGTH) {
      return {
        valid: false,
        error: {
          row: index + 1,
          field: 'symbol',
          value: t.symbol,
          message: `Symbol cannot exceed ${MAX_SYMBOL_LENGTH} characters`,
        },
      };
    }
    symbol = t.symbol.toUpperCase();
  }

  if (isBuySell && !symbol) {
    return {
      valid: false,
      error: {
        row: index + 1,
        field: 'symbol',
        value: '',
        message: 'Symbol is required for BUY/SELL transactions',
      },
    };
  }

  // Validate quantity
  let quantity: number | null = null;
  if (t.quantity !== null && t.quantity !== undefined) {
    if (typeof t.quantity !== 'number' || !isFinite(t.quantity)) {
      return {
        valid: false,
        error: {
          row: index + 1,
          field: 'quantity',
          value: String(t.quantity),
          message: 'Quantity must be a number',
        },
      };
    }
    quantity = t.quantity;
  }

  if (isBuySell && (quantity === null || quantity <= 0)) {
    return {
      valid: false,
      error: {
        row: index + 1,
        field: 'quantity',
        value: String(quantity ?? ''),
        message: 'Quantity is required and must be positive for BUY/SELL transactions',
      },
    };
  }

  // Validate pricePerShare
  let pricePerShare: number | null = null;
  if (t.pricePerShare !== null && t.pricePerShare !== undefined) {
    if (typeof t.pricePerShare !== 'number' || !isFinite(t.pricePerShare)) {
      return {
        valid: false,
        error: {
          row: index + 1,
          field: 'pricePerShare',
          value: String(t.pricePerShare),
          message: 'Price per share must be a number',
        },
      };
    }
    pricePerShare = t.pricePerShare;
  }

  if (isBuySell && (pricePerShare === null || pricePerShare <= 0)) {
    return {
      valid: false,
      error: {
        row: index + 1,
        field: 'pricePerShare',
        value: String(pricePerShare ?? ''),
        message: 'Price per share is required and must be positive for BUY/SELL transactions',
      },
    };
  }

  // Validate notes (optional string)
  let notes: string | undefined;
  if (t.notes !== null && t.notes !== undefined) {
    if (typeof t.notes !== 'string') {
      return {
        valid: false,
        error: {
          row: index + 1,
          field: 'notes',
          value: String(t.notes),
          message: 'Notes must be a string',
        },
      };
    }
    if (t.notes.length > MAX_STRING_LENGTH) {
      notes = t.notes.substring(0, MAX_STRING_LENGTH);
    } else {
      notes = t.notes;
    }
  }

  // Build validated transaction
  const validatedTransaction: ParsedPortfolioTransaction = {
    symbol,
    transactionType: t.transactionType as PortfolioTransactionType,
    quantity,
    pricePerShare,
    totalAmount: t.totalAmount as number,
    fees: fees as number,
    transactionDate: parsedDate,
    notes,
  };

  return { valid: true, data: validatedTransaction };
}

/**
 * Validates the entire request body
 */
function validateRequestBody(body: unknown): {
  valid: boolean;
  transactions?: ParsedPortfolioTransaction[];
  errors?: CSVValidationError[];
} {
  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      errors: [{ row: 0, field: '', value: '', message: 'Request body must be an object' }],
    };
  }

  const b = body as Record<string, unknown>;

  if (!Array.isArray(b.transactions)) {
    return {
      valid: false,
      errors: [{ row: 0, field: 'transactions', value: '', message: 'Transactions must be an array' }],
    };
  }

  if (b.transactions.length === 0) {
    return {
      valid: false,
      errors: [{ row: 0, field: 'transactions', value: '', message: 'No transactions provided' }],
    };
  }

  if (b.transactions.length > MAX_TRANSACTIONS_PER_IMPORT) {
    return {
      valid: false,
      errors: [
        {
          row: 0,
          field: 'transactions',
          value: String(b.transactions.length),
          message: `Too many transactions. Maximum is ${MAX_TRANSACTIONS_PER_IMPORT}`,
        },
      ],
    };
  }

  const validatedTransactions: ParsedPortfolioTransaction[] = [];
  const errors: CSVValidationError[] = [];

  for (let i = 0; i < b.transactions.length; i++) {
    const result = validateTransaction(b.transactions[i], i);
    if (result.valid) {
      validatedTransactions.push(result.data);
    } else {
      errors.push(result.error);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, transactions: validatedTransactions };
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

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
        },
        { status: 400 }
      );
    }

    // Validate request body
    const validation = validateRequestBody(body);
    if (!validation.valid || !validation.transactions) {
      return NextResponse.json(
        {
          success: false,
          imported: 0,
          failed: validation.errors?.length ?? 0,
          errors: validation.errors ?? [],
          error: validation.errors?.[0]?.message ?? 'Validation failed',
        } as CSVImportResult & { error: string },
        { status: 400 }
      );
    }

    const transactions = validation.transactions;

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
