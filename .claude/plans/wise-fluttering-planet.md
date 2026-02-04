# Portfolio Feature MVP - Implementation Plan

## Overview

Implement a comprehensive portfolio tracking feature for the AI Stock Prediction Platform based on the PRD requirements. The codebase already has ~70% of the backend infrastructure; this plan focuses on **UI enhancements**, **CSV Import**, **Stock Detail Page**, and **Health Dashboard**.

## Scope Summary

**In Scope (MVP):**
- Enhanced Holdings Table (14 columns, sorting, sticky header)
- CSV Import (Merrill Lynch + Fidelity formats)
- Stock Detail Page (`/stock/[symbol]`)
- Portfolio Health Dashboard (technical analysis-based scoring)
- Tab Navigation restructure (Summary, Health Score, Holdings, Dividends)
- Multiple portfolios per user (already supported)

**Out of Scope:**
- Comparative Analysis (user vs others) - REMOVED
- Analyst Ratings from external API - DEFERRED
- Factor grades - DEFERRED

---

## Phase 1: Holdings View Enhancement - COMPLETE

**Status:** Completed in commit `8dca9d8`

**Goal:** Transform HoldingsDataGrid into a feature-rich table matching PRD specifications

### Files to Modify
- `src/types/portfolio.ts` - Add new fields to HoldingWithMarketData
- `src/lib/portfolio/PortfolioService.ts` - Enhance getHoldingsWithMarketData()
- `src/components/portfolio/HoldingsDataGrid.tsx` - Add columns, sorting, sticky header
- `src/components/portfolio/HoldingRow.tsx` - Add new cells, symbol link

### New Columns to Add
| Column | Description |
|--------|-------------|
| Symbol | Clickable link to `/stock/[symbol]` |
| Price | Current + post-market price below |
| Change ($) | Day change, color-coded |
| Change % | Day change %, post-market % below |
| Weight | Portfolio allocation % |
| Shares | Quantity held |
| Cost | Average cost basis |
| Today's Gain | Dollar gain for today |
| Today's % Gain | Percentage gain today |
| Est Annual Income | Dividend yield x market value |
| Total Change | Unrealized P&L ($) |
| Total % Change | Unrealized P&L (%) |
| Value | Current market value |

### Features
- Column visibility toggle (dropdown)
- Sticky header on scroll
- All columns sortable
- Row hover highlight

### Tests
- `src/components/portfolio/__tests__/HoldingsDataGrid.test.tsx`

---

## Phase 2: Individual Stock Detail Page

**Goal:** Create comprehensive stock view at `/stock/[symbol]`

### New Files to Create
```
src/app/stock/[symbol]/page.tsx          # Server Component route
src/app/api/stock/[symbol]/route.ts      # API endpoint
src/components/stock/StockDetailPage.tsx # Main client component
src/components/stock/StockHeader.tsx     # Symbol, price, change
src/components/stock/StockChart.tsx      # Price chart with time selectors
src/components/stock/StockMetricsSidebar.tsx # Key metrics panel
src/components/stock/index.ts            # Exports
```

### StockChart Time Periods
1D, 5D, 1M, 6M, YTD, 1Y, 5Y, MAX

### Key Metrics Sidebar
- 52 Week Range
- Day Range
- EPS, P/E Ratio
- Dividend Rate/Yield
- Market Cap
- Volume
- Previous Close

### Tests
- `src/components/stock/__tests__/StockDetailPage.test.tsx`

---

## Phase 3: CSV Import Feature

**Goal:** Import transactions from Merrill Lynch and Fidelity CSV exports

### New Files to Create
```
src/lib/portfolio/CSVImportService.ts              # Main service
src/lib/portfolio/parsers/MerrillLynchParser.ts    # ML format parser
src/lib/portfolio/parsers/FidelityParser.ts        # Fidelity format parser
src/app/api/portfolios/[id]/import/route.ts        # Upload endpoint
src/components/portfolio/CSVImportModal.tsx        # Multi-step modal
src/components/portfolio/CSVImportPreview.tsx      # Preview table
```

