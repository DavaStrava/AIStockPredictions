# Design Document: Trading Journal & P&L Tracker

## Overview

The Trading Journal & P&L Tracker extends the AI Stock Prediction platform to allow users to log trades (paper or real), track profit and loss, and analyze trading performance. The feature integrates with existing prediction cards, enabling users to act on AI insights and track the outcomes of their trading decisions.

The design follows existing patterns in the codebase:
- Service layer pattern (like `WatchlistService`)
- Custom hooks for data fetching (like `usePredictions`)
- Singleton database connection pattern
- Next.js API routes for RESTful endpoints

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              UI LAYER                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Trading Journal Components                        │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │   │
│  │  │TradeLogTable │  │TradeEntryModal│  │ "Log Trade" Button      │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                    ┌───────────────┴───────────────┐                       │
│                    │     usePortfolioStats Hook    │                       │
│                    └───────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Next.js API Routes                                │   │
│  │  GET/POST /api/trades    PATCH /api/trades/[id]    GET /api/trades/stats│
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SERVICE LAYER                                      │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                        TradeService                                 │    │
│  │  - createTrade()      - closeTrade()      - getUserTrades()        │    │
│  │  - getTradeById()     - updateTrade()     - getPortfolioStats()    │    │
│  │  - calculateRealizedPnL()    - calculateUnrealizedPnL()            │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                    ┌───────────────┴───────────────┐                       │
│                    │      FMPDataProvider          │                       │
│                    │      (for current prices)     │                       │
│                    └───────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATABASE LAYER                                      │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                    PostgreSQL (trades table)                        │    │
│  └────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### TradeService

The core service for trade management, following the pattern established by `WatchlistService`.

```typescript
// src/lib/portfolio/TradeService.ts

import { DatabaseConnection } from '../database/connection';
import { FMPDataProvider } from '../data-providers/fmp';

export class TradeService {
  constructor(
    private db: DatabaseConnection,
    private fmpProvider: FMPDataProvider
  ) {}

  async createTrade(data: CreateTradeRequest): Promise<Trade>;
  async closeTrade(tradeId: string, exitPrice: number): Promise<Trade>;
  async getUserTrades(userId: string, filters?: TradeFilters): Promise<Trade[]>;
  async getTradeById(tradeId: string): Promise<Trade | null>;
  async updateTrade(tradeId: string, updates: UpdateTradeRequest): Promise<Trade | null>;
  async getPortfolioStats(userId: string): Promise<PortfolioStats>;
  
  // P&L calculation methods
  calculateRealizedPnL(trade: Trade): number;
  calculateUnrealizedPnL(trade: Trade, currentPrice: number): number;
}
```

### usePortfolioStats Hook

Custom React hook for fetching and managing trade data, following the `usePredictions` pattern.

```typescript
// src/components/trading-journal/hooks/usePortfolioStats.ts

export interface UsePortfolioStatsReturn {
  trades: TradeWithPnL[];
  stats: PortfolioStats | null;
  loading: boolean;
  error: string | null;
  fetchTrades: (filters?: TradeFilters) => Promise<void>;
  createTrade: (data: CreateTradeRequest) => Promise<Trade>;
  closeTrade: (tradeId: string, exitPrice: number) => Promise<Trade>;
  refreshStats: () => Promise<void>;
}

export function usePortfolioStats(userId: string): UsePortfolioStatsReturn;
```

### UI Components

```typescript
// src/components/trading-journal/TradeLogTable.tsx
interface TradeLogTableProps {
  trades: TradeWithPnL[];
  onSort: (column: SortColumn) => void;
  sortColumn: SortColumn;
  sortDirection: 'asc' | 'desc';
  onCloseTrade: (tradeId: string) => void;
}

// src/components/trading-journal/TradeEntryModal.tsx
interface TradeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTradeRequest) => Promise<void>;
  prefillSymbol?: string;
  prefillPredictionId?: string;
}
```

## Data Models

### Database Schema (Migration)

