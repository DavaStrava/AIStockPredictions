# Design Document: Codebase Cleanup

## Overview

This design document outlines the approach for cleaning up and simplifying the AI Stock Prediction codebase. The cleanup focuses on four main areas: extracting hooks from the large StockDashboard component, consolidating duplicate watchlist components, centralizing type definitions, and reducing excessive comments in library files.

The refactoring maintains all existing functionality while improving code organization, reducing duplication, and enhancing maintainability.

## Architecture

### Current State

```
src/
├── components/
│   ├── StockDashboard.tsx          # 1093 lines - too large
│   ├── WatchlistManager.tsx        # Real implementation
│   └── MockWatchlistManager.tsx    # Duplicate mock implementation
├── lib/
│   ├── data-providers/
│   │   └── fmp.ts                  # ~909 lines - excessive comments
│   └── database/
│       └── connection.ts           # ~936 lines - excessive comments
└── types/
    ├── index.ts
    ├── models.ts
    ├── api.ts
    └── technical-indicators.ts
```

### Target State

```
src/
├── components/
│   ├── dashboard/
│   │   ├── StockDashboard.tsx      # ~200-300 lines - main component
│   │   └── hooks/
│   │       ├── usePredictions.ts   # Prediction state & fetching
│   │       └── useStockAnalysis.ts # Analysis state & fetching
│   └── WatchlistManager.tsx        # Consolidated with mock data option
├── lib/
│   ├── data-providers/
│   │   └── fmp.ts                  # ~300-400 lines - trimmed comments
│   └── database/
│       └── connection.ts           # ~300-400 lines - trimmed comments
└── types/
    ├── index.ts
    ├── models.ts
    ├── api.ts
    ├── technical-indicators.ts
    └── predictions.ts              # New - centralized prediction types
```

## Components and Interfaces

### 1. usePredictions Hook

Extracts prediction-related state and logic from StockDashboard.

```typescript
// src/components/dashboard/hooks/usePredictions.ts

interface UsePredictionsReturn {
  predictions: PredictionResult[];
  loading: boolean;
  searchLoading: boolean;
  fetchPredictions: (symbols?: string, isNewSearch?: boolean) => Promise<void>;
  handleStockSearch: (symbol: string) => Promise<void>;
  removeTile: (symbol: string) => void;
}

export function usePredictions(): UsePredictionsReturn {
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  // Initial load effect
  useEffect(() => { /* ... */ }, []);

  const fetchPredictions = async (symbols?: string, isNewSearch = false) => {
    // Fetch logic extracted from StockDashboard
  };

  const handleStockSearch = async (symbol: string) => {
    // Search handler logic
  };

  const removeTile = (symbol: string) => {
    // Remove tile logic
  };

  return {
    predictions,
    loading,
    searchLoading,
    fetchPredictions,
    handleStockSearch,
    removeTile,
  };
}
```

### 2. useStockAnalysis Hook

Extracts analysis-related state and logic from StockDashboard.

```typescript
// src/components/dashboard/hooks/useStockAnalysis.ts

interface UseStockAnalysisReturn {
  selectedStock: string;
  analysis: TechnicalAnalysisResult | null;
  priceData: PriceData[];
  selectedIndex: string | null;
  fetchDetailedAnalysis: (symbol: string) => Promise<void>;
  handleIndexClick: (indexSymbol: string) => void;
  closeIndexAnalysis: () => void;
  clearAnalysis: () => void;
}

export function useStockAnalysis(): UseStockAnalysisReturn {
  const [selectedStock, setSelectedStock] = useState<string>('');
  const [analysis, setAnalysis] = useState<TechnicalAnalysisResult | null>(null);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null);

  const fetchDetailedAnalysis = async (symbol: string) => {
    // Analysis fetch logic
  };

  const handleIndexClick = (indexSymbol: string) => {
    setSelectedIndex(indexSymbol);
  };

  const closeIndexAnalysis = () => {
    setSelectedIndex(null);
  };

  const clearAnalysis = () => {
    setAnalysis(null);
    setPriceData([]);
    setSelectedStock('');
  };

  return {
    selectedStock,
    analysis,
    priceData,
    selectedIndex,
    fetchDetailedAnalysis,
    handleIndexClick,
    closeIndexAnalysis,
    clearAnalysis,
  };
}
```

### 3. Consolidated WatchlistManager

Single component with configurable data source.

