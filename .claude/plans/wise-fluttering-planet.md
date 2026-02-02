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

## Phase 1: Holdings View Enhancement

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

## Phase 4: Portfolio Health Dashboard

**Goal:** Technical analysis-based health scoring with gauge visualization

### New Files to Create
```
src/lib/portfolio/PortfolioHealthService.ts        # Health calculation
src/app/api/portfolios/[id]/health/route.ts        # API endpoint
src/components/portfolio/HealthScoreGauge.tsx      # SVG gauge component
src/components/portfolio/HealthDashboard.tsx       # Dashboard layout
src/components/portfolio/RatingBreakdown.tsx       # Bar chart component
src/components/portfolio/DiagnosticsPanel.tsx      # Actionable statements
```

### Health Score Calculation
- Leverage existing `TechnicalAnalysisEngine` (RSI, MACD, Moving Averages)
- Weight signals by portfolio allocation
- Score range: 0-100
- Ratings: Bullish (67-100), Neutral (34-66), Bearish (0-33)

### Dashboard Components
- Semi-circular gauge (SVG with animated needle)
- Rating breakdown bar chart (% Bullish/Neutral/Bearish holdings)
- Diagnostics panel with actionable statements

### Tests
- `src/lib/portfolio/__tests__/PortfolioHealthService.test.ts`
- `src/components/portfolio/__tests__/HealthScoreGauge.test.tsx`

---

## Phase 5: Tab Navigation & Dividends

**Goal:** Restructure PortfolioManager with new tab layout

### Modify Existing
- `src/components/portfolio/PortfolioManager.tsx` - New tab structure
- `src/components/portfolio/hooks/usePortfolio.ts` - Add healthScore state

### New Files to Create
```
src/components/portfolio/SummaryTab.tsx      # High-level dashboard
src/components/portfolio/DividendsTab.tsx    # Income tracking
```

### New Tab Structure
| Tab | Content |
|-----|---------|
| Summary | Key metrics, mini chart, top performers |
| Health Score | HealthDashboard component |
| Holdings | Enhanced HoldingsDataGrid |
| Dividends | Income tracking, yield info |

---

## Phase 6: Performance Chart Enhancement

**Goal:** Improve chart with time period selectors

### Modify Existing
- `src/components/portfolio/PerformanceChart.tsx`

### Enhancements
- Add daily/weekly/monthly aggregation options
- Add YTD/all-time quick selectors
- Improve S&P 500 benchmark visibility
- Add percentage vs absolute toggle

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
Phase 1 (Holdings) ---+
                      +--> Phase 5 (Tab Navigation)
Phase 2 (Stock Page) -+          |
         |                       v
         +----------> Phase 6 (Chart Polish)

Phase 3 (CSV Import) --> Independent
Phase 4 (Health) ------> Requires Phase 1 completion
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
