

# Feature Request: Trading Journal & P&L Tracker Extension

### 1. Objective

Extend the existing platform to allow users to "paper trade" or log real trades based on the platform's predictions. This module will track buy/sell entries, calculate real-time or historical P&L, and provide performance metrics.

### 2. Integration Context (Reference: SYSTEM_DESIGN.md)

* **Existing Stack:** Next.js 15 (App Router), React 19, Tailwind CSS v4, Prisma/PostgreSQL.
* **Data Source:** Use existing `FMPDataProvider` for fetching current prices to calculate "Open P&L."
* **Consistency:** Use existing `Shadcn UI` components and follow the refactored hook pattern used in `StockDashboard`.

### 3. Database Schema Update

Add a new model to `schema.prisma` (or your SQL migrations). This relates to the existing `User` and links to the `symbol` used in predictions.

```typescript
model Trade {
  id          String   @id @default(cuid())
  userId      String   // Links to existing Auth
  symbol      String   // e.g., "AAPL"
  side        TradeSide // ENUM: LONG, SHORT
  status      TradeStatus // ENUM: OPEN, CLOSED
  
  entryPrice  Decimal  @db.Decimal(10, 2)
  quantity    Decimal  @db.Decimal(10, 2)
  entryDate   DateTime @default(now())
  
  exitPrice   Decimal? @db.Decimal(10, 2)
  exitDate    DateTime?
  fees        Decimal  @default(0) @db.Decimal(10, 2)
  
  notes       String?  @db.Text
  predictionId String? // Optional: link to the prediction that inspired the trade
}

```

### 4. Logic & Service Layer

Create a new service in `src/lib/portfolio/TradeService.ts` to handle:

* **Realized P&L:** Calculated when `status === 'CLOSED'`.
* *Formula (Long):* 


* **Unrealized P&L:** Calculated for `OPEN` trades by fetching the current quote from `FMPDataProvider.getQuote(symbol)`.
* **Win Rate:** .

### 5. Frontend Components (New)

To be located in `src/components/trading-diary/`:

* **`TradeLogTable.tsx`**: A sortable table using your existing `ResponsiveContainer`.
* **`TradeEntryModal.tsx`**: A form to log a trade (autofill `symbol` if the user is currently viewing that stock in `StockDashboard`).
* **`usePortfolioStats.ts`**: A custom hook (following your `usePredictions` pattern) to fetch and aggregate trade data.

### 6. Implementation Instructions for the AI

1. **Analyze existing `lib/database/DatabaseConnection**` to ensure the new `Trade` queries follow the same singleton/connection patterns.
2. **Add API Routes:**
* `GET /api/trades`: Fetch all user trades.
* `POST /api/trades`: Create a new trade entry.
* `PATCH /api/trades/[id]`: Close or edit a trade.


3. **UI Integration:** Add a "Log Trade" button to the existing `StockDashboard` (specifically inside the `PredictionResult` cards) so users can act on AI insights immediately.
4. **Types:** Add trade interfaces to `src/types/models.ts`.

