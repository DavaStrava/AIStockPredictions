# Test Infrastructure Refactoring Plan

**Created:** 2026-01-31
**Last Updated:** 2026-01-31
**Status:** Ready to Implement
**Complements:** REFACTORING_PLAN.md (production code improvements)

## Executive Summary

This document addresses **test suite quality and architecture**, not production code. Our investigation revealed that **90% of tests are passing** (1,002/1,110), but the remaining 10% indicate systemic test infrastructure issues that need architectural fixes.

**Current State:**
- ✅ 1,002 tests passing (90.3%)
- ⚠️ 108 tests failing (9.7%)
- ✅ Core functionality works
- ⚠️ Test infrastructure has architectural debt

**Root Causes Identified:**
1. Missing dependencies prevented 79 tests from running
2. Tests don't properly mock Next.js Request/Response objects
3. Mock data using wrong dates/formats
4. Vitest/Jest pattern confusion
5. Tests that define expectations without executing code
6. React `act()` warnings from improper async handling

---

## What We Learned (Investigation Session 2026-01-31)

### Phase 1: Quick Wins ✅
**Fixed:** Empty test files, jest→vi references
**Result:** +8 tests passing

### Phase 2: Component Fixes ✅
**Fixed:** Mock data dates, defensive checks, console logging
**Result:** +18 tests passing

### Phase 3: API Route Mocking (Partial) ✅
**Fixed:** NextRequest mocking pattern
**Result:** +10 tests passing

### Critical Discovery: Missing @supabase/ssr Dependency ✅
**Impact:** 79 tests couldn't run due to import errors
**Fixed:** npm install
**Result:** Tests went from 1,031 → 1,110 total (+79 tests now running)

### Overall Progress
- **Starting:** 905/1,031 passing (87.8%)
- **After fixes:** 1,002/1,110 passing (90.3%)
- **Net improvement:** +97 passing tests, revealed true test health

---

## Test Failure Breakdown

### By Category (108 failures)

| Category | Failures | Root Cause | Priority |
|----------|----------|------------|----------|
| **AdvancedStockChart** | 30 | act() warnings, timeouts, message mismatches | HIGH |
| **ResponsiveGrid** | 27 | Vitest mock warnings | MEDIUM |
| **API Routes** | 23 | NextRequest mocking, error expectations | HIGH |
| **StockDashboard** | 6 | Mock data structure | MEDIUM |
| **Other Components** | 22 | Various | LOW |

### By Root Cause

1. **Mock Architecture Issues (50 tests)**
   - NextRequest not properly mocked (18 tests)
   - Vitest mock warnings (27 tests)
   - Mock data structure mismatches (5 tests)

2. **Async/Timing Issues (30 tests)**
   - React act() warnings (15 tests)
   - Test timeouts at 1000ms (15 tests)