### Import Flow
1. **Upload Step** - File dropzone, auto-detect format
2. **Preview Step** - Table with parsed transactions, validation errors highlighted
3. **Confirmation Step** - Summary of import
4. **Result Step** - Success/failure with counts

### Supported Transaction Types
- BUY, SELL, DIVIDEND

### Modify Existing
- `src/components/portfolio/PortfolioManager.tsx` - Add "Import CSV" button

### Tests
- `src/lib/portfolio/__tests__/CSVImportService.test.ts`
- `src/lib/portfolio/parsers/__tests__/MerrillLynchParser.test.ts`
- `src/lib/portfolio/parsers/__tests__/FidelityParser.test.ts`
- `src/components/portfolio/__tests__/CSVImportModal.test.tsx`

---

## Phase 4: Portfolio Health Dashboard - COMPLETE

**Status:** Completed (Phase 2 & 3 also completed in commits `3446ffe` and `aca2341`)

**Goal:** Technical analysis-based health scoring with gauge visualization

### Files Created
```
src/lib/portfolio/PortfolioHealthService.ts        # Health calculation service
src/app/api/portfolios/[id]/health/route.ts        # GET API endpoint
src/components/portfolio/HealthScoreGauge.tsx      # SVG semi-circular gauge
src/components/portfolio/HealthDashboard.tsx       # Dashboard composition layout
src/components/portfolio/RatingBreakdown.tsx       # Stacked bar with legend
src/components/portfolio/DiagnosticsPanel.tsx      # Per-holding diagnostic cards
src/lib/portfolio/__tests__/PortfolioHealthService.test.ts  # 9 unit tests
```

### Files Modified
- `src/types/portfolio.ts` - Added `HealthRating`, `HoldingHealthAnalysis`, `PortfolioHealthResult`
- `src/components/portfolio/hooks/usePortfolio.ts` - Added `healthData`, `healthLoading`, `fetchHealth` with AbortController
- `src/components/portfolio/PortfolioManager.tsx` - Added "Health Score" tab with lazy-loading

### Health Score Calculation
- Runs `TechnicalAnalysisEngine` on each holding's 6-month historical data
- Converts summary to 0-100 score: bullish (67-100), neutral (34-66), bearish (0-33)
- Portfolio-weighted overall score via `sum(score * weight) / sum(weights)`
- Batched processing (5 concurrent) with `Promise.allSettled` for fault tolerance

### Dashboard Components
- Semi-circular SVG gauge with CSS transform animated needle and 3 color zones
- Horizontal stacked bar showing bullish/neutral/bearish distribution with legend
- Scrollable diagnostics panel sorted worst-first with signal pills and diagnostic messages

### Tests
- `src/lib/portfolio/__tests__/PortfolioHealthService.test.ts` - 9 tests (all pass)

---

## Phase 5: Tab Navigation & Dividends - COMPLETE

**Status:** Completed

**Goal:** Restructure PortfolioManager with new tab layout, fix dividend yield data

### Files Created
```
src/components/portfolio/SummaryTab.tsx               # Key metrics, mini chart, top/bottom performers
src/components/portfolio/DividendsTab.tsx              # Income tracking, dividend table, history
src/lib/data-providers/__tests__/fmp-key-metrics.test.ts  # 9 tests
src/components/portfolio/__tests__/SummaryTab.test.tsx     # 10 tests
src/components/portfolio/__tests__/DividendsTab.test.tsx   # 10 tests
```

### Files Modified
- `src/lib/data-providers/fmp.ts` — Added `FMPKeyMetrics` interface, `getKeyMetricsTTM()`, `getMultipleKeyMetricsTTM()`
- `src/lib/portfolio/PortfolioService.ts` — Real dividend yields from FMP key-metrics-ttm endpoint
- `src/components/portfolio/PortfolioManager.tsx` — 7 tabs (Summary default), lazy-load history

