# Test Utilities Library

This directory contains shared test utilities that standardize testing patterns across the codebase.

## Quick Start

```typescript
import {
  // Request Mocking
  createMockNextRequest,
  createMockGetRequest,
  createMockPostRequest,
  createMockPatchRequest,
  createMockDeleteRequest,
  parseResponseJson,
  createRouteParams,

  // Data Builders
  MockDataBuilder,
  mockTrade,
  mockTradeWithPnL,
  mockPriceData,
  mockPriceDataArray,
  mockPortfolioStats,
  mockPrediction,
  mockAnalysisData,
  mockQuote,

  // Render Helpers
  renderWithProviders,
  renderAsync,
  createCustomRender,
  waitAndClick,
  waitAndType,
  fillForm,
  selectOption,
  screen,
  waitFor,
  act,
  userEvent,

  // Constants
  TEST_SYMBOLS,
  MARKET_INDICES,
  TEST_USER_IDS,
  API_ENDPOINTS,
  HTTP_STATUS,
  TRADE_CONSTANTS,
  TIMEFRAMES,
  TEST_TIMEOUTS,
  RATE_LIMITS,
  ERROR_MESSAGES,
  createMockDbTradeRow,
  mockResponses,
} from '@/__tests__/utils';
```

## Module Overview

| Module | Purpose | Use Case |
|--------|---------|----------|
| `mock-request.ts` | NextRequest mocking | API route tests |
| `mock-data.ts` | Test data factories | All tests |
| `render-helpers.tsx` | Component rendering | Component tests |
| `test-constants.ts` | Shared constants | All tests |

---

## 1. Mock Request Utilities (`mock-request.ts`)

Create NextRequest objects for API route testing.

### Basic Usage

```typescript
import { createMockNextRequest, parseResponseJson } from '@/__tests__/utils';
import { GET, POST } from '@/app/api/trades/route';

describe('GET /api/trades', () => {
  it('should return trades', async () => {
    const request = createMockNextRequest({
      url: 'http://localhost:3000/api/trades',
      searchParams: { status: 'OPEN' },
    });

    const response = await GET(request);
    const data = await parseResponseJson(response);

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
```

### Convenience Functions

```typescript
// GET with query params
const getRequest = createMockGetRequest('/api/trades', { status: 'OPEN' });

// POST with body
const postRequest = createMockPostRequest('/api/trades', {
  symbol: 'AAPL',
  side: 'LONG',
  entryPrice: 150,
  quantity: 10,
});

// PATCH with body
const patchRequest = createMockPatchRequest('/api/trades/123', {
  exitPrice: 160,
});

// DELETE
const deleteRequest = createMockDeleteRequest('/api/trades/123');

// PUT with body
const putRequest = createMockPutRequest('/api/portfolios/123', {
  name: 'Updated Portfolio',
});
```

### Dynamic Route Parameters

For routes like `/api/trades/[id]/route.ts`:

```typescript
import { createMockGetRequest, createRouteParams } from '@/__tests__/utils';
import { GET } from '@/app/api/trades/[id]/route';

const request = createMockGetRequest('/api/trades/123');
const response = await GET(request, createRouteParams({ id: '123' }));
```

### Custom Headers

```typescript
const request = createMockNextRequest({
  url: 'http://localhost:3000/api/trades',
  method: 'POST',
  body: { symbol: 'AAPL' },
  headers: {
    'X-Forwarded-For': '192.168.1.1',
    'Authorization': 'Bearer token123',
  },
});
```

### TypeScript Types

```typescript
import type { MockRequestOptions, ApiResponseBody } from '@/__tests__/utils';

// Type-safe response parsing
const data = await parseResponseJson<ApiResponseBody<Trade[]>>(response);
```

---

## 2. Mock Data Builders (`mock-data.ts`)

Create realistic test data with dynamic dates (always relative to "now").

### Why Dynamic Dates?

Tests with hardcoded dates like `2024-01-15` fail after that date passes. The MockDataBuilder generates dates relative to today:

```typescript
// Bad: Will fail after 2024-01-15
const trade = { entryDate: '2024-01-15' };

// Good: Always 5 days ago from today
const trade = MockDataBuilder.trade(); // entryDate = today - 5 days
```

### Price Data

```typescript
import { MockDataBuilder, mockPriceData, mockPriceDataArray } from '@/__tests__/utils';

// Single day's price data (today)
const today = mockPriceData(0);

// Price data from 5 days ago
const historical = mockPriceData(5, { close: 155.50 });

// Array of 90 days of data
const chartData = mockPriceDataArray(90);

// Custom options
const customData = mockPriceDataArray(30, {
  basePrice: 200,
  volatility: 5,
  trend: 'down', // 'up' | 'down' | 'flat'
});
```

### Trades

