# Migration Example: Predictions Route

This document provides a step-by-step example of migrating an existing API route to use the new middleware system.

## Route: `/api/predictions`

This is a typical GET endpoint that fetches stock predictions with optional query parameters.

---

## Before Migration

```typescript
// src/app/api/predictions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFMPProvider } from '@/lib/data-providers/fmp';
import { analyzeTechnicals } from '@/lib/technical-analysis';

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const symbolsParam = searchParams.get('symbols');

    // Default symbols if none provided
    const symbols = symbolsParam
      ? symbolsParam.split(',').map(s => s.trim().toUpperCase())
      : ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'];

    // Validate symbols
    if (symbols.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least one symbol is required',
        },
        { status: 400 }
      );
    }

    if (symbols.length > 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'Maximum 10 symbols allowed',
        },
        { status: 400 }
      );
    }

    // Validate symbol format
    for (const symbol of symbols) {
      if (!/^[A-Z]{1,5}$/.test(symbol)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid symbol format: ${symbol}`,
          },
          { status: 400 }
        );
      }
    }

    const fmpProvider = getFMPProvider();
    const predictions = [];

    // Fetch data for each symbol
    for (const symbol of symbols) {
      try {
        // Get current price
        const quote = await fmpProvider.getQuote(symbol);

        // Get historical data
        const historicalData = await fmpProvider.getHistoricalPrices(
          symbol,
          '1y'
        );

        // Perform technical analysis
        const analysis = analyzeTechnicals(historicalData, symbol);

        // Calculate prediction
        const prediction = {
          symbol,
          currentPrice: quote.price,
          prediction: {
            direction: analysis.summary.overall,
            confidence: analysis.summary.confidence,
            targetPrice: calculateTargetPrice(quote.price, analysis),
            timeframe: '1-3 months',
          },
          riskMetrics: {
            volatility: analysis.summary.volatility,
          },
        };

        predictions.push(prediction);
      } catch (error) {
        console.error(`Failed to analyze ${symbol}:`, error);
        // Skip failed symbols
        continue;
      }
    }

    return NextResponse.json({
      success: true,
      data: predictions,
    });
  } catch (error) {
    console.error('Predictions GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch predictions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function calculateTargetPrice(currentPrice: number, analysis: any): number {
  // Simplified calculation
  const direction = analysis.summary.overall === 'bullish' ? 1 : -1;
  const strength = analysis.summary.strength;
  return currentPrice * (1 + direction * strength * 0.1);
}
```

**Issues:**
- 120+ lines of boilerplate
- Manual parameter parsing and validation
- No rate limiting
- No request logging
- Error handling duplicated
- Hard to test

---

## Step 1: Create Validation Schema

First, create a Zod schema for the query parameters:

```typescript
// src/lib/validation/schemas.ts

export const PredictionsQuerySchema = z.object({
  symbols: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'];
      return val.split(',').map(s => s.trim().toUpperCase());
    })
    .pipe(
      z
        .array(z.string().regex(/^[A-Z]{1,5}$/, 'Symbol must be 1-5 uppercase letters'))
        .min(1, 'At least one symbol is required')
        .max(10, 'Maximum 10 symbols allowed')
    ),
});

export type PredictionsQueryData = z.infer<typeof PredictionsQuerySchema>;
```

**Benefits:**
- Declarative validation rules
- Automatic data transformation
- Better error messages
- Type-safe output

---

## Step 2: Extract Business Logic

Move the prediction calculation logic to a separate function for better testability:

```typescript
// src/lib/predictions/calculator.ts

interface PredictionInput {
  symbol: string;
  currentPrice: number;
  analysis: TechnicalAnalysisResult;
}

export function calculatePrediction(input: PredictionInput): PredictionResult {
  const { symbol, currentPrice, analysis } = input;

  const direction = analysis.summary.overall;
  const confidence = analysis.summary.confidence;
  const strength = analysis.summary.strength;

  // Calculate target price based on direction and strength
  const multiplier = direction === 'bullish' ? 1 : direction === 'bearish' ? -1 : 0;
  const targetPrice = currentPrice * (1 + multiplier * strength * 0.1);

  return {
    symbol,
    currentPrice,
    prediction: {
      direction,
      confidence,
      targetPrice: Number(targetPrice.toFixed(2)),
      timeframe: '1-3 months',
    },
    riskMetrics: {
      volatility: analysis.summary.volatility,
    },
  };
}

export async function fetchPredictionsForSymbols(
  symbols: string[]
): Promise<PredictionResult[]> {
  const fmpProvider = getFMPProvider();
  const predictions: PredictionResult[] = [];

  for (const symbol of symbols) {
    try {
      const quote = await fmpProvider.getQuote(symbol);
      const historicalData = await fmpProvider.getHistoricalPrices(symbol, '1y');
      const analysis = analyzeTechnicals(historicalData, symbol);

      const prediction = calculatePrediction({
        symbol,
        currentPrice: quote.price,
        analysis,
      });

      predictions.push(prediction);
    } catch (error) {
      console.error(`Failed to analyze ${symbol}:`, error);
      // Skip failed symbols
      continue;
    }
  }

  return predictions;
}
```

**Benefits:**
- Testable functions
- Reusable logic
- Clear separation of concerns
- Type-safe

---

## Step 3: Refactor Route Handler

Now refactor the route to use middleware:

```typescript
// src/app/api/predictions/route.ts

import { NextRequest } from 'next/server';
import {
  withMiddleware,
  withErrorHandling,
  withRateLimit,
  withValidation,
  withLogging,
  ApiResponse,
  RequestContext,
} from '@/lib/api/middleware';
import {
  PredictionsQuerySchema,
  PredictionsQueryData,
} from '@/lib/validation/schemas';
import { fetchPredictionsForSymbols } from '@/lib/predictions/calculator';

