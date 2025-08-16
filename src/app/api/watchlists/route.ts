import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/connection';
import { WatchlistService } from '@/lib/database/services/watchlist';

// For demo purposes, we'll use a hardcoded user ID
// In production, this would come from authentication
const DEMO_USER_ID = 'demo-user-123';

export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    const watchlistService = new WatchlistService(db);
    
    const watchlists = await watchlistService.getUserWatchlists(DEMO_USER_ID);
    
    return NextResponse.json({
      success: true,
      data: watchlists,
    });
  } catch (error) {
    console.error('Watchlists GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch watchlists',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    
    const watchlist = await watchlistService.createWatchlist({
      userId: DEMO_USER_ID,
      name: name.trim(),
      description: description?.trim(),
    });
    
    return NextResponse.json({
      success: true,
      data: watchlist,
    });
  } catch (error) {
    console.error('Watchlists POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create watchlist',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}