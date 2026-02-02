/**
 * Trade Service - Database Layer for Trading Journal Management
 *
 * This service implements the Data Access Layer (DAL) pattern for managing
 * trade records, calculating P&L, and aggregating performance statistics.
 *
 * Key Design Patterns Used:
 * - Service Layer Pattern: Encapsulates business logic and database operations
 * - Dependency Injection: DatabaseConnection and FMPDataProvider injected via constructor
 * - Interface Segregation: Clear separation between data models and request DTOs
 */

import { DatabaseConnection } from '../database/connection';
import { FMPDataProvider } from '../data-providers/fmp';
import { PoolClient } from 'pg';
import {
  JournalTrade,
  TradeWithPnL,
  CreateTradeRequest,
  TradeFilters,
  PortfolioStats,
  TradeSide,
  TradeStatus,
} from '@/types/models';

/**
 * Custom error class for trade validation errors.
 */
export class TradeValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'TradeValidationError';
  }
}

/**
 * Custom error class for trade not found errors.
 */
export class TradeNotFoundError extends Error {
  constructor(tradeId: string) {
    super(`Trade not found: ${tradeId}`);
    this.name = 'TradeNotFoundError';
  }
}

/**
 * Custom error class for invalid trade state errors.
 */
export class TradeStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TradeStateError';
  }
}

const VALID_SIDES: TradeSide[] = ['LONG', 'SHORT'];

/**
 * TradeService Class - Core Business Logic for Trading Journal Management
 *
 * This service class provides a high-level interface for all trade-related
 * operations including creation, closure, P&L calculations, and statistics.
 */
export class TradeService {
  /**
   * Creates a new TradeService instance.
   * @param db - Database connection instance for executing queries
   * @param fmpProvider - FMP data provider for fetching current prices
   */
  constructor(
    private db: DatabaseConnection,
    private fmpProvider: FMPDataProvider
  ) {}

  /**
   * Validates a trade creation request.
   * @param data - The trade creation request to validate
   * @throws TradeValidationError if validation fails
   */
  private validateCreateTradeRequest(data: CreateTradeRequest): void {
    // Required fields validation
    if (!data.userId || typeof data.userId !== 'string' || data.userId.trim() === '') {
      throw new TradeValidationError('userId is required', 'userId', 'REQUIRED');
    }

    if (!data.symbol || typeof data.symbol !== 'string' || data.symbol.trim() === '') {
      throw new TradeValidationError('symbol is required', 'symbol', 'REQUIRED');
    }

    if (!data.side) {
      throw new TradeValidationError('side is required', 'side', 'REQUIRED');
    }

    if (!VALID_SIDES.includes(data.side)) {
      throw new TradeValidationError('Side must be LONG or SHORT', 'side', 'INVALID_ENUM');
    }

    // Positive value validation
    if (data.entryPrice === undefined || data.entryPrice === null) {
      throw new TradeValidationError('entryPrice is required', 'entryPrice', 'REQUIRED');
    }

    if (typeof data.entryPrice !== 'number' || !isFinite(data.entryPrice) || data.entryPrice <= 0) {
      throw new TradeValidationError('Entry price must be a positive number', 'entryPrice', 'INVALID_VALUE');
    }

    if (data.quantity === undefined || data.quantity === null) {
      throw new TradeValidationError('quantity is required', 'quantity', 'REQUIRED');
    }

    if (typeof data.quantity !== 'number' || !isFinite(data.quantity) || data.quantity <= 0) {
      throw new TradeValidationError('Quantity must be a positive number', 'quantity', 'INVALID_VALUE');
    }

    // Optional fields validation
    if (data.fees !== undefined && data.fees !== null) {
      if (typeof data.fees !== 'number' || !isFinite(data.fees) || data.fees < 0) {
        throw new TradeValidationError('Fees must be a non-negative number', 'fees', 'INVALID_VALUE');
      }
    }
  }

  /**
   * Creates a new trade record.
   *
   * @param data - The trade creation request containing all trade details
   * @param client - Optional PoolClient for external transaction control (batch imports)
   * @returns Promise resolving to the newly created trade
   * @throws TradeValidationError if validation fails
   */
  async createTrade(data: CreateTradeRequest, client?: PoolClient): Promise<JournalTrade> {
    // Validate input
    this.validateCreateTradeRequest(data);

    const query = `
      INSERT INTO trades (user_id, symbol, side, status, entry_price, quantity, fees, notes, prediction_id)
      VALUES ($1, $2, $3, 'OPEN', $4, $5, $6, $7, $8)
      RETURNING id, user_id, symbol, side, status, entry_price, quantity, entry_date,
                exit_price, exit_date, fees, realized_pnl, notes, prediction_id, created_at, updated_at
    `;

    const params = [
      data.userId,
      data.symbol.toUpperCase(),
      data.side,
      data.entryPrice,
      data.quantity,
      data.fees ?? 0,
      data.notes ?? null,
      data.predictionId ?? null,
    ];

    // Use provided client or default to db.query
    const result = client
      ? await client.query(query, params)
      : await this.db.query(query, params);

    const row = result.rows[0];
    return this.mapRowToTrade(row);
  }

