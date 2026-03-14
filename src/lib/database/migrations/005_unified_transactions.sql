-- Unified Transactions System
-- Migration 005: Extend portfolio_transactions to support trade tracking and new transaction types
--
-- This migration unifies the Trade Tracker and Portfolio Transactions into a single system
-- supporting BUY/SELL with P&L tracking, dividends, dividend reinvestments, interest,
-- and deposits/withdrawals.

-- ============================================================================
-- 1. Add new enum values for transaction types
-- ============================================================================

-- Add DIVIDEND_REINVESTMENT type
DO $$ BEGIN
    ALTER TYPE portfolio_transaction_type ADD VALUE IF NOT EXISTS 'DIVIDEND_REINVESTMENT';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add INTEREST type
DO $$ BEGIN
    ALTER TYPE portfolio_transaction_type ADD VALUE IF NOT EXISTS 'INTEREST';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. Add trade tracking columns to portfolio_transactions
-- ============================================================================

-- Side: LONG or SHORT (for trade direction)
DO $$ BEGIN
    ALTER TABLE portfolio_transactions ADD COLUMN side VARCHAR(5);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Trade status: OPEN or CLOSED
DO $$ BEGIN
    ALTER TABLE portfolio_transactions ADD COLUMN trade_status VARCHAR(10);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Exit price for closed trades
DO $$ BEGIN
    ALTER TABLE portfolio_transactions ADD COLUMN exit_price DECIMAL(18, 4);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Exit date for closed trades
DO $$ BEGIN
    ALTER TABLE portfolio_transactions ADD COLUMN exit_date TIMESTAMPTZ;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Realized P&L for closed trades
DO $$ BEGIN
    ALTER TABLE portfolio_transactions ADD COLUMN realized_pnl DECIMAL(18, 4);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Link to related trade (e.g., SELL linked to original BUY)
DO $$ BEGIN
    ALTER TABLE portfolio_transactions ADD COLUMN linked_trade_id UUID REFERENCES portfolio_transactions(id);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Settlement date (T+1 or T+2)
DO $$ BEGIN
    ALTER TABLE portfolio_transactions ADD COLUMN settlement_date DATE;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Import source (e.g., 'merrill_edge', 'fidelity', 'manual')
DO $$ BEGIN
    ALTER TABLE portfolio_transactions ADD COLUMN import_source VARCHAR(50);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Raw description from import (for debugging and reference)
DO $$ BEGIN
    ALTER TABLE portfolio_transactions ADD COLUMN raw_description TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- ============================================================================
-- 3. Create indexes for new columns
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_portfolio_transactions_side
    ON portfolio_transactions(side) WHERE side IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_portfolio_transactions_trade_status
    ON portfolio_transactions(trade_status) WHERE trade_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_portfolio_transactions_linked_trade
    ON portfolio_transactions(linked_trade_id) WHERE linked_trade_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_portfolio_transactions_settlement
    ON portfolio_transactions(settlement_date) WHERE settlement_date IS NOT NULL;

-- ============================================================================
-- 4. Create trade_positions view for P&L reporting
-- ============================================================================

CREATE OR REPLACE VIEW trade_positions AS
WITH buy_transactions AS (
    SELECT
        pt.id,
        pt.portfolio_id,
        pt.asset_symbol,
        pt.quantity,
        pt.price_per_share AS entry_price,
        pt.transaction_date AS entry_date,
        pt.side,
        pt.trade_status,
        pt.exit_price,
        pt.exit_date,
        pt.realized_pnl,
        pt.fees,
        pt.notes,
        pt.linked_trade_id,
        pt.created_at
    FROM portfolio_transactions pt
    WHERE pt.transaction_type = 'BUY'
      AND pt.trade_status IS NOT NULL
)
SELECT
    bt.id AS trade_id,
    bt.portfolio_id,
    bt.asset_symbol AS symbol,
    COALESCE(bt.side, 'LONG') AS side,
    COALESCE(bt.trade_status, 'OPEN') AS status,
    bt.entry_price,
    bt.quantity,
    bt.entry_date,
    bt.exit_price,
    bt.exit_date,
    bt.realized_pnl,
    bt.fees,
    bt.notes,
    -- Calculate unrealized P&L placeholder (actual current price fetched by service)
    CASE
        WHEN bt.trade_status = 'CLOSED' THEN bt.realized_pnl
        ELSE NULL
    END AS pnl,
    bt.created_at