/**
 * GET /api/predictions - Fetch stock predictions
 *
 * Query parameters:
 * - symbols: Comma-separated stock symbols (optional, max 10)
 *            Defaults to: AAPL,GOOGL,MSFT,TSLA,NVDA
 *
 * Rate limit: 60 requests per minute
 *
 * Example: /api/predictions?symbols=AAPL,TSLA,NVDA
 */
export const GET = withMiddleware(
  withErrorHandling(),
  withLogging(),
  withRateLimit({ requestsPerMinute: 60 }),
  withValidation(PredictionsQuerySchema, 'query'),
  async (req: NextRequest, context: RequestContext) => {
    const { symbols } = context.validatedData as PredictionsQueryData;

    const predictions = await fetchPredictionsForSymbols(symbols);

    return ApiResponse.success(predictions);
  }
);
```

**Results:**
- **Before:** 120+ lines
- **After:** 35 lines
- **Reduction:** 71% fewer lines

**New Features:**
- ✅ Automatic validation
- ✅ Rate limiting
- ✅ Request logging with tracing
- ✅ Consistent error responses
- ✅ Type-safe query parameters

---

## Step 4: Update Tests

The new structure is much easier to test:

```typescript
// src/lib/predictions/__tests__/calculator.test.ts

import { calculatePrediction } from '../calculator';

describe('calculatePrediction', () => {
  it('calculates bullish target price', () => {
    const result = calculatePrediction({
      symbol: 'AAPL',
      currentPrice: 150,
      analysis: {
        summary: {
          overall: 'bullish',
          confidence: 0.8,
          strength: 0.7,
        },
      },
    });

    expect(result.prediction.direction).toBe('bullish');
    expect(result.prediction.targetPrice).toBeGreaterThan(150);
    expect(result.prediction.confidence).toBe(0.8);
  });

  it('calculates bearish target price', () => {
    const result = calculatePrediction({
      symbol: 'AAPL',
      currentPrice: 150,
      analysis: {
        summary: {
          overall: 'bearish',
          confidence: 0.75,
          strength: 0.6,
        },
      },
    });

    expect(result.prediction.direction).toBe('bearish');
    expect(result.prediction.targetPrice).toBeLessThan(150);
  });
});
```

```typescript
// src/app/api/predictions/__tests__/route.test.ts

import { GET } from '../route';
import { NextRequest } from 'next/server';

describe('GET /api/predictions', () => {
  it('returns predictions for default symbols', async () => {
    const request = new NextRequest('http://localhost/api/predictions');

    const response = await GET(request, {});
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data).toBeInstanceOf(Array);
    expect(data.data.length).toBeGreaterThan(0);
  });

  it('validates symbol format', async () => {
    const request = new NextRequest(
      'http://localhost/api/predictions?symbols=invalid!!!'
    );

    const response = await GET(request, {});
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(data.error).toContain('Symbol must be 1-5 uppercase letters');
  });

  it('enforces maximum symbols limit', async () => {
    const symbols = Array(11)
      .fill('AAPL')
      .join(',');
    const request = new NextRequest(
      `http://localhost/api/predictions?symbols=${symbols}`
    );

    const response = await GET(request, {});
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(data.error).toContain('Maximum 10 symbols allowed');
  });
});
```

---

## Comparison Summary

### Lines of Code

| File | Before | After | Change |
|------|--------|-------|--------|
| Route Handler | 120 | 35 | -71% |
| Business Logic | 0 | 45 | +45 (new) |
| Validation | 30 (embedded) | 15 | -50% |
| Tests | Difficult | 60 | +60 (new) |
| **Total** | 150 | 155 | +5 (more maintainable) |

### Quality Metrics

| Metric | Before | After |
|--------|--------|-------|
| **Testability** | Low | High |
| **Type Safety** | Partial | Full |
| **Validation** | Manual | Automatic |
| **Error Handling** | Inconsistent | Standardized |
| **Rate Limiting** | None | Built-in |
| **Logging** | Manual | Structured |
| **Reusability** | Low | High |

---

## Key Takeaways

1. **Validation First** - Create schema before touching route
2. **Extract Logic** - Move business logic to testable functions
3. **Compose Middleware** - Apply middleware in consistent order
4. **Test Thoroughly** - Much easier with separated concerns
5. **Document Well** - Clear JSDoc comments for API endpoints

---

## Checklist for Migration

Use this checklist when migrating a route:

- [ ] Create Zod validation schema in `src/lib/validation/schemas.ts`
- [ ] Extract business logic to separate module
- [ ] Add middleware imports
- [ ] Replace function with `withMiddleware` composition
- [ ] Add error handling middleware first
- [ ] Add logging middleware second
- [ ] Add rate limiting middleware
- [ ] Add validation middleware with schema
- [ ] Update handler to use `context.validatedData`
- [ ] Return responses using `ApiResponse.success/error`
- [ ] Write unit tests for business logic
- [ ] Write integration tests for route
- [ ] Update API documentation
- [ ] Test rate limiting behavior
- [ ] Verify error responses

---

## Next Steps

After completing this migration, proceed with:

1. **Migrate `/api/analysis`** - Similar pattern (query validation)
2. **Migrate `/api/search`** - Similar pattern (query validation)
3. **Migrate `/api/watchlists`** - Introduce auth middleware
4. **Add authentication middleware** - Reusable across all routes
5. **Add Redis for rate limiting** - Production-ready persistence

---

## Questions?

Refer to:
- [API Middleware Guide](./API_MIDDLEWARE_GUIDE.md)
- [Validation Schemas](../src/lib/validation/schemas.ts)
- [Middleware Source](../src/lib/api/middleware.ts)
