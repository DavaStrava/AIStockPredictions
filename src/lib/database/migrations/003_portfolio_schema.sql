-- Portfolio Investment Tracker Schema
-- Migration 003: Portfolio management tables for long-term investment tracking

-- Create enum type for transaction types
DO $$ BEGIN
    CREATE TYPE portfolio_transaction_type AS ENUM ('BUY', 'SELL', 'DEPOSIT', 'WITHDRAW', 'DIVIDEND');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Portfolios Table - Container for user's investment collections
CREATE TABLE IF NOT EXISTS portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    currency VARCHAR(3) DEFAULT 'USD',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure only one default portfolio per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolios_user_default 
    ON portfolios(user_id) WHERE is_default = TRUE;

-- Create indexes for portfolios
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_created_at ON portfolios(created_at);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_portfolios_updated_at ON portfolios;
CREATE TRIGGER update_portfolios_updated_at 
    BEFORE UPDATE ON portfolios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Portfolio Transactions Table - Source of truth for all portfolio movements
CREATE TABLE IF NOT EXISTS portfolio_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    asset_symbol VARCHAR(20), -- Null for cash operations (DEPOSIT/WITHDRAW)
    transaction_type portfolio_transaction_type NOT NULL,
    quantity DECIMAL(18, 8), -- Null for DEPOSIT/WITHDRAW
    price_per_share DECIMAL(18, 4), -- Null for DEPOSIT/WITHDRAW
    fees DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(18, 4) NOT NULL, -- Net cash impact (positive = cash in, negative = cash out)
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for portfolio_transactions
CREATE INDEX IF NOT EXISTS idx_portfolio_transactions_portfolio_id ON portfolio_transactions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_transactions_symbol ON portfolio_transactions(asset_symbol);
CREATE INDEX IF NOT EXISTS idx_portfolio_transactions_date ON portfolio_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_portfolio_transactions_type ON portfolio_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_portfolio_transactions_portfolio_date ON portfolio_transactions(portfolio_id, transaction_date DESC);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_portfolio_transactions_updated_at ON portfolio_transactions;
CREATE TRIGGER update_portfolio_transactions_updated_at 
    BEFORE UPDATE ON portfolio_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Portfolio Holdings Cache - Performance optimization for current state
CREATE TABLE IF NOT EXISTS portfolio_holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    quantity DECIMAL(18, 8) NOT NULL CHECK (quantity >= 0),
    average_cost_basis DECIMAL(18, 4) NOT NULL CHECK (average_cost_basis >= 0),
    total_cost_basis DECIMAL(18, 4) NOT NULL CHECK (total_cost_basis >= 0),
    target_allocation_percent DECIMAL(5, 2), -- User-defined target (e.g., 10.00 = 10%)
    sector VARCHAR(100),
    first_purchase_date TIMESTAMP WITH TIME ZONE,
    last_transaction_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(portfolio_id, symbol)
);

-- Create indexes for portfolio_holdings
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_portfolio_id ON portfolio_holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_symbol ON portfolio_holdings(symbol);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_sector ON portfolio_holdings(sector);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_portfolio_holdings_updated_at ON portfolio_holdings;
CREATE TRIGGER update_portfolio_holdings_updated_at 
    BEFORE UPDATE ON portfolio_holdings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Portfolio Daily Performance - Historical snapshots for equity curve and benchmarking
CREATE TABLE IF NOT EXISTS portfolio_daily_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_equity DECIMAL(18, 2) NOT NULL, -- Total portfolio value (holdings + cash)
    cash_balance DECIMAL(18, 2) NOT NULL,
    holdings_value DECIMAL(18, 2) NOT NULL, -- Sum of all holdings market value
    daily_return_percent DECIMAL(10, 6), -- Daily percentage return
    total_return_percent DECIMAL(10, 6), -- Cumulative return since inception
    net_deposits DECIMAL(18, 2) DEFAULT 0, -- Cumulative deposits - withdrawals
    benchmark_spy_close DECIMAL(10, 2), -- S&P 500 close price for reference
    benchmark_qqq_close DECIMAL(10, 2), -- Nasdaq 100 close price for reference
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(portfolio_id, date)
);