```typescript
import { mockTrade, mockTradeWithPnL, MockDataBuilder } from '@/__tests__/utils';

// Open trade (default)
const openTrade = mockTrade();

// Closed trade with P&L
const closedTrade = mockTrade({
  status: 'CLOSED',
  exitPrice: 160,
  exitDate: new Date(),
  realizedPnl: 95,
});

// Trade with current price and unrealized P&L
const tradeWithPnL = mockTradeWithPnL({ currentPrice: 155 });

// Array of trades
const trades = MockDataBuilder.tradeArray(5, {
  status: 'CLOSED',
  side: 'LONG',
  symbols: ['AAPL', 'GOOGL'],
});
```

### Portfolio Stats

```typescript
import { mockPortfolioStats } from '@/__tests__/utils';

const stats = mockPortfolioStats({
  winRate: 0.70,
  totalTrades: 50,
});
```

### API Response Data

```typescript
import { mockPrediction, mockAnalysisData, mockQuote } from '@/__tests__/utils';

// Prediction for dashboard
const prediction = mockPrediction('AAPL', {
  direction: 'bullish',
  confidence: 0.85,
});

// Analysis with signals and indicators
const analysis = mockAnalysisData('GOOGL');

// Stock quote
const quote = mockQuote('MSFT', {
  price: 400,
  change: 5.50,
  changesPercentage: 1.4,
});
```

---

## 3. Render Helpers (`render-helpers.tsx`)

Component rendering utilities that properly set up userEvent and providers.

### Basic Component Test

```typescript
import { renderWithProviders, screen } from '@/__tests__/utils';

describe('MyComponent', () => {
  it('should render and respond to clicks', async () => {
    const { user } = renderWithProviders(<MyComponent />);

    // Click a button (userEvent handles act() automatically)
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});
```

### Async Components

For components that fetch data on mount:

```typescript
import { renderAsync, screen } from '@/__tests__/utils';

describe('AsyncComponent', () => {
  it('should load data', async () => {
    // Waits for loading indicators to disappear
    const { user } = await renderAsync(<DataTable />);

    expect(screen.getByText('Data Loaded')).toBeInTheDocument();
  });

  it('should wait for specific element', async () => {
    await renderAsync(<DataTable />, {
      waitForElement: () => screen.findByText('Results: 5'),
    });
  });
});
```

### Custom Context Providers

```typescript
import { renderWithProviders, createCustomRender } from '@/__tests__/utils';

// One-off custom wrapper
const { user } = renderWithProviders(<TradeForm />, {
  additionalWrapper: ({ children }) => (
    <TradingContext.Provider value={mockContext}>
      {children}
    </TradingContext.Provider>
  ),
});

// Reusable custom render
const renderWithTradingContext = createCustomRender({
  additionalWrapper: ({ children }) => (
    <TradingContext.Provider value={mockContext}>
      {children}
    </TradingContext.Provider>
  ),
});

// Use in tests
const { user } = renderWithTradingContext(<TradeForm />);
```

### Interaction Helpers

```typescript
import { renderWithProviders, waitAndClick, waitAndType, fillForm, selectOption, screen } from '@/__tests__/utils';

describe('LoginForm', () => {
  it('should fill and submit form', async () => {
    const { user } = renderWithProviders(<LoginForm />);

    // Fill multiple fields at once
    await fillForm(user, {
      Email: 'test@example.com',
      Password: 'password123',
    });

    // Or use individual helpers
    await waitAndType(
      user,
      () => screen.findByLabelText('Email'),
      'test@example.com'
    );

    // Select dropdown option
    await selectOption(user, 'Role', 'Admin');

    // Click submit
    await waitAndClick(user, () => screen.findByRole('button', { name: 'Login' }));
  });
});
```

---

## 4. Test Constants (`test-constants.ts`)

Shared constants prevent magic values and ensure consistency.

### Stock Symbols

```typescript
import { TEST_SYMBOLS, MARKET_INDICES } from '@/__tests__/utils';

const symbol = TEST_SYMBOLS.APPLE; // 'AAPL'
const index = MARKET_INDICES.SP500; // '^GSPC'
```

### API Endpoints

```typescript
import { API_ENDPOINTS, HTTP_STATUS } from '@/__tests__/utils';

const request = createMockGetRequest(API_ENDPOINTS.TRADES);
expect(response.status).toBe(HTTP_STATUS.OK);
```

### Trade Constants

```typescript
import { TRADE_CONSTANTS, TIMEFRAMES } from '@/__tests__/utils';

const trade = mockTrade({
  side: TRADE_CONSTANTS.SIDE.LONG,
  status: TRADE_CONSTANTS.STATUS.OPEN,
  entryPrice: TRADE_CONSTANTS.DEFAULT_ENTRY_PRICE,
});
```

### Error Messages

```typescript
import { ERROR_MESSAGES } from '@/__tests__/utils';

expect(data.error).toContain(ERROR_MESSAGES.INVALID_SYMBOL);
```

### Database Row Factory

```typescript
import { createMockDbTradeRow } from '@/__tests__/utils';

// For testing database layer
const dbRow = createMockDbTradeRow({
  id: 'custom-id',
  symbol: 'GOOGL',
});
```

### Response Factories

```typescript
import { mockResponses } from '@/__tests__/utils';

// Success response
const success = mockResponses.success({ trades: [] });

// Error response
const error = mockResponses.error('Invalid input');

// Not found
const notFound = mockResponses.notFound('Trade');

// Validation error
const validationError = mockResponses.validationError('symbol', 'Invalid symbol format');
```

