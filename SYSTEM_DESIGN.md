# AI Stock Prediction Platform - System Design Documentation

## Executive Summary

This document provides a comprehensive overview of the AI Stock Prediction platform architecture, identifies areas for simplification, and documents the current system design for maintainability.

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Next.js App (React 19)                            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │   │
│  │  │ StockDashboard│  │ WatchlistMgr │  │ MarketIndicesSidebar    │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Next.js API Routes                                │   │
│  │  /api/predictions  /api/analysis  /api/insights  /api/watchlists    │   │
│  │  /api/search       /api/market-indices  /api/market-index-analysis  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SERVICE LAYER                                      │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐   │
│  │ Technical Analysis │  │   FMP Data Provider │  │  Database Service  │   │
│  │      Engine        │  │                     │  │                    │   │
│  └────────────────────┘  └────────────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SERVICES                                   │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐   │
│  │ Financial Modeling │  │     PostgreSQL     │  │   AWS Secrets      │   │
│  │    Prep API        │  │     Database       │  │     Manager        │   │
│  └────────────────────┘  └────────────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Frontend | Next.js | 15.5.9 | App Router, Server Components |
| UI Framework | React | 19.1.0 | Component library |
| Styling | Tailwind CSS | v4 | Utility-first CSS |
| Language | TypeScript | 5.x | Type safety |
| Database | PostgreSQL | 8.x | Data persistence |
| Cloud | AWS CDK | v2 | Infrastructure as Code |
| Testing | Vitest | 4.x | Unit/Integration tests |
| Charts | Recharts | 3.x | Data visualization |
| Analysis | technicalindicators | 3.x | Technical indicators |

---

## 2. Component Architecture

### 2.1 Component Hierarchy

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Main entry point
│   ├── layout.tsx                # Root layout with ErrorBoundary
│   └── api/                      # API routes (7 endpoints)
│
├── components/                   # React components (25 files)
│   ├── Core Dashboard
│   │   ├── StockDashboard.tsx    # Main dashboard (1093 lines) ⚠️ LARGE
│   │   ├── StockSearch.tsx       # Search functionality
│   │   └── StockChart.tsx        # Basic charting
│   │
│   ├── Charts
│   │   ├── AdvancedStockChart.tsx # Interactive charts
│   │   └── SimpleStockChart.tsx   # Quick overview charts
│   │
│   ├── Analysis
│   │   ├── AIInsights.tsx         # LLM-powered insights
│   │   ├── PerformanceMetrics.tsx # Risk/performance metrics
│   │   ├── TechnicalIndicatorExplanations.tsx
│   │   └── MarketIndexAnalysis.tsx
│   │
│   ├── Layout
│   │   ├── MultiColumnLayout.tsx  # 3-column layout
│   │   ├── ResponsiveContainer.tsx
│   │   ├── ResponsiveGrid.tsx
│   │   └── CollapsibleSection.tsx
│   │
│   ├── Sidebars
│   │   ├── MarketIndicesSidebar.tsx
│   │   └── AdditionalInsightsSidebar.tsx
│   │
│   ├── Watchlists
│   │   ├── WatchlistManager.tsx
│   │   └── MockWatchlistManager.tsx # ⚠️ DUPLICATE
│   │
│   ├── Error Handling
│   │   ├── ErrorBoundary.tsx
│   │   ├── ResponsiveLayoutErrorBoundary.tsx
│   │   └── DevErrorDashboard.tsx
│   │
│   └── Utilities
│       ├── SkeletonLoaders.tsx    # Loading states
│       ├── Term.tsx               # Tooltip definitions
│       └── TermsGlossary.tsx
│
├── lib/                          # Business logic
│   ├── technical-analysis/       # Core analysis engine
│   ├── database/                 # PostgreSQL connection
│   ├── data-providers/           # FMP API integration
│   ├── ai/                       # LLM providers
│   ├── portfolio/                # Portfolio metrics
│   └── knowledge/                # Term definitions
│
└── types/                        # TypeScript definitions
    ├── index.ts                  # Barrel export
    ├── models.ts                 # Data models
    ├── api.ts                    # API types
    └── technical-indicators.ts   # Analysis types
