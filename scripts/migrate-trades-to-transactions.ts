#!/usr/bin/env npx tsx

/**
 * Migrate Trades to Portfolio Transactions
 *
 * This script migrates data from the old `trades` table to the unified
 * `portfolio_transactions` table.
 *
 * Migration strategy:
 * - OPEN trades → BUY transaction with trade_status='OPEN'
 * - CLOSED trades → BUY transaction + SELL transaction linked via linked_trade_id
 * - Realized P&L preserved on SELL transactions
 *
 * Usage:
 *   npx tsx scripts/migrate-trades-to-transactions.ts [--dry-run] [--portfolio-id <id>]
 *
 * Options:
 *   --dry-run      Preview changes without committing
 *   --portfolio-id Target specific portfolio (required)
 */

import { Pool } from 'pg';

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const portfolioIdIndex = args.indexOf('--portfolio-id');
const targetPortfolioId = portfolioIdIndex !== -1 ? args[portfolioIdIndex + 1] : null;

if (!targetPortfolioId) {
  console.error('Error: --portfolio-id is required');
  console.log('\nUsage: npx tsx scripts/migrate-trades-to-transactions.ts --portfolio-id <uuid> [--dry-run]');
  process.exit(1);
}

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface Trade {
  id: string;
  user_id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  status: 'OPEN' | 'CLOSED';
  entry_price: number;
  quantity: number;
  entry_date: Date;
  exit_price: number | null;
  exit_date: Date | null;
  fees: number;
  realized_pnl: number | null;
  notes: string | null;
  created_at: Date;
}

interface MigrationResult {
  tradesProcessed: number;
  buyTransactionsCreated: number;
  sellTransactionsCreated: number;
  errors: Array<{ tradeId: string; error: string }>;
}

