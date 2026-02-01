/**
 * Stock Search API Route
 * Endpoint: GET /api/search
 *
 * Searches for stocks by symbol or company name using middleware-based architecture.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  withMiddleware,
  withErrorHandling,
  withRateLimit,
  withValidation,
  withLogging,
  RequestContext,
} from '@/lib/api/middleware';
import { StockSearchQuerySchema } from '@/lib/validation/schemas';
import { getFMPProvider } from '@/lib/data-providers/fmp';

// Supported US stock exchanges
const SUPPORTED_EXCHANGES = ['NASDAQ', 'NYSE', 'AMEX'] as const;

export const GET = withMiddleware(
  withErrorHandling(),
  withRateLimit({ requestsPerMinute: 30 }),
  withValidation(StockSearchQuerySchema, 'query'),
  withLogging(),
  async (req: NextRequest, { validatedData }: RequestContext) => {
    const { q, limit } = validatedData as { q: string; limit: number };

    const fmpProvider = getFMPProvider();
    const searchResults = await fmpProvider.searchStocks(q, limit);

    // Filter for major US exchanges and format results
    const formattedResults = searchResults
      .filter(result =>
        result.exchangeShortName &&
        SUPPORTED_EXCHANGES.includes(result.exchangeShortName.toUpperCase() as typeof SUPPORTED_EXCHANGES[number])
      )
      .map(result => ({
        symbol: result.symbol,
        name: result.name,
        exchange: result.exchangeShortName,
        currency: result.currency,
        type: 'stock',
      }));

    // Return in original format for backward compatibility
    return NextResponse.json({
      success: true,
      data: formattedResults,
      metadata: {
        query: q,
        resultsCount: formattedResults.length,
        timestamp: new Date().toISOString(),
      },
    });
  }
);