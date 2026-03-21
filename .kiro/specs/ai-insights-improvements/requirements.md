# AI Insights Improvements - Requirements

## Problem Statement

The AI-powered insights feature has three analysis types (Technical, Portfolio, Sentiment) that suffer from data accuracy and consistency issues:

1. **Technical Analysis** - Shows historical RSI trends while the UI panel shows current values, creating user confusion
2. **Portfolio Theory** - Receives technical analysis data but hallucinates portfolio metrics (Sharpe ratio, beta, correlations) that don't exist in the input
3. **Sentiment Analysis** - Receives technical analysis data but invents institutional/retail sentiment narratives without actual sentiment data

## Current State

| Type | Has Correct Data? | Status |
|------|------------------|--------|
| Technical | ✅ Yes | Current values separated from trends, prompts aligned |
| Portfolio | ✅ Yes | Real portfolio data from DB, held/not-held modes |
| Sentiment | ✅ Yes | Renamed to "Technical Psychology", derived from indicators |

**Phase 1 Implementation Complete (March 2026)**

### Technical Details

All three insight types currently receive the same `TechnicalAnalysisResult`:
```typescript
{
  summary: { overall, trendDirection, volatility, strength },
  signals: [{ type, strength, direction }...],
  indicators: { rsi: [...], macd: [...], bollingerBands: [...] }
}
```

- Technical analysis prompts receive last 5 values of each indicator array
- Portfolio prompts ask about Sharpe ratio, beta, correlations (not provided)
- Sentiment prompts ask about institutional vs retail behavior (not provided)

## Requirements

### REQ-1: Technical Analysis Accuracy
- AI narrative must reference the **same RSI/MACD values** shown in the Technical Indicators panel
- User should not see conflicting information between narrative and data panels
- Historical trend context is acceptable but must be clearly distinguished from current values

### REQ-2: Portfolio Theory Data Integrity
- Portfolio insights must use the user's **actual portfolio data**
- **If stock is held**: Analyze existing position (cost basis, return, sizing recommendations)
- **If stock is NOT held**: Analyze as potential addition (entry point, position sizing based on portfolio size, diversification impact)
- No hallucinated Sharpe ratios, betas, or correlation values
- Insights should be specific to the user's situation

### REQ-3: Sentiment Analysis Data Integrity
- Sentiment insights must only reference data that actually exists
- If real sentiment data is not available, the prompt must be reframed to discuss "technical sentiment indicators" derived from RSI, volume, and price action
- No invented institutional/retail narratives without supporting data

### REQ-4: Data Source Transparency
- Each insight should indicate what data sources it's based on
- Users should understand whether they're seeing real sentiment data or technical-derived psychology

## Success Criteria

1. No user-reported confusion between AI narrative values and UI panel values
2. All referenced metrics in AI narratives are traceable to actual input data
3. Clear labeling of insight types and their data sources
4. Insights provide genuine value without misleading users

## Out of Scope (Phase 2 - Optional)

- Real-time sentiment data from external providers
- News/social sentiment aggregation

Phase 2 is optional. "Technical Psychology" may be sufficient for personal use. If sentiment is desired, pick one provider and implement directly (no elaborate architecture needed).
