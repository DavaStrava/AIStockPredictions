# Implementation Plan: SimpleStockChart Component Fix

## Overview

This plan implements a proper SimpleStockChart component to replace the accidentally overwritten file. The implementation follows a test-driven approach, creating the component with proper TypeScript interfaces, defensive programming patterns, and comprehensive testing.

## Tasks

- [x] 1. Create the SimpleStockChart component
  - [x] 1.1 Implement the component with proper TypeScript interface
    - Create `src/components/SimpleStockChart.tsx`
    - Define SimpleStockChartProps interface matching expected props (symbol, priceData, analysis)
    - Import PriceData and TechnicalAnalysisResult types from `@/lib/technical-analysis/types`
    - Add 'use client' directive for Next.js client-side rendering
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.2 Implement empty state and error handling
    - Add null-safe data access with fallback to empty array
    - Implement guard clause for empty priceData
    - Implement guard clause for empty symbol
    - Display appropriate empty state messages
    - _Requirements: 1.4, 4.1, 4.2, 4.3_

  - [x] 1.3 Implement key metrics calculation and display
    - Calculate current price from last data point
    - Calculate price change (absolute and percentage)
    - Extract daily high, low, and volume
    - Implement volume formatting function (B/M/K suffixes)
    - Apply conditional color styling (green for positive, red for negative)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 1.4 Implement the area chart visualization
    - Import Recharts components (AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer)
    - Transform priceData to chart data format
    - Configure responsive container with minimum height
    - Style chart with blue color scheme (#3B82F6)
    - Add tooltip with date and price formatting
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.2, 5.4_

  - [x] 1.5 Apply visual styling and dark mode support
    - Use Tailwind CSS classes consistent with dashboard
    - Add dark: variants for all color classes
    - Ensure proper spacing and typography
    - _Requirements: 5.1, 5.3_

- [x] 2. Checkpoint - Verify component renders correctly
  - Ensure the component compiles without TypeScript errors
  - Verify the Quick Price Overview section displays the chart
  - Test with a selected stock to confirm data flows correctly
  - Ask the user if questions arise

- [x] 3. Write tests for SimpleStockChart
  - [x] 3.1 Write unit tests for empty states and edge cases
    - Test rendering with undefined priceData
    - Test rendering with null priceData
    - Test rendering with empty array
    - Test rendering with empty symbol
    - Test volume formatting function
    - _Requirements: 1.4, 4.1, 4.2, 4.3, 3.6_

  - [x] 3.2 Write property test for component interface acceptance
    - **Property 1: Component Interface Acceptance**
    - Generate random valid props and verify no crashes
    - **Validates: Requirements 1.1, 1.2, 1.3**

  - [x] 3.3 Write property test for null/undefined handling
    - **Property 2: Graceful Null/Undefined Handling**
    - Generate various falsy inputs and verify graceful handling
    - **Validates: Requirements 1.4, 4.1, 4.3**

  - [x] 3.4 Write property test for price change calculation
    - **Property 5: Price Change Calculation**
    - Generate random price arrays and verify calculation accuracy
    - **Validates: Requirements 3.2**

  - [x] 3.5 Write property test for price change color styling
    - **Property 6: Price Change Color Styling**
    - Generate random price changes and verify correct color classes
    - **Validates: Requirements 3.3, 3.4**

  - [x] 3.6 Write property test for volume formatting
    - **Property 7: Volume Formatting**
    - Generate random volume values and verify correct magnitude suffix
    - **Validates: Requirements 3.6**

- [x] 4. Final checkpoint - Ensure all tests pass
  - Run `npm run test:run` to verify all tests pass
  - Ensure no TypeScript errors in the codebase
  - Ask the user if questions arise

## Notes

- All tasks including property-based tests are required for comprehensive coverage
- The component intentionally omits time range selectors, chart type toggles, and technical indicators to stay lightweight (Requirements 6.1, 6.2, 6.3)
- The component uses provided priceData prop without making additional API calls (Requirement 6.4)
- Property tests should use fast-check library with minimum 100 iterations
