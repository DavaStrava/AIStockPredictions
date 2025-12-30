# Requirements Document

## Introduction

This document defines the requirements for a Trading Journal & P&L Tracker extension to the AI Stock Prediction platform. The feature enables users to log trades (paper or real), track profit and loss, and analyze trading performance based on the platform's predictions.

## Glossary

- **Trade_Service**: The backend service responsible for managing trade records, calculating P&L, and aggregating performance statistics
- **Trade_Entry_Modal**: The UI component that allows users to create new trade entries
- **Trade_Log_Table**: The UI component that displays a sortable, filterable list of trades
- **Portfolio_Stats_Hook**: A React hook that fetches and aggregates trade data for display
- **FMP_Data_Provider**: The existing Financial Modeling Prep API integration for fetching current stock prices
- **Realized_P&L**: Profit or loss calculated when a trade is closed (exit price - entry price) × quantity - fees
- **Unrealized_P&L**: Profit or loss calculated for open trades using current market price
- **Win_Rate**: The percentage of closed trades that resulted in profit

## Requirements

### Requirement 1: Trade Data Model

**User Story:** As a user, I want my trades to be stored persistently, so that I can track my trading history over time.

#### Acceptance Criteria

1. THE Trade_Service SHALL store trades with the following fields: id, userId, symbol, side (LONG/SHORT), status (OPEN/CLOSED), entryPrice, quantity, entryDate, exitPrice, exitDate, fees, notes, and predictionId
2. WHEN a trade is created, THE Trade_Service SHALL generate a unique identifier and set entryDate to the current timestamp
3. WHEN a trade references a prediction, THE Trade_Service SHALL store the predictionId to link the trade to the inspiring prediction
4. THE Trade_Service SHALL enforce that entryPrice and quantity are positive decimal values
5. THE Trade_Service SHALL enforce that side is either LONG or SHORT
6. THE Trade_Service SHALL enforce that status is either OPEN or CLOSED

### Requirement 2: Trade Creation

**User Story:** As a user, I want to log new trades, so that I can track my trading activity.

#### Acceptance Criteria

1. WHEN a user submits a valid trade entry, THE Trade_Service SHALL create a new trade record with status OPEN
2. WHEN a user creates a trade from a prediction card, THE Trade_Entry_Modal SHALL autofill the symbol from the selected prediction
3. WHEN a user creates a trade from a prediction card, THE Trade_Entry_Modal SHALL store the predictionId linking the trade to that prediction
4. IF a user submits a trade with missing required fields, THEN THE Trade_Service SHALL return a validation error
5. IF a user submits a trade with invalid price or quantity values, THEN THE Trade_Service SHALL return a validation error

### Requirement 3: Trade Closure

**User Story:** As a user, I want to close my open trades, so that I can record my realized profit or loss.

#### Acceptance Criteria

1. WHEN a user closes a trade, THE Trade_Service SHALL update the trade status to CLOSED and record the exitPrice and exitDate
2. WHEN a trade is closed, THE Trade_Service SHALL calculate and store the realized P&L
3. IF a user attempts to close an already closed trade, THEN THE Trade_Service SHALL return an error
4. WHEN closing a trade, THE Trade_Service SHALL require a valid exitPrice

### Requirement 4: Realized P&L Calculation

**User Story:** As a user, I want to see my realized profit or loss on closed trades, so that I can understand my actual trading performance.

#### Acceptance Criteria

1. WHEN a LONG trade is closed, THE Trade_Service SHALL calculate realized P&L as (exitPrice - entryPrice) × quantity - fees
2. WHEN a SHORT trade is closed, THE Trade_Service SHALL calculate realized P&L as (entryPrice - exitPrice) × quantity - fees
3. FOR ALL closed trades, THE Trade_Service SHALL return the realized P&L value

### Requirement 5: Unrealized P&L Calculation

**User Story:** As a user, I want to see my unrealized profit or loss on open trades, so that I can monitor my current positions.