  /**
   * Calculates realized P&L for a closed trade.
   *
   * For LONG trades: (exitPrice - entryPrice) × quantity - fees
   * For SHORT trades: (entryPrice - exitPrice) × quantity - fees
   *
   * @param trade - The trade to calculate P&L for
   * @returns The realized P&L value
   */
  calculateRealizedPnL(trade: JournalTrade): number {
    if (trade.exitPrice === null) {
      return 0;
    }

    const priceDiff =
      trade.side === 'LONG'
        ? trade.exitPrice - trade.entryPrice
        : trade.entryPrice - trade.exitPrice;

    return priceDiff * trade.quantity - trade.fees;
  }

  /**
   * Calculates unrealized P&L for an open trade using current market price.
   *
   * For LONG trades: (currentPrice - entryPrice) × quantity - fees
   * For SHORT trades: (entryPrice - currentPrice) × quantity - fees
   *
   * @param trade - The trade to calculate P&L for
   * @param currentPrice - The current market price
   * @returns The unrealized P&L value
   */
  calculateUnrealizedPnL(trade: JournalTrade, currentPrice: number): number {
    const priceDiff =
      trade.side === 'LONG'
        ? currentPrice - trade.entryPrice
        : trade.entryPrice - currentPrice;

    return priceDiff * trade.quantity - trade.fees;
  }

  /**
   * Closes an open trade with the specified exit price.
   *
   * @param tradeId - The ID of the trade to close
   * @param exitPrice - The exit price for the trade
   * @param client - Optional PoolClient for external transaction control (batch imports)
   * @returns Promise resolving to the updated trade
   * @throws TradeNotFoundError if trade doesn't exist
   * @throws TradeStateError if trade is already closed
   * @throws TradeValidationError if exitPrice is invalid
   */
  async closeTrade(tradeId: string, exitPrice: number, client?: PoolClient): Promise<JournalTrade> {
    // Validate exit price
    if (typeof exitPrice !== 'number' || !isFinite(exitPrice) || exitPrice <= 0) {
      throw new TradeValidationError('Exit price must be a positive number', 'exitPrice', 'INVALID_VALUE');
    }

    // Get the existing trade
    const existingTrade = await this.getTradeById(tradeId, client);
    if (!existingTrade) {
      throw new TradeNotFoundError(tradeId);
    }

    if (existingTrade.status === 'CLOSED') {
      throw new TradeStateError('Trade is already closed');
    }

    // Calculate realized P&L
    const tradeWithExit = { ...existingTrade, exitPrice };
    const realizedPnl = this.calculateRealizedPnL(tradeWithExit);

    const query = `
      UPDATE trades
      SET status = 'CLOSED', exit_price = $1, exit_date = CURRENT_TIMESTAMP, realized_pnl = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, user_id, symbol, side, status, entry_price, quantity, entry_date,
                exit_price, exit_date, fees, realized_pnl, notes, prediction_id, created_at, updated_at
    `;

    const params = [exitPrice, realizedPnl, tradeId];
    const result = client
      ? await client.query(query, params)
      : await this.db.query(query, params);

    return this.mapRowToTrade(result.rows[0]);
  }

