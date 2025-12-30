-- Trading Journal Database Schema
-- Migration 002: Trades table for P&L tracking

-- Create enum types for trade side and status
DO $$ BEGIN
    CREATE TYPE trade_side AS ENUM ('LONG', 'SHORT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE trade_status AS ENUM ('OPEN', 'CLOSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create trades table
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL,
    side trade_side NOT NULL,
    status trade_status NOT NULL DEFAULT 'OPEN',
    
    entry_price DECIMAL(12, 4) NOT NULL CHECK (entry_price > 0),
    quantity DECIMAL(12, 4) NOT NULL CHECK (quantity > 0),
    entry_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    exit_price DECIMAL(12, 4) CHECK (exit_price > 0 OR exit_price IS NULL),
    exit_date TIMESTAMP WITH TIME ZONE,
    fees DECIMAL(10, 2) DEFAULT 0 CHECK (fees >= 0),
    
    realized_pnl DECIMAL(14, 4),
    notes TEXT,
    prediction_id UUID REFERENCES predictions(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_entry_date ON trades(entry_date);
CREATE INDEX IF NOT EXISTS idx_trades_user_status ON trades(user_id, status);
CREATE INDEX IF NOT EXISTS idx_trades_user_symbol ON trades(user_id, symbol);

-- Create trigger for updated_at (reuses function from migration 001)
DROP TRIGGER IF EXISTS update_trades_updated_at ON trades;
CREATE TRIGGER update_trades_updated_at 
    BEFORE UPDATE ON trades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