#### Acceptance Criteria

1. WHEN displaying an OPEN LONG trade, THE Trade_Service SHALL calculate unrealized P&L as (currentPrice - entryPrice) × quantity - fees
2. WHEN displaying an OPEN SHORT trade, THE Trade_Service SHALL calculate unrealized P&L as (entryPrice - currentPrice) × quantity - fees
3. WHEN calculating unrealized P&L, THE Trade_Service SHALL fetch the current price from FMP_Data_Provider
4. IF the FMP_Data_Provider fails to return a price, THEN THE Trade_Service SHALL return the trade without unrealized P&L and indicate the error

### Requirement 6: Trade Listing and Filtering

**User Story:** As a user, I want to view and filter my trades, so that I can analyze my trading history.

#### Acceptance Criteria

1. WHEN a user requests their trades, THE Trade_Service SHALL return all trades for that user ordered by entryDate descending
2. WHEN a user filters by status, THE Trade_Service SHALL return only trades matching the specified status
3. WHEN a user filters by symbol, THE Trade_Service SHALL return only trades matching the specified symbol
4. WHEN a user filters by date range, THE Trade_Service SHALL return only trades within the specified date range

### Requirement 7: Portfolio Statistics

**User Story:** As a user, I want to see aggregate statistics about my trading performance, so that I can evaluate my overall success.

#### Acceptance Criteria

1. WHEN calculating portfolio statistics, THE Trade_Service SHALL compute total realized P&L across all closed trades
2. WHEN calculating portfolio statistics, THE Trade_Service SHALL compute total unrealized P&L across all open trades
3. WHEN calculating portfolio statistics, THE Trade_Service SHALL compute win rate as (profitable closed trades / total closed trades)
4. WHEN calculating portfolio statistics, THE Trade_Service SHALL compute average profit per winning trade
5. WHEN calculating portfolio statistics, THE Trade_Service SHALL compute average loss per losing trade
6. IF there are no closed trades, THEN THE Trade_Service SHALL return win rate as null

### Requirement 8: Trade Log Display

**User Story:** As a user, I want to view my trades in a sortable table, so that I can easily review my trading activity.

#### Acceptance Criteria

1. WHEN displaying trades, THE Trade_Log_Table SHALL show symbol, side, status, entry price, exit price, quantity, P&L, and entry date
2. WHEN a user clicks a column header, THE Trade_Log_Table SHALL sort the trades by that column
3. WHEN displaying an open trade, THE Trade_Log_Table SHALL show the unrealized P&L with current price
4. WHEN displaying a closed trade, THE Trade_Log_Table SHALL show the realized P&L

### Requirement 9: Trade Entry from Predictions

**User Story:** As a user, I want to log a trade directly from a prediction card, so that I can quickly act on AI insights.

#### Acceptance Criteria

1. WHEN viewing a prediction card, THE StockDashboard SHALL display a "Log Trade" button
2. WHEN a user clicks "Log Trade" on a prediction card, THE Trade_Entry_Modal SHALL open with the symbol pre-filled
3. WHEN a user clicks "Log Trade" on a prediction card, THE Trade_Entry_Modal SHALL store the prediction ID for tracking

### Requirement 10: API Endpoints

**User Story:** As a developer, I want RESTful API endpoints for trade management, so that the frontend can interact with trade data.

#### Acceptance Criteria

1. THE API SHALL provide a GET /api/trades endpoint that returns all trades for the authenticated user
2. THE API SHALL provide a POST /api/trades endpoint that creates a new trade
3. THE API SHALL provide a PATCH /api/trades/[id] endpoint that updates a trade (for closing or editing)
4. THE API SHALL provide a GET /api/trades/stats endpoint that returns portfolio statistics
5. WHEN an API request fails validation, THE API SHALL return a 400 status with error details
6. WHEN an API request references a non-existent trade, THE API SHALL return a 404 status