-- Create indexes for portfolio_daily_performance
CREATE INDEX IF NOT EXISTS idx_portfolio_daily_perf_portfolio_id ON portfolio_daily_performance(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_daily_perf_date ON portfolio_daily_performance(date);
CREATE INDEX IF NOT EXISTS idx_portfolio_daily_perf_portfolio_date ON portfolio_daily_performance(portfolio_id, date DESC);

-- 5. Portfolio Cash Balance View - Calculated from transactions
CREATE OR REPLACE VIEW portfolio_cash_balances AS
SELECT 
    portfolio_id,
    SUM(total_amount) as cash_balance
FROM portfolio_transactions
GROUP BY portfolio_id;

-- 6. Function to recalculate holdings for a portfolio from transactions
CREATE OR REPLACE FUNCTION recalculate_portfolio_holdings(p_portfolio_id UUID)
RETURNS void AS $$
DECLARE
    txn RECORD;
    current_qty DECIMAL(18, 8);
    current_cost DECIMAL(18, 4);
BEGIN
    -- Delete existing holdings for this portfolio
    DELETE FROM portfolio_holdings WHERE portfolio_id = p_portfolio_id;
    
    -- Get all symbols with transactions in this portfolio
    FOR txn IN 
        SELECT 
            asset_symbol,
            SUM(CASE WHEN transaction_type = 'BUY' THEN quantity ELSE 0 END) as total_bought,
            SUM(CASE WHEN transaction_type = 'SELL' THEN quantity ELSE 0 END) as total_sold,
            SUM(CASE WHEN transaction_type = 'BUY' THEN quantity * price_per_share ELSE 0 END) as total_cost,
            MIN(CASE WHEN transaction_type = 'BUY' THEN transaction_date END) as first_purchase,
            MAX(transaction_date) as last_transaction
        FROM portfolio_transactions
        WHERE portfolio_id = p_portfolio_id 
          AND asset_symbol IS NOT NULL
        GROUP BY asset_symbol
    LOOP
        current_qty := txn.total_bought - txn.total_sold;
        
        IF current_qty > 0 THEN
            -- Calculate average cost basis (simplified - using total cost / total bought)
            current_cost := txn.total_cost / NULLIF(txn.total_bought, 0);
            
            INSERT INTO portfolio_holdings (
                portfolio_id, symbol, quantity, average_cost_basis, 
                total_cost_basis, first_purchase_date, last_transaction_date
            ) VALUES (
                p_portfolio_id, txn.asset_symbol, current_qty, 
                COALESCE(current_cost, 0),
                current_qty * COALESCE(current_cost, 0),
                txn.first_purchase, txn.last_transaction
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 7. Function to get portfolio summary
CREATE OR REPLACE FUNCTION get_portfolio_summary(p_portfolio_id UUID)
RETURNS TABLE (
    portfolio_id UUID,
    portfolio_name VARCHAR(255),
    cash_balance DECIMAL(18, 4),
    holdings_count INTEGER,
    total_cost_basis DECIMAL(18, 4)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as portfolio_id,
        p.name as portfolio_name,
        COALESCE(cb.cash_balance, 0) as cash_balance,
        COUNT(DISTINCT h.symbol)::INTEGER as holdings_count,
        COALESCE(SUM(h.total_cost_basis), 0) as total_cost_basis
    FROM portfolios p
    LEFT JOIN portfolio_cash_balances cb ON p.id = cb.portfolio_id
    LEFT JOIN portfolio_holdings h ON p.id = h.portfolio_id
    WHERE p.id = p_portfolio_id
    GROUP BY p.id, p.name, cb.cash_balance;
END;
$$ LANGUAGE plpgsql;





