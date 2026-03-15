-- Migration: Fix trade_status for existing transactions
-- This migration retroactively fixes:
-- 1. SELL transactions that have null trade_status (should be CLOSED)
-- 2. BUY transactions that have been fully sold (should be CLOSED with exit details)

-- Step 1: Mark all SELL transactions as CLOSED for trade tracking
UPDATE portfolio_transactions
SET trade_status = 'CLOSED',
    side = COALESCE(side, 'LONG')
WHERE transaction_type = 'SELL'
  AND trade_status IS NULL;

-- Step 2: Mark BUY transactions as having trades tracked
UPDATE portfolio_transactions
SET trade_status = 'OPEN',
    side = COALESCE(side, 'LONG')
WHERE transaction_type = 'BUY'
  AND trade_status IS NULL;

-- Step 3: Calculate realized P&L for SELL transactions that don't have it
-- Uses weighted average cost basis from all prior BUYs for the same symbol
WITH sell_pnl AS (
  SELECT
    s.id AS sell_id,
    s.asset_symbol,
    s.portfolio_id,
    s.quantity AS sell_quantity,
    s.price_per_share AS sell_price,
    s.transaction_date AS sell_date,
    -- Get avg cost basis from all BUYs before this SELL
    (
      SELECT SUM(b.quantity * b.price_per_share) / NULLIF(SUM(b.quantity), 0)
      FROM portfolio_transactions b
      WHERE b.portfolio_id = s.portfolio_id
        AND b.asset_symbol = s.asset_symbol
        AND b.transaction_type IN ('BUY', 'DIVIDEND_REINVESTMENT')
        AND b.transaction_date <= s.transaction_date
    ) AS avg_cost_basis
  FROM portfolio_transactions s
  WHERE s.transaction_type = 'SELL'
    AND s.realized_pnl IS NULL
    AND s.quantity IS NOT NULL
    AND s.price_per_share IS NOT NULL
)
UPDATE portfolio_transactions pt
SET realized_pnl = (sp.sell_price - COALESCE(sp.avg_cost_basis, 0)) * sp.sell_quantity
FROM sell_pnl sp
WHERE pt.id = sp.sell_id
  AND sp.avg_cost_basis IS NOT NULL;

-- Step 4: Close BUY transactions that have been fully sold
-- A BUY is fully sold if total quantity sold for that symbol >= BUY quantity
-- and the BUY is the oldest open position (FIFO)
WITH position_summary AS (
  SELECT
    portfolio_id,
    asset_symbol,
    SUM(CASE WHEN transaction_type IN ('BUY', 'DIVIDEND_REINVESTMENT') THEN quantity ELSE 0 END) AS total_bought,
    SUM(CASE WHEN transaction_type = 'SELL' THEN quantity ELSE 0 END) AS total_sold
  FROM portfolio_transactions
  WHERE asset_symbol IS NOT NULL
  GROUP BY portfolio_id, asset_symbol
),
-- Find BUYs that should be closed (where total_sold >= cumulative bought at that point)
buys_to_close AS (
  SELECT
    b.id,
    b.portfolio_id,
    b.asset_symbol,
    b.quantity,
    b.price_per_share,
    b.transaction_date,
    -- Running total of bought shares up to and including this transaction
    SUM(b.quantity) OVER (
      PARTITION BY b.portfolio_id, b.asset_symbol
      ORDER BY b.transaction_date
      ROWS UNBOUNDED PRECEDING
    ) AS cumulative_bought,
    ps.total_sold,
    -- Get the latest sell price and date for exit info
    (
      SELECT price_per_share
      FROM portfolio_transactions
      WHERE portfolio_id = b.portfolio_id
        AND asset_symbol = b.asset_symbol
        AND transaction_type = 'SELL'
      ORDER BY transaction_date DESC
      LIMIT 1
    ) AS latest_sell_price,
    (
      SELECT transaction_date
      FROM portfolio_transactions
      WHERE portfolio_id = b.portfolio_id
        AND asset_symbol = b.asset_symbol
        AND transaction_type = 'SELL'
      ORDER BY transaction_date DESC
      LIMIT 1
    ) AS latest_sell_date
  FROM portfolio_transactions b
  JOIN position_summary ps ON ps.portfolio_id = b.portfolio_id AND ps.asset_symbol = b.asset_symbol
  WHERE b.transaction_type IN ('BUY', 'DIVIDEND_REINVESTMENT')
    AND b.trade_status = 'OPEN'
    AND ps.total_sold > 0
)
UPDATE portfolio_transactions pt
SET
  trade_status = 'CLOSED',
  exit_price = btc.latest_sell_price,
  exit_date = btc.latest_sell_date,
  realized_pnl = COALESCE(pt.realized_pnl, 0) +
    (COALESCE(btc.latest_sell_price, 0) - COALESCE(btc.price_per_share, 0)) * btc.quantity
FROM buys_to_close btc
WHERE pt.id = btc.id
  AND btc.cumulative_bought <= btc.total_sold
  AND btc.latest_sell_price IS NOT NULL;

-- Add index to improve trade status queries
CREATE INDEX IF NOT EXISTS idx_portfolio_transactions_trade_status
ON portfolio_transactions (portfolio_id, trade_status)
WHERE trade_status IS NOT NULL;
