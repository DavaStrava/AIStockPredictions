# TradingAgents Integration Plan

> **Status**: Draft for Review
> **Created**: February 8, 2026
> **Source Repo**: https://github.com/DavaStrava/TradingAgents

---

## Overview

Integrate the [TradingAgents](https://github.com/DavaStrava/TradingAgents) multi-agent LLM trading framework into the existing AI Stock Prediction Platform. The goal is to run the multi-agent analysis in the backend and surface results in the dashboard.

---

## Key Findings

### TradingAgents (Python)
- **Multi-agent LLM framework** using LangGraph/LangChain
- **4 hierarchical agent teams**: Analysts (4 parallel) → Researchers (Bull/Bear debate) → Trader → Risk Management
- **Data sources**: yfinance, Alpha Vantage, Reddit (PRAW), Google News, Finnhub
- **Output**: BUY/HOLD/SELL decision with confidence score and reasoning
- **Memory system**: ChromaDB for learning from past trades
- **Entry point**: `TradingAgentsGraph.propagate(symbol, date)` returns full analysis

### Current Platform (TypeScript/Next.js)
- 7-tab portfolio manager (Summary, Holdings, Health, Dividends, Transactions, Allocation, Performance)
- PostgreSQL backend with 3 migrations
- FMP as primary data provider
- Existing patterns: async data fetching, lazy loading tabs, health scoring

---

## Recommended Architecture: Python Microservice

**Why not port to TypeScript?**
- LangGraph orchestration, ChromaDB memory, and multi-agent debate logic are complex Python-native implementations
- Porting would be months of work with high risk
- LangGraph.js is less mature than Python version

**Solution**: Deploy TradingAgents as a **FastAPI microservice** on Render, communicating with Next.js via REST API. Both services share the same PostgreSQL database.

```
┌─────────────────────────────────────────────────────────────┐
│                      User's Browser                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               Next.js App (Existing)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  /api/agent-analysis/* (New API Routes)              │   │
│  │  - POST /api/agent-analysis (trigger analysis)       │   │
│  │  - GET /api/agent-analysis/[jobId] (poll status)     │   │
│  │  - GET /api/agent-analysis/[jobId]/debates (details) │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
           │                                    │
           │ HTTP (trigger/poll)                │ Direct DB reads
           ▼                                    ▼
┌────────────────────────┐        ┌────────────────────────────┐
│  TradingAgents Service │        │     PostgreSQL (Shared)    │
│  (FastAPI - New)       │───────▶│  - agent_analysis_jobs     │
│  (Render Web Service)  │        │  - agent_analysis_results  │
│                        │        │  - agent_team_outputs      │
│  - Run LangGraph       │        │  - agent_debates           │
│  - Store results in DB │        │  - (existing tables)       │
│  - ChromaDB memory     │        └────────────────────────────┘
└────────────────────────┘
```

---

## User Decisions

| Decision | Choice |
|----------|--------|
| **Scope** | Any stock symbol (not limited to portfolio holdings) |
| **Reddit** | Yes, include social sentiment (requires Reddit API credentials) |
| **History** | Store all analyses permanently for review and comparison |

---

## Implementation Phases

### Phase 1: Python Microservice Setup (2 weeks)

**Create new service alongside existing platform**

**New directory structure** (separate repo or subdirectory):
```
trading-agents-service/
├── app/
│   ├── main.py                 # FastAPI entry point
│   ├── config.py               # Environment variables
│   ├── api/routes/
│   │   ├── analysis.py         # POST /api/v1/analysis
│   │   ├── jobs.py             # GET /api/v1/jobs/{id}
│   │   └── health.py           # GET /health
│   ├── services/
│   │   ├── trading_agents.py   # Wrapper for TradingAgentsGraph
│   │   ├── job_manager.py      # Background job handling
│   │   └── postgres_store.py   # Store results in shared DB
│   └── models/
│       ├── requests.py         # Pydantic models
│       └── responses.py
├── requirements.txt
├── Dockerfile
└── render.yaml
```

**Key endpoint**:
```python
@router.post("/api/v1/analysis")
async def create_analysis(request: AnalysisRequest, background_tasks: BackgroundTasks):
    job_id = uuid.uuid4()
    await db.execute(
        "INSERT INTO agent_analysis_jobs (id, symbol, status) VALUES ($1, $2, 'pending')",
        job_id, request.symbol
    )
    background_tasks.add_task(run_trading_agents, job_id, request.symbol)
    return {"job_id": job_id, "status": "pending"}
```

---

### Phase 2: Database Schema (1 week)

**New migration**: `src/lib/database/migrations/004_agent_analysis_schema.sql`

```sql
-- Analysis jobs (tracks async analysis requests)
CREATE TABLE agent_analysis_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE SET NULL,
    symbol VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- status: pending, running, completed, failed
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Final analysis results
CREATE TABLE agent_analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES agent_analysis_jobs(id) ON DELETE CASCADE,
    final_decision VARCHAR(10) CHECK (final_decision IN ('BUY', 'HOLD', 'SELL')),
    confidence_score DECIMAL(3,2),
    reasoning_summary TEXT,
    raw_state JSONB,  -- Full TradingAgents state for debugging
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Individual agent team outputs (for transparency)
CREATE TABLE agent_team_outputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    result_id UUID NOT NULL REFERENCES agent_analysis_results(id) ON DELETE CASCADE,
    team_name VARCHAR(50) NOT NULL,   -- analyst, researcher, trader, risk
    agent_role VARCHAR(100),           -- market_analyst, bull_researcher, etc.
    content JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Debate transcripts (Bull/Bear and Risk debates)
CREATE TABLE agent_debates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    result_id UUID NOT NULL REFERENCES agent_analysis_results(id) ON DELETE CASCADE,
    debate_type VARCHAR(50) NOT NULL,  -- bull_bear, risk_assessment
    transcript JSONB NOT NULL,
    conclusion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_agent_jobs_symbol ON agent_analysis_jobs(symbol);
CREATE INDEX idx_agent_jobs_status ON agent_analysis_jobs(status);
CREATE INDEX idx_agent_jobs_portfolio ON agent_analysis_jobs(portfolio_id);
CREATE INDEX idx_agent_jobs_created ON agent_analysis_jobs(created_at DESC);
CREATE INDEX idx_agent_results_job ON agent_analysis_results(job_id);
```

---

### Phase 3: Next.js API Integration (1 week)

**New API routes**:

`src/app/api/agent-analysis/route.ts`:
```typescript
export async function POST(req: Request) {
  const { symbol, portfolioId } = await req.json();

  // Call Python microservice
  const response = await fetch(`${process.env.AGENT_SERVICE_URL}/api/v1/analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Service-Key': process.env.AGENT_SERVICE_KEY
    },
    body: JSON.stringify({ symbol, portfolio_id: portfolioId })
  });

  return Response.json(await response.json());
}
```

`src/app/api/agent-analysis/[jobId]/route.ts`:
```typescript
export async function GET(req: Request, { params }: { params: { jobId: string } }) {
  // Query shared PostgreSQL directly
  const result = await db.query(`
    SELECT j.*, r.final_decision, r.confidence_score, r.reasoning_summary
    FROM agent_analysis_jobs j
    LEFT JOIN agent_analysis_results r ON r.job_id = j.id
    WHERE j.id = $1
  `, [params.jobId]);

  return Response.json({ data: result.rows[0] });
}
```

`src/app/api/agent-analysis/[jobId]/debates/route.ts`:
```typescript
export async function GET(req: Request, { params }: { params: { jobId: string } }) {
  const debates = await db.query(`
    SELECT d.debate_type, d.transcript, d.conclusion
    FROM agent_debates d
    JOIN agent_analysis_results r ON r.id = d.result_id
    JOIN agent_analysis_jobs j ON j.id = r.job_id
    WHERE j.id = $1
    ORDER BY d.created_at
  `, [params.jobId]);

  return Response.json({ debates: debates.rows });
}
```

---

### Phase 4: Dashboard Integration (1 week)

**Modify**: `src/components/portfolio/PortfolioManager.tsx`

Add new tab to `TABS` array:
```typescript
import { Brain } from 'lucide-react';