  /**
   * Gets a single trade by ID.
   *
   * @param tradeId - The ID of the trade to retrieve
   * @param client - Optional PoolClient for external transaction control
   * @returns Promise resolving to the trade or null if not found
   */
  async getTradeById(tradeId: string, client?: PoolClient): Promise<JournalTrade | null> {
    const query = `
      SELECT id, user_id, symbol, side, status, entry_price, quantity, entry_date,
             exit_price, exit_date, fees, realized_pnl, notes, prediction_id, created_at, updated_at
      FROM trades
      WHERE id = $1
    `;

    const result = client
      ? await client.query(query, [tradeId])
      : await this.db.query(query, [tradeId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToTrade(result.rows[0]);
  }

  /**
   * Gets all trades for a user with optional filtering.
   *
   * @param userId - The ID of the user
   * @param filters - Optional filters for status, symbol, date range
   * @returns Promise resolving to array of trades with P&L data
   */
  async getUserTrades(userId: string, filters?: TradeFilters): Promise<TradeWithPnL[]> {
    let query = `
      SELECT id, user_id, symbol, side, status, entry_price, quantity, entry_date,
             exit_price, exit_date, fees, realized_pnl, notes, prediction_id, created_at, updated_at
      FROM trades
      WHERE user_id = $1
    `;

    const params: (string | Date)[] = [userId];
    let paramIndex = 2;

    // Apply filters
    if (filters?.status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters?.symbol) {
      query += ` AND symbol = $${paramIndex++}`;
      params.push(filters.symbol.toUpperCase());
    }

    if (filters?.startDate) {
      query += ` AND entry_date >= $${paramIndex++}`;
      params.push(filters.startDate);
    }

    if (filters?.endDate) {
      query += ` AND entry_date <= $${paramIndex++}`;
      params.push(filters.endDate);
    }

    query += ' ORDER BY entry_date DESC';

    const result = await this.db.query(query, params);
    const trades: JournalTrade[] = result.rows.map((row: Record<string, unknown>) => this.mapRowToTrade(row));

    // Fetch current prices for open trades
    const openTrades = trades.filter((t: JournalTrade) => t.status === 'OPEN');
    const tradesWithPnL: TradeWithPnL[] = [];

    if (openTrades.length > 0) {
      const symbols: string[] = [...new Set(openTrades.map((t: JournalTrade) => t.symbol))];
      let priceMap: Map<string, number> = new Map();

      try {
        const quotes = await this.fmpProvider.getMultipleQuotes(symbols);
        priceMap = new Map(quotes.map((q) => [q.symbol, q.price]));
      } catch (error) {
        // FMP API failure - trades will be returned without unrealized P&L
        console.error('Failed to fetch current prices:', error);
      }

      for (const trade of trades) {
        const tradeWithPnL: TradeWithPnL = { ...trade };

        if (trade.status === 'OPEN') {
          const currentPrice = priceMap.get(trade.symbol);
          if (currentPrice !== undefined) {
            tradeWithPnL.currentPrice = currentPrice;
            tradeWithPnL.unrealizedPnl = this.calculateUnrealizedPnL(trade, currentPrice);
          } else {
            tradeWithPnL.pnlError = 'Unable to fetch current price';
          }
        }

        tradesWithPnL.push(tradeWithPnL);
      }
    } else {
      // No open trades, just return closed trades as-is
      for (const trade of trades) {
        tradesWithPnL.push({ ...trade });
      }
    }

    return tradesWithPnL;
  }

  /**
   * Calculates portfolio statistics for a user.
   *
   * @param userId - The ID of the user
   * @returns Promise resolving to portfolio statistics
   */
  async getPortfolioStats(userId: string): Promise<PortfolioStats> {
    const trades = await this.getUserTrades(userId);

    const openTrades = trades.filter((t) => t.status === 'OPEN');
    const closedTrades = trades.filter((t) => t.status === 'CLOSED');

    // Calculate total realized P&L
    const totalRealizedPnl = closedTrades.reduce((sum, t) => sum + (t.realizedPnl ?? 0), 0);

    // Calculate total unrealized P&L
    const totalUnrealizedPnl = openTrades.reduce((sum, t) => sum + (t.unrealizedPnl ?? 0), 0);

    // Calculate win rate and averages
    let winRate: number | null = null;
    let avgWin: number | null = null;
    let avgLoss: number | null = null;
    let bestTrade: number | null = null;
    let worstTrade: number | null = null;

    if (closedTrades.length > 0) {
      const winningTrades = closedTrades.filter((t: TradeWithPnL) => (t.realizedPnl ?? 0) > 0);
      const losingTrades = closedTrades.filter((t: TradeWithPnL) => (t.realizedPnl ?? 0) < 0);

      winRate = winningTrades.length / closedTrades.length;

      if (winningTrades.length > 0) {
        avgWin = winningTrades.reduce((sum: number, t: TradeWithPnL) => sum + (t.realizedPnl ?? 0), 0) / winningTrades.length;
      }

      if (losingTrades.length > 0) {
        avgLoss = losingTrades.reduce((sum: number, t: TradeWithPnL) => sum + (t.realizedPnl ?? 0), 0) / losingTrades.length;
      }

      const pnlValues: number[] = closedTrades.map((t: TradeWithPnL) => t.realizedPnl ?? 0);
      bestTrade = Math.max(...pnlValues);
      worstTrade = Math.min(...pnlValues);
    }

    return {
      totalRealizedPnl,
      totalUnrealizedPnl,
      totalTrades: trades.length,
      openTrades: openTrades.length,
      closedTrades: closedTrades.length,
      winRate,
      avgWin,
      avgLoss,
      bestTrade,
      worstTrade,
    };
  }

  /**
   * Maps a database row to a JournalTrade object.
   */
  private mapRowToTrade(row: Record<string, unknown>): JournalTrade {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      symbol: row.symbol as string,
      side: row.side as TradeSide,
      status: row.status as TradeStatus,
      entryPrice: parseFloat(row.entry_price as string),
      quantity: parseFloat(row.quantity as string),
      entryDate: new Date(row.entry_date as string),
      exitPrice: row.exit_price ? parseFloat(row.exit_price as string) : null,
      exitDate: row.exit_date ? new Date(row.exit_date as string) : null,
      fees: parseFloat(row.fees as string) || 0,
      realizedPnl: row.realized_pnl ? parseFloat(row.realized_pnl as string) : null,
      notes: (row.notes as string) || null,
      predictionId: (row.prediction_id as string) || null,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }
}

// Singleton instance
let tradeServiceInstance: TradeService | null = null;

/**
 * Gets the singleton TradeService instance.
 * @param db - Database connection instance
 * @param fmpProvider - FMP data provider instance
 * @returns The shared TradeService instance
 */
export function getTradeService(db: DatabaseConnection, fmpProvider: FMPDataProvider): TradeService {
  if (!tradeServiceInstance) {
    tradeServiceInstance = new TradeService(db, fmpProvider);
  }
  return tradeServiceInstance;
}
