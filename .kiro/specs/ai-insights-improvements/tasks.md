# AI Insights Improvements - Tasks

## Status: NOT STARTED

## Phase 1: Fix Prompts & Labels (No New Data Sources)

### Task 1: Technical Analysis - Current Value Alignment
- [ ] 1.1 Modify `compactTechnical()` to separate current values from trend arrays
- [ ] 1.2 Update technical prompt to explicitly reference current values
- [ ] 1.3 Add instruction to lead with current values, then discuss trends
- [ ] 1.4 Test that AI narrative RSI matches Technical Indicators panel RSI

### Task 2: Portfolio Theory → Position Management
- [ ] 2.1 Rename insight type from "portfolio" to "position" (or keep internal name, change display)
- [ ] 2.2 Rewrite `getSystemPrompt('portfolio')` to focus on position management
- [ ] 2.3 Remove references to Sharpe ratio, beta, correlations from prompt
- [ ] 2.4 Add disclaimer about technical-only data source
- [ ] 2.5 Update UI tab label in `AIInsights.tsx` to "Position Management"
- [ ] 2.6 Add subtitle "Based on technical analysis"

### Task 3: Sentiment Analysis → Technical Psychology
- [ ] 3.1 Rewrite `getSystemPrompt('sentiment')` to focus on technical psychology
- [ ] 3.2 Remove references to institutional/retail behavior
- [ ] 3.3 Focus on RSI extremes, volume patterns, support/resistance behavior
- [ ] 3.4 Add disclaimer about technical-derived psychology
- [ ] 3.5 Update UI tab label in `AIInsights.tsx` to "Technical Psychology"
- [ ] 3.6 Add subtitle "Derived from price & volume patterns"

### Task 4: Testing & Validation
- [ ] 4.1 Manual test: Compare AI narrative values with UI panel values
- [ ] 4.2 Review AI outputs for hallucinated metrics
- [ ] 4.3 Verify disclaimers appear in responses
- [ ] 4.4 User acceptance testing

---

## Phase 2: Add Real Data Sources (Future)

### Task 5: Portfolio Data Integration
- [ ] 5.1 Add FMP company profile API call (`/api/v3/profile/{symbol}`)
- [ ] 5.2 Extract: sector, marketCap, beta, dividendYield
- [ ] 5.3 Calculate historical volatility and simple Sharpe ratio
- [ ] 5.4 Pass portfolio data to LLM alongside technical data
- [ ] 5.5 Update prompt to use real portfolio metrics
- [ ] 5.6 Rename back to "Portfolio Theory" with real data

### Task 6: Sentiment Data Integration
- [ ] 6.1 Add FMP news sentiment API call (`/api/v3/stock_news`)
- [ ] 6.2 Aggregate recent news sentiment scores
- [ ] 6.3 Explore social sentiment API if available
- [ ] 6.4 Pass sentiment data to LLM
- [ ] 6.5 Update prompt to use real sentiment data
- [ ] 6.6 Rename back to "Market Sentiment" with real data

### Task 7: Data Source Indicators
- [ ] 7.1 Add data source badges to each insight tab
- [ ] 7.2 Show "Technical Data" vs "Market Data" vs "News Sentiment" badges
- [ ] 7.3 Add "Last Updated" timestamp display in UI

---

## Dependencies

- Phase 1 has no external dependencies
- Phase 2 requires:
  - FMP API endpoints for company profile
  - FMP API endpoints for news (check API tier/limits)
  - Potential additional API costs

## Estimated Effort

| Phase | Effort | Priority |
|-------|--------|----------|
| Phase 1 (Prompts) | 2-3 hours | HIGH - Fix misleading content |
| Phase 2 (Data) | 4-6 hours | MEDIUM - Enhancement |

## Notes

- Phase 1 should be completed first to stop AI hallucinations
- Phase 2 can be deferred until real data sources are needed
- Consider A/B testing Phase 1 changes with users before Phase 2
