# Test Failure Analysis - AdvancedStockChart Component

## Summary
126 tests failing, primarily in AdvancedStockChart.test.tsx with timeout errors and missing elements.

## Root Causes

### 1. **Early Return Prevents Test Assertions** (Critical)
**Location**: `AdvancedStockChart.tsx:397-403`

```typescript
if (filteredData.length === 0) {
    return (
        <div className="flex items-center justify-center h-96 text-gray-500">
            No price data available for {symbol}
        </div>
    );
}
```

**Problem**:
- This early return prevents the component from reaching:
  - `console.log` statements at line 540 and line 421
  - The `renderChart()` function where `console.warn` happens
  - The main chart container with specific styling that tests look for

**Affected Tests**:
- "should log chart type and data points when rendering line chart"
- "should apply inline height style to chart container"
- "should wrap RSI chart ResponsiveContainer in a div with explicit dimensions"
- Many others expecting console logs or chart elements

### 2. **Missing Console Warning in Empty State Path**
**Expected**: `console.warn('No chart data available for rendering')`
**Location**: Only called inside `renderChart()` at line 412

**Problem**:
- Tests with empty data expect this warning
- But empty data triggers early return, never calling `renderChart()`

**Affected Tests**:
- "should log warning and return null when chartData is empty"
- "should handle undefined priceData gracefully"
- "should handle null priceData gracefully"

### 3. **Duplicate Empty State Logic**
Two different empty checks:
1. Line 397: `if (filteredData.length === 0)` → Early return with "No price data available for {symbol}"
2. Line 633: `chartData.length === 0` → Shows "No chart data available"

**Problem**: Tests expect the second message but get short-circuited by the first check.

**Affected Tests**:
- "should display 'No chart data available' message when chartData is empty"
- Empty state tests

### 4. **React `act()` Warnings**
Tests have React state updates not wrapped in `act()`:
- State changes from `fireEvent.click()` on chart type buttons
- State changes from time range selection
- Data fetching in `useEffect`

**Example**:
```
An update to AdvancedStockChart inside a test was not wrapped in act(...)
```

### 5. **Vitest Mock Implementation Warnings**
Mock functions in ResponsiveGrid tests not using 'function' or 'class' syntax:
```
[vitest] The vi.fn() mock did not use 'function' or 'class' in its implementation
```

## Specific Failing Test Categories

### Category A: Console Log Assertions (58 tests)
**Pattern**: `expect(consoleLogSpy).toHaveBeenCalledWith('Rendering chart:', ...)`

**Why They Fail**:
- With empty data: Early return prevents reaching console.log
- With mock data: Console logs may be called but tests timeout waiting for elements

**Example Tests**:
- "should log chart type and data points when rendering line chart"
- "should log updated data points when time range changes"
- "should log component rendering with debug information"

### Category B: DOM Element Assertions (45 tests)
**Pattern**: `await waitFor(() => { expect(screen.getByTestId('line-chart')).toBeInTheDocument() })`

**Why They Fail**:
- Mocked Recharts components may not render as expected
- Tests timeout after 1000ms waiting for elements
- Early returns prevent chart rendering

**Example Tests**:
- "should apply inline height style to chart container"
- "should maintain inline height style across chart type changes"
- "should wrap RSI chart ResponsiveContainer with explicit dimensions"

### Category C: Empty State Tests (12 tests)
**Pattern**: Looking for specific empty state behavior

**Why They Fail**:
- Tests expect "No chart data available" but get "No price data available for {symbol}"
- Console.warn not called due to early return

**Example Tests**:
- "should log warning and return null when chartData is empty"
- "should display 'No chart data available' message"

### Category D: State Transition Tests (11 tests)
**Pattern**: Tests that change state and check for updates

**Why They Fail**:
- React act() warnings
- Timeout waiting for state updates to reflect in DOM
- Mock fetch not resolving as expected

**Example Tests**:
- "should show loading state before empty state"
- "should prioritize empty state over loading state when data is empty"
- "should handle rapid state transitions correctly"

## Solutions Required

### Fix 1: Remove Early Return or Add Console Logs
**Option A**: Add console.warn to early return path:
```typescript
if (filteredData.length === 0) {
    console.warn('No chart data available for rendering');
    return (
        <div className="flex items-center justify-center h-96 text-gray-500">
            No price data available for {symbol}
        </div>
    );
}
```

**Option B**: Remove early return, rely on conditional rendering later:
- Remove lines 397-403
- Let the component flow to the chart data check at line 633

### Fix 2: Wrap State Updates in act()
Tests should wrap fireEvent calls that trigger state updates:
```typescript
import { act } from '@testing-library/react';

// Before
fireEvent.click(areaButton);

// After
await act(async () => {
    fireEvent.click(areaButton);
});
await waitFor(() => {
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
});
```

### Fix 3: Fix Empty State Message Consistency
Decide on one message:
- "No price data available for {symbol}" (current early return)
- "No chart data available" (current late check)

Update tests to match.

