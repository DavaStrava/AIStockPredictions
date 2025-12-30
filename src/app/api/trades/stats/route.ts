import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/connection';
import { getFMPProvider } from '@/lib/data-providers/fmp';
import { TradeService } from '@/lib/portfolio/TradeService';
import { getDemoUserId } from '@/lib/auth/demo-user';

/**
 * GET /api/trades/stats - Get portfolio statistics for the authenticated user
 * 
 * Returns:
 * - totalRealizedPnl: Sum of realized P&L from all closed trades
 * - totalUnrealizedPnl: Sum of unrealized P&L from all open trades
 * - totalTrades: Total number of trades
 * - openTrades: Number of open trades
 * - closedTrades: Number of closed trades
 * - winRate: Percentage of profitable closed trades (null if no closed trades)
 * - avgWin: Average profit per winning trade (null if no winning trades)
 * - avgLoss: Average loss per losing trade (null if no losing trades)
 * - bestTrade: Highest realized P&L (null if no closed trades)
 * - worstTrade: Lowest realized P&L (null if no closed trades)
 * 
 * Requirements: 10.4
 */
export async function GET() {
  try {
    const db = getDatabase();
    
    // Check database health first
    const isHealthy = await db.healthCheck();
    if (!isHealthy) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database connection unavailable',
          details: 'Please ensure the database is running and migrations have been applied. Run: npm run db:setup',
        },
        { status: 503 }
      );
    }
    
    const fmpProvider = getFMPProvider();
    const tradeService = new TradeService(db, fmpProvider);

    const userId = await getDemoUserId();

    const stats = await tradeService.getPortfolioStats(userId);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Trades stats GET error:', error);
    
    // Provide more specific error messages
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    let userFriendlyError = 'Failed to fetch portfolio statistics';
    let statusCode = 500;
    
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('connection')) {
      userFriendlyError = 'Database connection failed';
      statusCode = 503;
    } else if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
      userFriendlyError = 'Database tables not found. Please run migrations: npm run db:migrate';
      statusCode = 503;
    } else if (errorMessage.includes('Authentication service unavailable')) {
      userFriendlyError = 'User authentication failed. Database may not be properly configured.';
      statusCode = 503;
    }
    
    return NextResponse.json(
      {
        success: false,
        error: userFriendlyError,
        details: errorMessage,
      },
      { status: statusCode }
    );
  }
}