// Add to TABS array:
{ id: 'ai-analysis', label: 'AI Analysis', icon: <Brain className="w-4 h-4" /> }
```

**New components**:

| Component | Purpose |
|-----------|---------|
| `AgentAnalysisTab.tsx` | Main tab with symbol search and results display |
| `AgentDecisionCard.tsx` | BUY/HOLD/SELL display with confidence gauge |
| `AgentDebateViewer.tsx` | Expandable Bull/Bear and Risk debate transcripts |
| `AgentProgressIndicator.tsx` | Visual progress: Analysts → Researchers → Trader → Risk |
| `AgentHistoryList.tsx` | Past analyses for the same stock |
| `hooks/useAgentAnalysis.ts` | Polling hook for job status |

**UI Flow**:
1. User enters a stock symbol (or selects from holdings)
2. Clicks "Run AI Analysis" button
3. Progress indicator shows agent teams working (30-120 seconds)
4. Results display: Decision card + debate transcripts + team breakdowns
5. Previous analyses shown below for comparison

---

### Phase 5: Polish & Optimization (1 week)

- **Caching**: Cache analysis results (4-hour TTL) to avoid redundant LLM calls
- **Rate limiting**: 5 analyses per minute, 20 per hour per user
- **Cost tracking**: Log token usage per analysis (~40k tokens ≈ $0.04 with GPT-4o-mini)
- **Error handling**: Graceful failure states, retry logic
- **Loading states**: Skeleton loaders, progress percentages

---

## Environment Variables

### Next.js (add to `.env.local`):
```bash
# TradingAgents Service
AGENT_SERVICE_URL=https://trading-agents-service.onrender.com
AGENT_SERVICE_KEY=<generate-a-secure-key>
```

### Python Service (`.env`):
```bash
# LLM Provider
OPENAI_API_KEY=<required>

