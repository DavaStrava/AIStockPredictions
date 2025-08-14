-- AI Stock Prediction Database Schema
-- Migration 001: Initial schema with pgvector extension

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create watchlists table
CREATE TABLE IF NOT EXISTS watchlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for watchlists
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_created_at ON watchlists(created_at);

-- Create watchlist_stocks table
CREATE TABLE IF NOT EXISTS watchlist_stocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    watchlist_id UUID REFERENCES watchlists(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(watchlist_id, symbol)
);

-- Create indexes for watchlist_stocks
CREATE INDEX IF NOT EXISTS idx_watchlist_stocks_watchlist_id ON watchlist_stocks(watchlist_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_stocks_symbol ON watchlist_stocks(symbol);

-- Create predictions table
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(10) NOT NULL,
    prediction_date DATE NOT NULL,
    target_price DECIMAL(10,2),
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    time_horizon VARCHAR(20) CHECK (time_horizon IN ('1d', '1w', '1m', '3m')),
    technical_signals JSONB,
    portfolio_metrics JSONB,
    sentiment_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for predictions
CREATE INDEX IF NOT EXISTS idx_predictions_symbol ON predictions(symbol);
CREATE INDEX IF NOT EXISTS idx_predictions_date ON predictions(prediction_date);
CREATE INDEX IF NOT EXISTS idx_predictions_symbol_date ON predictions(symbol, prediction_date);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions(created_at);
CREATE INDEX IF NOT EXISTS idx_predictions_confidence ON predictions(confidence_score);

-- Create GIN index for JSONB columns
CREATE INDEX IF NOT EXISTS idx_predictions_technical_signals ON predictions USING GIN (technical_signals);
CREATE INDEX IF NOT EXISTS idx_predictions_portfolio_metrics ON predictions USING GIN (portfolio_metrics);
CREATE INDEX IF NOT EXISTS idx_predictions_sentiment_data ON predictions USING GIN (sentiment_data);

-- Create backtest_results table
CREATE TABLE IF NOT EXISTS backtest_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    strategy_name VARCHAR(100) NOT NULL,
    parameters JSONB NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_return DECIMAL(8,4),
    sharpe_ratio DECIMAL(6,4),
    max_drawdown DECIMAL(6,4),
    win_rate DECIMAL(5,4) CHECK (win_rate >= 0 AND win_rate <= 1),
    trade_count INTEGER CHECK (trade_count >= 0),
    results_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for backtest_results
CREATE INDEX IF NOT EXISTS idx_backtest_results_user_id ON backtest_results(user_id);
CREATE INDEX IF NOT EXISTS idx_backtest_results_strategy ON backtest_results(strategy_name);
CREATE INDEX IF NOT EXISTS idx_backtest_results_dates ON backtest_results(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_backtest_results_performance ON backtest_results(total_return, sharpe_ratio);
CREATE INDEX IF NOT EXISTS idx_backtest_results_created_at ON backtest_results(created_at);

-- Create GIN index for parameters and results_data
CREATE INDEX IF NOT EXISTS idx_backtest_results_parameters ON backtest_results USING GIN (parameters);
CREATE INDEX IF NOT EXISTS idx_backtest_results_data ON backtest_results USING GIN (results_data);

-- Create insights table with vector embeddings
CREATE TABLE IF NOT EXISTS insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(10),
    insight_type VARCHAR(50) CHECK (insight_type IN ('technical', 'portfolio', 'sentiment')),
    content TEXT NOT NULL,
    llm_provider VARCHAR(20) CHECK (llm_provider IN ('openai', 'bedrock')),
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    metadata JSONB,
    embedding VECTOR(1536), -- OpenAI embedding dimension
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for insights
CREATE INDEX IF NOT EXISTS idx_insights_symbol ON insights(symbol);
CREATE INDEX IF NOT EXISTS idx_insights_type ON insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_insights_symbol_type ON insights(symbol, insight_type);
CREATE INDEX IF NOT EXISTS idx_insights_created_at ON insights(created_at);
CREATE INDEX IF NOT EXISTS idx_insights_expires_at ON insights(expires_at);
CREATE INDEX IF NOT EXISTS idx_insights_provider ON insights(llm_provider);

-- Create GIN index for metadata
CREATE INDEX IF NOT EXISTS idx_insights_metadata ON insights USING GIN (metadata);

-- Create vector similarity index for embeddings (using HNSW for better performance)
CREATE INDEX IF NOT EXISTS idx_insights_embedding ON insights USING hnsw (embedding vector_cosine_ops);

-- Create market_data table for caching frequently accessed data
CREATE TABLE IF NOT EXISTS market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(10) NOT NULL,
    date DATE NOT NULL,
    open_price DECIMAL(10,2),
    high_price DECIMAL(10,2),
    low_price DECIMAL(10,2),
    close_price DECIMAL(10,2),
    volume BIGINT,
    adjusted_close DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(symbol, date)
);

-- Create indexes for market_data
CREATE INDEX IF NOT EXISTS idx_market_data_symbol ON market_data(symbol);
CREATE INDEX IF NOT EXISTS idx_market_data_date ON market_data(date);
CREATE INDEX IF NOT EXISTS idx_market_data_symbol_date ON market_data(symbol, date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_watchlists_updated_at BEFORE UPDATE ON watchlists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function for vector similarity search
CREATE OR REPLACE FUNCTION find_similar_insights(
    query_embedding VECTOR(1536),
    similarity_threshold FLOAT DEFAULT 0.8,
    max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    symbol VARCHAR(10),
    insight_type VARCHAR(50),
    content TEXT,
    confidence_score DECIMAL(3,2),
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.symbol,
        i.insight_type,
        i.content,
        i.confidence_score,
        1 - (i.embedding <=> query_embedding) as similarity
    FROM insights i
    WHERE i.embedding IS NOT NULL
        AND (1 - (i.embedding <=> query_embedding)) > similarity_threshold
        AND (i.expires_at IS NULL OR i.expires_at > CURRENT_TIMESTAMP)
    ORDER BY i.embedding <=> query_embedding
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up expired insights
CREATE OR REPLACE FUNCTION cleanup_expired_insights()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM insights 
    WHERE expires_at IS NOT NULL 
        AND expires_at < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create view for recent predictions with performance metrics
CREATE OR REPLACE VIEW recent_predictions AS
SELECT 
    p.id,
    p.symbol,
    p.prediction_date,
    p.target_price,
    p.confidence_score,
    p.time_horizon,
    p.created_at,
    md.close_price as current_price,
    CASE 
        WHEN p.target_price IS NOT NULL AND md.close_price IS NOT NULL 
        THEN ((p.target_price - md.close_price) / md.close_price * 100)
        ELSE NULL 
    END as predicted_return_pct
FROM predictions p
LEFT JOIN market_data md ON p.symbol = md.symbol 
    AND md.date = (
        SELECT MAX(date) 
        FROM market_data md2 
        WHERE md2.symbol = p.symbol
    )
WHERE p.created_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY p.created_at DESC;

-- Grant permissions (adjust as needed for your Lambda execution role)
-- These would typically be handled by your Lambda execution role
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO lambda_execution_role;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO lambda_execution_role;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO lambda_execution_role;