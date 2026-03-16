# CSV Import Logic

This document describes the logic used for importing CSV transaction data, specifically for Merrill Edge format and trade matching.

## Supported CSV Formats

| Format | Import Type | Description |
|--------|-------------|-------------|
| `merrill_transactions` | Portfolio, Trade | Merrill Edge transaction history |
| `merrill_holdings` | Holdings | Merrill Edge current holdings |
| `fidelity` | Portfolio | Fidelity transaction history |
| `trade_tracker` | Trade | Native trade tracker format |

## Merrill Edge Transaction Import

### BUY/SELL Detection

The transaction type (BUY or SELL) is determined by the **Quantity sign** in the CSV:

| Quantity Sign | Transaction Type | Description |
|---------------|------------------|-------------|
| **Positive** (e.g., `150`) | BUY | Shares added to portfolio |
| **Negative** (e.g., `-350`) | SELL | Shares removed from portfolio |

**Important:** The Description field (e.g., "Purchase", "Sale") is used as a fallback but the Quantity sign takes precedence. This is because:
- Quantity sign is always reliable in Merrill Edge exports
- Description text can vary or be ambiguous

### CSV Column Mapping

```
Trade Date       -> transactionDate
Settlement Date  -> settlementDate
Description      -> rawDescription, notes (fallback for type detection)
Symbol/ CUSIP    -> symbol
Quantity         -> quantity (sign determines BUY/SELL)
Price            -> pricePerShare
Amount           -> totalAmount
```

### Transaction Type Detection Flow

```
1. Parse Quantity field with sign preservation
2. Clean and extract symbol from "Symbol/ CUSIP"
3. Check if this is a stock trade (has symbol and quantity)
4. Determine transaction type:
   - If Quantity > 0 -> BUY
   - If Quantity < 0 -> SELL
   - If Quantity = 0 -> Fall back to Description parsing
5. For non-stock transactions (dividends, etc.):
   - Parse Description for keywords like "DIVIDEND", "REINVEST"
```

## Trade Matching (FIFO with Chronology)

When importing Merrill transactions as **trades** (not portfolio transactions), the system performs FIFO matching to pair BUYs with SELLs.

### Core Principle

**A SELL can only be matched with a BUY that occurred BEFORE the SELL date.**

This prevents logically impossible scenarios like selling shares before purchasing them.

### Matching Algorithm

```
1. Separate all transactions into BUYs and SELLs
2. Pre-compute timestamps for performance
3. Sort both lists by date (oldest first)
4. Build a FIFO queue of open BUYs per symbol
5. Process each SELL:
   a. Find the oldest BUY for that symbol where BUY date <= SELL date
   b. If no eligible BUY found, skip this SELL (orphaned)
   c. Match quantities (handle partial fills)
   d. Create CLOSED trade with entry from BUY, exit from SELL
   e. Calculate realized P&L
6. Remaining unmatched BUYs become OPEN trades
```

### Example Scenarios

#### Scenario 1: Normal BUY then SELL

```
Input:
  - 01/10: BUY 100 AAPL @ $150
  - 01/15: SELL 100 AAPL @ $160

Result:
  - 1 CLOSED trade: Entry $150, Exit $160, P&L +$1,000
```

#### Scenario 2: SELL before BUY (Chronological Skip)

```
Input:
  - 03/06: SELL 350 TTMI @ $88
  - 03/10: BUY 150 TTMI @ $98

Result:
  - SELL is skipped (no BUY existed before 03/06)
  - 1 OPEN trade: BUY 150 @ $98 (remains open)
```

#### Scenario 3: Partial Fill

```
Input:
  - 01/01: BUY 30 AAPL @ $100
  - 01/02: BUY 30 AAPL @ $105
  - 01/10: SELL 50 AAPL @ $120

Result:
  - CLOSED trade 1: 30 shares @ $100 -> $120, P&L +$600
  - CLOSED trade 2: 20 shares @ $105 -> $120, P&L +$300
  - OPEN trade: 10 shares @ $105 (remaining from second BUY)
```

#### Scenario 4: Multiple Symbols

```
Input:
  - 01/01: BUY 100 AAPL @ $150
  - 01/02: BUY 50 GOOGL @ $200
  - 01/10: SELL 100 AAPL @ $160

Result:
  - CLOSED trade: AAPL 100 shares, P&L +$1,000
  - OPEN trade: GOOGL 50 shares @ $200 (unaffected)
```

### P&L Calculation

For LONG positions (standard buys):

```
Realized P&L = (Exit Price - Entry Price) × Quantity - Fees
```

Example:
- Entry: 100 shares @ $150
- Exit: 100 shares @ $160
- Fees: $10
- P&L = ($160 - $150) × 100 - $10 = $990

### Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| SELL with no prior BUY | SELL is skipped (orphaned) |
| SELL quantity > available BUY quantity | Partial matching, excess skipped |
| Multiple BUYs, one SELL | FIFO order (oldest BUY matched first) |
| Same-day BUY and SELL | Matched (BUY date <= SELL date) |
| Zero quantity | Transaction validation fails |
| Missing symbol | Transaction skipped |

## Performance Optimizations

### Pre-computed Timestamps

To avoid repeated `new Date().getTime()` calls during matching:

```typescript
type TxWithTimestamp = ParsedPortfolioTransaction & { _timestamp: number };

// Timestamps computed once during filtering
const buyTrades = transactions
  .filter(t => t.transactionType === 'BUY')
  .map(t => ({ ...t, _timestamp: new Date(t.transactionDate).getTime() }));
```

### Sorting Once

Both BUY and SELL lists are sorted once at the start, not during each comparison.

## Testing

Tests are located in:
- `src/lib/csv/__tests__/mappers.test.ts` - BUY/SELL detection tests
- `src/lib/csv/__tests__/tradeMatching.test.ts` - FIFO matching tests

Key test cases:
- Quantity sign override of Description
- SELL before BUY (chronological skip)
- FIFO ordering
- Partial fills
- Multiple symbols
- P&L calculation accuracy

## Related Files

| File | Purpose |
|------|---------|
| `src/lib/csv/merrillTransactionsMapper.ts` | Merrill CSV parsing and BUY/SELL detection |
| `src/components/shared/CSVImportModal.tsx` | FIFO trade matching logic |
| `src/app/api/trades/import/route.ts` | Trade import API endpoint |
| `src/app/api/portfolios/[id]/transactions/import/route.ts` | Portfolio transaction import API |
