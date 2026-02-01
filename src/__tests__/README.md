# API Tests Documentation

This directory contains comprehensive tests for all API routes.

## Test Structure

```
__tests__/
├── api/
│   ├── contract-tests.test.ts    # API contract validation
│   ├── predictions.test.ts       # /api/predictions tests
│   ├── analysis.test.ts          # /api/analysis tests
│   └── search.test.ts            # /api/search tests
├── utils/                        # Shared test utilities
│   ├── index.ts                  # Central exports
│   ├── mock-request.ts           # NextRequest mocking
│   ├── mock-data.ts              # Test data builders
│   ├── render-helpers.tsx        # Component render helpers
│   ├── test-constants.ts         # Shared constants
│   └── README.md                 # Utilities documentation
└── README.md                     # This file
```

## Test Utilities

All tests should use the shared utilities from `@/__tests__/utils`. See [utils/README.md](./utils/README.md) for full documentation.

```typescript
import {
  createMockGetRequest,
  parseResponseJson,
  mockTrade,
  HTTP_STATUS,
  renderWithProviders,
} from '@/__tests__/utils';
```

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test File
```bash
npm test -- predictions.test.ts
npm test -- analysis.test.ts
npm test -- search.test.ts
npm test -- contract-tests.test.ts
```

### Watch Mode
```bash
npm test -- --watch
```

### Coverage Report
```bash
npm test -- --coverage
```

### Contract Tests Only (Quick Check)
```bash
npm run test:contracts
# or
npm test -- contract-tests
```

## Test Categories

### 1. Contract Tests (`contract-tests.test.ts`)
**Purpose:** Prevent breaking changes to API response structures

**What it tests:**
- Response structure matches expected format
- `data` field is correct type (array vs object)
- Required fields are present
- Metadata structure is consistent

**When to run:**
- ✅ Before every commit touching API routes
- ✅ Before deploying
- ✅ In CI/CD pipeline

**Example:**
```typescript
test('predictions.data should be an array', () => {
  expect(Array.isArray(response.data)).toBe(true);
});
```

---

### 2. Unit Tests

#### Predictions Tests (`predictions.test.ts`)
**Coverage:**
- ✅ Response structure validation
- ✅ Input validation (symbols, formats)
- ✅ Business logic (bullish/bearish/neutral)
- ✅ Error handling (failed symbols, no data)
- ✅ Price calculations (target price, support/resistance)
- ✅ Edge cases (empty arrays, invalid symbols)

**Test Count:** ~30 tests

**Key Tests:**
```typescript
✓ should return correct response structure
✓ data should be an array, not an object
✓ should generate bullish prediction when signals are positive
✓ should calculate target price correctly
✓ should continue processing other symbols if one fails
```

---

#### Analysis Tests (`analysis.test.ts`)
**Coverage:**
- ✅ GET endpoint (fetch from FMP)
- ✅ POST endpoint (custom data)
- ✅ Response structure validation
- ✅ Input validation (symbols, timeframes)
- ✅ Data transformation (date strings → Date objects)
- ✅ Graceful degradation (quote fetch failure)
- ✅ Custom configuration support

**Test Count:** ~25 tests per endpoint

**Key Tests:**
```typescript
✓ should include priceData array
✓ currentQuote can be null if fetch fails
✓ should convert date strings to Date objects
✓ should pass config to TechnicalAnalysisEngine
✓ POST should have lower rate limit than GET
```

---

#### Search Tests (`search.test.ts`)
**Coverage:**
- ✅ Response structure validation
- ✅ Input validation (query, limit)
- ✅ Exchange filtering (US only)
- ✅ Response transformation
- ✅ Metadata generation
- ✅ Edge cases (special characters, empty results)

**Test Count:** ~25 tests

**Key Tests:**
```typescript
✓ should only return US exchanges
✓ should handle case-insensitive exchange names
✓ should transform results to correct format
✓ should handle special characters in query
✓ should handle all results filtered out
```

---

## Coverage Monitoring

### Running Coverage

```bash
# Generate coverage report
npm run test:coverage

# View HTML report in browser
npm run test:coverage:view

# CI-friendly coverage with verbose output
npm run test:coverage:ci
```

### Coverage Reports

Reports are generated in the `./coverage` directory:
- **HTML Report:** `coverage/index.html` (interactive browser view)
- **LCOV:** `coverage/lcov.info` (CI integration: Codecov, Coveralls)
- **JSON:** `coverage/coverage-final.json` (machine-readable)

### Current Coverage Status

| Module | Statements | Branches | Functions | Lines |
|--------|-----------|----------|-----------|-------|
| Technical Analysis | 93% | 89% | 92% | 94% |
| Overall Codebase | 20% | 17% | 12% | 20% |

### Coverage Thresholds

Current baseline thresholds (in `vitest.config.ts`):
- Statements: 20%
- Branches: 15%
- Functions: 10%
- Lines: 20%

**Target goals** (to increase incrementally):
- Statements: 50%+
- Branches: 40%+
- Functions: 50%+
- Lines: 50%+

## Test Coverage Goals by Component

| Component | Current | Target |
|-----------|---------|--------|
| Technical Analysis | 93% | 95% |
| API Routes | 20% | 80% |
| Components | 15% | 70% |
| Utilities | 10% | 80% |

## Common Test Patterns

### Testing Response Structure
```typescript
test('should return correct structure', () => {
  const response = {
    success: true,
    data: [...],
    metadata: {...}
  };

  expect(response).toMatchObject({
    success: true,
    data: expect.any(Array),
    metadata: expect.any(Object),
  });
});
```

