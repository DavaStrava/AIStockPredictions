# AI Insights Improvements - Design

## Overview

This design document outlines the approach to fix data accuracy issues in the three AI insight types: Technical Analysis, Portfolio Theory, and Sentiment Analysis.

## Implementation Status: PHASE 1 COMPLETE ✅

Phase 1 has been fully implemented (March 2026). All prompts have been reframed to use actual data and eliminate hallucinations.

### Phase 2 (Future) can add real data sources for Sentiment if needed.

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

### Solution: Use Real Portfolio Data
Fetch the user's actual portfolio data for the analyzed stock and provide genuine portfolio insights.

### Data Requirements
```typescript
// Always fetch portfolio context
interface PortfolioContext {
  totalEquity: number;
  cashBalance: number;
  positionCount: number;
}

// Fetch position data if held (null if not)
interface PositionData {
  symbol: string;
  totalQuantity: number;
  averageCostBasis: number;
  currentPrice: number;
  marketValue: number;
  totalReturnPercent: number;
  positionWeight: number;  // % of total portfolio
}

// Return both
{
  portfolio: PortfolioContext;
  position: PositionData | null;
}
```

If user has multiple portfolios, aggregate across all.

### Conditional Behavior
1. **If stock IS in portfolio**: Analyze existing position (cost basis, return, whether to add/reduce)
2. **If stock is NOT in portfolio**: Analyze as potential addition (sizing suggestions based on portfolio size, diversification considerations)

### Prompt Change

**If stock IS in portfolio:**
```
You have access to the user's actual position in {symbol}:

- Shares owned: {totalQuantity}
- Average cost: ${averageCostBasis}
- Current price: ${currentPrice}
- Position value: ${marketValue}
- Total return: {totalReturnPercent}%

Portfolio context:
- Total portfolio value: ${totalEquity}
- This position is {positionWeight}% of portfolio

Provide insights on:
1. How is this position performing relative to cost basis?
2. Given the technical signals, should they consider adding, holding, or reducing?
3. Any risk considerations based on position size and current volatility?
```

**If stock is NOT in portfolio:**
```
The user does not currently hold {symbol} but may be considering adding it.

Portfolio context:
- Total portfolio value: ${totalEquity}
- Cash available: ${cashBalance}
- Current number of positions: {positionCount}

Provide insights on:
1. Based on the technical signals, is this a good entry point?
2. Position sizing suggestion (e.g., "a 3-5% allocation would be ${X}-${Y}")
3. How would adding this stock affect portfolio diversification?
4. Any timing considerations based on current volatility?
```

### UI Label Change
- Keep tab label as "Portfolio Theory"
- Subtitle: "Based on your position" (if held) or "Considering adding" (if not held)

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

## File Changes Summary (Completed)

| File | Changes |
|------|---------|
| `src/lib/ai/llm-providers.ts` | Updated prompts, `compactTechnical()`, added `safeFixed()` and psychology helpers |
| `src/app/api/insights/route.ts` | Added `getPortfolioInsightData()` and `generateInsightsWithContext()` |
| `src/components/AIInsights.tsx` | Updated tab labels, subtitles, and TypeScript types |
| `src/types/components.ts` | Added `position_held` and `generatedAt` to metadata |
| `src/lib/ai/__tests__/llm-providers.test.ts` | Added 32 new tests |
| `src/app/api/insights/__tests__/route.test.ts` | Added 15 new tests |

---

## Phase 2: Real Sentiment Data (Future - Optional)

> **Personal app context**: This phase is optional. "Technical Psychology" from Phase 1 may be sufficient. Only implement if you find sentiment data valuable.

### Decision Point
Before implementing, decide:
1. **Skip it** - Technical Psychology is good enough
2. **TradingAgents** - Get sentiment from that integration (separate project)
3. **Simple API** - Add one sentiment source directly

### If Implementing: Keep It Simple
Don't build a provider registry. Just:
```typescript
// In /api/insights route
async function getSentiment(symbol: string): Promise<SentimentData | null> {
  if (!process.env.SENTIMENT_API_KEY) return null;

  // Direct API call to chosen provider
  const response = await fetch(`https://api.provider.com/sentiment/${symbol}`);
  // ... parse and return
}
```

### Potential Sources
| Source | Pros | Cons |
|--------|------|------|
| TradingAgents | Multi-source, already planned | Separate project dependency |
| Finnhub | News + social | Requires API key |
| Alpha Vantage | News sentiment | Limited free tier |

### Fallback Behavior
If sentiment fetch fails or isn't configured → use "Technical Psychology" (Phase 1 behavior)

---

## Testing Considerations

1. **Consistency Test**: Verify RSI value in AI narrative matches UI panel
2. **Hallucination Test**: Check that AI doesn't mention Sharpe/beta/correlations
3. **Honesty Test**: Verify disclaimers about data source limitations appear
4. **User Clarity Test**: Confirm new labels accurately describe content
