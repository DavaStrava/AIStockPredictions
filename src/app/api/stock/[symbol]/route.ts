/**
 * Stock Detail API Route
 *
 * Provides real-time quote data and historical price data for individual stocks.
 * Used by the Stock Detail Page component.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFMPProvider } from '@/lib/data-providers/fmp';
import {
  createErrorResponse,
  checkRateLimit,
  createRateLimitResponse,
  getClientIdentifier,
} from '@/lib/api/utils';
import type {
  StockQuote,
  StockPricePoint,
  MarketStatus,
  StockDetailApiResponse,
  StockDetailTimeRange,
} from '@/types/stock';

interface RouteParams {
  params: Promise<{ symbol: string }>;
}

/**
 * Map time range to FMP API period parameter.
 */
function mapTimeRangeToPeriod(
  range: StockDetailTimeRange
): '1day' | '5day' | '1month' | '6month' | '1year' | '5year' {
  switch (range) {
    case '1D':
      return '1day';
    case '5D':
      return '5day';
    case '1M':
      return '1month';
    case '6M':
      return '6month';
    case 'YTD':
    case '1Y':
      return '1year';
    case '5Y':
    case 'MAX':
      return '5year';
    default:
      return '1year';
  }
}

/**
 * Determine current market status based on time.
 * Note: This is a simplified check for US market hours.
 */
function getMarketStatus(): MarketStatus {
  const now = new Date();
  const nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = nyTime.getDay();
  const hours = nyTime.getHours();
  const minutes = nyTime.getMinutes();
  const time = hours * 60 + minutes;

  // Weekend
  if (day === 0 || day === 6) {
    return 'closed';
  }

  // Market hours: 9:30 AM - 4:00 PM ET
  const marketOpen = 9 * 60 + 30; // 9:30 AM
  const marketClose = 16 * 60; // 4:00 PM

  // Pre-market: 4:00 AM - 9:30 AM ET
  const preMarketOpen = 4 * 60; // 4:00 AM

  // After-hours: 4:00 PM - 8:00 PM ET
  const afterHoursClose = 20 * 60; // 8:00 PM

  if (time >= marketOpen && time < marketClose) {
    return 'open';
  } else if (time >= preMarketOpen && time < marketOpen) {
    return 'pre-market';
  } else if (time >= marketClose && time < afterHoursClose) {
    return 'after-hours';
  }

  return 'closed';
}

/**
 * Filter price history for YTD range.
 */
function filterYTD(priceHistory: StockPricePoint[]): StockPricePoint[] {
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);
  return priceHistory.filter((point) => new Date(point.date) >= startOfYear);
}

/**
 * GET /api/stock/[symbol] - Get stock detail data
 *
 * Query parameters:
 * - period: Time range for historical data (1D, 5D, 1M, 6M, YTD, 1Y, 5Y, MAX)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`stock:get:${clientId}`, {
    maxRequests: 60,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.resetIn);
  }

  try {
    const { symbol } = await params;
    const upperSymbol = symbol.toUpperCase();

    // Validate symbol format (supports standard tickers and class shares like BRK.A, BF-B)
    if (!/^[A-Z]{1,5}([.-][A-Z]{1,2})?$/.test(upperSymbol)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid symbol format. Symbol must be 1-5 letters, optionally followed by a class designator (e.g., AAPL, BRK.A, BF-B).',
        } as StockDetailApiResponse,
        { status: 400 }
      );
    }

    // Get time range from query params
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || '1Y') as StockDetailTimeRange;

    const fmpProvider = getFMPProvider();

    // Fetch quote and historical data in parallel
    const [fmpQuote, historicalData] = await Promise.all([
      fmpProvider.getQuote(upperSymbol),
      fmpProvider.getHistoricalData(upperSymbol, mapTimeRangeToPeriod(period)),
    ]);

    // Transform FMP quote to our StockQuote format
    const quote: StockQuote = {
      symbol: fmpQuote.symbol,
      companyName: fmpQuote.name,
      price: fmpQuote.price,
      change: fmpQuote.change,
      changePercent: fmpQuote.changesPercentage,
      previousClose: fmpQuote.previousClose,
      open: fmpQuote.open,
      dayHigh: fmpQuote.dayHigh,
      dayLow: fmpQuote.dayLow,
      yearHigh: fmpQuote.yearHigh,
      yearLow: fmpQuote.yearLow,
      volume: fmpQuote.volume,
      avgVolume: fmpQuote.avgVolume,
      marketCap: fmpQuote.marketCap,
      pe: fmpQuote.pe || null,
      eps: fmpQuote.eps || null,
      exchange: fmpQuote.exchange,
    };

    // Transform historical data to price points
    let priceHistory: StockPricePoint[] = historicalData.map((point) => ({
      date: point.date.toISOString().split('T')[0],
      price: point.close,
      open: point.open,
      high: point.high,
      low: point.low,
      volume: point.volume,
    }));

    // Apply YTD filter if needed
    if (period === 'YTD') {
      priceHistory = filterYTD(priceHistory);
    }

    const marketStatus = getMarketStatus();

    const response: StockDetailApiResponse = {
      success: true,
      data: {
        quote,
        priceHistory,
        marketStatus,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Stock detail API error:', error);

    // Check for known error types
    if (error instanceof Error) {
      if (error.message.includes('No quote data found')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Symbol not found. Please check the ticker symbol.',
          } as StockDetailApiResponse,
          { status: 404 }
        );
      }
    }

    return createErrorResponse(error, 'Failed to fetch stock data', 500);
  }
}