```typescript
// src/components/WatchlistManager.tsx

interface WatchlistManagerProps {
  useMockData?: boolean;  // Default: false (use real API)
}

export default function WatchlistManager({ useMockData = false }: WatchlistManagerProps) {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (useMockData) {
      // Load mock data from memory
      loadMockData();
    } else {
      // Fetch from API
      fetchWatchlists();
    }
  }, [useMockData]);

  const loadMockData = () => {
    const mockWatchlists: Watchlist[] = [
      { id: '1', name: 'Tech Stocks', stocks: ['AAPL', 'GOOGL', 'MSFT'] },
      { id: '2', name: 'Blue Chips', stocks: ['JNJ', 'PG', 'KO'] },
    ];
    setWatchlists(mockWatchlists);
    setLoading(false);
  };

  // CRUD operations work with both mock and real data
  // Mock mode: update local state only
  // Real mode: API calls + state updates
}
```

### 4. Centralized PredictionResult Type

```typescript
// src/types/predictions.ts

import { TechnicalSignal } from './technical-indicators';

export interface PredictionResult {
  symbol: string;
  currentPrice: number;
  prediction: {
    direction: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    targetPrice: number;
    timeframe: string;
    reasoning: string[];
  };
  signals: TechnicalSignal[];
  riskMetrics: {
    volatility: 'low' | 'medium' | 'high';
    support: number;
    resistance: number;
    stopLoss: number;
  };
}
```

## Data Models

No new data models are introduced. Existing models are reorganized:

| Type | Current Location | Target Location |
|------|------------------|-----------------|
| PredictionResult | StockDashboard.tsx, predictions/route.ts | src/types/predictions.ts |
| Watchlist | WatchlistManager.tsx, MockWatchlistManager.tsx | src/types/models.ts |

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Hook Interface Completeness

*For any* extracted hook (usePredictions or useStockAnalysis), the hook SHALL return all state variables and functions that were previously defined inline in StockDashboard, ensuring no functionality is lost during extraction.

**Validates: Requirements 1.1, 1.2**

### Property 2: Behavioral Equivalence After Refactoring

*For any* user interaction sequence (search, select stock, remove tile, etc.), the refactored StockDashboard using extracted hooks SHALL produce identical UI state and API calls as the original monolithic component.

**Validates: Requirements 1.3**

### Property 3: Mock Data Toggle Behavior

*For any* WatchlistManager instance with `useMockData=true`, the component SHALL NOT make any network requests to `/api/watchlists` endpoints, and SHALL use in-memory mock data for all CRUD operations.

**Validates: Requirements 2.2, 2.3**

### Property 4: Type Import Consistency

*For any* file that uses the `PredictionResult` type, the import SHALL reference `@/types/predictions` and NOT define the type locally, ensuring single source of truth for type definitions.

**Validates: Requirements 3.2, 3.3, 3.4**

### Property 5: JSDoc Preservation for Public APIs

*For any* exported function, class, or interface in the cleaned-up FMP provider and Database connection modules, essential JSDoc documentation (description, parameters, return type) SHALL be preserved.

**Validates: Requirements 4.3**

## Error Handling

The refactoring maintains existing error handling patterns:

1. **Hook Error Handling**: Errors in hooks are caught and logged, with state reset to safe defaults
2. **API Errors**: Network failures gracefully degrade to empty states
3. **Type Safety**: TypeScript ensures type errors are caught at compile time

No new error handling mechanisms are introduced—this is a structural refactoring.

## Testing Strategy

### Unit Tests

Unit tests verify specific examples and edge cases:

1. **Hook Tests**: Test that hooks return correct initial state and respond to actions
2. **Component Tests**: Test WatchlistManager renders correctly in both mock and real modes
3. **Type Tests**: Verify type exports are accessible from centralized location

### Property-Based Tests

Property tests verify universal properties across all inputs using Vitest with fast-check:

1. **Hook Interface Property**: Generate random sequences of hook calls and verify return types match interface
2. **Mock Mode Property**: Generate random CRUD operations and verify no network calls in mock mode
3. **Type Consistency Property**: Scan codebase for PredictionResult usage and verify import sources

### Test Configuration

- Framework: Vitest (already configured in project)
- Property Testing: fast-check library
- Minimum iterations: 100 per property test
- Tag format: `Feature: codebase-cleanup, Property N: {property_text}`
