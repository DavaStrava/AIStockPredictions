# Implementation Plan: Trading Journal & P&L Tracker

## Overview

This implementation plan breaks down the Trading Journal feature into discrete coding tasks. Each task builds on previous work, with property-based tests validating correctness properties from the design document.

## Tasks

- [x] 1. Database schema and type definitions
  - [x] 1.1 Create database migration for trades table
    - Create `src/lib/database/migrations/002_trades_schema.sql`
    - Define trade_side and trade_status enums
    - Create trades table with all columns and constraints
    - Add indexes for user_id, symbol, status, entry_date
    - Add trigger for updated_at
    - _Requirements: 1.1, 1.4, 1.5, 1.6_

  - [x] 1.2 Add Trade types to models.ts
    - Add TradeSide and TradeStatus type aliases
    - Add Trade, TradeWithPnL, CreateTradeRequest, UpdateTradeRequest interfaces
    - Add TradeFilters and PortfolioStats interfaces
    - _Requirements: 1.1_

- [x] 2. TradeService implementation
  - [x] 2.1 Create TradeService class with createTrade method
    - Create `src/lib/portfolio/TradeService.ts`
    - Implement constructor with DatabaseConnection and FMPDataProvider injection
    - Implement createTrade with validation and database insert
    - Implement input validation for required fields, positive values, valid enums
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.4, 2.5_

  - [x] 2.2 Write property test for trade creation
    - **Property 1: Trade Creation Preserves All Required Fields**
    - **Property 2: Input Validation Rejects Invalid Trades**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.4, 2.5**

  - [x] 2.3 Implement P&L calculation methods
    - Implement calculateRealizedPnL for LONG and SHORT trades
    - Implement calculateUnrealizedPnL using current price
    - Handle fees in calculations
    - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2_

  - [x] 2.4 Write property test for P&L calculations
    - **Property 4: Realized P&L Calculation Correctness**
    - **Property 5: Unrealized P&L Calculation Correctness**
    - **Validates: Requirements 4.1, 4.2, 4.3, 5.1, 5.2**

  - [x] 2.5 Implement closeTrade method
    - Update trade status to CLOSED
    - Set exitPrice and exitDate
    - Calculate and store realizedPnl
    - Validate trade is currently OPEN
    - Validate exitPrice is positive
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 2.6 Write property test for trade closure
    - **Property 3: Trade Closure Updates Status and Records Exit Data**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

  - [x] 2.7 Implement getUserTrades with filtering
    - Implement getUserTrades with optional filters
    - Support filtering by status, symbol, date range
    - Order results by entryDate descending
    - Fetch current prices for open trades and calculate unrealized P&L
    - Handle FMP API failures gracefully
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 5.3, 5.4_

  - [x] 2.8 Write property test for trade filtering
    - **Property 6: Trade Filtering Returns Correct Subset**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

  - [x] 2.9 Implement getPortfolioStats
    - Calculate totalRealizedPnl from closed trades
    - Calculate totalUnrealizedPnl from open trades
    - Calculate winRate, avgWin, avgLoss
    - Handle edge case of no closed trades (return null for winRate)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 2.10 Write property test for portfolio statistics
    - **Property 7: Portfolio Statistics Calculation Correctness**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**

- [x] 3. Checkpoint - Ensure all service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. API routes implementation
  - [x] 4.1 Create GET/POST /api/trades route
    - Create `src/app/api/trades/route.ts`
    - Implement GET handler to fetch user trades with filters
    - Implement POST handler to create new trade
    - Add input validation and error handling
    - Return appropriate HTTP status codes
    - _Requirements: 10.1, 10.2, 10.5_

  - [x] 4.2 Create PATCH /api/trades/[id] route
    - Create `src/app/api/trades/[id]/route.ts`
    - Implement PATCH handler for closing/updating trades
    - Handle trade not found with 404
    - Handle validation errors with 400
    - _Requirements: 10.3, 10.5, 10.6_

  - [x] 4.3 Create GET /api/trades/stats route
    - Create `src/app/api/trades/stats/route.ts`
    - Implement GET handler to return portfolio statistics
    - _Requirements: 10.4_

  - [x] 4.4 Write property test for API validation
    - **Property 9: API Validation Returns Appropriate Error Codes**
    - **Validates: Requirements 10.5, 10.6**

- [x] 5. Checkpoint - Ensure all API tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Frontend hooks and components
  - [x] 6.1 Create usePortfolioStats hook
    - Create `src/components/trading-journal/hooks/usePortfolioStats.ts`
    - Implement trade fetching with filters
    - Implement createTrade and closeTrade functions
    - Implement stats fetching
    - Handle loading and error states
    - _Requirements: 6.1, 7.1, 7.2, 7.3_

  - [x] 6.2 Create TradeEntryModal component
    - Create `src/components/trading-journal/TradeEntryModal.tsx`
    - Implement form with symbol, side, entryPrice, quantity, fees, notes fields
    - Support prefilled symbol and predictionId props
    - Add form validation
    - _Requirements: 2.2, 2.3, 9.2, 9.3_

  - [x] 6.3 Create TradeLogTable component
    - Create `src/components/trading-journal/TradeLogTable.tsx`
    - Display trades with all required columns
    - Implement column sorting
    - Show unrealized P&L for open trades, realized P&L for closed trades
    - Add close trade action button for open trades
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 6.4 Write property test for trade display
    - **Property 8: Trade Display Shows Correct P&L Type**
    - **Validates: Requirements 8.1, 8.3, 8.4**

- [x] 7. Integration with StockDashboard
  - [x] 7.1 Add "Log Trade" button to prediction cards
    - Modify StockDashboard to include "Log Trade" button on prediction cards
    - Pass symbol and prediction ID to TradeEntryModal
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 7.2 Write unit test for Log Trade button integration
    - Test button presence on prediction cards
    - Test modal opens with correct prefilled data
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required, including property-based tests for comprehensive validation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows existing patterns in the codebase (WatchlistService, usePredictions)