3. **Test Design Issues (20 tests)**
   - Structure-only tests (don't execute code)
   - Wrong error message expectations
   - Outdated mock data (dates, formats)

4. **Other (8 tests)**
   - Various edge cases

---

## Phase 1: Test Utilities & Infrastructure

**Goal:** Create reusable test utilities to prevent duplication
**Priority:** HIGH | **Impact:** HIGH | **Effort:** 3-4 hours

### 1.1 Create Test Utilities Library ⭐ CRITICAL

**Status:** 📋 Planned

**Files to Create:**

```typescript
// src/__tests__/utils/mock-request.ts
/**
 * Create mock NextRequest for API route testing
 */
export function createMockNextRequest(options: {
  url?: string;
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}): NextRequest {
  const url = options.url || 'http://localhost:3000/api/test';

  return {
    nextUrl: new URL(url),
    url,
    method: options.method || 'GET',
    headers: new Headers(options.headers || {}),
    json: async () => options.body,
  } as NextRequest;
}

// Usage in tests:
const request = createMockNextRequest({
  method: 'POST',
  url: 'http://localhost:3000/api/trades',
  body: { symbol: 'AAPL', quantity: 10 }
});
```

```typescript
// src/__tests__/utils/mock-data.ts
/**
 * Generate mock data with current dates
 * Prevents date-related test failures
 */
export class MockDataBuilder {
  static priceData(daysAgo: number = 0): PriceData {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    return {
      date,
      open: 100 + Math.random() * 10,
      high: 105 + Math.random() * 10,
      low: 98 + Math.random() * 10,
      close: 103 + Math.random() * 10,
      volume: 1000000 + Math.random() * 500000,
    };
  }

  static priceDataArray(days: number = 90): PriceData[] {
    return Array.from({ length: days }, (_, i) =>
      this.priceData(days - i - 1)
    );
  }

  static trade(overrides?: Partial<JournalTrade>): JournalTrade {
    return {
      id: `trade-${Date.now()}`,
      userId: 'user-123',
      symbol: 'AAPL',
      side: 'LONG',
      entryPrice: 150,
      quantity: 10,
      entryDate: new Date(),
      status: 'OPEN',
      ...overrides,
    };
  }
}

// Usage:
const recentData = MockDataBuilder.priceDataArray(90); // Last 90 days
const trade = MockDataBuilder.trade({ symbol: 'GOOGL' });
```

```typescript
// src/__tests__/utils/render-helpers.tsx
/**
 * Custom render with providers and common setup
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderOptions
) {
  const AllProviders = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  return render(ui, { wrapper: AllProviders, ...options });
}

/**
 * Render component and wait for async operations
 */
export async function renderAsync(ui: React.ReactElement) {
  const result = renderWithProviders(ui);
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
  return result;
}
```

**Files to Create:**
- `src/__tests__/utils/mock-request.ts`
- `src/__tests__/utils/mock-data.ts`
- `src/__tests__/utils/render-helpers.tsx`
- `src/__tests__/utils/test-constants.ts`

**Files to Modify:**
- All test files using these patterns (gradual migration)

**Completion Criteria:**
- [ ] Test utilities created and documented
- [ ] At least 5 test files migrated to use utilities
- [ ] Documentation added to README
- [ ] Examples provided

---

### 1.2 Standardize Mock Patterns ⭐ CRITICAL

**Status:** 📋 Planned

**Current Issues:**
- Vitest vs Jest confusion (`jest.fn()` vs `vi.fn()`)
- Inconsistent mock implementations
- Mock warnings: "vi.fn() did not use 'function' or 'class'"

**Proposed Standards:**

```typescript
// ❌ WRONG: Arrow function mock (causes Vitest warnings)
vi.mock('module', () => ({
  method: vi.fn(() => 'value'),
}));

// ✅ CORRECT: Function/class mock
vi.mock('module', () => ({
  method: vi.fn(function() {
    return 'value';
  }),
}));

// ✅ BETTER: Mock as class for complex objects
vi.mock('@/lib/service', () => ({
  Service: class MockService {
    method = vi.fn();
    constructor() {
      this.method.mockReturnValue('value');
    }
  }
}));
```

**Create Mock Patterns Guide:**

```markdown
# Mock Patterns Guide

## API Route Mocks
- Always use `createMockNextRequest()` helper
- Mock Response with proper JSON methods

## Database Mocks
- Use class-based mocks for DatabaseConnection
- Mock query results as arrays

## External Service Mocks
- Use vi.mock() at top level
- Clear mocks in beforeEach
- Restore in afterEach
```

**Files to Create:**
- `docs/TEST_PATTERNS.md` - Comprehensive guide
- `docs/MOCK_PATTERNS.md` - Mock-specific patterns

**Completion Criteria:**
- [ ] Mock patterns documented
- [ ] All Vitest warnings fixed (27 tests)
- [ ] Tests using standardized patterns
- [ ] Pre-commit hook checks for `jest.fn()`

---

## Phase 2: Fix Component Tests

**Goal:** Resolve React component test issues
**Priority:** HIGH | **Impact:** MEDIUM | **Effort:** 4-5 hours

### 2.1 Fix React act() Warnings ⭐ HIGH PRIORITY

**Status:** 📋 Planned

**Current Issue:**
```
Warning: An update to Component inside a test was not wrapped in act(...)
```

**Affects:** 15+ tests in AdvancedStockChart, StockDashboard

**Pattern to Fix:**

```typescript
// ❌ WRONG: State updates not wrapped
fireEvent.click(button);
await waitFor(() => {
  expect(screen.getByText('Updated')).toBeInTheDocument();
});

// ✅ CORRECT: Wrap state-triggering events in act()
await act(async () => {
  fireEvent.click(button);
});
await waitFor(() => {
  expect(screen.getByText('Updated')).toBeInTheDocument();
});

// ✅ EVEN BETTER: Use userEvent (handles act() automatically)
import userEvent from '@testing-library/user-event';

const user = userEvent.setup();
await user.click(button);
await waitFor(() => {
  expect(screen.getByText('Updated')).toBeInTheDocument();
});
```

**Migration Strategy:**

1. **Replace fireEvent with userEvent** (preferred)
   ```bash
   # Already installed: @testing-library/user-event
   ```

2. **Wrap remaining fireEvent calls in act()**
   - Only if userEvent doesn't support the interaction

**Files to Fix:**
- `src/components/__tests__/AdvancedStockChart.test.tsx` (~15 fixes)
- `src/components/__tests__/StockDashboard.*.test.tsx` (~5 fixes)

**Completion Criteria:**
- [ ] All act() warnings resolved
- [ ] Prefer userEvent over fireEvent
- [ ] Tests pass without warnings
- [ ] Pattern documented

**Estimated Impact:** +15 tests passing

---

### 2.2 Fix Test Timeouts

**Status:** 📋 Planned

**Current Issue:**
Tests timing out at 1000-1003ms waiting for elements

**Root Causes:**
1. Component doesn't render expected elements (wrong assertions)
2. Mock data doesn't trigger expected state
3. Async operations don't complete

**Debug Strategy:**

```typescript
// Add debug output to see what's actually rendered
await waitFor(() => {
  screen.debug(); // Print current DOM
  expect(screen.getByTestId('chart')).toBeInTheDocument();
}, { timeout: 5000 }); // Increase timeout for debugging

// Or use screen.logTestingPlaygroundURL()
screen.logTestingPlaygroundURL(); // Opens interactive debugger
```

**Common Fixes:**

```typescript
// ❌ Wrong: Element never renders because data is filtered out
const oldData = [{ date: new Date('2020-01-01'), ... }]; // Too old!
render(<Chart data={oldData} />);
expect(screen.getByTestId('chart')).toBeInTheDocument(); // Times out

// ✅ Correct: Use recent data
const data = MockDataBuilder.priceDataArray(90); // Last 90 days
render(<Chart data={data} />);
expect(screen.getByTestId('chart')).toBeInTheDocument(); // Works!
```

**Files to Fix:**
- `src/components/__tests__/AdvancedStockChart.test.tsx` (2 timeout tests)
- Others TBD after debugging

**Completion Criteria:**
- [ ] All timeout issues diagnosed
- [ ] Root causes fixed (data, assertions, or mocks)
- [ ] Tests run in <500ms
- [ ] Documentation of common timeout causes

**Estimated Impact:** +5 tests passing

---

### 2.3 Fix Mock Data Dates ✅ MOSTLY DONE

**Status:** 🔄 Partially Complete

**What We Fixed:**
- ✅ Updated main mock data to 2025-12-XX
- ✅ Fixed multi-month data to start 2025-10-01
- ✅ Fixed large datasets to start 2023-01-01
- ✅ Changed "very old" test data to 2025-09-01

**Remaining Work:**
- [ ] Audit all test files for hardcoded dates
- [ ] Replace with `MockDataBuilder.priceData(daysAgo)`
- [ ] Add lint rule to prevent `new Date('2024-XX-XX')`

**Completion Criteria:**
- [ ] No hardcoded dates in tests
- [ ] All tests use data builders
- [ ] Dates always relative to current time
- [ ] Pre-commit hook checks for hardcoded dates

---

## Phase 3: Fix API Route Tests

**Goal:** Properly test Next.js API routes
**Priority:** HIGH | **Impact:** HIGH | **Effort:** 3-4 hours

### 3.1 Standardize NextRequest Mocking ✅ STARTED

**Status:** 🔄 In Progress

**What We Fixed:**
- ✅ Created `createMockRequest()` helper in trades/stats tests
- ✅ Fixed 10/18 tests in trades/stats

**Remaining Work:**

1. **Move helper to shared utilities**
   ```bash
   mv pattern → src/__tests__/utils/mock-request.ts
   ```

2. **Apply to all API route tests**
   - `src/app/api/trades/__tests__/*`
   - `src/app/api/trades/[id]/__tests__/*`
   - `src/__tests__/api/*.test.ts`

3. **Enhance helper with more options**
   ```typescript
   export function createMockNextRequest(options: {
     url?: string;
     method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
     body?: any;
     headers?: Record<string, string>;
     cookies?: Record<string, string>;
     searchParams?: Record<string, string>;
   }): NextRequest {
     // Full implementation
   }
   ```

**Files to Create:**
- `src/__tests__/utils/mock-request.ts` ⭐
- `src/__tests__/utils/mock-response.ts`

**Files to Migrate:**
- All `src/app/api/**/__tests__/*.test.ts` files
- All `src/__tests__/api/*.test.ts` files

**Completion Criteria:**
- [ ] Shared mock utilities created
- [ ] All API route tests use utilities
- [ ] 100% of API tests use proper mocks
- [ ] No more "Cannot read properties of undefined (reading 'nextUrl')"

**Estimated Impact:** +13 tests passing (remaining API tests)

---

### 3.2 Fix Error Message Expectations ✅ STARTED

**Status:** 🔄 In Progress

**What We Fixed:**
- ✅ Changed exact match `.toBe()` to `.toContain()` for error messages
- ✅ Fixed 1 test in trades/stats

**Pattern:**

```typescript
// ❌ Wrong: Exact match fails when middleware adds details
expect(data.error).toBe('Database connection failed');

// ✅ Correct: Partial match works
expect(data.error).toContain('Database connection failed');
```

**Remaining Work:**
- [ ] Audit all error expectation tests
- [ ] Update to use `.toContain()` pattern
- [ ] Document error response structure
- [ ] Add type safety for error responses

**Completion Criteria:**
- [ ] All error tests use flexible matching
- [ ] Error response types documented
- [ ] Tests don't break when error details change

**Estimated Impact:** +8 tests passing (remaining error tests)

---

### 3.3 Fix Structure-Only Tests

**Status:** 📋 Planned

**Current Issue:**
Tests define expected structure but don't execute code:

```typescript
// ❌ Wrong: Defines structure but doesn't test anything
test('should return correct response structure', () => {
  const expectedStructure = {
    success: true,
    data: expect.objectContaining({
      summary: expect.any(Object),
    }),
  };

  expect(expectedStructure.success).toBe(true); // Always passes!
  expect(expectedStructure.data).toHaveProperty('summary'); // Wrong!
});

// ✅ Correct: Actually call the API and test response
test('should return correct response structure', async () => {
  const request = createMockNextRequest({ url: '/api/analysis' });
  const response = await GET(request);
  const data = await response.json();

  expect(data.success).toBe(true);
  expect(data).toHaveProperty('data');
  expect(data.data).toHaveProperty('summary');
  expect(data.data.summary).toMatchObject({
    overall: expect.any(String),
    strength: expect.any(Number),
  });
});
```

**Files to Fix:**
- `src/__tests__/api/analysis.test.ts` (~5 tests)
- `src/__tests__/api/predictions.test.ts` (~2 tests)
- `src/__tests__/api/search.test.ts` (~2 tests)

**Completion Criteria:**
- [ ] All structure tests actually call routes
- [ ] Tests verify real response structure
- [ ] Pattern documented

**Estimated Impact:** +9 tests passing

---

## Phase 4: Documentation & Standards

**Goal:** Prevent future test quality issues
**Priority:** MEDIUM | **Impact:** HIGH | **Effort:** 2-3 hours

### 4.1 Create Testing Guide ⭐ CRITICAL

**Status:** 📋 Planned

**Files to Create:**

#### `docs/TESTING_GUIDE.md`

```markdown
# Testing Guide

## Test Organization
- Unit tests: `*.test.ts` next to source
- Integration tests: `src/__tests__/integration/`
- API tests: `src/__tests__/api/` or `src/app/api/**/__tests__/`

## Naming Conventions
- `describe('ComponentName', ...)`
- `describe('functionName', ...)`
- `it('should [behavior]', ...)`

## Common Patterns

### Component Tests
- Use renderWithProviders() for components needing context
- Use userEvent instead of fireEvent
- Always await async operations
- Clean up with cleanup() in afterEach

### API Route Tests
- Use createMockNextRequest() helper
- Test success cases and error cases
- Verify response structure and status codes
- Check error messages contain key information

### Mock Data
- Use MockDataBuilder for dynamic data
- Never hardcode dates - use relative dates
- Keep mock data minimal but realistic

## Anti-Patterns to Avoid
- ❌ Using jest.fn() in Vitest (use vi.fn())
- ❌ Hardcoded dates in mock data
- ❌ Testing implementation details
- ❌ Not wrapping state updates in act()
- ❌ Structure-only tests that don't execute
```

#### `docs/MOCK_PATTERNS.md`

```markdown
# Mock Patterns

## Vitest Mocks

### Basic Mock
\`\`\`typescript
vi.mock('module', () => ({
  method: vi.fn(function() { return 'value'; }),
}));
\`\`\`

### Class Mock
\`\`\`typescript
vi.mock('module', () => ({
  ClassName: class MockClass {
    method = vi.fn();
  }
}));
\`\`\`

### Cleanup
\`\`\`typescript
beforeEach(() => {
  vi.clearAllMocks(); // Clear call history
});

afterEach(() => {
  vi.restoreAllMocks(); // Restore original implementations
});
\`\`\`

## Next.js API Mocks

### NextRequest
\`\`\`typescript
import { createMockNextRequest } from '@/__tests__/utils/mock-request';

const request = createMockNextRequest({
  method: 'POST',
  body: { symbol: 'AAPL' },
});
\`\`\`

### Database Mocks
\`\`\`typescript
vi.mock('@/lib/database/connection', () => ({
  getDatabase: vi.fn(() => ({
    query: vi.fn(),
    healthCheck: vi.fn(),
  })),
}));
\`\`\`
```

**Completion Criteria:**
- [ ] Testing guide created
- [ ] Mock patterns documented
- [ ] Examples for all common scenarios
- [ ] Linked from main README

---

### 4.2 Add Pre-Commit Hooks

**Status:** 📋 Planned

**Goal:** Catch test quality issues before commit

**Install Husky:**
```bash
npm install -D husky lint-staged
npx husky init
```

**Configure:**

```json
// package.json
{
  "lint-staged": {
    "**/*.test.{ts,tsx}": [
      "eslint --fix",
      "grep -q 'jest\\.fn()' && echo 'Error: Use vi.fn() instead of jest.fn()' && exit 1 || true",
      "grep -q \"new Date('20[0-2][0-4]\" && echo 'Error: Avoid hardcoded dates in tests' && exit 1 || true"
    ]
  }
}
```

```bash
# .husky/pre-commit
npm run lint-staged
npm test -- --run --changed
```

**Completion Criteria:**
- [ ] Husky installed and configured
- [ ] Pre-commit checks for common mistakes
- [ ] Tests run on changed files before commit
- [ ] Documentation added

---

## Phase 5: Test Coverage & Quality Metrics

**Goal:** Track and improve test quality
**Priority:** LOW | **Impact:** MEDIUM | **Effort:** 2-3 hours

### 5.1 Set Up Coverage Reporting

**Status:** 📋 Planned

**Already Configured:**
```json
// package.json
{
  "scripts": {
    "test:coverage": "vitest run --coverage"
  }
}
```

**Add Coverage Thresholds:**

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
      exclude: [
        'src/__tests__/**',
        '**/*.test.{ts,tsx}',
        'src/types/**',
      ],
    },
  },
});
```

**Completion Criteria:**
- [ ] Coverage thresholds configured
- [ ] Coverage reports in CI/CD
- [ ] Coverage badge in README
- [ ] Team reviews coverage regularly

---

### 5.2 Test Quality Metrics Dashboard

**Status:** 💡 Proposed (Nice to have)

**Create Test Health Report:**

```typescript
// scripts/test-health.ts
import { execSync } from 'child_process';

