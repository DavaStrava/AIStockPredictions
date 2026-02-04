# Phase 5: Tab Navigation & Dividends - Implementation Plan (COMPLETE)

## Overview

Add Summary and Dividends tabs to PortfolioManager, fix dividend yield data by integrating FMP key-metrics endpoint, and reorder tabs for a better UX. All 5 existing tabs are retained.

**Status:** All steps implemented and verified. 74+ portfolio tests pass, lint clean on all changed files.

## Final Tab Order (7 tabs)

| # | Tab ID | Label | Status |
|---|--------|-------|--------|
| 1 | `summary` | Summary | **NEW** |
| 2 | `holdings` | Holdings | Existing |
| 3 | `health` | Health Score | Existing |
| 4 | `dividends` | Dividends | **NEW** |
| 5 | `transactions` | Transactions | Existing |
| 6 | `allocation` | Allocation | Existing |
| 7 | `performance` | Performance | Existing |

---

## Step 1: Fix Dividend Yield Data (FMP Integration)

**Goal:** Replace hardcoded `dividendYield = 0` with real data from FMP.

### 1a. Add FMP Key Metrics Method

**File:** `src/lib/data-providers/fmp.ts`

- Add `FMPKeyMetrics` interface with fields: `dividendYieldTTM`, `dividendPerShareTTM`, `payoutRatioTTM`
- Add method `getKeyMetricsTTM(symbol: string): Promise<FMPKeyMetrics | null>`
  - Calls FMP endpoint `/key-metrics-ttm/{symbol}`
  - Returns first element or null if unavailable
- Add method `getMultipleKeyMetricsTTM(symbols: string[]): Promise<Map<string, FMPKeyMetrics>>`
  - Batch call for multiple symbols to minimize API requests
  - Returns a Map keyed by symbol

### 1b. Update PortfolioService Holdings Enrichment

**File:** `src/lib/portfolio/PortfolioService.ts` (~line 546)

- In `getHoldingsWithMarketData()`, after fetching quotes, also fetch key metrics for all symbols via `getMultipleKeyMetricsTTM()`
- Replace `const dividendYield = 0` with actual `keyMetrics.dividendYieldTTM * 100` (FMP returns as decimal)
- Recalculate `estimatedAnnualIncome = (dividendYield / 100) * marketValue`
- Graceful fallback: if key metrics unavailable for a symbol, keep yield at 0

---

## Step 2: Create SummaryTab Component

**New file:** `src/components/portfolio/SummaryTab.tsx`

**Props:**
```typescript
interface SummaryTabProps {
  summary: PortfolioSummary | null;
  holdings: HoldingWithMarketData[];
  history: BenchmarkDataPoint[];
  loading?: boolean;
}
```

**Layout (3 sections):**