### Final Tab Structure (7 tabs)
| Tab | Content |
|-----|---------|
| Summary | Key metrics, mini chart, top/bottom performers |
| Holdings | Enhanced HoldingsDataGrid |
| Health Score | HealthDashboard component |
| Dividends | Income tracking, yield info, dividend history |
| Transactions | Transaction list |
| Allocation | TreeMap visualization |
| Performance | Benchmark chart |

---

## Phase 6: Performance Chart Enhancement - COMPLETE

**Status:** Completed

**Goal:** Improve chart with time period selectors, aggregation, display modes, and benchmark visibility

### Files Modified
- `src/components/portfolio/PerformanceChart.tsx` — All enhancements (sole production file)

### Files Created
- `src/components/portfolio/__tests__/PerformanceChart.test.tsx` — 18 tests

### Enhancements
- **YTD Time Period** — Added `YTD` to time range selector (between 6M and 1Y), filters from Jan 1 of current year
- **Data Aggregation** — Daily/Weekly/Monthly toggle (`D`/`W`/`M` pills), groups data points keeping end-of-period snapshots via `getWeekKey()` and `getMonthKey()` helpers
- **Percent vs Absolute Toggle** — `%`/`$` switch; percent mode shows normalized returns with benchmarks, absolute mode shows portfolio dollar value only
- **Improved Benchmark Visibility** — QQQ enabled by default, portfolio line thick solid (`strokeWidth: 3`), benchmarks thinner dashed (`strokeWidth: 1.5`, `strokeDasharray: "6 3"`), alpha badges on benchmark toggles
- **Controls Layout** — Two-row layout: Row 1 (title + time range + aggregation), Row 2 (display mode toggle + line toggles with alpha badges)
- **ReferenceLine** — Replaced dummy `<Line dataKey={() => 0}>` with proper `<ReferenceLine y={0}>`, only shown in percent mode
- **X-axis Formatting** — Adapts to aggregation: monthly shows `"Jan '25"`, daily/weekly shows `"Jan 15"`

### Tests (18 total)
- Aggregation helpers: `getWeekKey`, `getMonthKey`, `aggregateData` (7 tests)
- Component rendering: loading/empty states, line defaults, stroke styling, YTD filtering, display mode toggle, benchmark visibility (11 tests)

---

## Technical Decisions

| Decision | Approach |
|----------|----------|
| CSV Parsing | Client-side with Papa Parse for immediate feedback |
| Health Score | Use existing TechnicalAnalysisEngine, cache 1hr |
| Stock Page | Server Component for data, Client for interactivity |
| Gauge Visualization | Custom SVG component |
| Testing | Vitest + React Testing Library (existing pattern) |

---

## Phase Dependencies

```
Phase 1 (Holdings) ----DONE
                        |
Phase 2 (Stock Page) ---+--> Phase 5 (Tab Nav) --DONE
         |               DONE       |
         +----------> Phase 6 (Chart Polish) --DONE

Phase 3 (CSV Import) --> DONE (Independent)
Phase 4 (Health) ------> DONE

ALL PHASES COMPLETE - Portfolio Feature MVP Done
```

---

## Verification Plan

### After Each Phase
1. Run `npm run build` - Verify no TypeScript errors
2. Run `npm run test:run` - Verify all tests pass
3. Run `npm run dev` - Manual smoke test

### End-to-End Testing
1. **Holdings View**: Navigate to Portfolio tab, verify all columns render, test sorting, click symbol to verify navigation
2. **Stock Detail**: Visit `/stock/AAPL`, verify chart loads with all time periods, metrics display
3. **CSV Import**: Import sample Fidelity CSV, verify preview, confirm transactions appear
4. **Health Dashboard**: Check health score renders, diagnostics make sense
5. **Dividends Tab**: Verify dividend income calculations

### Sample Test Data
- Create test CSV files for Merrill Lynch and Fidelity formats
- Seed portfolio with dividend-paying stocks (e.g., KO, JNJ, PG)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| FMP API rate limits | Batch quote requests, aggressive caching |
| CSV format variations | Flexible parsing with user confirmation step |
| Technical analysis perf | Cache health scores, calculate on-demand |
| Large portfolios | Virtualize holdings table if >100 holdings |