```sql
-- Migration: 002_trades_schema.sql

-- Create enum types
CREATE TYPE trade_side AS ENUM ('LONG', 'SHORT');
CREATE TYPE trade_status AS ENUM ('OPEN', 'CLOSED');

-- Create trades table
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL,
    side trade_side NOT NULL,
    status trade_status NOT NULL DEFAULT 'OPEN',
    
    entry_price DECIMAL(12, 4) NOT NULL CHECK (entry_price > 0),
    quantity DECIMAL(12, 4) NOT NULL CHECK (quantity > 0),
    entry_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    exit_price DECIMAL(12, 4) CHECK (exit_price > 0 OR exit_price IS NULL),
    exit_date TIMESTAMP WITH TIME ZONE,
    fees DECIMAL(10, 2) DEFAULT 0 CHECK (fees >= 0),
    
    realized_pnl DECIMAL(14, 4),
    notes TEXT,
    prediction_id UUID REFERENCES predictions(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_entry_date ON trades(entry_date);
CREATE INDEX idx_trades_user_status ON trades(user_id, status);
CREATE INDEX idx_trades_user_symbol ON trades(user_id, symbol);

-- Create trigger for updated_at
CREATE TRIGGER update_trades_updated_at 
    BEFORE UPDATE ON trades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### TypeScript Interfaces

```typescript
// src/types/models.ts (additions)

export type TradeSide = 'LONG' | 'SHORT';
export type TradeStatus = 'OPEN' | 'CLOSED';