### Fix 4: Add Loading State Check Before Console Logs
The debug console.log at line 540 runs every render, but tests may catch it during loading state:
```typescript
// Only log when not loading
if (!loading) {
    console.log('AdvancedStockChart rendering:', {
        symbol,
        filteredDataLength: filteredData.length,
        chartDataLength: chartData.length,
        loading,
        chartType,
        selectedTimeRange
    });
}
```

### Fix 5: Mock Recharts Better
Current mocks may not trigger proper rendering. Consider:
```typescript
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children, ...props }: any) => (
    <div data-testid="responsive-container" {...props}>
      {typeof children === 'function' ? children({ width: 800, height: 400 }) : children}
    </div>
  ),
  // ... other mocks
}));
```

## Priority Actions

1. **High Priority**: Fix early return logic - affects 58 tests
2. **High Priority**: Add act() wrappers - affects rendering and state tests
3. **Medium Priority**: Fix empty state message consistency - affects 12 tests
4. **Medium Priority**: Improve Recharts mocks - may fix DOM element tests
5. **Low Priority**: Fix vitest mock warnings - doesn't break tests, just warnings

## Additional Issues Found

### 6. **Empty Test Files** (Critical)
**Files**:
- `src/app/__tests__/page.test.tsx` - 0 lines (empty)
- `src/components/__tests__/LazyTechnicalIndicatorExplanations.test.tsx` - 0 lines (empty)

**Impact**: These files show as failures because they contain no tests.

**Fix**: Either:
1. Delete empty test files
2. Add actual test implementations

### 7. **Jest vs Vitest Confusion** (Critical)
**Location**: `src/__tests__/api/analysis.test.ts:237`

**Error**:
```
ReferenceError: jest is not defined
```

**Problem**: Test uses `jest.clearAllMocks()` but project uses Vitest.

**Affected Tests**: All POST /api/analysis tests (12 tests)

**Fix**: Replace `jest` with `vi`:
```typescript
// Before
beforeEach(() => {
    jest.clearAllMocks();
});

// After
beforeEach(() => {
    vi.clearAllMocks();
});
```

### 8. **Structure-Only Tests Without Execution**
**Location**: `src/__tests__/api/analysis.test.ts`

**Problem**: Tests define expected structure but don't actually call APIs:
```typescript
test('should return correct response structure', () => {
    const expectedStructure = {
        success: true,
        data: expect.objectContaining({...})
    };

    expect(expectedStructure.success).toBe(true);
    expect(expectedStructure.data).toHaveProperty('summary'); // ❌ Fails
});
```

**Issue**: `expectedStructure.data` is an `expect.objectContaining()` matcher, not an actual object.

**Affected Tests**:
- "should return correct response structure"
- Several POST structure tests

**Fix**: These tests need to actually call the API route handler and test the real response.

### 9. **Validation Logic Errors**
**Location**: `src/__tests__/api/analysis.test.ts:159`

**Error**:
```
expected true to be false
```

**Problem**: Test expects `/^[A-Z]+$/.test('123abc')` to be false, but the regex matches uppercase letters, so it depends on the test input.

**Test Code**:
```typescript
['123', 'abc', '!@#', ''].forEach(symbol => {
    const isValid = /^[A-Z]+$/.test(symbol);
    expect(isValid).toBe(false); // ❌ 'ABC' would be true
});
```

## Test Statistics
- Total Tests: 1031
- Passing: 905 (87.8%)
- Failing: 126 (12.2%)
- Errors: 13
- Duration: 45.71s

## Breakdown by Category
1. **AdvancedStockChart component tests**: ~70 failures
2. **API tests (jest vs vi)**: 12 failures
3. **Empty test files**: 2 files (count as failures)
4. **API structure tests**: ~6 failures
5. **Other component tests**: Remaining failures

## Recommended Fix Order

### Phase 1: Quick Wins (5 min)
1. **Delete or stub empty test files**
   - `src/app/__tests__/page.test.tsx`
   - `src/components/__tests__/LazyTechnicalIndicatorExplanations.test.tsx`

2. **Fix jest → vi reference**
   - `src/__tests__/api/analysis.test.ts:237` and similar

### Phase 2: Component Fixes (15 min)
3. **Fix AdvancedStockChart early return**
   - Add console.warn to early return path
   - Or remove early return, consolidate empty state logic

4. **Wrap state updates in act()**
   - Update AdvancedStockChart tests
   - Add act() around fireEvent calls

### Phase 3: API Test Fixes (20 min)
5. **Rewrite structure-only tests**
   - Actually call API route handlers
   - Test real responses, not mock structures

6. **Fix validation test logic**
   - Update test cases with correct expected values

### Phase 4: Remaining Issues
7. **Fix ResponsiveGrid vitest warnings**
8. **Review and fix remaining timeout tests**

## Expected Impact
- **Phase 1**: Fix ~14-15 tests (empty files + jest reference)
- **Phase 2**: Fix ~70 tests (AdvancedStockChart)
- **Phase 3**: Fix ~15 tests (API structure tests)
- **Phase 4**: Fix remaining ~26 tests

**Total**: Should bring passing rate from 87.8% → 99%+

## Next Steps
1. Start with Phase 1 quick wins
2. Verify fixes with `npm test`
3. Move to Phase 2 component fixes
4. Complete API test restructuring
5. Address remaining edge cases
