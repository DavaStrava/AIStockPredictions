import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/connection';
import { WatchlistService } from '@/lib/database/services/watchlist';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDatabase();
    const watchlistService = new WatchlistService(db);
    
    const watchlist = await watchlistService.getWatchlist(params.id);
    
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
    console.error('Watchlist GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch watchlist',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description } = body;
    
    const updates: { name?: string; description?: string } = {};
    
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
    
    const watchlist = await watchlistService.updateWatchlist(params.id, updates);
    
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
    console.error('Watchlist PUT error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update watchlist',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDatabase();
    const watchlistService = new WatchlistService(db);
    
    const deleted = await watchlistService.deleteWatchlist(params.id);
    
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
    console.error('Watchlist DELETE error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete watchlist',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}