# Design Document: SimpleStockChart Component Fix

## Overview

This design document outlines the implementation of a proper `SimpleStockChart` component to replace the accidentally overwritten file. The component provides a lightweight, at-a-glance price visualization for the "Quick Price Overview" section of the Stock Dashboard.

The SimpleStockChart serves as a simpler alternative to the AdvancedStockChart, focusing on essential price information without the complexity of time range selectors, chart type toggles, or technical indicator overlays.

## Architecture

### Component Hierarchy

```
StockDashboard
└── CollapsibleSection ("Quick Price Overview")
    └── SimpleStockChart
        ├── Key Metrics Header
        │   ├── Current Price
        │   ├── Price Change (absolute + percentage)
        │   └── High/Low/Volume
        └── Area Chart (Recharts)
            ├── ResponsiveContainer
            ├── AreaChart
            ├── XAxis (dates)
            ├── YAxis (prices)
            └── Tooltip
```

### Data Flow

```
priceData (prop) → Data Transformation → Chart Data → Recharts Rendering
                                      ↓
                              Metrics Calculation → Key Metrics Display
```

## Components and Interfaces

### SimpleStockChart Props Interface

```typescript
interface SimpleStockChartProps {
  symbol: string;                           // Stock ticker symbol (e.g., "AAPL")
  priceData: PriceData[];                   // Historical price data array
  analysis?: TechnicalAnalysisResult;       // Optional (not used, for interface compatibility)
}
```

### PriceData Interface (existing)

```typescript
interface PriceData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
```

### Internal Chart Data Structure

```typescript
interface ChartDataPoint {
  date: string;      // Formatted date string for display
  close: number;     // Closing price
}
```

## Data Models

### Metrics Calculation

The component calculates the following metrics from the provided priceData:

| Metric | Calculation | Display Format |
|--------|-------------|----------------|
| Current Price | `priceData[last].close` | `$XXX.XX` |
| Price Change | `currentPrice - firstPrice` | `+$XX.XX` or `-$XX.XX` |
| Change Percent | `((current - first) / first) * 100` | `+X.XX%` or `-X.XX%` |
| Daily High | `priceData[last].high` | `$XXX.XX` |
| Daily Low | `priceData[last].low` | `$XXX.XX` |
| Volume | `priceData[last].volume` | `X.XM` or `X.XK` |

### Volume Formatting Logic

```typescript
function formatVolume(volume: number): string {
  if (volume >= 1_000_000_000) return `${(volume / 1_000_000_000).toFixed(1)}B`;
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(1)}K`;
  return volume.toString();
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Component Interface Acceptance

*For any* valid combination of props (symbol as string, priceData as PriceData array, optional analysis), the SimpleStockChart component should render without throwing errors.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Graceful Null/Undefined Handling

*For any* null, undefined, or empty priceData input, the SimpleStockChart component should render an appropriate empty state without crashing.

**Validates: Requirements 1.4, 4.1, 4.3**

### Property 3: Chart Rendering with Valid Data

*For any* non-empty priceData array with valid PriceData objects, the SimpleStockChart should render chart elements (Area, XAxis, YAxis).

**Validates: Requirements 2.1**

### Property 4: Current Price Display

*For any* non-empty priceData array, the displayed current price should equal the closing price of the last element in the array.

**Validates: Requirements 3.1**

### Property 5: Price Change Calculation

*For any* priceData array with at least 2 elements, the displayed price change should equal `lastClose - firstClose` and the percentage should equal `((lastClose - firstClose) / firstClose) * 100`.

**Validates: Requirements 3.2**

### Property 6: Price Change Color Styling

*For any* price change value, if positive the display should include green color classes, if negative it should include red color classes.

**Validates: Requirements 3.3, 3.4**

### Property 7: Volume Formatting

*For any* volume value, the formatted output should correctly represent the magnitude (B for billions, M for millions, K for thousands).

**Validates: Requirements 3.6**

### Property 8: Empty Symbol Handling

*For any* empty or whitespace-only symbol string, the component should display a prompt to select a stock.

**Validates: Requirements 4.2**

## Error Handling

### Input Validation Strategy

| Input State | Behavior |
|-------------|----------|
| `priceData` is `undefined` | Show empty state: "No price data available" |
| `priceData` is `null` | Show empty state: "No price data available" |
| `priceData` is `[]` | Show empty state: "No price data available" |
| `symbol` is `""` | Show prompt: "Select a stock to view price overview" |
| `priceData` has 1 element | Show chart, change shows as 0% |
| Valid data | Render full chart with metrics |

### Defensive Programming Patterns

```typescript
// Null-safe data access
const safeData = priceData || [];

// Guard clause for empty data
if (safeData.length === 0) {
  return <EmptyState />;
}

// Safe array access
const currentData = safeData[safeData.length - 1];
const firstData = safeData[0];
```

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **Empty State Rendering**: Verify empty state message when priceData is empty/null/undefined
2. **Symbol Prompt**: Verify prompt message when symbol is empty
3. **Metrics Display**: Verify correct price, change, and volume formatting
4. **Color Classes**: Verify green/red classes based on price direction

### Property-Based Tests

Property-based tests will verify universal properties across generated inputs:

1. **Interface Acceptance**: Generate random valid props and verify no crashes
2. **Null Safety**: Generate various falsy inputs and verify graceful handling
3. **Price Change Calculation**: Generate random price arrays and verify calculation accuracy
4. **Volume Formatting**: Generate random volume values and verify correct magnitude suffix

### Test Configuration

- Testing Framework: Vitest
- Property-Based Testing Library: fast-check
- Minimum iterations per property test: 100
- Test file location: `src/components/__tests__/SimpleStockChart.test.tsx`

### Test Annotations

Each property test will be annotated with:
```typescript
// Feature: simple-stock-chart-fix, Property N: [Property Title]
// Validates: Requirements X.Y
```
