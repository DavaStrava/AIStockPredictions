import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/connection';
import { WatchlistService } from '@/lib/database/services/watchlist';
import { getDemoUserId } from '@/lib/auth/demo-user';
import {
  createErrorResponse,
  checkRateLimit,
  createRateLimitResponse,
  getClientIdentifier,
} from '@/lib/api/utils';

export async function GET(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`watchlists:get:${clientId}`);
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.resetIn);
  }

  try {
    const db = getDatabase();
    const watchlistService = new WatchlistService(db);

    const userId = await getDemoUserId();
    const watchlists = await watchlistService.getUserWatchlists(userId);

    return NextResponse.json({
      success: true,
      data: watchlists,
    });
  } catch (error) {
    return createErrorResponse(error, 'Failed to fetch watchlists', 500);
  }
}

export async function POST(request: NextRequest) {
  // Rate limiting (stricter for write operations)
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`watchlists:post:${clientId}`, {
    maxRequests: 20,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.resetIn);
  }

  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Name is required and must be a string',
        },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const watchlistService = new WatchlistService(db);

    const userId = await getDemoUserId();
    const watchlist = await watchlistService.createWatchlist({
      userId,
      name: name.trim(),
      description: description?.trim(),
    });

    return NextResponse.json({
      success: true,
      data: watchlist,
    });
  } catch (error) {
    return createErrorResponse(error, 'Failed to create watchlist', 500);
  }
}
