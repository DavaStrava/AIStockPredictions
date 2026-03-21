# AI Insights Improvements - Tasks

## Status: PHASE 1 COMPLETE

## Phase 1: Fix Prompts & Labels (No New Data Sources) ✅

### Task 1: Technical Analysis - Current Value Alignment ✅
- [x] 1.1 Modify `compactTechnical()` to separate current values from trend arrays
- [x] 1.2 Update technical prompt to explicitly reference current values
- [x] 1.3 Add instruction to lead with current values, then discuss trends
- [x] 1.4 Test that AI narrative RSI matches Technical Indicators panel RSI

### Task 2: Portfolio Theory → Real Portfolio Data ✅
- [x] 2.1 Create `getPortfolioInsightData(symbol)` helper in insights API
  - Gets current user ID via `getDemoUserId()`
  - Aggregates data across all user portfolios using `Promise.allSettled`
  - Returns `{ portfolio: {...}, position: {...} | null, isHeld: boolean }`
- [x] 2.2 Update `/api/insights` route to fetch portfolio context
  - Passes portfolio context for portfolio insight type
  - Includes position data if stock is held
- [x] 2.3 Rewrite `getSystemPrompt('portfolio')` with two modes:
  - **If held**: Analyze existing position (cost basis, return, add/hold/reduce)
  - **If not held**: Analyze as potential addition (sizing, entry point, diversification)
- [x] 2.4 Update UI tab subtitle:
  - "Based on your position" (if held)
  - "Considering adding" (if not held)

### Task 3: Sentiment Analysis → Technical Psychology ✅
- [x] 3.1 Rewrite `getSystemPrompt('sentiment')` to focus on technical psychology
- [x] 3.2 Remove references to institutional/retail behavior
- [x] 3.3 Focus on RSI extremes, volume patterns, support/resistance behavior
- [x] 3.4 Add disclaimer about technical-derived psychology
- [x] 3.5 Update UI tab label in `AIInsights.tsx` to "Technical Psychology"
- [x] 3.6 Add subtitle "Derived from price & volume patterns"

### Task 4: Testing & Validation ✅
- [x] 4.1 Unit tests for `safeFixed()`, `compactTechnical()`, psychology helpers
- [x] 4.2 Unit tests for portfolio context fetching (15 tests)
- [x] 4.3 Prompt structure tests for all three insight types
- [x] 4.4 Code review and critical issue fixes (N+1 query, null safety)

---

## Phase 2: Real Sentiment Data (Future)

> **Note**: Keep this simple. Pick one provider, implement it directly. Refactor if you switch providers later.

### Task 5: Choose and Implement Sentiment Source
- [ ] 5.1 Decide on sentiment data source:
  - Option A: TradingAgents integration (if proceeding with that project)
  - Option B: Single API (Finnhub, Alpha Vantage, or FMP news)
  - Option C: Skip sentiment entirely, keep "Technical Psychology"
- [ ] 5.2 Implement sentiment fetch in `/api/insights` route
  - Simple function, not an elaborate provider system
  - Cache results (4-hour TTL)
- [ ] 5.3 Update `getSystemPrompt('sentiment')` to use real data when available
- [ ] 5.4 Fall back to "Technical Psychology" if API unavailable or not configured

### Task 6: UI Updates (if implementing sentiment)
- [ ] 6.1 Rename tab to "Market Sentiment" when real data present
- [ ] 6.2 Keep "Technical Psychology" label when using fallback
- [ ] 6.3 Show simple indicator if using real vs derived sentiment

---

## Dependencies

- Phase 1:
  - Existing `portfolio_holdings` and `portfolios` tables
  - `getDemoUserId()` for user context
- Phase 2:
  - API credentials for chosen sentiment provider (if implementing)
  - OR TradingAgents integration (separate project)

## Estimated Effort

| Phase | Effort | Priority |
|-------|--------|----------|
| Phase 1 | 3-4 hours | HIGH - Fix misleading content |
| Phase 2 | 2-4 hours | LOW - Only if sentiment data is valuable to you |

## Notes

- Phase 1 is straightforward: fix prompts + add one DB query for portfolio data
- Phase 2 is optional - "Technical Psychology" may be sufficient for personal use
- If TradingAgents project proceeds, sentiment could come from there instead
