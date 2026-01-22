import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/connection';
import { WatchlistService } from '@/lib/database/services/watchlist';
import { getDemoUserId } from '@/lib/auth/demo-user';
import {
  createErrorResponse,
  createForbiddenResponse,
  checkRateLimit,
  createRateLimitResponse,
  getClientIdentifier,
} from '@/lib/api/utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Verifies that the watchlist belongs to the authenticated user.
 * Returns the watchlist if authorized, null if not found.
 */
async function authorizeWatchlistAccess(
  watchlistService: WatchlistService,
  watchlistId: string,
  userId: string
): Promise<{ authorized: boolean; watchlist: Awaited<ReturnType<typeof watchlistService.getWatchlist>> | null }> {
  const watchlist = await watchlistService.getWatchlist(watchlistId);

  if (!watchlist) {
    return { authorized: true, watchlist: null };
  }

  // Verify ownership
  if (watchlist.userId !== userId) {
    return { authorized: false, watchlist: null };
  }

  return { authorized: true, watchlist };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`watchlists:id:get:${clientId}`);
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.resetIn);
  }

  try {
    const { id } = await params;
    const db = getDatabase();
    const watchlistService = new WatchlistService(db);

    // Get authenticated user
    const userId = await getDemoUserId();

    // Verify watchlist ownership
    const { authorized, watchlist } = await authorizeWatchlistAccess(
      watchlistService,
      id,
      userId
    );

    if (!authorized) {
      return createForbiddenResponse();
    }

    if (!watchlist) {
      return NextResponse.json(
        {
          success: false,
          error: 'Watchlist not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: watchlist,
    });
  } catch (error) {
    return createErrorResponse(error, 'Failed to fetch watchlist', 500);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`watchlists:id:put:${clientId}`, {
    maxRequests: 30,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.resetIn);
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    const updates: { name?: string; description?: string | null } = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Name must be a non-empty string',
          },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    if (description !== undefined) {
      updates.description = typeof description === 'string' ? description.trim() : null;
    }

    const db = getDatabase();
    const watchlistService = new WatchlistService(db);

    // Get authenticated user
    const userId = await getDemoUserId();

    // Verify watchlist ownership before updating
    const { authorized, watchlist: existingWatchlist } = await authorizeWatchlistAccess(
      watchlistService,
      id,
      userId
    );

    if (!authorized) {
      return createForbiddenResponse();
    }

    if (!existingWatchlist) {
      return NextResponse.json(
        {
          success: false,
          error: 'Watchlist not found',
        },
        { status: 404 }
      );
    }

    const watchlist = await watchlistService.updateWatchlist(id, updates);

    if (!watchlist) {
      return NextResponse.json(
        {
          success: false,
          error: 'Watchlist not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: watchlist,
    });
  } catch (error) {
    return createErrorResponse(error, 'Failed to update watchlist', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`watchlists:id:delete:${clientId}`, {
    maxRequests: 10,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.resetIn);
  }

  try {
    const { id } = await params;
    const db = getDatabase();
    const watchlistService = new WatchlistService(db);

    // Get authenticated user
    const userId = await getDemoUserId();

    // Verify watchlist ownership before deleting
    const { authorized, watchlist } = await authorizeWatchlistAccess(
      watchlistService,
      id,
      userId
    );

    if (!authorized) {
      return createForbiddenResponse();
    }

    if (!watchlist) {
      return NextResponse.json(
        {
          success: false,
          error: 'Watchlist not found',
        },
        { status: 404 }
      );
    }

    const deleted = await watchlistService.deleteWatchlist(id);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Watchlist not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Watchlist deleted successfully',
    });
  } catch (error) {
    return createErrorResponse(error, 'Failed to delete watchlist', 500);
  }
}