async function migrateTradesForPortfolio(
  portfolioId: string,
  dryRun: boolean
): Promise<MigrationResult> {
  const client = await pool.connect();

  const result: MigrationResult = {
    tradesProcessed: 0,
    buyTransactionsCreated: 0,
    sellTransactionsCreated: 0,
    errors: [],
  };

  try {
    // Get the portfolio to find user_id
    const portfolioResult = await client.query(
      'SELECT id, user_id FROM portfolios WHERE id = $1',
      [portfolioId]
    );

    if (portfolioResult.rows.length === 0) {
      throw new Error(`Portfolio not found: ${portfolioId}`);
    }

    const portfolio = portfolioResult.rows[0];
    console.log(`\nMigrating trades for portfolio: ${portfolioId}`);
    console.log(`User ID: ${portfolio.user_id}`);

    // Get all trades for this user
    const tradesResult = await client.query<Trade>(
      `SELECT id, user_id, symbol, side, status, entry_price, quantity,
              entry_date, exit_price, exit_date, fees, realized_pnl, notes, created_at
       FROM trades
       WHERE user_id = $1
       ORDER BY entry_date ASC`,
      [portfolio.user_id]
    );

    const trades = tradesResult.rows;
    console.log(`Found ${trades.length} trades to migrate`);

    if (trades.length === 0) {
      console.log('No trades to migrate.');
      return result;
    }

    if (!dryRun) {
      await client.query('BEGIN');
    }

    for (const trade of trades) {
      try {
        result.tradesProcessed++;

        // Calculate total amount for BUY
        const buyTotalAmount = trade.entry_price * trade.quantity;

        // Create BUY transaction
        const buyTxnId = crypto.randomUUID();
        const buyQuery = `
          INSERT INTO portfolio_transactions (
            id, portfolio_id, asset_symbol, transaction_type, quantity,
            price_per_share, fees, total_amount, transaction_date, notes,
            side, trade_status, import_source
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `;

        const buyParams = [
          buyTxnId,
          portfolioId,
          trade.symbol,
          'BUY',
          trade.quantity,
          trade.entry_price,
          trade.status === 'OPEN' ? trade.fees : 0, // Fees on BUY for open trades
          -buyTotalAmount, // Negative for cash out
          trade.entry_date,
          trade.notes ? `Migrated: ${trade.notes}` : 'Migrated from trade tracker',
          trade.side,
          trade.status,
          'trade_migration',
        ];

        if (dryRun) {
          console.log(`\n[DRY RUN] Would create BUY transaction:`);
          console.log(`  Symbol: ${trade.symbol}, Qty: ${trade.quantity}, Price: ${trade.entry_price}`);
          console.log(`  Date: ${trade.entry_date}, Status: ${trade.status}`);
        } else {
          await client.query(buyQuery, buyParams);
          result.buyTransactionsCreated++;
        }

        // Create SELL transaction for closed trades
        if (trade.status === 'CLOSED' && trade.exit_price && trade.exit_date) {
          const sellTotalAmount = trade.exit_price * trade.quantity;
          const sellTxnId = crypto.randomUUID();

          const sellQuery = `
            INSERT INTO portfolio_transactions (
              id, portfolio_id, asset_symbol, transaction_type, quantity,
              price_per_share, fees, total_amount, transaction_date, notes,
              side, trade_status, exit_price, exit_date, realized_pnl,
              linked_trade_id, import_source
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          `;

          const sellParams = [
            sellTxnId,
            portfolioId,
            trade.symbol,
            'SELL',
            trade.quantity,
            trade.exit_price,
            trade.fees, // Fees on SELL for closed trades
            sellTotalAmount - trade.fees, // Positive for cash in (minus fees)
            trade.exit_date,
            `Closed trade (migrated)`,
            trade.side,
            'CLOSED',
            trade.exit_price,
            trade.exit_date,
            trade.realized_pnl,
            buyTxnId, // Link to the BUY transaction
            'trade_migration',
          ];

          if (dryRun) {
            console.log(`[DRY RUN] Would create SELL transaction:`);
            console.log(`  Symbol: ${trade.symbol}, Qty: ${trade.quantity}, Price: ${trade.exit_price}`);
            console.log(`  Date: ${trade.exit_date}, P&L: ${trade.realized_pnl}`);
          } else {
            await client.query(sellQuery, sellParams);
            result.sellTransactionsCreated++;
          }

          // Update the BUY transaction with exit info
          if (!dryRun) {
            await client.query(
              `UPDATE portfolio_transactions
               SET exit_price = $1, exit_date = $2, realized_pnl = $3
               WHERE id = $4`,
              [trade.exit_price, trade.exit_date, trade.realized_pnl, buyTxnId]
            );
          }
        }

        if (!dryRun && result.tradesProcessed % 10 === 0) {
          console.log(`Processed ${result.tradesProcessed} trades...`);
        }
      } catch (error) {
        result.errors.push({
          tradeId: trade.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(`Error migrating trade ${trade.id}:`, error);
      }
    }

    if (!dryRun) {
      // Recalculate holdings cache
      console.log('\nRecalculating holdings cache...');
      await client.query('SELECT recalculate_portfolio_holdings($1)', [portfolioId]);

      await client.query('COMMIT');
      console.log('\nMigration committed successfully!');
    } else {
      console.log('\n[DRY RUN] No changes were made.');
    }

    return result;
  } catch (error) {
    if (!dryRun) {
      await client.query('ROLLBACK');
    }
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Trade to Transaction Migration Script');
  console.log('='.repeat(60));

  if (dryRun) {
    console.log('\n** DRY RUN MODE - No changes will be made **\n');
  }

  try {
    const result = await migrateTradesForPortfolio(targetPortfolioId!, dryRun);

    console.log('\n' + '='.repeat(60));
    console.log('Migration Summary');
    console.log('='.repeat(60));
    console.log(`Trades Processed:          ${result.tradesProcessed}`);
    console.log(`BUY Transactions Created:  ${result.buyTransactionsCreated}`);
    console.log(`SELL Transactions Created: ${result.sellTransactionsCreated}`);
    console.log(`Errors:                    ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('\nErrors:');
      for (const err of result.errors) {
        console.log(`  - Trade ${err.tradeId}: ${err.error}`);
      }
    }

    if (dryRun) {
      console.log('\nRun without --dry-run to apply changes.');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