interface TestHealth {
  total: number;
  passing: number;
  failing: number;
  passRate: number;
  avgDuration: number;
  warnings: {
    actWarnings: number;
    timeouts: number;
    mockWarnings: number;
  };
}

function analyzeTestHealth(): TestHealth {
  // Run tests and analyze output
  const output = execSync('npm test 2>&1', { encoding: 'utf-8' });

  // Parse output for metrics
  // Return health report
}

// Generate markdown report
function generateReport(health: TestHealth): string {
  return `
# Test Health Report

**Pass Rate:** ${health.passRate.toFixed(1)}%
**Total Tests:** ${health.total}
**Passing:** ${health.passing} ✅
**Failing:** ${health.failing} ❌

## Warnings
- React act() warnings: ${health.warnings.actWarnings}
- Timeouts: ${health.warnings.timeouts}
- Mock warnings: ${health.warnings.mockWarnings}

**Status:** ${health.passRate >= 95 ? '✅ Healthy' : '⚠️ Needs Attention'}
  `;
}
```

**Usage:**
```bash
npm run test:health
# Outputs: TEST_HEALTH_REPORT.md
```

**Completion Criteria:**
- [ ] Test health script created
- [ ] Runs in CI/CD
- [ ] Reports tracked over time
- [ ] Alerts if quality drops

---

## Priority Matrix

### Do First (High Impact, Low Effort)

1. ⭐ **Create Test Utilities** (Phase 1.1) - 3-4 hours
   - Biggest impact on developer experience
   - Prevents future issues
   - Makes all other work easier

2. ⭐ **Standardize NextRequest Mocking** (Phase 3.1) - 2 hours
   - Fixes 13+ API tests immediately
   - Clear pattern to follow

3. ⭐ **Fix act() Warnings** (Phase 2.1) - 2-3 hours
   - Fixes 15+ tests
   - Improves test reliability

### Do Next (Medium Priority)

4. **Fix Error Message Expectations** (Phase 3.2) - 1 hour
   - Quick win, +8 tests

5. **Fix Structure-Only Tests** (Phase 3.3) - 2 hours
   - +9 tests, better test quality

6. **Fix Test Timeouts** (Phase 2.2) - 2-3 hours
   - +5 tests, requires debugging

7. **Create Testing Guide** (Phase 4.1) - 2-3 hours
   - Prevents future issues
   - Onboards new developers

### Do Later (Lower Priority)

8. **Vitest Mock Warnings** (Phase 1.2) - 2-3 hours
   - Fixes 27 tests but mostly warnings

9. **Pre-Commit Hooks** (Phase 4.2) - 1 hour
   - Preventive measure

10. **Coverage & Metrics** (Phase 5) - 2-3 hours
    - Nice to have, not critical

---

## Expected Outcomes

### After Phase 1-3 (Estimated 15-20 hours)

**Test Results:**
- **Total Tests:** 1,110
- **Passing:** ~1,060-1,080 (95-97%)
- **Failing:** ~30-50 (3-5%)

**Improvements:**
- ✅ All API route tests working
- ✅ Component tests reliable
- ✅ No React warnings
- ✅ Standardized patterns
- ✅ Reusable utilities

**Remaining Failures:**
- Edge cases
- Complex integration scenarios
- Tests needing broader refactoring

### After Phase 4-5 (Estimated +5 hours)

**Quality Improvements:**
- ✅ Comprehensive documentation
- ✅ Pre-commit quality checks
- ✅ Coverage reporting
- ✅ Test health monitoring

**Developer Experience:**
- New developers can write tests confidently
- Test patterns are clear and documented
- Quality is automatically enforced
- Regressions caught early

---

## Test Quality Checklist

Use this checklist when writing new tests:

### Before Writing Tests
- [ ] Read `docs/TESTING_GUIDE.md`
- [ ] Check `docs/MOCK_PATTERNS.md` for examples
- [ ] Use test utilities from `src/__tests__/utils/`

### Writing Tests
- [ ] Use `vi.fn()` not `jest.fn()`
- [ ] Use `MockDataBuilder` for test data
- [ ] Use `createMockNextRequest()` for API tests
- [ ] Use `userEvent` instead of `fireEvent`
- [ ] Wrap async state updates in `act()` if needed
- [ ] Use `.toContain()` for flexible error matching
- [ ] Test behavior, not implementation

### Before Committing
- [ ] All tests pass locally
- [ ] No `act()` warnings
- [ ] No timeout errors
- [ ] No mock warnings
- [ ] Pre-commit hooks pass
- [ ] Coverage doesn't drop

---

## Lessons Learned

### What Worked Well
1. **Mock data builders** - Dynamic dates prevent future failures
2. **Shared utilities** - Reduces duplication, enforces patterns
3. **Progressive migration** - Fix highest impact first
4. **Investigation before fixing** - Understanding root cause prevents band-aids

### What To Avoid
1. **Hardcoded dates** - Tests break over time
2. **Structure-only tests** - Don't actually test anything
3. **Incomplete mocks** - Cause cryptic errors
4. **Ignoring warnings** - They indicate real issues
5. **Exact error matching** - Too brittle, use `.toContain()`

### Best Practices Established
1. Always use test utilities for common patterns
2. Mock data should be realistic and current
3. Tests should fail for the right reasons
4. Document patterns as you discover them
5. Automate quality checks

---

## Success Metrics

### Quantitative
- **Pass Rate:** Target 95%+ (currently 90.3%)
- **Test Duration:** Average <500ms per test
- **Warnings:** Zero act() warnings
- **Coverage:** Maintain 80%+ coverage

### Qualitative
- New developers can write tests without help
- Tests catch real bugs, not implementation details
- Test failures are clear and actionable
- Team confidence in test suite

---

## Integration with REFACTORING_PLAN.md

This plan **complements** the production code refactoring:

| Production Plan Phase | Test Support Needed |
|-----------------------|---------------------|
| Phase 2: React Query | Update component tests to mock queries |
| Phase 3: Component Decomposition | Update tests for new component structure |
| Phase 5: Integration Tests | Use utilities from this plan |
| Phase 7: Authentication | Create auth mocking utilities |

**Recommendation:** Complete **Phase 1-3 of this plan** before starting **Phase 2-3 of production plan** to ensure solid test foundation.

---

## Quick Reference

### Current Status
- **Total Tests:** 1,110
- **Passing:** 1,002 (90.3%)
- **Failing:** 108 (9.7%)
- **Test Files:** 40 total, 12 failing

### Key Files
- Test utilities: `src/__tests__/utils/`
- Documentation: `docs/TESTING_GUIDE.md`, `docs/MOCK_PATTERNS.md`
- This plan: `TEST_INFRASTRUCTURE_REFACTOR.md`

### Quick Wins (< 2 hours each)
1. Create `createMockNextRequest()` utility
2. Fix remaining trades/stats API tests
3. Create `MockDataBuilder` utility
4. Fix error message expectations
5. Document test patterns

---

**Last Updated:** 2026-01-31 by Claude Code
**Version:** 1.0
**Status:** Ready for Implementation