export interface Trade {
  id: string;
  userId: string;
  symbol: string;
  side: TradeSide;
  status: TradeStatus;
  entryPrice: number;
  quantity: number;
  entryDate: Date;
  exitPrice: number | null;
  exitDate: Date | null;
  fees: number;
  realizedPnl: number | null;
  notes: string | null;
  predictionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TradeWithPnL extends Trade {
  unrealizedPnl?: number;
  currentPrice?: number;
  pnlError?: string;
}

export interface CreateTradeRequest {
  userId: string;
  symbol: string;
  side: TradeSide;
  entryPrice: number;
  quantity: number;
  fees?: number;
  notes?: string;
  predictionId?: string;
}

export interface UpdateTradeRequest {
  exitPrice?: number;
  fees?: number;
  notes?: string;
}

export interface TradeFilters {
  status?: TradeStatus;
  symbol?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PortfolioStats {
  totalRealizedPnl: number;
  totalUnrealizedPnl: number;
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  winRate: number | null;
  avgWin: number | null;
  avgLoss: number | null;
  bestTrade: number | null;
  worstTrade: number | null;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Trade Creation Preserves All Required Fields

*For any* valid trade creation request, the created trade SHALL contain all provided fields (symbol, side, entryPrice, quantity, fees, notes, predictionId) with their exact values, plus system-generated fields (id, userId, status=OPEN, entryDate, createdAt, updatedAt).

**Validates: Requirements 1.1, 1.2, 1.3, 2.1**

### Property 2: Input Validation Rejects Invalid Trades

*For any* trade creation request with invalid data (non-positive entryPrice, non-positive quantity, invalid side value, or missing required fields), the Trade_Service SHALL return a validation error and not create a trade record.

**Validates: Requirements 1.4, 1.5, 1.6, 2.4, 2.5, 3.4**

### Property 3: Trade Closure Updates Status and Records Exit Data

*For any* open trade that is closed with a valid exit price, the trade status SHALL become CLOSED, exitPrice SHALL equal the provided value, exitDate SHALL be set, and realizedPnl SHALL be calculated and stored.

**Validates: Requirements 3.1, 3.2**

### Property 4: Realized P&L Calculation Correctness

*For any* closed trade, the realized P&L SHALL equal:
- For LONG: (exitPrice - entryPrice) × quantity - fees
- For SHORT: (entryPrice - exitPrice) × quantity - fees

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 5: Unrealized P&L Calculation Correctness

*For any* open trade with a known current price, the unrealized P&L SHALL equal:
- For LONG: (currentPrice - entryPrice) × quantity - fees
- For SHORT: (entryPrice - currentPrice) × quantity - fees

**Validates: Requirements 5.1, 5.2**

### Property 6: Trade Filtering Returns Correct Subset

*For any* set of trades and any combination of filters (status, symbol, date range), the returned trades SHALL:
- Be ordered by entryDate descending
- Include only trades matching ALL specified filter criteria
- Include all trades matching the filter criteria (no false negatives)

**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 7: Portfolio Statistics Calculation Correctness

*For any* set of trades:
- totalRealizedPnl SHALL equal the sum of realizedPnl for all closed trades
- totalUnrealizedPnl SHALL equal the sum of unrealizedPnl for all open trades
- winRate SHALL equal (count of profitable closed trades) / (count of all closed trades), or null if no closed trades
- avgWin SHALL equal the average realizedPnl of profitable closed trades, or null if none
- avgLoss SHALL equal the average realizedPnl of losing closed trades, or null if none

**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**

### Property 8: Trade Display Shows Correct P&L Type

*For any* trade displayed in the Trade_Log_Table:
- Open trades SHALL display unrealizedPnl (calculated from current price)
- Closed trades SHALL display realizedPnl (stored value)
- All trades SHALL display symbol, side, status, entryPrice, quantity, and entryDate

**Validates: Requirements 8.1, 8.3, 8.4**

### Property 9: API Validation Returns Appropriate Error Codes

*For any* API request with invalid data, the API SHALL return HTTP 400 with error details. *For any* API request referencing a non-existent trade, the API SHALL return HTTP 404.

**Validates: Requirements 10.5, 10.6**

## Error Handling

### Service Layer Errors

```typescript
export class TradeValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'TradeValidationError';
  }
}

export class TradeNotFoundError extends Error {
  constructor(tradeId: string) {
    super(`Trade not found: ${tradeId}`);
    this.name = 'TradeNotFoundError';
  }
}

export class TradeStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TradeStateError';
  }
}
```

### Error Scenarios

| Scenario | Error Type | HTTP Status | User Message |
|----------|------------|-------------|--------------|
| Invalid entry price | TradeValidationError | 400 | "Entry price must be a positive number" |
| Invalid quantity | TradeValidationError | 400 | "Quantity must be a positive number" |
| Invalid side | TradeValidationError | 400 | "Side must be LONG or SHORT" |
| Missing required field | TradeValidationError | 400 | "Field {field} is required" |
| Trade not found | TradeNotFoundError | 404 | "Trade not found" |
| Closing closed trade | TradeStateError | 400 | "Trade is already closed" |
| FMP API failure | Error | 200 (partial) | Trade returned without unrealized P&L |
| Database unavailable | Error | 503 | "Database connection unavailable" |
| Database connection failed | Error | 503 | "Database connection failed" |
| Missing database tables | Error | 503 | "Database tables not found. Please run migrations: npm run db:migrate" |
| Auth service unavailable | Error | 503 | "User authentication failed. Database may not be properly configured." |

## Testing Strategy

### Property-Based Testing

The implementation will use **fast-check** for property-based testing, following the existing pattern in the codebase.

```typescript
// Example test structure
import fc from 'fast-check';

// Arbitrary for valid trade creation requests
const validTradeRequestArb = fc.record({
  userId: fc.uuid(),
  symbol: fc.stringOf(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')), { minLength: 1, maxLength: 5 }),
  side: fc.constantFrom('LONG', 'SHORT'),
  entryPrice: fc.float({ min: 0.01, max: 100000, noNaN: true }),
  quantity: fc.float({ min: 0.01, max: 1000000, noNaN: true }),
  fees: fc.option(fc.float({ min: 0, max: 1000, noNaN: true })),
  notes: fc.option(fc.string()),
  predictionId: fc.option(fc.uuid()),
});
```

### Unit Tests

Unit tests will cover:
- TradeService methods with mocked database
- P&L calculation edge cases (zero fees, large numbers, precision)
- Validation logic for all input fields
- Filter combinations

### Integration Tests

Integration tests will cover:
- API endpoint contracts
- Database operations with test database
- FMP provider integration (mocked)

### Test Configuration

- Minimum 100 iterations per property test
- Tests tagged with property references: `**Feature: trading-journal, Property N: {description}**`
