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
| StockDashboard | 1093 | Main orchestrator | ⚠️ HIGH |
| AdvancedStockChart | ~500 | Interactive charting | MEDIUM |
| TechnicalIndicatorExplanations | ~300 | Indicator display | MEDIUM |
| FMPDataProvider | 909 | External API | ⚠️ HIGH |
| DatabaseConnection | 936 | DB management | ⚠️ HIGH |

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

#### ⚠️ Duplicate Components
- `WatchlistManager.tsx` and `MockWatchlistManager.tsx` - consolidate into one

### 6.2 Component Complexity Issues

#### StockDashboard.tsx (1093 lines)
**Problem**: Single component handling too many responsibilities

**Recommendation**: Extract into smaller components:
```
StockDashboard/
├── index.tsx              # Main orchestrator (~200 lines)
├── StockPredictionGrid.tsx # Prediction cards
├── DetailedAnalysis.tsx    # Analysis section
├── hooks/
│   ├── usePredictions.ts   # Prediction fetching logic
│   └── useAnalysis.ts      # Analysis fetching logic
└── utils/
    └── styling.ts          # getDirectionColor, getDirectionBg
```

#### FMPDataProvider (909 lines)
**Problem**: Excessive documentation comments

**Recommendation**: Move educational comments to separate documentation file

#### DatabaseConnection (936 lines)
**Problem**: Excessive documentation comments

**Recommendation**: Move educational comments to separate documentation file

### 6.3 Type Duplication

Multiple type definitions exist across files:
- `PredictionResult` defined in both API route and component
- Consider centralizing in `src/types/`

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

## 7. Recommended Simplifications

### Priority 1: Immediate Cleanup (Low Risk)

1. **Delete orphaned root files** (17 files)
2. **Delete backup file** (`explanations.ts.bak`)
3. **Consolidate watchlist components**

### Priority 2: Code Organization (Medium Risk)

1. **Extract StockDashboard hooks**
   - Create `usePredictions` hook
   - Create `useAnalysis` hook
   - Reduce main component to ~300 lines

2. **Centralize type definitions**
   - Move `PredictionResult` to `src/types/`
   - Create shared interfaces

### Priority 3: Documentation (Low Risk)

1. **Move educational comments**
   - Create `docs/` folder
   - Move verbose comments from FMP and Database modules
   - Keep essential JSDoc comments

### Priority 4: Architecture Improvements (Higher Risk)

1. **Consider state management library**
   - Current: React useState (works for current scale)
   - Future: Consider Zustand if complexity grows

2. **API route consolidation**
   - `/api/predictions` and `/api/analysis` have overlap
   - Consider combining or clarifying boundaries

---

## 8. File Structure Recommendation

```
ai-stock-prediction/
├── src/
│   ├── app/
│   │   ├── api/              # Keep as-is
│   │   └── ...
│   ├── components/
│   │   ├── dashboard/        # NEW: Dashboard-specific
│   │   │   ├── StockDashboard.tsx
│   │   │   ├── PredictionGrid.tsx
│   │   │   └── DetailedAnalysis.tsx
│   │   ├── charts/           # NEW: Chart components
│   │   ├── analysis/         # NEW: Analysis components
│   │   ├── layout/           # NEW: Layout components
│   │   ├── common/           # NEW: Shared components
│   │   └── __tests__/        # Keep co-located tests
│   ├── hooks/                # NEW: Custom hooks
│   │   ├── usePredictions.ts
│   │   ├── useAnalysis.ts
│   │   └── useLayoutShiftPrevention.ts
│   ├── lib/                  # Keep as-is
│   └── types/                # Keep as-is
├── docs/                     # NEW: Documentation
│   ├── architecture.md
│   ├── api-reference.md
│   └── development-guide.md
├── infrastructure/           # Keep as-is
└── [config files]            # Keep as-is
```

---

## 9. Performance Considerations

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

## 10. Security Considerations

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
├── StockDashboard
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
├── MockWatchlistManager
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
