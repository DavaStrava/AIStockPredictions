# AI Insights Improvements - Design

## Overview

This design document outlines the approach to fix data accuracy issues in the three AI insight types: Technical Analysis, Portfolio Theory, and Sentiment Analysis.

## Approach: Fix the Prompts (Phase 1)

Rather than integrating new data sources immediately, we'll reframe the prompts to be honest about what data is available and generate valuable insights from actual data.

### Phase 2 (Future) can add real data sources for Portfolio and Sentiment.

---

## 1. Technical Analysis Changes

### Problem
- `compactTechnical()` passes last 5 values of RSI, MACD, etc.
- AI describes trend: "RSI went from 88 to 23"
- UI panel shows current RSI: 23.5
- User sees mismatch

### Solution
Pass **current values explicitly** alongside the trend data, and instruct AI to:
1. Lead with current values that match the UI panel
2. Provide trend context as secondary information

### Data Structure Change
```typescript
// Before: Just arrays
indicators: {
  rsi: [45, 52, 61, 38, 23.5],  // Last 5 values
  macd: [...]
}

// After: Current + trend
indicators: {
  current: {
    rsi: 23.5,
    macd: { macd: -2.5, signal: -1.8, histogram: -0.7 }
  },
  trend: {
    rsi: [45, 52, 61, 38, 23.5],  // For context
    macd: [...]
  }
}
```

### Prompt Change
Add to technical system prompt:
```
IMPORTANT: The user's Technical Indicators panel shows these CURRENT values:
- RSI: {current.rsi}
- MACD: {current.macd}
Your analysis must reference these exact current values first, then discuss trends.
```

---

## 2. Portfolio Theory Changes

### Problem
- Receives `TechnicalAnalysisResult` (no portfolio data)
- Prompt asks about Sharpe ratio, beta, correlations
- AI hallucinates these metrics

### Solution: Reframe as "Position Management"
Change the insight type from "Portfolio Theory" to "Position Management" and focus on:
- What technical signals suggest for position sizing
- Risk considerations based on volatility and trend
- Entry/exit level implications
- Stop-loss considerations

### Prompt Change
Replace portfolio prompt with:
```
For position management analysis, provide insights on:

**Position Sizing Considerations**: Based on current volatility and trend strength,
discuss general position sizing principles (percentage-based, not dollar amounts).

**Risk Management**: What do the technical signals suggest about setting stop-losses
and managing downside risk?

**Entry/Exit Timing**: Based on support/resistance and momentum indicators,
discuss timing considerations for building or reducing positions.

**Volatility Assessment**: How does current volatility compare to recent history,
and what does this mean for position management?

NOTE: This analysis is based on technical indicators only. For full portfolio
optimization (beta, correlations, Sharpe ratio), additional data would be needed.
```

### UI Label Change
- Change tab label from "Portfolio Theory" to "Position Management"
- Add subtitle: "Based on technical analysis"

---

## 3. Sentiment Analysis Changes

### Problem
- Receives `TechnicalAnalysisResult` (no sentiment data)
- Prompt asks about institutional vs retail behavior
- AI invents sentiment narratives

### Solution: Reframe as "Technical Psychology"
Change the insight type from "Sentiment Analysis" to "Technical Psychology" and focus on:
- What RSI overbought/oversold suggests about crowd behavior
- Volume patterns and what they indicate
- Price action psychology (support bounces, resistance rejections)
- Fear/greed indicators derived from technical data

### Prompt Change
Replace sentiment prompt with:
```
For technical psychology analysis, provide insights on:

**Crowd Behavior Signals**: What do RSI extremes (overbought/oversold) and
Stochastic readings suggest about current market psychology?

**Volume Psychology**: What does recent volume pattern suggest about
conviction behind price moves?

**Support/Resistance Psychology**: How are traders behaving around key
technical levels? Are they defending support or attacking resistance?

**Momentum Psychology**: What does the MACD histogram and trend strength
suggest about bullish vs bearish conviction?

NOTE: This analysis interprets technical indicators as proxies for market
psychology. For true sentiment analysis, news/social data would be needed.
```

### UI Label Change
- Change tab label from "Market Sentiment" to "Technical Psychology"
- Add subtitle: "Derived from price & volume patterns"

---

## File Changes Summary

| File | Changes |
|------|---------|
| `src/lib/ai/llm-providers.ts` | Update prompts, modify `compactTechnical()` |
| `src/components/AIInsights.tsx` | Update tab labels and subtitles |
| `src/lib/ai/llm-providers.ts` | Update `LLMInsight.type` union if needed |

---

## Alternative: Add Real Data Sources (Phase 2)

If we want genuine Portfolio and Sentiment insights later:

### Portfolio Data (via FMP API)
- Company profile: sector, market cap, beta
- Key metrics: PE ratio, dividend yield
- Could calculate simple Sharpe from historical returns

### Sentiment Data (via FMP API)
- `/api/v3/stock_news` - News with sentiment
- `/api/v4/social-sentiment` - Social media sentiment (if available)
- Insider trading data

This would require:
1. New API calls in the insights route
2. New data structures for each insight type
3. More complex prompt building

---

## Testing Considerations

1. **Consistency Test**: Verify RSI value in AI narrative matches UI panel
2. **Hallucination Test**: Check that AI doesn't mention Sharpe/beta/correlations
3. **Honesty Test**: Verify disclaimers about data source limitations appear
4. **User Clarity Test**: Confirm new labels accurately describe content
