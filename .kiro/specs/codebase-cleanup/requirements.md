# Requirements Document

## Introduction

This document defines the requirements for cleaning up and simplifying the AI Stock Prediction codebase. The cleanup focuses on improving code organization, reducing duplication, and enhancing maintainability without changing functionality.

## Glossary

- **StockDashboard**: The main dashboard component that displays stock predictions and analysis
- **Watchlist_Manager**: Component responsible for managing user watchlists
- **FMP_Provider**: Financial Modeling Prep data provider for fetching stock data
- **Database_Connection**: PostgreSQL connection pooling and management module
- **Type_Definition**: TypeScript interface or type declaration

## Requirements

### Requirement 1: Extract StockDashboard Hooks

**User Story:** As a developer, I want the StockDashboard component to be modular, so that I can maintain and test individual pieces of functionality independently.

#### Acceptance Criteria

1. WHEN the StockDashboard component is refactored, THE System SHALL extract prediction-related state and fetching logic into a `usePredictions` hook
2. WHEN the StockDashboard component is refactored, THE System SHALL extract analysis-related state and fetching logic into a `useStockAnalysis` hook
3. WHEN hooks are extracted, THE StockDashboard SHALL maintain identical functionality and behavior
4. WHEN hooks are extracted, THE System SHALL place them in `src/components/dashboard/hooks/` directory
5. WHEN the refactoring is complete, THE StockDashboard component SHALL be reduced to approximately 200-300 lines

### Requirement 2: Consolidate Watchlist Components

**User Story:** As a developer, I want a single watchlist component with configurable data sources, so that I can avoid maintaining duplicate implementations.

#### Acceptance Criteria

1. WHEN the watchlist components are consolidated, THE System SHALL merge `WatchlistManager.tsx` and `MockWatchlistManager.tsx` into a single component
2. WHEN the consolidated component is created, THE Watchlist_Manager SHALL accept a `useMockData` prop to toggle between real and mock data
3. WHEN `useMockData` is true, THE Watchlist_Manager SHALL use in-memory mock data instead of API calls
4. WHEN the consolidation is complete, THE System SHALL delete the redundant `MockWatchlistManager.tsx` file

### Requirement 3: Centralize Type Definitions

**User Story:** As a developer, I want type definitions in a single location, so that I can avoid inconsistencies and duplication.

#### Acceptance Criteria

1. WHEN type definitions are centralized, THE System SHALL create a `src/types/predictions.ts` file for prediction-related types
2. WHEN the `PredictionResult` type is centralized, THE System SHALL remove duplicate definitions from `src/app/api/predictions/route.ts` and `src/components/StockDashboard.tsx`
3. WHEN types are centralized, THE System SHALL update all imports to reference the centralized type definitions
4. IF a type is used in multiple files, THEN THE System SHALL move it to the appropriate file in `src/types/`

### Requirement 4: Reduce Comment Verbosity

**User Story:** As a developer, I want concise, essential comments in library files, so that I can read and understand code more efficiently.

#### Acceptance Criteria

1. WHEN the FMP_Provider is cleaned up, THE System SHALL reduce the file from ~909 lines to ~300-400 lines by removing excessive comments
2. WHEN the Database_Connection is cleaned up, THE System SHALL reduce the file from ~936 lines to ~300-400 lines by removing excessive comments
3. WHEN comments are removed, THE System SHALL preserve essential JSDoc documentation for public APIs
4. WHEN educational content is removed from code, THE System SHALL optionally move it to a `docs/` folder if valuable
