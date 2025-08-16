import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/connection';
import { WatchlistService } from '@/lib/database/services/watchlist';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { symbol } = body;
    
    if (!symbol || typeof symbol !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Symbol is required and must be a string',
        },
        { status: 400 }
      );
    }
    
    // Basic symbol validation
    const cleanSymbol = symbol.trim().toUpperCase();
    if (!/^[A-Z]{1,5}$/.test(cleanSymbol)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid symbol format. Must be 1-5 uppercase letters.',
        },
        { status: 400 }
      );
    }
    
    const db = getDatabase();
    const watchlistService = new WatchlistService(db);
    
    // Check if watchlist exists
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
    
    const stock = await watchlistService.addStockToWatchlist({
      watchlistId: params.id,
      symbol: cleanSymbol,
    });
    
    return NextResponse.json({
      success: true,
      data: stock,
    });
  } catch (error) {
    console.error('Add stock error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add stock to watchlist',
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
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    
    if (!symbol) {
      return NextResponse.json(
        {
          success: false,
          error: 'Symbol parameter is required',
        },
        { status: 400 }
      );
    }
    
    const db = getDatabase();
    const watchlistService = new WatchlistService(db);
    
    const removed = await watchlistService.removeStockFromWatchlist(params.id, symbol);
    
    if (!removed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Stock not found in watchlist',
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Stock removed from watchlist successfully',
    });
  } catch (error) {
    console.error('Remove stock error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to remove stock from watchlist',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}