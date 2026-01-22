/**
 * Portfolio Service - Business Logic for Investment Portfolio Management
 *
 * This service implements the core portfolio management functionality including:
 * - Portfolio CRUD operations
 * - Transaction logging (BUY, SELL, DEPOSIT, WITHDRAW, DIVIDEND)
 * - Holdings cache management with real-time valuation
 * - Performance calculations and benchmarking
 *
 * Key Design Patterns:
 * - Service Layer Pattern: Encapsulates business logic and database operations
 * - Dependency Injection: DatabaseConnection and FMPDataProvider injected
 * - FIFO/Weighted Average: Cost basis calculation support
 */

import { DatabaseConnection } from '../database/connection';
import { FMPDataProvider, FMPQuote } from '../data-providers/fmp';
import {
  Portfolio,
  PortfolioTransaction,
  PortfolioHolding,
  HoldingWithMarketData,
  PortfolioSummary,
  SectorAllocation,
  BenchmarkDataPoint,
  RebalanceSuggestion,
  CreatePortfolioRequest,
  UpdatePortfolioRequest,
  CreateTransactionRequest,
  TransactionFilters,
  PerformanceHistoryFilters,
  PortfolioDailyPerformance,
} from '@/types/portfolio';

/**
 * Custom error for portfolio validation failures.
 */
export class PortfolioValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'PortfolioValidationError';
  }
}

/**
 * Custom error for portfolio not found.
 */
export class PortfolioNotFoundError extends Error {
  constructor(portfolioId: string) {
    super(`Portfolio not found: ${portfolioId}`);
    this.name = 'PortfolioNotFoundError';
  }
}

/**
 * Custom error for insufficient funds.
 */
export class InsufficientFundsError extends Error {
  constructor(required: number, available: number) {
    super(`Insufficient funds: required ${required}, available ${available}`);
    this.name = 'InsufficientFundsError';
  }
}

/**
 * PortfolioService - Core business logic for portfolio management.
 */
export class PortfolioService {
  constructor(
    private db: DatabaseConnection,
    private fmpProvider: FMPDataProvider
  ) {}

  // ============================================================================
  // Portfolio CRUD Operations
  // ============================================================================

  /**
   * Creates a new portfolio for a user.
   */
  async createPortfolio(data: CreatePortfolioRequest): Promise<Portfolio> {
    this.validateCreatePortfolioRequest(data);

    // If this is set as default, unset any existing default
    if (data.isDefault) {
      await this.db.query(
        'UPDATE portfolios SET is_default = FALSE WHERE user_id = $1',
        [data.userId]
      );
    }

    const query = `
      INSERT INTO portfolios (user_id, name, description, currency, is_default)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id, name, description, currency, is_default, created_at, updated_at
    `;

    const result = await this.db.query(query, [
      data.userId,
      data.name,
      data.description ?? null,
      data.currency ?? 'USD',
      data.isDefault ?? false,
    ]);

    return this.mapRowToPortfolio(result.rows[0]);
  }

  /**
   * Gets a portfolio by ID.
   */
  async getPortfolioById(portfolioId: string): Promise<Portfolio | null> {
    const query = `
      SELECT id, user_id, name, description, currency, is_default, created_at, updated_at
      FROM portfolios WHERE id = $1
    `;

    const result = await this.db.query(query, [portfolioId]);
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToPortfolio(result.rows[0]);
  }

  /**
   * Gets all portfolios for a user.
   */
  async getUserPortfolios(userId: string): Promise<Portfolio[]> {
    const query = `
      SELECT id, user_id, name, description, currency, is_default, created_at, updated_at
      FROM portfolios 
      WHERE user_id = $1
      ORDER BY is_default DESC, created_at ASC
    `;

    const result = await this.db.query(query, [userId]);
    return result.rows.map((row: Record<string, unknown>) => this.mapRowToPortfolio(row));
  }

  /**
   * Updates a portfolio.
   */
  async updatePortfolio(portfolioId: string, data: UpdatePortfolioRequest): Promise<Portfolio> {
    const portfolio = await this.getPortfolioById(portfolioId);
    if (!portfolio) {
      throw new PortfolioNotFoundError(portfolioId);
    }

    // If setting as default, unset others
    if (data.isDefault) {
      await this.db.query(
        'UPDATE portfolios SET is_default = FALSE WHERE user_id = $1 AND id != $2',
        [portfolio.userId, portfolioId]
      );
    }

    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(data.description);
    }
    if (data.currency !== undefined) {
      updates.push(`currency = $${paramIndex++}`);
      params.push(data.currency);
    }
    if (data.isDefault !== undefined) {
      updates.push(`is_default = $${paramIndex++}`);
      params.push(data.isDefault);
    }

