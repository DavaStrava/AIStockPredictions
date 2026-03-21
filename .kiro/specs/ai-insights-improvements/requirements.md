# AI Insights Improvements - Requirements

## Problem Statement

The AI-powered insights feature has three analysis types (Technical, Portfolio, Sentiment) that suffer from data accuracy and consistency issues:

1. **Technical Analysis** - Shows historical RSI trends while the UI panel shows current values, creating user confusion
2. **Portfolio Theory** - Receives technical analysis data but hallucinates portfolio metrics (Sharpe ratio, beta, correlations) that don't exist in the input
3. **Sentiment Analysis** - Receives technical analysis data but invents institutional/retail sentiment narratives without actual sentiment data

## Current State

| Type | Has Correct Data? | Problem |
|------|------------------|---------|
| Technical | ✅ Partial | Historical trend vs current value mismatch |
| Portfolio | ❌ No | Hallucinating metrics from wrong data source |
| Sentiment | ❌ No | Inventing sentiment from wrong data source |

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
- Portfolio insights must only reference metrics that exist in the input data
- If real portfolio data is not available, the prompt must be reframed to discuss "position management considerations" based on technical signals
- No hallucinated Sharpe ratios, betas, or correlation values

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

## Out of Scope (Future Considerations)

- Integrating real-time news sentiment API
- Options flow / put-call ratio data
- Social media sentiment analysis
- Insider trading data integration

These could be added later to provide genuine sentiment data.