```

### 2.2 Component Responsibilities

| Component | Lines | Responsibility | Complexity |
|-----------|-------|----------------|------------|
| StockDashboard | ~588 | Main orchestrator | MEDIUM ✅ |
| AdvancedStockChart | ~500 | Interactive charting | MEDIUM |
| TechnicalIndicatorExplanations | ~300 | Indicator display | MEDIUM |
| FMPDataProvider | ~356 | External API | MEDIUM ✅ |
| DatabaseConnection | ~331 | DB management | MEDIUM ✅ |

*Note: StockDashboard, FMPDataProvider, and DatabaseConnection were refactored in December 2025 cleanup.*

---

## 3. Data Flow

### 3.1 Stock Analysis Flow

```
User Action: Search/Select Stock
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ StockDashboard.handleStockSearch(symbol)                        │
│   1. fetchPredictions(symbol, isNewSearch=true)                 │
│   2. fetchDetailedAnalysis(symbol)                              │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ API: /api/predictions                                           │
│   1. FMPProvider.getHistoricalData(symbol)                      │
│   2. FMPProvider.getQuote(symbol)                               │
│   3. TechnicalAnalysisEngine.analyze(data)                      │
│   4. Generate prediction based on signals                       │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ TechnicalAnalysisEngine.analyze()                               │
│   ├── analyzeRSI()                                              │
│   ├── analyzeMACD()                                             │
│   ├── analyzeBollingerBands()                                   │
│   ├── analyzeMovingAverages()                                   │
│   ├── analyzeStochastic()                                       │
│   ├── analyzeWilliamsR()                                        │
│   ├── analyzeMomentum()                                         │
│   └── analyzeVolume()                                           │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Response: PredictionResult                                      │
│   - symbol, currentPrice                                        │
│   - prediction (direction, confidence, target, reasoning)       │
│   - signals (TechnicalSignal[])                                 │
│   - riskMetrics (volatility, support, resistance)               │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 State Management

The application uses React's built-in state management:

```typescript
// StockDashboard State
predictions: PredictionResult[]      // Stock prediction cards
selectedStock: string                // Currently selected stock
analysis: TechnicalAnalysisResult    // Detailed analysis data
priceData: PriceData[]               // Historical prices for charts
loading: boolean                     // Initial load state
searchLoading: boolean               // Search operation state
selectedIndex: string | null         // Market index selection
```

---

## 4. API Endpoints

| Endpoint | Method | Purpose | Data Source |
|----------|--------|---------|-------------|
| `/api/predictions` | GET | Stock predictions | FMP + Analysis Engine |
| `/api/analysis` | GET/POST | Technical analysis | FMP + Analysis Engine |
| `/api/insights` | GET | AI-powered insights | LLM Providers |
| `/api/search` | GET | Stock search | FMP |
| `/api/watchlists` | GET/POST | Watchlist CRUD | PostgreSQL |
| `/api/watchlists/[id]` | GET/PUT/DELETE | Single watchlist | PostgreSQL |
| `/api/market-indices` | GET | Market index data | FMP |
| `/api/market-index-analysis` | GET | Index analysis | FMP + Analysis |

---

## 5. Technical Analysis Engine

### 5.1 Supported Indicators

| Category | Indicator | Purpose |
|----------|-----------|---------|
| Momentum | RSI | Overbought/Oversold |
| Momentum | Stochastic | Momentum oscillator |
| Momentum | Williams %R | Momentum oscillator |
| Trend | MACD | Trend following |
| Trend | Moving Averages | SMA/EMA crossovers |
| Trend | ADX | Trend strength |
| Volatility | Bollinger Bands | Volatility bands |
| Volume | OBV | Volume trend |
| Volume | VPT | Volume-price trend |
| Volume | A/D | Accumulation/Distribution |

### 5.2 Signal Generation

```typescript
interface TechnicalSignal {
  indicator: string;           // Source indicator
  signal: 'buy' | 'sell' | 'hold';
  strength: number;            // 0-1 confidence
  value: number;               // Indicator value
  timestamp: Date;
  description: string;         // Human-readable
}
```

---

## 6. Identified Issues & Simplification Opportunities

### 6.1 Code Organization Issues

#### ✅ Orphaned Files Cleanup (Completed December 29, 2025)

All orphaned files have been removed:
- 11 orphaned test files deleted
- 10 orphaned documentation files deleted  
- 1 backup file deleted (`explanations.ts.bak`)

**Total: 22 files removed**

#### ✅ Duplicate Components (Completed December 29, 2025)
- `MockWatchlistManager.tsx` deleted
- `WatchlistManager.tsx` now supports `useMockData` prop for testing

