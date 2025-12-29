# Implementation Plan: Codebase Cleanup

## Overview

This implementation plan breaks down the codebase cleanup into discrete, incremental tasks. Each task builds on previous work and maintains a working codebase throughout the refactoring process.

## Tasks

- [x] 1. Set up project structure and centralize types
  - [x] 1.1 Create `src/types/predictions.ts` with PredictionResult interface
    - Extract PredictionResult from StockDashboard.tsx
    - Include all nested types (prediction, riskMetrics)
    - Export the interface
    - _Requirements: 3.1_
  - [x] 1.2 Update imports in StockDashboard.tsx to use centralized type
    - Replace local PredictionResult definition with import
    - Verify TypeScript compilation succeeds
    - _Requirements: 3.2, 3.3_
  - [x] 1.3 Update imports in predictions API route
    - Replace local PredictionResult definition with import from @/types/predictions
    - Verify API route still functions correctly
    - _Requirements: 3.2, 3.3_
  - [x] 1.4 Write property test for type import consistency
    - **Property 4: Type Import Consistency**
    - Scan files for PredictionResult usage and verify import sources
    - **Validates: Requirements 3.2, 3.3, 3.4**

- [x] 2. Checkpoint - Verify type centralization
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Extract usePredictions hook
  - [ ] 3.1 Create `src/components/dashboard/hooks/usePredictions.ts`
    - Create directory structure
    - Extract predictions state (predictions, loading, searchLoading)
    - Extract fetchPredictions function
    - Extract handleStockSearch function
    - Extract removeTile function
    - Define and export UsePredictionsReturn interface
    - _Requirements: 1.1, 1.4_
  - [ ] 3.2 Update StockDashboard to use usePredictions hook
    - Import usePredictions hook
    - Replace inline state with hook return values
    - Remove extracted code from component
    - Verify component renders correctly
    - _Requirements: 1.3_
  - [ ] 3.3 Write unit tests for usePredictions hook
    - Test initial state values
    - Test fetchPredictions updates state correctly
    - Test removeTile removes correct prediction
    - _Requirements: 1.1_

- [ ] 4. Extract useStockAnalysis hook
  - [ ] 4.1 Create `src/components/dashboard/hooks/useStockAnalysis.ts`
    - Extract analysis state (selectedStock, analysis, priceData, selectedIndex)
    - Extract fetchDetailedAnalysis function
    - Extract handleIndexClick function
    - Extract closeIndexAnalysis function
    - Add clearAnalysis helper function
    - Define and export UseStockAnalysisReturn interface
    - _Requirements: 1.2, 1.4_
  - [ ] 4.2 Update StockDashboard to use useStockAnalysis hook
    - Import useStockAnalysis hook
    - Replace inline state with hook return values
    - Remove extracted code from component
    - Verify detailed analysis still works
    - _Requirements: 1.3_
  - [ ] 4.3 Write unit tests for useStockAnalysis hook
    - Test initial state values
    - Test fetchDetailedAnalysis updates state correctly
    - Test clearAnalysis resets all state
    - _Requirements: 1.2_

- [ ] 5. Checkpoint - Verify hook extraction
  - Ensure all tests pass, ask the user if questions arise.
  - Verify StockDashboard line count is reduced to ~200-300 lines

- [ ] 5.1 Write property test for behavioral equivalence
  - **Property 2: Behavioral Equivalence After Refactoring**
  - Test that user interactions produce same results as before
  - **Validates: Requirements 1.3**

- [ ] 6. Consolidate WatchlistManager components
  - [ ] 6.1 Add useMockData prop to WatchlistManager
    - Add optional useMockData prop with default false
    - Add mock data loading function
    - Conditionally use mock or API data based on prop
    - _Requirements: 2.2_
  - [ ] 6.2 Implement mock CRUD operations
    - Create operations update local state only when useMockData=true
    - Update operations work with local state in mock mode
    - Delete operations work with local state in mock mode
    - _Requirements: 2.3_
  - [ ] 6.3 Delete MockWatchlistManager.tsx
    - Remove the redundant file
    - Update any imports that referenced MockWatchlistManager
    - _Requirements: 2.4_
  - [ ] 6.4 Write property test for mock data toggle
    - **Property 3: Mock Data Toggle Behavior**
    - Verify no network requests when useMockData=true
    - **Validates: Requirements 2.2, 2.3**

- [ ] 7. Checkpoint - Verify watchlist consolidation
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Reduce comment verbosity in FMP provider
  - [ ] 8.1 Trim excessive comments in fmp.ts
    - Remove educational/tutorial comments
    - Preserve essential JSDoc for public APIs
    - Keep interface documentation
    - Target: ~300-400 lines
    - _Requirements: 4.1, 4.3_

- [ ] 9. Reduce comment verbosity in Database connection
  - [ ] 9.1 Trim excessive comments in connection.ts
    - Remove educational/tutorial comments
    - Preserve essential JSDoc for public APIs
    - Keep interface documentation
    - Target: ~300-400 lines
    - _Requirements: 4.2, 4.3_

- [ ] 9.2 Write property test for JSDoc preservation
  - **Property 5: JSDoc Preservation for Public APIs**
  - Verify exported functions have JSDoc comments
  - **Validates: Requirements 4.3**

- [ ] 10. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all cleanup objectives are met
  - Update CLEANUP_RECOMMENDATIONS.md to mark Phase 2 complete

## Notes

- All tasks are required for comprehensive testing
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