### Testing Validation
```typescript
test('should reject invalid input', () => {
  const invalidInputs = ['', '123', 'TOO_LONG_SYMBOL'];

  invalidInputs.forEach(input => {
    const isValid = /^[A-Z]{1,5}$/.test(input);
    expect(isValid).toBe(false);
  });
});
```

### Testing Error Handling
```typescript
test('should continue on partial failure', () => {
  const symbols = ['AAPL', 'INVALID', 'GOOGL'];

  symbols.forEach(symbol => {
    try {
      processSymbol(symbol);
    } catch (error) {
      // Should not throw, just log
      console.error(error);
    }
  });
});
```

## Mocking Strategy

### Using Test Utilities

Always use the shared test utilities for consistent mocking:

```typescript
import {
  createMockGetRequest,
  createMockPostRequest,
  parseResponseJson,
  mockTrade,
  mockPriceDataArray,
  mockResponses,
  HTTP_STATUS,
} from '@/__tests__/utils';

// Create mock requests
const request = createMockGetRequest('/api/trades', { status: 'OPEN' });

// Create mock data with dynamic dates
const trade = mockTrade({ symbol: 'AAPL' });
const priceData = mockPriceDataArray(90);

// Parse responses safely
const response = await GET(request);
const data = await parseResponseJson(response);
```

### External Dependencies
```typescript
jest.mock('@/lib/data-providers/fmp');
jest.mock('@/lib/technical-analysis/engine');

const mockFMPProvider = {
  getHistoricalData: jest.fn(),
  getQuote: jest.fn(),
};
```

### Why We Mock
- ✅ Tests run fast (no real API calls)
- ✅ Tests are deterministic (no flaky results)
- ✅ Can test error scenarios
- ✅ No API costs during testing
- ✅ Dynamic dates prevent test staleness

## Integration Tests (Future)

**Planned Location:** `__tests__/integration/`

**What they'll test:**
- Actual HTTP requests to routes
- Middleware stack execution
- Real database interactions
- End-to-end workflows

**Setup:**
```bash
# Start test server
npm run test:server

# Run integration tests
npm run test:integration
```

## CI/CD Integration

### GitHub Actions
```yaml
name: API Tests
on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:contracts  # Quick check
      - run: npm test -- --coverage  # Full test suite
```

### Pre-commit Hook
```bash
# .husky/pre-commit
#!/bin/sh
npm run test:contracts || {
  echo "❌ Contract tests failed!"
  exit 1
}
```

## Debugging Tests

### Run Single Test
```bash
npm test -- -t "should return correct response structure"
```

### Debug Mode
```bash
# Use Vitest's built-in debug mode
npm test -- --inspect-brk

# Or use the UI for interactive debugging
npm run test:ui
```

### Verbose Output
```bash
npm test -- --verbose
```

## Writing New Tests

### Template
```typescript
describe('Feature Name', () => {
  describe('Success Cases', () => {
    test('should do X when Y', () => {
      // Arrange
      const input = {...};

      // Act
      const result = processInput(input);

      // Assert
      expect(result).toBe(expected);
    });
  });

  describe('Error Cases', () => {
    test('should throw when invalid', () => {
      expect(() => processInput(invalid)).toThrow();
    });
  });
});
```

### Best Practices
1. **Descriptive Names:** `should return array when symbols provided`
2. **AAA Pattern:** Arrange, Act, Assert
3. **One Assertion:** Test one thing per test
4. **Independent:** Tests shouldn't depend on each other
5. **Fast:** Mock expensive operations

## Test Maintenance

### When to Update Tests

**Add tests when:**
- ✅ Adding new API endpoints
- ✅ Adding new features
- ✅ Fixing bugs (add regression test)

**Update tests when:**
- ✅ Changing response structure
- ✅ Adding/removing fields
- ✅ Changing validation rules

**Delete tests when:**
- ✅ Removing features
- ✅ Tests become obsolete

### Red-Green-Refactor

1. **Red:** Write failing test first
2. **Green:** Write minimum code to pass
3. **Refactor:** Clean up code while tests pass

## FAQ

**Q: Why are tests not running?**
A: Check that Vitest is configured in `vitest.config.ts` and dependencies are installed (`npm install`).

**Q: How do I test middleware?**
A: Middleware is tested through the route tests. Each route test verifies middleware behavior.

**Q: Should I test error responses?**
A: Yes! Error handling is critical. Test all error scenarios.

**Q: How do I test rate limiting?**
A: Contract tests verify rate limit config exists. Integration tests verify it works.

**Q: What about E2E tests?**
A: E2E tests (Playwright/Cypress) are separate and test the full stack.

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Contract Testing Guide](../docs/PREVENTING_BREAKING_CHANGES.md)
- [Component Testing Guide](../docs/COMPONENT_TESTING_GUIDE.md)
- [Test Utilities Documentation](./utils/README.md)

## Quick Reference

```bash
# Run all tests
npm test

# Run specific file
npm test predictions

# Watch mode
npm test -- --watch

# Coverage report
npm run test:coverage

# View coverage in browser
npm run test:coverage:view

# Contracts only
npm run test:contracts

# Verbose
npm test -- --verbose

# Run tests in UI mode
npm run test:ui

# Single run (no watch)
npm run test:run
```

---

**Last Updated:** 2026-02-01
**Test Coverage:** 20% current → 50%+ (target)
**Test Count:** ~1100+ tests across 45+ files
