# Remaining Test Failures Summary

**Current Status:** 100 failures out of 1031 tests (90.3% passing)

## Breakdown by Test File

| Test File | Failures | Category | Difficulty |
|-----------|----------|----------|------------|
| AdvancedStockChart.test.tsx | 31 | Component | Medium |
| trades/stats route.test.ts | 18 | API | Easy |
| ComprehensiveResponsive.test.tsx | 14 | Component | Medium |
| ResponsiveGrid.integration.test.tsx | 13 | Component | Easy |
| trades route.property.test.ts | 8 | API | Medium |
| analysis.test.ts | 5 | API | Easy |
| StockDashboard tests | 4 | Component | Medium |
| MobileLayoutPreservation.test.tsx | 2 | Component | Easy |
| search.test.ts | 2 | API | Easy |
| predictions.test.ts | 2 | API | Easy |
| predictions.property.test.ts | 1 | Types | Easy |

## Category 1: AdvancedStockChart (31 failures)

### Issues:
1. **Empty state message mismatch** (10 tests)
   - Tests expect: "No chart data available"
   - Component returns: "No price data available for TEST"
   - **Root cause**: Early return at line 397 vs late check at line 643
   - **Affected tests**:
     - "should display 'No chart data available' message when chartData is empty"
     - "should show empty state after filtering removes all data"
     - "should transition from empty state to chart when data becomes available"
     - "should maintain empty state across chart type changes"
     - And 6 more...

2. **React act() warnings** (8 tests)
   - State updates from fireEvent not wrapped in act()
   - **Affected tests**:
     - "should maintain inline height style across chart type changes"
     - "should maintain inline height style across time range changes"
     - And 6 more...

3. **Timeout waiting for elements** (2 tests)
   - Tests timeout at 1000ms waiting for chart elements
   - **Affected tests**:
     - "should log updated data points when time range changes"
     - "should log correct data points after filtering by time range"

4. **Container styling expectations** (11 tests)
   - Tests expect specific inline styles that may not exist
   - Looking for `.w-full` with `style="height: 400px"`
   - **Affected tests**:
     - "should apply inline height style to chart container"
     - "should wrap RSI chart ResponsiveContainer in a div"
     - And 9 more...

### Quick Wins:
- **Fix empty state message** (10 tests): Change early return message OR update tests
- **Fix act() warnings** (8 tests): Wrap fireEvent calls in act()

## Category 2: API Route Tests (35 failures)

### trades/stats route (18 failures)
- **Issue**: Error handling tests for connection/auth errors
- **Root cause**: Tests not properly mocking error scenarios
- **Difficulty**: Easy - just need to fix mocks

### analysis route (5 failures)
- **Issue**: Structure-only tests that don't call actual route
- **Examples**:
  - "should return correct response structure" - defines structure but doesn't test it
  - "should reject invalid symbols" - regex test logic error
- **Fix**: Rewrite to actually call route handlers

### search/predictions routes (4 failures)
- **Issue**: Similar to analysis route - structure tests without execution
- **Fix**: Rewrite to call actual handlers

### trades property tests (8 failures)
- **Issue**: Property-based tests with incorrect expectations
- **Fix**: Update test expectations to match actual behavior

## Category 3: Responsive Grid Tests (27 failures)

### ResponsiveGrid.integration.test.tsx (13 failures)
- **Issue**: Vitest mock warnings: `vi.fn() mock did not use 'function' or 'class'`
- **Examples**:
  - "should adapt layout based on screen size changes"
  - "should handle dynamic content changes gracefully"
- **Fix**: Update mock implementations to use proper function syntax

### ComprehensiveResponsive.test.tsx (14 failures)
- **Issue**: Similar mock warnings
- **Fix**: Same as above

## Category 4: Other Component Tests (6 failures)

### StockDashboard (4 failures)
- **Issue**: `predictions.map is not a function`
- **Root cause**: Mock data structure doesn't match expected format
- **Fix**: Update mock data structure

### MobileLayoutPreservation (2 failures)
- **Issue**: Layout tests failing due to mock issues
- **Fix**: Update component mocks

## Recommended Fix Priority

### High Impact / Low Effort (20 tests - ~2 hours)

1. **Fix API test mocks** (18 tests)
   - File: `src/app/api/trades/stats/__tests__/route.test.ts`
   - Action: Fix error scenario mocks
   - Time: 30 min

2. **Fix empty state message** (10 tests)
   - File: `src/components/AdvancedStockChart.tsx:400`
   - Action: Change message to "No chart data available" OR update all test expectations
   - Time: 15 min

3. **Fix API structure tests** (5 tests)
   - Files: `src/__tests__/api/analysis.test.ts`, search.test.ts, predictions.test.ts
   - Action: Rewrite to call actual route handlers
   - Time: 45 min

### Medium Impact / Medium Effort (35 tests - ~3 hours)

4. **Fix ResponsiveGrid mocks** (27 tests)
   - Files: ResponsiveGrid tests
   - Action: Update vi.fn() to use proper function syntax
   - Time: 1 hour

5. **Add act() wrappers** (8 tests)
   - File: `src/components/__tests__/AdvancedStockChart.test.tsx`
   - Action: Wrap fireEvent calls in act()
   - Time: 1 hour

### Lower Impact / Higher Effort (45 tests - ~4 hours)

6. **Fix container styling tests** (11 tests)
   - File: AdvancedStockChart tests
   - Action: Investigate and fix inline style expectations
   - Time: 2 hours

7. **Fix StockDashboard mocks** (4 tests)
   - Action: Update predictions mock structure
   - Time: 30 min

8. **Fix remaining tests** (remaining)
   - Various fixes
   - Time: 1.5 hours

## Quick Win Strategy (Get to 95%+ passing)

**Target**: Fix 40-50 tests in next 2 hours

1. ✅ **Phase 1 Complete**: Removed empty files, fixed jest→vi (+8 tests)
2. ✅ **Phase 2 Complete**: Fixed AdvancedStockChart dates, defensive checks (+18 tests)
3. **Phase 3a** (30 min): Fix API error handling mocks (+18 tests)
4. **Phase 3b** (15 min): Fix empty state message (+10 tests)
5. **Phase 3c** (45 min): Fix API structure tests (+7 tests)

**After Phase 3**: ~965/1031 passing (93.6%)

## Test Quality Issues Found

Several tests have architectural issues:
1. Structure-only tests that don't execute code
2. Tests using old dates that fail filtering
3. Tests expecting UI elements without proper rendering
4. Mock implementations not matching Vitest requirements

These should be addressed in a separate refactoring effort.