### 6.2 Component Complexity Issues

#### ✅ StockDashboard.tsx (Refactored - December 29, 2025)
**Previous**: 1093 lines handling too many responsibilities
**Current**: ~588 lines with extracted hooks

**Completed refactoring**:
```
src/components/
├── StockDashboard.tsx           # Main orchestrator (~588 lines)
└── dashboard/
    └── hooks/
        ├── usePredictions.ts    # Prediction fetching logic ✅
        └── useStockAnalysis.ts  # Analysis fetching logic ✅
```

#### ✅ FMPDataProvider (~356 lines - Refactored)
**Previous**: 909 lines with excessive documentation comments
**Current**: ~356 lines with essential JSDoc preserved

#### ✅ DatabaseConnection (~331 lines - Refactored)
**Previous**: 936 lines with excessive documentation comments
**Current**: ~331 lines with essential JSDoc preserved

### 6.3 Type Duplication

#### ✅ Type Centralization (Completed December 29, 2025)
- `PredictionResult` centralized to `src/types/predictions.ts`
- All imports updated to use centralized type
- Property-based test ensures import consistency

### 6.4 Test Organization

Current test structure is good but could be improved:
- Tests are co-located with components (`__tests__/` folders) ✓
- Consider adding integration tests for API routes
- ✅ Orphaned test files removed from root (completed)

### 6.5 CSS Organization

Multiple CSS files with potential overlap:
- `globals.css` - Global styles
- `responsive-transitions.css` - Transition animations
- `typography.css` - Typography system

**Recommendation**: Audit for unused styles and consolidate

---

## 7. ✅ Completed Simplifications (December 29, 2025)

### Phase 1: Immediate Cleanup ✅

1. **Deleted 22 orphaned root files** ✅
2. **Deleted backup file** (`explanations.ts.bak`) ✅
3. **Consolidated watchlist components** ✅

### Phase 2: Code Organization ✅

1. **Extracted StockDashboard hooks** ✅
   - Created `usePredictions` hook
   - Created `useStockAnalysis` hook
   - Reduced main component from 1093 to ~588 lines

2. **Centralized type definitions** ✅
   - Moved `PredictionResult` to `src/types/predictions.ts`
   - Created shared interfaces

3. **Reduced comment verbosity** ✅
   - FMP provider: 909 → 356 lines (61% reduction)
   - Database connection: 936 → 331 lines (65% reduction)
   - Essential JSDoc preserved

### Property-Based Tests Added ✅

- Type import consistency test
- Behavioral equivalence test
- Mock data toggle test
- JSDoc preservation test

---

## 8. Future Improvements (Optional)

1. **Consider state management library**
   - Current: React useState (works for current scale)
   - Future: Consider Zustand if complexity grows

2. **API route consolidation**
   - `/api/predictions` and `/api/analysis` have overlap
   - Consider combining or clarifying boundaries

3. **Additional testing**
   - FMP provider unit tests
   - Database service unit tests

---

## 9. ✅ Trading Journal Feature (Completed December 29, 2025)

### Implementation Status

The Trading Journal & P&L Tracker feature is fully implemented:

| Component | Status | Location |
|-----------|--------|----------|
| Database Schema | ✅ Complete | `src/lib/database/migrations/002_trades_schema.sql` |
| Type Definitions | ✅ Complete | `src/types/models.ts` |
| TradeService | ✅ Complete | `src/lib/portfolio/TradeService.ts` |
| API Routes | ✅ Complete | `src/app/api/trades/` |
| usePortfolioStats Hook | ✅ Complete | `src/components/trading-journal/hooks/` |
| TradeEntryModal | ✅ Complete | `src/components/trading-journal/` |
| TradeLogTable | ✅ Complete | `src/components/trading-journal/` |
| Property Tests | ✅ Complete | Various `__tests__/` directories |
| StockDashboard Integration | ✅ Complete | `src/components/StockDashboard.tsx` |

### Implemented Capabilities

- **Trade Logging**: Create trades with symbol, side (LONG/SHORT), entry price, quantity, fees, notes
- **Trade Closure**: Close open trades with exit price, automatic P&L calculation
- **P&L Calculations**: 
  - Realized P&L: `(exitPrice - entryPrice) × quantity - fees` (LONG)
  - Unrealized P&L: Uses current market price from FMP API
