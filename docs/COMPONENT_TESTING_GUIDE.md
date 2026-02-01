# Component Testing Guide

This guide documents component testing patterns and best practices for the AI Stock Predictions project.

## Table of Contents

1. [Overview](#overview)
2. [Test Setup](#test-setup)
3. [Testing Patterns](#testing-patterns)
4. [Component Test Inventory](#component-test-inventory)
5. [Common Testing Scenarios](#common-testing-scenarios)
6. [Troubleshooting](#troubleshooting)

---

## Overview

### Testing Stack

| Tool | Purpose |
|------|---------|
| **Vitest** | Test runner (fast, ESM-native) |
| **React Testing Library** | Component rendering and queries |
| **userEvent** | User interaction simulation |
| **vi.mock()** | Module mocking |

### Test Location

```
src/components/__tests__/           # Main component tests
src/components/dashboard/hooks/__tests__/  # Dashboard hook tests
src/components/portfolio/__tests__/ # Portfolio component tests
src/components/trading-journal/__tests__/  # Trading journal tests
```

### Running Tests

```bash
# All component tests
npm test -- --testPathPattern="components"

# Specific component
npm test -- --testPathPattern="StockDashboard"

# Watch mode
npm test -- --watch --testPathPattern="components"

# With coverage
npm test -- --coverage --testPathPattern="components"
```

---

## Test Setup

### Basic Test File Structure

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MyComponent from '../MyComponent';

// Mock dependencies
vi.mock('@/lib/some-module', () => ({
  someFunction: vi.fn(),
}));

describe('MyComponent', () => {
  let consoleSpy: any;

  beforeEach(() => {
    vi.resetAllMocks();
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Rendering', () => {
    it('renders correctly', () => {
      render(<MyComponent />);
      expect(screen.getByText('Expected Text')).toBeInTheDocument();
    });
  });
});
```

### Using Test Utilities

```typescript
import {
  renderWithProviders,
  mockTrade,
  mockPriceDataArray,
  TEST_SYMBOLS,
} from '@/__tests__/utils';

describe('TradeCard', () => {
  it('displays trade information', () => {
    const trade = mockTrade({ symbol: TEST_SYMBOLS.APPLE });
    const { user } = renderWithProviders(<TradeCard trade={trade} />);

    expect(screen.getByText('AAPL')).toBeInTheDocument();
  });
});
```

---

## Testing Patterns

### 1. Component Mocking

**Mock child components** to isolate the component under test:

```typescript
// Mock a complex child component
vi.mock('../SimpleStockChart', () => ({
  default: () => <div data-testid="simple-stock-chart">Simple Stock Chart</div>
}));

// Mock with props access
vi.mock('../MarketIndicesSidebar', () => ({
  default: ({ onIndexClick }: { onIndexClick: (symbol: string) => void }) => (
    <div data-testid="market-indices-sidebar">
      <button onClick={() => onIndexClick('^GSPC')} data-testid="index-button">
        Market Indices
      </button>
    </div>
  )
}));

// Mock with data verification
vi.mock('../ResponsiveGrid', () => ({
  default: ({ children, columns, gap, minItemWidth, className }: any) => (
    <div
      data-testid="responsive-grid"
      data-columns={JSON.stringify(columns)}
      data-gap={gap}
      data-min-item-width={minItemWidth}
      className={className}
    >
      {children}
    </div>
  )
}));
```

### 2. API/Fetch Mocking

```typescript
// Mock global fetch
global.fetch = vi.fn();

beforeEach(() => {
  (global.fetch as any).mockResolvedValue({
    ok: true,
    json: async () => ({
      success: true,
      data: mockPredictionData
    })
  });
});

// Mock sequential API calls
(global.fetch as any)
  .mockResolvedValueOnce({ ok: true, json: async () => ({ data: first }) })
  .mockResolvedValueOnce({ ok: true, json: async () => ({ data: second }) });

// Mock API errors
(global.fetch as any).mockResolvedValue({
  ok: false,
  status: 500,
  json: async () => ({ success: false, error: 'Server error' })
});

// Mock network errors
(global.fetch as any).mockRejectedValue(new Error('Network error'));
```

### 3. Async Testing

```typescript
// Wait for element to appear
await screen.findByTestId('responsive-grid');

// Wait for text
await screen.findByText('$150');

// Wait for condition
await waitFor(() => {
  expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
});

// Wait with custom timeout
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
}, { timeout: 5000 });
```

### 4. User Interaction Testing

```typescript
// Using fireEvent (simple)
fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
fireEvent.change(input, { target: { value: 'AAPL' } });

// Using userEvent (recommended - handles act() automatically)
const { user } = renderWithProviders(<MyComponent />);
await user.click(screen.getByRole('button'));
await user.type(input, 'AAPL');
await user.clear(input);
```

### 5. Loading States

```typescript
it('should show loading state during initial load', async () => {
  // Mock delayed API response
  let resolvePromise: (value: any) => void;
  const delayedPromise = new Promise(resolve => {
    resolvePromise = resolve;
  });

  (global.fetch as any).mockReturnValue(delayedPromise);

  render(<StockDashboard />);

  // Should show loading initially
  expect(screen.getByText('Loading predictions...')).toBeInTheDocument();

  // Resolve the promise
  resolvePromise!({
    ok: true,
    json: async () => ({ success: true, data: mockData })
  });

  // Wait for data to load
  await screen.findByText('$150');
});
```

### 6. Error Boundary Testing

```typescript
// Component that throws for testing
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div data-testid="success">Success!</div>;
};

describe('ErrorBoundary', () => {
  it('catches and displays error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.queryByTestId('success')).not.toBeInTheDocument();
  });
});
```

### 7. CSS/Styling Verification

```typescript
it('applies correct CSS classes', () => {
  const { container } = render(<ResponsiveGrid {...props} />);

  const gridElement = container.firstChild as HTMLElement;

  expect(gridElement).toHaveClass('grid');
  expect(gridElement).toHaveClass('grid-cols-1');
  expect(gridElement).toHaveClass('md:grid-cols-2');
  expect(gridElement).toHaveStyle({
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'
  });
});
```

### 8. Accessibility Testing

```typescript
describe('Accessibility', () => {
  it('provides proper focus management', () => {
    render(<MyComponent />);

    const button = screen.getByRole('button', { name: 'Submit' });
    button.focus();
    expect(document.activeElement).toBe(button);
  });

  it('uses proper semantic HTML', () => {
    render(<MyComponent />);

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('maintains child accessibility attributes', () => {
    render(
      <ParentComponent>
        <button aria-label="Close dialog">X</button>
      </ParentComponent>
    );

    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Close dialog');
  });
});
```

---

## Component Test Inventory

### Dashboard Components

| Component | Test File | Test Count | Coverage Focus |
|-----------|-----------|------------|----------------|
| StockDashboard | `StockDashboard.test.tsx` | ~50 | Grid integration, API calls, interactions |
| StockDashboard (Left Column) | `StockDashboard.LeftColumnConditional.test.tsx` | ~15 | Conditional rendering |
| StockDashboard (ResponsiveGrid) | `StockDashboard.ResponsiveGrid.test.tsx` | ~10 | Grid props verification |

### Layout Components

| Component | Test File | Test Count | Coverage Focus |
|-----------|-----------|------------|----------------|
| ResponsiveGrid | `ResponsiveGrid.test.tsx` | ~100 | Column config, breakpoints, edge cases |
| ResponsiveGrid (Hooks) | `ResponsiveGrid.hooks.test.tsx` | ~20 | useResponsiveGrid hook |
| ResponsiveGrid (Integration) | `ResponsiveGrid.integration.test.tsx` | ~15 | Full integration scenarios |
| ResponsiveContainer | `ResponsiveContainer.test.tsx` | ~20 | Container behavior |
| MultiColumnLayout | `MultiColumnLayout.test.tsx` | ~15 | Multi-column rendering |
| ResponsiveTransitions | `ResponsiveTransitions.test.tsx` | ~10 | Animation/transition handling |

### UI Components

| Component | Test File | Test Count | Coverage Focus |
|-----------|-----------|------------|----------------|
| ErrorBoundary | `ErrorBoundary.test.tsx` | ~30 | Error catching, recovery, UI |
| CollapsibleSection | `CollapsibleSection.test.tsx` | ~15 | Expand/collapse behavior |
| SimpleStockChart | `SimpleStockChart.test.tsx` | ~20 | Chart rendering |
| AdvancedStockChart | `AdvancedStockChart.test.tsx` | ~25 | Advanced chart features |
| TechnicalIndicatorExplanations | `TechnicalIndicatorExplanations.test.tsx` | ~15 | Indicator display |

### Portfolio Components

| Component | Test File | Test Count | Coverage Focus |
|-----------|-----------|------------|----------------|
| HoldingsDataGrid | `HoldingsDataGrid.test.tsx` | ~15 | Data grid rendering |
| PortfolioSummaryCard | `PortfolioSummaryCard.test.tsx` | ~10 | Summary display |
| TransactionModal | `TransactionModal.test.tsx` | ~15 | Modal behavior |

### Hook Tests

| Hook | Test File | Test Count | Coverage Focus |
|------|-----------|------------|----------------|
| usePredictions | `usePredictions.test.ts` | ~15 | State management, API calls |
| useStockAnalysis | `useStockAnalysis.test.ts` | ~15 | Analysis fetching |
| behavioralEquivalence | `behavioralEquivalence.property.test.ts` | ~20 | Property-based testing |

### Responsive/Mobile Tests

| Focus Area | Test File | Test Count | Coverage Focus |
|------------|-----------|------------|----------------|
| Mobile Layout | `MobileLayoutPreservation.test.tsx` | ~15 | Mobile-specific rendering |
| Comprehensive | `ComprehensiveResponsive.test.tsx` | ~25 | Cross-breakpoint testing |
| Error Handling | `ResponsiveLayout.errorHandling.test.tsx` | ~15 | Error states |

---

## Common Testing Scenarios

### Testing Components with Context

```typescript
vi.mock('../trading-journal/hooks/usePortfolioStats', () => ({
  usePortfolioStats: () => ({
    trades: [],
    stats: null,
    loading: false,
    error: null,
    fetchTrades: vi.fn(),
    createTrade: vi.fn().mockResolvedValue({}),
  })
}));
```

### Testing Components with Modals

```typescript
it('should open modal on button click', async () => {
  render(<StockDashboard />);

  await screen.findByText('$150');

  const logTradeButton = screen.getByTitle('Log a trade for AAPL');
  fireEvent.click(logTradeButton);

  await waitFor(() => {
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

it('should close modal when clicking outside', async () => {
  // ... open modal ...

  const dialog = screen.getByRole('dialog');
  fireEvent.click(dialog); // Click backdrop

  await waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
```

### Testing Event Propagation

```typescript
it('should not trigger card click when clicking button inside card', async () => {
  const analysisMock = vi.fn();

  render(<StockDashboard />);
  await screen.findByText('$150');

  // Click remove button (should not trigger card click)
  const removeButton = screen.getByTitle('Remove AAPL');
  fireEvent.click(removeButton);

  // Analysis API should not be called
  expect(analysisMock).not.toHaveBeenCalled();
});
```

### Testing Environment-Specific Behavior

```typescript
it('displays error details in development mode', () => {
  vi.stubEnv('NODE_ENV', 'development');

  render(
    <ErrorBoundary>
      <ThrowError shouldThrow={true} />
    </ErrorBoundary>
  );

  expect(screen.getByText('Error Details (Development)')).toBeInTheDocument();

  vi.unstubAllEnvs();
});

it('hides error details in production mode', () => {
  vi.stubEnv('NODE_ENV', 'production');

  render(
    <ErrorBoundary>
      <ThrowError shouldThrow={true} />
    </ErrorBoundary>
  );

  expect(screen.queryByText('Error Details (Development)')).not.toBeInTheDocument();

  vi.unstubAllEnvs();
});
```

### Testing Rerender Behavior

```typescript
it('handles prop changes correctly', () => {
  const { rerender } = render(<ResponsiveGrid columns={{ mobile: 1 }} />);

  expect(container.firstChild).toHaveClass('grid-cols-1');

  rerender(<ResponsiveGrid columns={{ mobile: 2 }} />);

  expect(container.firstChild).toHaveClass('grid-cols-2');
});
```

---

## Troubleshooting

### Common Issues

#### "act() warning"

Use `renderWithProviders` and `userEvent`:

```typescript
// Bad
render(<Component />);
fireEvent.click(button);

// Good
const { user } = renderWithProviders(<Component />);
await user.click(button);
```

#### "findBy* timing out"

Increase timeout or check if element is actually being rendered:

```typescript
// Default timeout is 1000ms, increase if needed
await screen.findByText('Expected', {}, { timeout: 5000 });
```

#### "Element not found"

Use `queryBy*` to check existence without throwing:

```typescript
// Throws if not found
screen.getByText('Text');

// Returns null if not found
screen.queryByText('Text');
```

#### Mock not being called

Ensure mock is set up before render and reset between tests:

```typescript
beforeEach(() => {
  vi.resetAllMocks();
  (global.fetch as any).mockResolvedValue({ ... });
});
```

### Debugging Tips

```typescript
// Print DOM for debugging
screen.debug();

// Print specific element
screen.debug(screen.getByTestId('my-element'));

// Verbose test output
npm test -- --verbose --testPathPattern="MyComponent"
```

---

## Best Practices Checklist

- [ ] Test file mirrors component structure (`Component.test.tsx`)
- [ ] Mock complex child components to isolate tests
- [ ] Use `data-testid` for elements hard to query by role/text
- [ ] Test loading, success, and error states
- [ ] Test user interactions with `userEvent`
- [ ] Test accessibility (focus, roles, semantic HTML)
- [ ] Clean up mocks in `afterEach`
- [ ] Use dynamic dates via `mockTrade()`, `mockPriceDataArray()`
- [ ] Avoid hardcoded waits (`setTimeout`), use `waitFor`
- [ ] Group tests by behavior (`describe` blocks)

---

**Last Updated:** 2026-02-01
**Total Component Test Files:** 26
**Testing Framework:** Vitest + React Testing Library
