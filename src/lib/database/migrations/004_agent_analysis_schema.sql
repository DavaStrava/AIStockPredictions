-- Agent Analysis Schema
-- Migration 004: TradingAgents multi-agent analysis integration

-- Create enum type for job status
DO $$ BEGIN
    CREATE TYPE agent_job_status AS ENUM ('pending', 'running', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum type for analysis decision
DO $$ BEGIN
    CREATE TYPE agent_decision AS ENUM ('BUY', 'HOLD', 'SELL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Agent Analysis Jobs - Tracks async analysis requests
CREATE TABLE IF NOT EXISTS agent_analysis_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE SET NULL,
    symbol VARCHAR(20) NOT NULL,
    status agent_job_status NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for agent_analysis_jobs
CREATE INDEX IF NOT EXISTS idx_agent_jobs_symbol ON agent_analysis_jobs(symbol);
CREATE INDEX IF NOT EXISTS idx_agent_jobs_status ON agent_analysis_jobs(status);
CREATE INDEX IF NOT EXISTS idx_agent_jobs_portfolio ON agent_analysis_jobs(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_agent_jobs_created ON agent_analysis_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_jobs_symbol_created ON agent_analysis_jobs(symbol, created_at DESC);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_agent_analysis_jobs_updated_at ON agent_analysis_jobs;
CREATE TRIGGER update_agent_analysis_jobs_updated_at
    BEFORE UPDATE ON agent_analysis_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Agent Analysis Results - Final analysis output
CREATE TABLE IF NOT EXISTS agent_analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES agent_analysis_jobs(id) ON DELETE CASCADE,
    final_decision agent_decision NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    reasoning_summary TEXT NOT NULL,
    raw_state JSONB, -- Full TradingAgents state for debugging
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for agent_analysis_results
CREATE INDEX IF NOT EXISTS idx_agent_results_job ON agent_analysis_results(job_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_results_job_unique ON agent_analysis_results(job_id);

-- 3. Agent Team Outputs - Individual agent team contributions
CREATE TABLE IF NOT EXISTS agent_team_outputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    result_id UUID NOT NULL REFERENCES agent_analysis_results(id) ON DELETE CASCADE,
    team_name VARCHAR(50) NOT NULL, -- analyst, researcher, trader, risk
    agent_role VARCHAR(100), -- market_analyst, bull_researcher, etc.
    content JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for agent_team_outputs
CREATE INDEX IF NOT EXISTS idx_agent_team_outputs_result ON agent_team_outputs(result_id);
CREATE INDEX IF NOT EXISTS idx_agent_team_outputs_team ON agent_team_outputs(team_name);

-- 4. Agent Debates - Bull/Bear and Risk debate transcripts
CREATE TABLE IF NOT EXISTS agent_debates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    result_id UUID NOT NULL REFERENCES agent_analysis_results(id) ON DELETE CASCADE,
    debate_type VARCHAR(50) NOT NULL, -- bull_bear, risk_assessment
    transcript JSONB NOT NULL,
    conclusion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for agent_debates
CREATE INDEX IF NOT EXISTS idx_agent_debates_result ON agent_debates(result_id);
CREATE INDEX IF NOT EXISTS idx_agent_debates_type ON agent_debates(debate_type);

-- 5. View for recent analyses per symbol
CREATE OR REPLACE VIEW recent_agent_analyses AS
SELECT
    j.id as job_id,
    j.symbol,
    j.status,
    j.created_at,
    j.completed_at,
    r.final_decision,
    r.confidence_score,
    r.reasoning_summary
FROM agent_analysis_jobs j
LEFT JOIN agent_analysis_results r ON r.job_id = j.id
ORDER BY j.created_at DESC;

-- 6. Function to get analysis history for a symbol
CREATE OR REPLACE FUNCTION get_agent_analysis_history(p_symbol VARCHAR(20), p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    job_id UUID,
    symbol VARCHAR(20),
    status agent_job_status,
    final_decision agent_decision,
    confidence_score DECIMAL(3,2),
    reasoning_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        j.id as job_id,
        j.symbol,
        j.status,
        r.final_decision,
        r.confidence_score,
        r.reasoning_summary,
        j.created_at,
        j.completed_at
    FROM agent_analysis_jobs j
    LEFT JOIN agent_analysis_results r ON r.job_id = j.id
    WHERE j.symbol = p_symbol
    ORDER BY j.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