- **Portfolio Statistics**: Win rate, average win/loss, total P&L, best/worst trade
- **Trade Filtering**: By status, symbol, date range
- **Dashboard Integration**: "Log Trade" button on prediction cards for quick trade entry

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/trades` | GET | List user trades with filters |
| `/api/trades` | POST | Create new trade |
| `/api/trades/[id]` | GET | Get single trade |
| `/api/trades/[id]` | PATCH | Close/update trade |
| `/api/trades/stats` | GET | Portfolio statistics |

### Error Handling

The trading journal API endpoints include comprehensive error handling:

| HTTP Status | Condition | Resolution |
|-------------|-----------|------------|
| 400 | Invalid input data | Check request body for validation errors |
| 404 | Trade not found | Verify trade ID exists |
| 503 | Database unavailable | Run `npm run db:setup` |
| 503 | Missing tables | Run `npm run db:migrate` |
| 503 | Auth service unavailable | Check database configuration |
| 500 | Unexpected error | Check server logs |

Full specification available in `.kiro/specs/trading-journal/`.

---

## 10. File Structure (Current)

```
ai-stock-prediction/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   └── ...
│   ├── components/
│   │   ├── dashboard/        # Dashboard-specific ✅
│   │   │   └── hooks/
│   │   │       ├── usePredictions.ts
│   │   │       └── useStockAnalysis.ts
│   │   ├── StockDashboard.tsx
│   │   ├── WatchlistManager.tsx  # Consolidated ✅
│   │   └── __tests__/        # Co-located tests
│   ├── hooks/                # Custom hooks
│   │   └── useLayoutShiftPrevention.ts
│   ├── lib/                  # Business logic
│   │   ├── technical-analysis/
│   │   ├── database/
│   │   ├── data-providers/
│   │   └── ai/
│   └── types/                # TypeScript definitions
│       ├── predictions.ts    # Centralized ✅
│       └── ...
├── infrastructure/           # AWS CDK
└── [config files]
```

---

## 11. Performance Considerations

### Current Performance Profile

| Metric | Current | Target |
|--------|---------|--------|
| Initial Load | ~2-3s | <2s |
| Stock Search | ~1-2s | <1s |
| Analysis Render | ~500ms | <300ms |

### Optimization Opportunities

1. **Lazy Loading**: Already using `LazyTechnicalIndicatorExplanations`
2. **Memoization**: Consider `useMemo` for expensive calculations
3. **API Caching**: Consider SWR or React Query for data fetching
4. **Bundle Size**: Audit recharts import (large library)

---

## 12. Security Considerations

### Current Security Measures

- ✅ API keys in environment variables
- ✅ AWS Secrets Manager integration
- ✅ SSL/TLS for database connections
- ✅ Input validation in API routes

### Recommendations

- Consider rate limiting on API routes
- Add request validation middleware
- Implement CORS configuration
- Add security headers

---

## Appendix A: Component Dependency Graph

```
page.tsx
├── StockDashboard (uses usePredictions, useStockAnalysis hooks)
│   ├── StockSearch
│   ├── ResponsiveGrid
│   │   └── [Prediction Cards]
│   ├── CollapsibleSection
│   │   ├── PerformanceMetrics
│   │   ├── AdvancedStockChart
│   │   ├── SimpleStockChart
│   │   ├── AIInsights
│   │   └── TechnicalIndicatorExplanations
│   ├── TermsGlossary
│   ├── MultiColumnLayout
│   │   ├── AdditionalInsightsSidebar
│   │   └── MarketIndicesSidebar
│   └── MarketIndexAnalysis (modal)
├── WatchlistManager (supports useMockData prop)
├── DevErrorDashboard
├── ResponsiveContainer
└── ResponsiveLayoutErrorBoundary
```

---

## Appendix B: API Response Schemas

### Prediction Response
```typescript
{
  success: boolean;
  data: PredictionResult[];
  metadata: {
    timestamp: string;
    symbolsRequested: number;
    symbolsProcessed: number;
    dataSource: string;
  }
}
```

### Analysis Response
```typescript
{
  success: boolean;
  data: TechnicalAnalysisResult;
  priceData: PriceData[];
  currentQuote: FMPQuote | null;
  metadata: {
    symbol: string;
    dataPoints: number;
    period: string;
    dataSource: string;
    analysisTimestamp: string;
    dateRange: { from: Date; to: Date; }
  }
}
```

---

*Document Version: 1.0*
*Last Updated: December 29, 2025*
*Author: System Architecture Review*