# Data Sources
ALPHA_VANTAGE_API_KEY=<required>
REDDIT_CLIENT_ID=<required-for-social-sentiment>
REDDIT_CLIENT_SECRET=<required-for-social-sentiment>

# Shared Database (same as Next.js)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Inter-service Auth
SERVICE_KEY=<same-as-nextjs>

# ChromaDB (for agent memory)
CHROMADB_PATH=/data/chromadb
```

---

## Required API Keys

Before implementation, obtain these:

| API | Purpose | Link |
|-----|---------|------|
| OpenAI | LLM inference for agents | [platform.openai.com](https://platform.openai.com) |
| Alpha Vantage | Fundamentals & news data | [alphavantage.co](https://www.alphavantage.co/support/#api-key) (free tier available) |
| Reddit | Social sentiment analysis | [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps) |

---

## Files to Modify (Existing)

| File | Change |
|------|--------|
| `src/components/portfolio/PortfolioManager.tsx` | Add 'ai-analysis' tab, update TabId type |
| `src/types/portfolio.ts` | Add AgentAnalysis, AgentJob, AgentDebate types |
| `.env.local` | Add AGENT_SERVICE_URL, AGENT_SERVICE_KEY |

---

## Files to Create (New)

### Next.js API Routes
- `src/app/api/agent-analysis/route.ts`
- `src/app/api/agent-analysis/[jobId]/route.ts`
- `src/app/api/agent-analysis/[jobId]/debates/route.ts`
- `src/app/api/agent-analysis/history/route.ts`

### React Components
- `src/components/portfolio/AgentAnalysisTab.tsx`
- `src/components/portfolio/AgentDecisionCard.tsx`
- `src/components/portfolio/AgentDebateViewer.tsx`
- `src/components/portfolio/AgentProgressIndicator.tsx`
- `src/components/portfolio/AgentHistoryList.tsx`
- `src/components/portfolio/hooks/useAgentAnalysis.ts`

### Database
- `src/lib/database/migrations/004_agent_analysis_schema.sql`

### Python Service (separate directory)
- `trading-agents-service/` (full structure above)

---

## Verification Plan

1. **Unit tests**: Mock LangGraph for Python service tests
2. **Integration tests**: Mock Python service in Next.js tests
3. **Manual testing**:
   - Trigger analysis for AAPL, verify completion in < 2 minutes
   - Verify BUY/HOLD/SELL decision displays correctly
   - Check debate transcripts expand/collapse properly
   - Verify job status polling works
   - Test error handling (invalid symbol, service timeout)
4. **Cost verification**: Confirm ~$0.04 per analysis with GPT-4o-mini

---

## Timeline Summary

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| 1. Python Microservice | 2 weeks | FastAPI service, Docker, Render deploy |
| 2. Database Schema | 1 week | Migration 004, indexes |
| 3. Next.js API | 1 week | Proxy routes, job polling |
| 4. Dashboard | 1 week | New tab, 5 components |
| 5. Polish | 1 week | Caching, rate limiting, errors |
| **Total** | **6 weeks** | Full integration |

---

## Cost Estimates

| Item | Cost |
|------|------|
| OpenAI API (per analysis) | ~$0.04 (GPT-4o-mini) |
| Render Python Service | $7/month (Starter plan) |
| Alpha Vantage | Free tier (5 calls/min) |
| Reddit API | Free |

**Monthly estimate**: ~$10-20 depending on analysis volume

---

## Next Steps

1. Review this plan and provide feedback
2. Obtain required API keys (Alpha Vantage, Reddit)
3. Decide: separate repo for Python service or monorepo subdirectory?
4. Begin Phase 1 implementation