FROM buy_transactions bt
ORDER BY bt.entry_date DESC;

-- ============================================================================
-- 5. Create function to calculate realized P&L
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_realized_pnl(
    p_entry_price DECIMAL,
    p_exit_price DECIMAL,
    p_quantity DECIMAL,
    p_side VARCHAR,
    p_fees DECIMAL DEFAULT 0
) RETURNS DECIMAL AS $$
BEGIN
    IF p_side = 'SHORT' THEN
        -- Short: profit when price goes down
        RETURN (p_entry_price - p_exit_price) * p_quantity - COALESCE(p_fees, 0);
    ELSE
        -- Long: profit when price goes up
        RETURN (p_exit_price - p_entry_price) * p_quantity - COALESCE(p_fees, 0);
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 6. Update cash balance view to include new transaction types
-- ============================================================================

CREATE OR REPLACE VIEW portfolio_cash_balances AS
SELECT
    portfolio_id,
    SUM(total_amount) as cash_balance
FROM portfolio_transactions
GROUP BY portfolio_id;

-- ============================================================================
-- 7. Create open positions view (positions with remaining shares)
-- ============================================================================

CREATE OR REPLACE VIEW portfolio_open_positions AS
SELECT
    portfolio_id,
    asset_symbol AS symbol,
    SUM(CASE
        WHEN transaction_type = 'BUY' THEN quantity
        WHEN transaction_type = 'DIVIDEND_REINVESTMENT' THEN quantity
        ELSE 0
    END) AS total_bought,
    SUM(CASE WHEN transaction_type = 'SELL' THEN quantity ELSE 0 END) AS total_sold,
    SUM(CASE
        WHEN transaction_type = 'BUY' THEN quantity * price_per_share
        WHEN transaction_type = 'DIVIDEND_REINVESTMENT' THEN quantity * price_per_share
        ELSE 0
    END) AS total_cost,
    SUM(CASE
        WHEN transaction_type = 'BUY' THEN quantity
        WHEN transaction_type = 'DIVIDEND_REINVESTMENT' THEN quantity
        ELSE 0
    END) - SUM(CASE WHEN transaction_type = 'SELL' THEN quantity ELSE 0 END) AS remaining_shares,
    MIN(CASE
        WHEN transaction_type IN ('BUY', 'DIVIDEND_REINVESTMENT') THEN transaction_date
    END) AS first_purchase_date,
    MAX(transaction_date) AS last_transaction_date
FROM portfolio_transactions
WHERE asset_symbol IS NOT NULL
GROUP BY portfolio_id, asset_symbol
HAVING SUM(CASE
    WHEN transaction_type = 'BUY' THEN quantity
    WHEN transaction_type = 'DIVIDEND_REINVESTMENT' THEN quantity
    ELSE 0
END) - SUM(CASE WHEN transaction_type = 'SELL' THEN quantity ELSE 0 END) > 0;

-- ============================================================================
-- 8. Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN portfolio_transactions.side IS 'Trade direction: LONG or SHORT. NULL for non-trade transactions.';
COMMENT ON COLUMN portfolio_transactions.trade_status IS 'Trade status: OPEN or CLOSED. NULL for non-trade transactions.';
COMMENT ON COLUMN portfolio_transactions.exit_price IS 'Exit price for closed trades. NULL for open or non-trade transactions.';
COMMENT ON COLUMN portfolio_transactions.exit_date IS 'Exit date for closed trades. NULL for open or non-trade transactions.';
COMMENT ON COLUMN portfolio_transactions.realized_pnl IS 'Realized profit/loss for closed trades. NULL for open or non-trade transactions.';
COMMENT ON COLUMN portfolio_transactions.linked_trade_id IS 'Reference to related transaction (e.g., SELL referencing original BUY).';
COMMENT ON COLUMN portfolio_transactions.settlement_date IS 'Settlement date (T+1 or T+2 after trade date).';
COMMENT ON COLUMN portfolio_transactions.import_source IS 'Source of imported transaction (e.g., merrill_edge, fidelity, manual).';
COMMENT ON COLUMN portfolio_transactions.raw_description IS 'Original description from CSV import for reference.';

COMMENT ON VIEW trade_positions IS 'View of all trades with P&L information for trade tracking.';
COMMENT ON VIEW portfolio_open_positions IS 'View of current open positions with aggregated buy/sell quantities.';