### Testing UI Patterns

```typescript
import { CSS_PATTERNS, ARIA_ROLES } from '@/__tests__/utils';

// Check bullish/bearish styling
expect(element.className).toMatch(CSS_PATTERNS.BULLISH);

// Find by role
const button = screen.getByRole(ARIA_ROLES.BUTTON);
```

---

## Migration Guide

### Before (Without Utilities)

```typescript
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/trades/route';

describe('GET /api/trades', () => {
  it('should return trades', async () => {
    // Manual request creation
    const url = new URL('http://localhost:3000/api/trades');
    url.searchParams.set('status', 'OPEN');
    const request = new NextRequest(url.toString());

    // Hardcoded dates
    const mockTrade = {
      id: 'trade-1',
      symbol: 'AAPL',
      entryDate: new Date('2024-01-15'), // Will become stale!
      // ... many more fields
    };

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
  });
});
```

### After (With Utilities)

```typescript
import {
  createMockGetRequest,
  parseResponseJson,
  mockTrade,
  HTTP_STATUS,
  API_ENDPOINTS,
} from '@/__tests__/utils';
import { GET } from '@/app/api/trades/route';

describe('GET /api/trades', () => {
  it('should return trades', async () => {
    // Clean request creation
    const request = createMockGetRequest(API_ENDPOINTS.TRADES, { status: 'OPEN' });

    // Dynamic dates
    const trade = mockTrade({ symbol: 'AAPL' });

    const response = await GET(request);
    const data = await parseResponseJson(response);

    expect(response.status).toBe(HTTP_STATUS.OK);
  });
});
```

---

## Best Practices

### 1. Always Use Dynamic Dates

```typescript
// Good
const trade = mockTrade();

// Bad
const trade = { entryDate: new Date('2024-01-15') };
```

### 2. Use Convenience Functions

```typescript
// Good
const request = createMockPostRequest('/api/trades', body);

// Verbose alternative
const request = createMockNextRequest({
  url: 'http://localhost:3000/api/trades',
  method: 'POST',
  body,
});
```

### 3. Use Constants for Magic Values

```typescript
// Good
expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);

// Bad
expect(response.status).toBe(400);
```

### 4. Use renderWithProviders for Components

```typescript
// Good (handles act() automatically)
const { user } = renderWithProviders(<Component />);
await user.click(button);

// Bad (may cause act() warnings)
render(<Component />);
fireEvent.click(button);
```

### 5. Type Your Response Parsing

```typescript
// Good
const data = await parseResponseJson<ApiResponseBody<Trade>>(response);

// Less safe
const data = await response.json();
```

---

## Troubleshooting

### "Cannot find module '@/__tests__/utils'"

Ensure `tsconfig.json` has the path alias:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### "act() warning" in Component Tests

Use `renderWithProviders` instead of `render`:
```typescript
// This handles act() automatically
const { user } = renderWithProviders(<Component />);
await user.click(button);
```

### "Date comparison failed"

Use `MockDataBuilder` instead of hardcoded dates:
```typescript
// Dates are always relative to "now"
const trade = mockTrade();
expect(trade.entryDate).toBeInstanceOf(Date);
```

### "Request body is undefined"

For non-GET requests, the body is automatically JSON stringified:
```typescript
const request = createMockPostRequest('/api/trades', { symbol: 'AAPL' });
// Body is available via request.json()
```

---

## File Reference

| File | Exports |
|------|---------|
| `index.ts` | All exports (use this) |
| `mock-request.ts` | `createMockNextRequest`, `createMockGetRequest`, `createMockPostRequest`, `createMockPatchRequest`, `createMockDeleteRequest`, `createMockPutRequest`, `parseResponseJson`, `createRouteParams`, `MockRequestOptions`, `ApiResponseBody` |
| `mock-data.ts` | `MockDataBuilder`, `mockPriceData`, `mockPriceDataArray`, `mockTrade`, `mockTradeWithPnL`, `mockTradeArray`, `mockPortfolioStats`, `mockPrediction`, `mockAnalysisData`, `mockQuote`, `MockPriceData` |
| `render-helpers.tsx` | `renderWithProviders`, `renderAsync`, `createCustomRender`, `waitAndClick`, `waitAndType`, `fillForm`, `selectOption`, `screen`, `waitFor`, `within`, `act`, `userEvent`, `RenderWithProvidersOptions`, `ExtendedRenderResult` |
| `test-constants.ts` | `TEST_SYMBOLS`, `MARKET_INDICES`, `TEST_USER_IDS`, `API_ENDPOINTS`, `HTTP_STATUS`, `TRADE_CONSTANTS`, `TIMEFRAMES`, `TEST_TIMEOUTS`, `RATE_LIMITS`, `ERROR_MESSAGES`, `INDICATOR_CONSTANTS`, `CSS_PATTERNS`, `ARIA_ROLES`, `createMockDbTradeRow`, `mockResponses` |

---

**Last Updated:** 2026-02-01