### Section A: Key Metrics Row
- 4-5 stat cards in a grid (similar style to PortfolioSummaryCard's StatCard)
- Metrics: Total Value, Day Change ($ + %), Total Return ($ + %), Daily Alpha, Est. Annual Dividend Income (sum of all holdings' `estimatedAnnualIncome`)

### Section B: Mini Performance Chart
- Compact Recharts LineChart (~200px height) showing last 3 months of portfolio return
- Simplified: portfolio line only, no toggles, no legend
- Uses `history` data (already fetched by usePortfolio)

### Section C: Top & Bottom Performers
- Two side-by-side cards:
  - **Top Performers**: Top 5 holdings sorted by `totalGainLossPercent` descending
  - **Bottom Performers**: Bottom 5 holdings sorted by `totalGainLossPercent` ascending
- Each row: symbol, company name, gain/loss %, gain/loss $, current price

---

## Step 3: Create DividendsTab Component

**New file:** `src/components/portfolio/DividendsTab.tsx`

**Props:**
```typescript
interface DividendsTabProps {
  holdings: HoldingWithMarketData[];
  transactions: PortfolioTransaction[];
  loading?: boolean;
}
```

**Layout (3 sections):**

### Section A: Dividend Summary Cards
- **Total Est. Annual Income**: sum of all holdings' `estimatedAnnualIncome`
- **Portfolio Yield**: weighted average dividend yield across holdings
- **Dividend-Paying Holdings**: count of holdings with `dividendYield > 0`
- **Total Dividends Received**: sum of all DIVIDEND transactions' `totalAmount`

### Section B: Holdings Dividend Table
- Table of holdings that have dividendYield > 0 (sorted by estimatedAnnualIncome descending)
- Columns: Symbol, Company Name, Dividend Yield %, Est. Annual Income, Market Value, Portfolio Weight
- Exclude holdings with 0 yield (or show them greyed out at bottom)

### Section C: Dividend History
- List of DIVIDEND-type transactions from `transactions` array, sorted by date descending
- Each row: date, symbol, amount received
- Empty state: "No dividend payments recorded yet. Dividend transactions will appear here when received."

---

## Step 4: Update PortfolioManager

**File:** `src/components/portfolio/PortfolioManager.tsx`

### Changes:
1. Import `SummaryTab` and `DividendsTab`
2. Import `DollarSign` icon from lucide-react (for Dividends tab), `BarChart3` (for Summary tab)
3. Update `TabId` union type: add `'summary'` and `'dividends'`
4. Reorder `TABS` array to new 7-tab order (summary first)
5. Change default `activeTab` from `'holdings'` to `'summary'`
6. Add tab content rendering for `summary` and `dividends` tabs
7. SummaryTab needs `history` data — add a lazy-load effect: when `activeTab === 'summary'` and `history.length === 0`, call `fetchHistory(selectedPortfolioId)`

---

## Step 5: Tests

**New file:** `src/components/portfolio/__tests__/SummaryTab.test.tsx`
- Renders key metrics from summary data
- Shows top/bottom performers from holdings
- Shows loading skeletons
- Shows empty state when no data

**New file:** `src/components/portfolio/__tests__/DividendsTab.test.tsx`
- Renders dividend summary cards with correct calculations
- Shows dividend-paying holdings table
- Filters out zero-yield holdings (or shows them greyed)
- Shows dividend transaction history
- Shows empty states

**New file:** `src/lib/data-providers/__tests__/fmp-key-metrics.test.ts`
- Tests `getKeyMetricsTTM()` returns parsed data
- Tests `getMultipleKeyMetricsTTM()` batching
- Tests fallback when endpoint returns empty/error

---

## Files Summary

| File | Action |
|------|--------|
| `src/lib/data-providers/fmp.ts` | Modify — add key metrics types + methods |
| `src/lib/portfolio/PortfolioService.ts` | Modify — use real dividend yield |
| `src/components/portfolio/SummaryTab.tsx` | **New** |
| `src/components/portfolio/DividendsTab.tsx` | **New** |
| `src/components/portfolio/PortfolioManager.tsx` | Modify — add tabs, reorder, new default |
| `src/components/portfolio/__tests__/SummaryTab.test.tsx` | **New** |
| `src/components/portfolio/__tests__/DividendsTab.test.tsx` | **New** |
| `src/lib/data-providers/__tests__/fmp-key-metrics.test.ts` | **New** |

---

## Implementation Order

1. FMP key metrics integration (Step 1a → 1b)
2. SummaryTab component (Step 2)
3. DividendsTab component (Step 3)
4. PortfolioManager updates (Step 4)
5. Tests (Step 5)
6. Build verification + manual smoke test

---

## Verification

1. `npm run test:run` — all existing + new tests pass
2. `npm run build` — no TypeScript errors
3. Manual: Navigate to Portfolio → Summary tab loads as default, shows metrics + mini chart + performers
4. Manual: Dividends tab shows yield data, holdings table, dividend history
5. Verify all 7 tabs render correctly and existing tabs still work