    if (updates.length === 0) {
      return portfolio;
    }

    params.push(portfolioId);
    const query = `
      UPDATE portfolios 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, user_id, name, description, currency, is_default, created_at, updated_at
    `;

    const result = await this.db.query(query, params);
    return this.mapRowToPortfolio(result.rows[0]);
  }

  /**
   * Deletes a portfolio and all associated data.
   */
  async deletePortfolio(portfolioId: string): Promise<void> {
    const portfolio = await this.getPortfolioById(portfolioId);
    if (!portfolio) {
      throw new PortfolioNotFoundError(portfolioId);
    }

    await this.db.query('DELETE FROM portfolios WHERE id = $1', [portfolioId]);
  }

  // ============================================================================
  // Transaction Management
  // ============================================================================

  /**
   * Adds a transaction to a portfolio.
   * Automatically updates the holdings cache after the transaction.
   */
  async addTransaction(data: CreateTransactionRequest): Promise<PortfolioTransaction> {
    this.validateTransactionRequest(data);

    const portfolio = await this.getPortfolioById(data.portfolioId);
    if (!portfolio) {
      throw new PortfolioNotFoundError(data.portfolioId);
    }

    // For BUY transactions, check if we have enough cash
    if (data.transactionType === 'BUY') {
      const cashBalance = await this.getCashBalance(data.portfolioId);
      const requiredAmount = Math.abs(data.totalAmount) + (data.fees ?? 0);
      if (cashBalance < requiredAmount) {
        throw new InsufficientFundsError(requiredAmount, cashBalance);
      }
    }

    // For SELL transactions, check if we have enough shares
    if (data.transactionType === 'SELL' && data.assetSymbol && data.quantity) {
      const holding = await this.getHolding(data.portfolioId, data.assetSymbol);
      if (!holding || holding.quantity < data.quantity) {
        throw new PortfolioValidationError(
          `Insufficient shares of ${data.assetSymbol}`,
          'quantity',
          'INSUFFICIENT_SHARES'
        );
      }
    }

    // Calculate total_amount based on transaction type
    let totalAmount = data.totalAmount;
    if (data.transactionType === 'BUY') {
      // BUY: cash goes out (negative)
      totalAmount = -Math.abs(data.totalAmount) - (data.fees ?? 0);
    } else if (data.transactionType === 'SELL') {
      // SELL: cash comes in (positive)
      totalAmount = Math.abs(data.totalAmount) - (data.fees ?? 0);
    } else if (data.transactionType === 'DEPOSIT' || data.transactionType === 'DIVIDEND') {
      // DEPOSIT/DIVIDEND: cash comes in (positive)
      totalAmount = Math.abs(data.totalAmount);
    } else if (data.transactionType === 'WITHDRAW') {
      // WITHDRAW: cash goes out (negative)
      totalAmount = -Math.abs(data.totalAmount);
    }

    const query = `
      INSERT INTO portfolio_transactions (
        portfolio_id, asset_symbol, transaction_type, quantity, 
        price_per_share, fees, total_amount, transaction_date, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, portfolio_id, asset_symbol, transaction_type, quantity,
                price_per_share, fees, total_amount, transaction_date, notes,
                created_at, updated_at
    `;

    const result = await this.db.query(query, [
      data.portfolioId,
      data.assetSymbol ?? null,
      data.transactionType,
      data.quantity ?? null,
      data.pricePerShare ?? null,
      data.fees ?? 0,
      totalAmount,
      data.transactionDate,
      data.notes ?? null,
    ]);

    const transaction = this.mapRowToTransaction(result.rows[0]);

    // Update holdings cache if this affects holdings
    if (data.transactionType === 'BUY' || data.transactionType === 'SELL') {
      await this.updateHoldingsCache(data.portfolioId, data.assetSymbol!);
    }

    return transaction;
  }

  /**
   * Gets transactions for a portfolio with optional filtering.
   */
  async getTransactions(
    portfolioId: string,
    filters?: TransactionFilters
  ): Promise<PortfolioTransaction[]> {
    let query = `
      SELECT id, portfolio_id, asset_symbol, transaction_type, quantity,
             price_per_share, fees, total_amount, transaction_date, notes,
             created_at, updated_at
      FROM portfolio_transactions
      WHERE portfolio_id = $1
    `;

    const params: unknown[] = [portfolioId];
    let paramIndex = 2;

    if (filters?.transactionType) {
      query += ` AND transaction_type = $${paramIndex++}`;
      params.push(filters.transactionType);
    }

    if (filters?.symbol) {
      query += ` AND asset_symbol = $${paramIndex++}`;
      params.push(filters.symbol.toUpperCase());
    }

    if (filters?.startDate) {
      query += ` AND transaction_date >= $${paramIndex++}`;
      params.push(filters.startDate);
    }

    if (filters?.endDate) {
      query += ` AND transaction_date <= $${paramIndex++}`;
      params.push(filters.endDate);
    }

    query += ' ORDER BY transaction_date DESC';

    const result = await this.db.query(query, params);
    return result.rows.map((row: Record<string, unknown>) => this.mapRowToTransaction(row));
  }

  // ============================================================================
  // Holdings Management
  // ============================================================================

  /**
   * Gets the current cash balance for a portfolio.
   */
  async getCashBalance(portfolioId: string): Promise<number> {
    const query = `
      SELECT COALESCE(SUM(total_amount), 0) as cash_balance
      FROM portfolio_transactions
      WHERE portfolio_id = $1
    `;

    const result = await this.db.query(query, [portfolioId]);
    return parseFloat(result.rows[0].cash_balance) || 0;
  }

  /**
   * Gets a single holding from the cache.
   */
  async getHolding(portfolioId: string, symbol: string): Promise<PortfolioHolding | null> {
    const query = `
      SELECT id, portfolio_id, symbol, quantity, average_cost_basis,
             total_cost_basis, target_allocation_percent, sector,
             first_purchase_date, last_transaction_date, created_at, updated_at
      FROM portfolio_holdings
      WHERE portfolio_id = $1 AND symbol = $2
    `;

    const result = await this.db.query(query, [portfolioId, symbol.toUpperCase()]);
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToHolding(result.rows[0]);
  }

  /**
   * Gets all holdings for a portfolio from the cache.
   */
  async getHoldings(portfolioId: string): Promise<PortfolioHolding[]> {
    const query = `
      SELECT id, portfolio_id, symbol, quantity, average_cost_basis,
             total_cost_basis, target_allocation_percent, sector,
             first_purchase_date, last_transaction_date, created_at, updated_at
      FROM portfolio_holdings
      WHERE portfolio_id = $1
      ORDER BY symbol
    `;

    const result = await this.db.query(query, [portfolioId]);
    return result.rows.map((row: Record<string, unknown>) => this.mapRowToHolding(row));
  }

  /**
   * Gets holdings with real-time market data merged.
   * Includes price status indicator to show when price data is unavailable.
   */
  async getHoldingsWithMarketData(portfolioId: string): Promise<HoldingWithMarketData[]> {
    const holdings = await this.getHoldings(portfolioId);

    if (holdings.length === 0) {
      return [];
    }

    // Fetch real-time quotes for all holdings
    const symbols = holdings.map((h) => h.symbol);
    let quotes: FMPQuote[] = [];
    let fetchError: Error | null = null;

    try {
      quotes = await this.fmpProvider.getMultipleQuotes(symbols);
    } catch (error) {
      console.error('Failed to fetch market data for holdings:', error);
      fetchError = error instanceof Error ? error : new Error('Unknown error');
    }

    const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));

    // Calculate total market value for weight calculation
    let totalMarketValue = 0;
    const enrichedHoldings: HoldingWithMarketData[] = [];

    for (const holding of holdings) {
      const quote = quoteMap.get(holding.symbol);
      const hasQuoteData = quote !== undefined && quote.price > 0;
      const currentPrice = hasQuoteData ? quote.price : 0;
      const marketValue = holding.quantity * currentPrice;
      totalMarketValue += marketValue;

      // Determine price status and message
      let priceStatus: 'live' | 'unavailable';
      let priceStatusMessage: string | undefined;

      if (hasQuoteData) {
        priceStatus = 'live';
      } else {
        priceStatus = 'unavailable';
        if (fetchError) {
          priceStatusMessage = 'Market data temporarily unavailable';
        } else {
          priceStatusMessage = `No market data for ${holding.symbol}`;
        }
      }

      enrichedHoldings.push({
        ...holding,
        currentPrice,
        marketValue,
        portfolioWeight: 0, // Will be calculated after we have totalMarketValue
        driftPercent: null,
        dayChange: (quote?.change ?? 0) * holding.quantity,
        dayChangePercent: quote?.changesPercentage ?? 0,
        totalGainLoss: marketValue - holding.totalCostBasis,
        totalGainLossPercent:
          holding.totalCostBasis > 0
            ? ((marketValue - holding.totalCostBasis) / holding.totalCostBasis) * 100
            : 0,
        previousClose: quote?.previousClose ?? currentPrice,
        companyName: quote?.name,
        priceStatus,
        priceStatusMessage,
      });
    }

    // Calculate portfolio weights and drift
    for (const holding of enrichedHoldings) {
      holding.portfolioWeight =
        totalMarketValue > 0 ? (holding.marketValue / totalMarketValue) * 100 : 0;

      if (holding.targetAllocationPercent !== null) {
        holding.driftPercent = holding.portfolioWeight - holding.targetAllocationPercent;
      }
    }

    return enrichedHoldings;
  }

  /**
   * Updates the target allocation for a holding.
   */
  async updateHoldingTarget(
    portfolioId: string,
    symbol: string,
    targetAllocationPercent: number | null
  ): Promise<PortfolioHolding> {
    const holding = await this.getHolding(portfolioId, symbol);
    if (!holding) {
      throw new PortfolioValidationError(`Holding not found: ${symbol}`, 'symbol', 'NOT_FOUND');
    }

    const query = `
      UPDATE portfolio_holdings
      SET target_allocation_percent = $1
      WHERE portfolio_id = $2 AND symbol = $3
      RETURNING id, portfolio_id, symbol, quantity, average_cost_basis,
                total_cost_basis, target_allocation_percent, sector,
                first_purchase_date, last_transaction_date, created_at, updated_at
    `;

    const result = await this.db.query(query, [targetAllocationPercent, portfolioId, symbol]);
    return this.mapRowToHolding(result.rows[0]);
  }

  /**
   * Updates the holdings cache for a specific symbol after a transaction.
   * Uses weighted average cost basis calculation.
   */
  private async updateHoldingsCache(portfolioId: string, symbol: string): Promise<void> {
    // Calculate current position from transactions
    const query = `
      SELECT 
        SUM(CASE WHEN transaction_type = 'BUY' THEN quantity ELSE 0 END) as total_bought,
        SUM(CASE WHEN transaction_type = 'SELL' THEN quantity ELSE 0 END) as total_sold,
        SUM(CASE WHEN transaction_type = 'BUY' THEN quantity * price_per_share ELSE 0 END) as total_cost,
        MIN(CASE WHEN transaction_type = 'BUY' THEN transaction_date END) as first_purchase,
        MAX(transaction_date) as last_transaction
      FROM portfolio_transactions
      WHERE portfolio_id = $1 AND asset_symbol = $2
    `;

    const result = await this.db.query(query, [portfolioId, symbol.toUpperCase()]);
    const row = result.rows[0];

    const totalBought = parseFloat(row.total_bought) || 0;
    const totalSold = parseFloat(row.total_sold) || 0;
    const totalCost = parseFloat(row.total_cost) || 0;
    const currentQuantity = totalBought - totalSold;

    if (currentQuantity <= 0) {
      // No remaining position, delete from holdings
      await this.db.query(
        'DELETE FROM portfolio_holdings WHERE portfolio_id = $1 AND symbol = $2',
        [portfolioId, symbol.toUpperCase()]
      );
      return;
    }

    // Calculate weighted average cost basis
    const averageCostBasis = totalBought > 0 ? totalCost / totalBought : 0;
    const totalCostBasis = currentQuantity * averageCostBasis;

    // Try to get sector from FMP
    let sector: string | null = null;
    try {
      const profile = await this.fmpProvider.getCompanyProfile(symbol);
      sector = profile.sector || null;
    } catch {
      // Sector lookup failed, continue without it
    }

    // Upsert the holding
    const upsertQuery = `
      INSERT INTO portfolio_holdings (
        portfolio_id, symbol, quantity, average_cost_basis, total_cost_basis,
        sector, first_purchase_date, last_transaction_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (portfolio_id, symbol) DO UPDATE SET
        quantity = EXCLUDED.quantity,
        average_cost_basis = EXCLUDED.average_cost_basis,
        total_cost_basis = EXCLUDED.total_cost_basis,
        sector = COALESCE(EXCLUDED.sector, portfolio_holdings.sector),
        last_transaction_date = EXCLUDED.last_transaction_date
    `;

    await this.db.query(upsertQuery, [
      portfolioId,
      symbol.toUpperCase(),
      currentQuantity,
      averageCostBasis,
      totalCostBasis,
      sector,
      row.first_purchase,
      row.last_transaction,
    ]);
  }

  // ============================================================================
  // Portfolio Summary & Analytics
  // ============================================================================

  /**
   * Gets a comprehensive summary of a portfolio.
   */
  async getPortfolioSummary(portfolioId: string): Promise<PortfolioSummary> {
    const portfolio = await this.getPortfolioById(portfolioId);
    if (!portfolio) {
      throw new PortfolioNotFoundError(portfolioId);
    }

    const [cashBalance, holdingsWithMarket] = await Promise.all([
      this.getCashBalance(portfolioId),
      this.getHoldingsWithMarketData(portfolioId),
    ]);

    const holdingsValue = holdingsWithMarket.reduce((sum, h) => sum + h.marketValue, 0);
    const totalEquity = holdingsValue + cashBalance;

    const dayChange = holdingsWithMarket.reduce((sum, h) => sum + h.dayChange, 0);
    const previousEquity = totalEquity - dayChange;
    const dayChangePercent = previousEquity > 0 ? (dayChange / previousEquity) * 100 : 0;

    // Calculate net deposits for total return
    const depositsQuery = `
      SELECT COALESCE(SUM(CASE WHEN transaction_type IN ('DEPOSIT', 'DIVIDEND') THEN total_amount ELSE 0 END), 0) -
             COALESCE(SUM(CASE WHEN transaction_type = 'WITHDRAW' THEN ABS(total_amount) ELSE 0 END), 0) as net_deposits
      FROM portfolio_transactions
      WHERE portfolio_id = $1
    `;
    const depositsResult = await this.db.query(depositsQuery, [portfolioId]);
    const netDeposits = parseFloat(depositsResult.rows[0].net_deposits) || 0;

    const totalReturn = totalEquity - netDeposits;
    const totalReturnPercent = netDeposits > 0 ? (totalReturn / netDeposits) * 100 : 0;

    // Calculate daily alpha vs SPY
    let dailyAlpha: number | null = null;
    try {
      const spyQuote = await this.fmpProvider.getQuote('SPY');
      dailyAlpha = dayChangePercent - spyQuote.changesPercentage;
    } catch {
      // SPY data unavailable
    }

    return {
      portfolioId,
      portfolioName: portfolio.name,
      totalEquity,
      cashBalance,
      holdingsValue,
      holdingsCount: holdingsWithMarket.length,
      dayChange,
      dayChangePercent,
      totalReturn,
      totalReturnPercent,
      dailyAlpha,
    };
  }

  /**
   * Gets sector allocation for tree map visualization.
   */
  async getSectorAllocation(portfolioId: string): Promise<SectorAllocation[]> {
    const holdingsWithMarket = await this.getHoldingsWithMarketData(portfolioId);

    const sectorMap = new Map<string, SectorAllocation>();

    for (const holding of holdingsWithMarket) {
      const sector = holding.sector || 'Other';

      if (!sectorMap.has(sector)) {
        sectorMap.set(sector, {
          sector,
          marketValue: 0,
          portfolioWeight: 0,
          dayChangePercent: 0,
          holdings: [],
        });
      }

      const sectorData = sectorMap.get(sector)!;
      sectorData.marketValue += holding.marketValue;
      sectorData.holdings.push({
        symbol: holding.symbol,
        marketValue: holding.marketValue,
        portfolioWeight: holding.portfolioWeight,
        dayChangePercent: holding.dayChangePercent,
      });
    }

    // Calculate sector weights and weighted average day change
    const totalValue = holdingsWithMarket.reduce((sum, h) => sum + h.marketValue, 0);

    for (const sectorData of sectorMap.values()) {
      sectorData.portfolioWeight = totalValue > 0 ? (sectorData.marketValue / totalValue) * 100 : 0;

      // Weighted average day change for sector
      const weightedDayChange = sectorData.holdings.reduce(
        (sum, h) => sum + h.dayChangePercent * h.marketValue,
        0
      );
      sectorData.dayChangePercent =
        sectorData.marketValue > 0 ? weightedDayChange / sectorData.marketValue : 0;
    }

    return Array.from(sectorMap.values()).sort((a, b) => b.marketValue - a.marketValue);
  }

  /**
   * Gets rebalancing suggestions based on target allocations.
   */
  async getRebalanceSuggestions(
    portfolioId: string,
    threshold: number = 2
  ): Promise<RebalanceSuggestion[]> {
    const holdingsWithMarket = await this.getHoldingsWithMarketData(portfolioId);

    const suggestions: RebalanceSuggestion[] = [];

    for (const holding of holdingsWithMarket) {
      if (holding.targetAllocationPercent === null) {
        continue;
      }

      const drift = holding.portfolioWeight - holding.targetAllocationPercent;

      if (Math.abs(drift) >= threshold) {
        const totalValue = holdingsWithMarket.reduce((sum, h) => sum + h.marketValue, 0);
        const targetValue = (holding.targetAllocationPercent / 100) * totalValue;
        const tradeValue = targetValue - holding.marketValue;
        const tradeShares = holding.currentPrice > 0 ? tradeValue / holding.currentPrice : 0;

        suggestions.push({
          symbol: holding.symbol,
          currentWeight: holding.portfolioWeight,
          targetWeight: holding.targetAllocationPercent,
          driftPercent: drift,
          action: tradeValue > 0 ? 'BUY' : tradeValue < 0 ? 'SELL' : 'HOLD',
          suggestedTradeValue: Math.abs(tradeValue),
          suggestedShares: Math.abs(tradeShares),
        });
      }
    }

    return suggestions.sort((a, b) => Math.abs(b.driftPercent) - Math.abs(a.driftPercent));
  }

  /**
   * Gets historical performance data for equity curve and benchmarking.
   */
  async getPerformanceHistory(
    portfolioId: string,
    filters?: PerformanceHistoryFilters
  ): Promise<BenchmarkDataPoint[]> {
    let query = `
      SELECT date, total_equity, daily_return_percent, total_return_percent,
             benchmark_spy_close, benchmark_qqq_close
      FROM portfolio_daily_performance
      WHERE portfolio_id = $1
    `;

    const params: unknown[] = [portfolioId];
    let paramIndex = 2;

    if (filters?.startDate) {
      query += ` AND date >= $${paramIndex++}`;
      params.push(filters.startDate);
    }

    if (filters?.endDate) {
      query += ` AND date <= $${paramIndex++}`;
      params.push(filters.endDate);
    }

    query += ' ORDER BY date ASC';

    const result = await this.db.query(query, params);

    if (result.rows.length === 0) {
      return [];
    }

    // Normalize returns to the first data point
    const firstRow = result.rows[0];
    const basePortfolioValue = parseFloat(firstRow.total_equity) || 1;
    const baseSpyPrice = parseFloat(firstRow.benchmark_spy_close) || 1;
    const baseQqqPrice = parseFloat(firstRow.benchmark_qqq_close) || 1;

    return result.rows.map((row: Record<string, unknown>) => {
      const portfolioValue = parseFloat(row.total_equity as string) || 0;
      const spyPrice = parseFloat(row.benchmark_spy_close as string) || 0;
      const qqqPrice = parseFloat(row.benchmark_qqq_close as string) || 0;

      return {
        date: (row.date as Date).toISOString().split('T')[0],
        portfolioValue,
        portfolioReturn: ((portfolioValue - basePortfolioValue) / basePortfolioValue) * 100,
        spyReturn: baseSpyPrice > 0 ? ((spyPrice - baseSpyPrice) / baseSpyPrice) * 100 : 0,
        qqqReturn: baseQqqPrice > 0 ? ((qqqPrice - baseQqqPrice) / baseQqqPrice) * 100 : 0,
      };
    });
  }

  /**
   * Records a daily performance snapshot.
   * Should be called by a scheduled job at market close.
   */
  async recordDailyPerformance(portfolioId: string): Promise<PortfolioDailyPerformance> {
    const [summary, cashBalance] = await Promise.all([
      this.getPortfolioSummary(portfolioId),
      this.getCashBalance(portfolioId),
    ]);

    // Get benchmark prices
    let spyClose: number | null = null;
    let qqqClose: number | null = null;

    try {
      const [spyQuote, qqqQuote] = await Promise.all([
        this.fmpProvider.getQuote('SPY'),
        this.fmpProvider.getQuote('QQQ'),
      ]);
      spyClose = spyQuote.price;
      qqqClose = qqqQuote.price;
    } catch {
      // Benchmark data unavailable
    }

    // Get previous day's record for return calculation
    const prevQuery = `
      SELECT total_equity, net_deposits
      FROM portfolio_daily_performance
      WHERE portfolio_id = $1
      ORDER BY date DESC
      LIMIT 1
    `;
    const prevResult = await this.db.query(prevQuery, [portfolioId]);

    let dailyReturnPercent: number | null = null;
    if (prevResult.rows.length > 0) {
      const prevEquity = parseFloat(prevResult.rows[0].total_equity);
      if (prevEquity > 0) {
        dailyReturnPercent = ((summary.totalEquity - prevEquity) / prevEquity) * 100;
      }
    }

    // Calculate net deposits
    const depositsQuery = `
      SELECT COALESCE(SUM(CASE WHEN transaction_type IN ('DEPOSIT', 'DIVIDEND') THEN ABS(total_amount) ELSE 0 END), 0) -
             COALESCE(SUM(CASE WHEN transaction_type = 'WITHDRAW' THEN ABS(total_amount) ELSE 0 END), 0) as net_deposits
      FROM portfolio_transactions
      WHERE portfolio_id = $1
    `;
    const depositsResult = await this.db.query(depositsQuery, [portfolioId]);
    const netDeposits = parseFloat(depositsResult.rows[0].net_deposits) || 0;

    const totalReturnPercent =
      netDeposits > 0 ? ((summary.totalEquity - netDeposits) / netDeposits) * 100 : null;

    const query = `
      INSERT INTO portfolio_daily_performance (
        portfolio_id, date, total_equity, cash_balance, holdings_value,
        daily_return_percent, total_return_percent, net_deposits,
        benchmark_spy_close, benchmark_qqq_close
      ) VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (portfolio_id, date) DO UPDATE SET
        total_equity = EXCLUDED.total_equity,
        cash_balance = EXCLUDED.cash_balance,
        holdings_value = EXCLUDED.holdings_value,
        daily_return_percent = EXCLUDED.daily_return_percent,
        total_return_percent = EXCLUDED.total_return_percent,
        net_deposits = EXCLUDED.net_deposits,
        benchmark_spy_close = EXCLUDED.benchmark_spy_close,
        benchmark_qqq_close = EXCLUDED.benchmark_qqq_close
      RETURNING id, portfolio_id, date, total_equity, cash_balance, holdings_value,
                daily_return_percent, total_return_percent, net_deposits,
                benchmark_spy_close, benchmark_qqq_close, created_at
    `;

    const result = await this.db.query(query, [
      portfolioId,
      summary.totalEquity,
      cashBalance,
      summary.holdingsValue,
      dailyReturnPercent,
      totalReturnPercent,
      netDeposits,
      spyClose,
      qqqClose,
    ]);

    return this.mapRowToPerformance(result.rows[0]);
  }

  // ============================================================================
  // Validation Helpers
  // ============================================================================

  private validateCreatePortfolioRequest(data: CreatePortfolioRequest): void {
    if (!data.userId || typeof data.userId !== 'string') {
      throw new PortfolioValidationError('userId is required', 'userId', 'REQUIRED');
    }

    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      throw new PortfolioValidationError('name is required', 'name', 'REQUIRED');
    }

    if (data.name.length > 255) {
      throw new PortfolioValidationError('name must be 255 characters or less', 'name', 'TOO_LONG');
    }
  }

  private validateTransactionRequest(data: CreateTransactionRequest): void {
    if (!data.portfolioId || typeof data.portfolioId !== 'string') {
      throw new PortfolioValidationError('portfolioId is required', 'portfolioId', 'REQUIRED');
    }

    if (!data.transactionType) {
      throw new PortfolioValidationError(
        'transactionType is required',
        'transactionType',
        'REQUIRED'
      );
    }

    const validTypes = ['BUY', 'SELL', 'DEPOSIT', 'WITHDRAW', 'DIVIDEND'];
    if (!validTypes.includes(data.transactionType)) {
      throw new PortfolioValidationError(
        `transactionType must be one of: ${validTypes.join(', ')}`,
        'transactionType',
        'INVALID_ENUM'
      );
    }

    // Asset-specific validations
    if (data.transactionType === 'BUY' || data.transactionType === 'SELL') {
      if (!data.assetSymbol || typeof data.assetSymbol !== 'string') {
        throw new PortfolioValidationError(
          'assetSymbol is required for BUY/SELL',
          'assetSymbol',
          'REQUIRED'
        );
      }

      if (
        data.quantity === undefined ||
        data.quantity === null ||
        typeof data.quantity !== 'number' ||
        data.quantity <= 0
      ) {
        throw new PortfolioValidationError(
          'quantity must be a positive number for BUY/SELL',
          'quantity',
          'INVALID_VALUE'
        );
      }

      if (
        data.pricePerShare === undefined ||
        data.pricePerShare === null ||
        typeof data.pricePerShare !== 'number' ||
        data.pricePerShare <= 0
      ) {
        throw new PortfolioValidationError(
          'pricePerShare must be a positive number for BUY/SELL',
          'pricePerShare',
          'INVALID_VALUE'
        );
      }
    }

    if (data.transactionType === 'DIVIDEND') {
      if (!data.assetSymbol || typeof data.assetSymbol !== 'string') {
        throw new PortfolioValidationError(
          'assetSymbol is required for DIVIDEND',
          'assetSymbol',
          'REQUIRED'
        );
      }
    }

    if (
      data.totalAmount === undefined ||
      data.totalAmount === null ||
      typeof data.totalAmount !== 'number' ||
      data.totalAmount <= 0
    ) {
      throw new PortfolioValidationError(
        'totalAmount must be a positive number',
        'totalAmount',
        'INVALID_VALUE'
      );
    }

    if (!data.transactionDate || !(data.transactionDate instanceof Date)) {
      throw new PortfolioValidationError(
        'transactionDate is required and must be a valid date',
        'transactionDate',
        'REQUIRED'
      );
    }
  }

  // ============================================================================
  // Row Mappers
  // ============================================================================

  private mapRowToPortfolio(row: Record<string, unknown>): Portfolio {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      name: row.name as string,
      description: (row.description as string) || undefined,
      currency: row.currency as string,
      isDefault: row.is_default as boolean,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  private mapRowToTransaction(row: Record<string, unknown>): PortfolioTransaction {
    return {
      id: row.id as string,
      portfolioId: row.portfolio_id as string,
      assetSymbol: (row.asset_symbol as string) || null,
      transactionType: row.transaction_type as PortfolioTransaction['transactionType'],
      quantity: row.quantity !== null ? parseFloat(row.quantity as string) : null,
      pricePerShare: row.price_per_share !== null ? parseFloat(row.price_per_share as string) : null,
      fees: parseFloat(row.fees as string) || 0,
      totalAmount: parseFloat(row.total_amount as string),
      transactionDate: new Date(row.transaction_date as string),
      notes: (row.notes as string) || undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  private mapRowToHolding(row: Record<string, unknown>): PortfolioHolding {
    return {
      id: row.id as string,
      portfolioId: row.portfolio_id as string,
      symbol: row.symbol as string,
      quantity: parseFloat(row.quantity as string),
      averageCostBasis: parseFloat(row.average_cost_basis as string),
      totalCostBasis: parseFloat(row.total_cost_basis as string),
      targetAllocationPercent:
        row.target_allocation_percent !== null
          ? parseFloat(row.target_allocation_percent as string)
          : null,
      sector: (row.sector as string) || null,
      firstPurchaseDate: row.first_purchase_date
        ? new Date(row.first_purchase_date as string)
        : null,
      lastTransactionDate: row.last_transaction_date
        ? new Date(row.last_transaction_date as string)
        : null,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  private mapRowToPerformance(row: Record<string, unknown>): PortfolioDailyPerformance {
    return {
      id: row.id as string,
      portfolioId: row.portfolio_id as string,
      date: new Date(row.date as string),
      totalEquity: parseFloat(row.total_equity as string),
      cashBalance: parseFloat(row.cash_balance as string),
      holdingsValue: parseFloat(row.holdings_value as string),
      dailyReturnPercent:
        row.daily_return_percent !== null ? parseFloat(row.daily_return_percent as string) : null,
      totalReturnPercent:
        row.total_return_percent !== null ? parseFloat(row.total_return_percent as string) : null,
      netDeposits: parseFloat(row.net_deposits as string) || 0,
      benchmarkSpyClose:
        row.benchmark_spy_close !== null ? parseFloat(row.benchmark_spy_close as string) : null,
      benchmarkQqqClose:
        row.benchmark_qqq_close !== null ? parseFloat(row.benchmark_qqq_close as string) : null,
      createdAt: new Date(row.created_at as string),
    };
  }
}

// Singleton instance
let portfolioServiceInstance: PortfolioService | null = null;

/**
 * Gets the singleton PortfolioService instance.
 */
export function getPortfolioService(
  db: DatabaseConnection,
  fmpProvider: FMPDataProvider
): PortfolioService {
  if (!portfolioServiceInstance) {
    portfolioServiceInstance = new PortfolioService(db, fmpProvider);
  }
  return portfolioServiceInstance;
}





