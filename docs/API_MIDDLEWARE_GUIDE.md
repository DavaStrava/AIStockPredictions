# API Middleware Guide

## Overview

The API middleware system provides a composable, type-safe way to handle common concerns in Next.js API routes:

- ✅ **Centralized error handling** - Consistent error responses
- ✅ **Request validation** - Zod schema validation for type safety
- ✅ **Rate limiting** - Prevent API abuse
- ✅ **Request logging** - Track requests and performance
- ✅ **CORS support** - Cross-origin request handling
- ✅ **Composable** - Mix and match middleware as needed

## Quick Start

### Before (Old Pattern)

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, side, entryPrice, quantity } = body;

    // Manual validation
    if (!symbol || typeof symbol !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Symbol is required' },
        { status: 400 }
      );
    }

    if (!side || (side !== 'LONG' && side !== 'SHORT')) {
      return NextResponse.json(
        { success: false, error: 'Invalid side' },
        { status: 400 }
      );
    }

    // ... 50 more lines of validation

    const trade = await tradeService.createTrade({
      symbol,
      side,
      entryPrice,
      quantity,
    });

    return NextResponse.json({ success: true, data: trade });
  } catch (error) {
    console.error('Error:', error);

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Lines of code: 60+**

### After (New Pattern)

```typescript
export const POST = withMiddleware(
  withErrorHandling(),
  withRateLimit({ requestsPerMinute: 30 }),
  withValidation(CreateTradeSchema, 'body'),
  async (req, { validatedData }) => {
    const trade = await tradeService.createTrade({
      userId: await getDemoUserId(),
      ...validatedData,
    });

    return ApiResponse.success(trade, 201);
  }
);
```

**Lines of code: 12**

## Architecture

### Middleware Composition

Middleware functions are composed left-to-right, creating a pipeline:

```
Request → ErrorHandling → Logging → RateLimit → Validation → Handler → Response
```

Each middleware can:
- Inspect/modify the request
- Pass data to the next middleware via `context`
- Short-circuit with an error response
- Transform the final response

## Available Middleware

### 1. Error Handling Middleware

Catches all errors and formats them into consistent responses.

```typescript
withErrorHandling()
```

**Handles:**
- `ApiError` - Custom API errors with status codes
- `ZodError` - Validation errors from Zod
- Generic errors - Unknown errors (500 response)

**Example:**

```typescript
export const GET = withMiddleware(
  withErrorHandling(),
  async (req) => {
    throw new NotFoundError('User not found');
    // Automatically returns: { success: false, error: 'User not found' }, 404
  }
);
```

### 2. Validation Middleware

Validates request data using Zod schemas.

```typescript
withValidation(schema, source)
```

**Parameters:**
- `schema`: Zod schema to validate against
- `source`: Where to get data from - `'body'`, `'query'`, or `'params'`

**Example:**

```typescript
const QuerySchema = z.object({
  page: z.string().transform(v => parseInt(v, 10)).pipe(z.number().positive()),
  limit: z.string().transform(v => parseInt(v, 10)).pipe(z.number().max(100)),
});

export const GET = withMiddleware(
  withValidation(QuerySchema, 'query'),
  async (req, { validatedData }) => {
    // validatedData is type-safe and validated
    const { page, limit } = validatedData as z.infer<typeof QuerySchema>;
    return ApiResponse.success({ page, limit });
  }
);
```

### 3. Rate Limiting Middleware

Prevents API abuse by limiting requests per IP address.

```typescript
withRateLimit(options)
```

**Options:**
- `requestsPerMinute`: Max requests per minute (default: 60)
- `requestsPerHour`: Max requests per hour (default: 1000)

**Example:**

```typescript
export const POST = withMiddleware(
  withRateLimit({ requestsPerMinute: 10 }),  // Stricter for mutations
  async (req) => {
    // Handler
  }
);
```

**Note:** Uses in-memory storage (resets on server restart). For production, replace with Redis.

### 4. Logging Middleware

Logs request/response details for debugging and monitoring.

```typescript
withLogging()
```

**Logs:**
- Request: method, path, query params, timestamp
- Response: status code, duration
- Adds `X-Request-ID` header for tracing

**Example:**

```typescript
export const GET = withMiddleware(
  withLogging(),
  async (req) => {
    // [API Request] { requestId: '...', method: 'GET', path: '/api/trades', ... }
    // [API Response] { requestId: '...', status: 200, duration: '45ms' }
  }
);
```

### 5. CORS Middleware

Adds CORS headers for cross-origin requests.

```typescript
withCors(allowedOrigins)
```

**Parameters:**
- `allowedOrigins`: Array of allowed origins (default: `['*']`)

**Example:**

```typescript
export const GET = withMiddleware(
  withCors(['https://example.com', 'https://app.example.com']),
  async (req) => {
    return ApiResponse.success({ message: 'CORS enabled' });
  }
);
```

## Helper Classes

### ApiResponse

Standardized response builder.

```typescript
// Success response
ApiResponse.success(data, status?)

// Error response
ApiResponse.error(error, status?, field?, code?, details?)
```

**Examples:**

```typescript
// Success with data
return ApiResponse.success({ trades: [] });
// → { success: true, data: { trades: [] } }, 200

// Success with custom status
return ApiResponse.success(trade, 201);
// → { success: true, data: trade }, 201

// Error
return ApiResponse.error('Not found', 404);
// → { success: false, error: 'Not found' }, 404
```

### Error Classes

Pre-defined error classes with appropriate status codes.

```typescript
// 400 Bad Request
throw new ValidationError('Invalid email format', 'email');

// 401 Unauthorized
throw new UnauthorizedError('Authentication required');

// 404 Not Found
throw new NotFoundError('Trade not found');

// 429 Too Many Requests
throw new RateLimitError('Rate limit exceeded');

// Custom status code
throw new ApiError('Custom error', 418, 'field', 'CODE');
```

## Validation Schemas

Define schemas in `src/lib/validation/schemas.ts`:

```typescript
export const CreateTradeSchema = z.object({
  symbol: z
    .string()
    .min(1)
    .max(5)
    .regex(/^[A-Z]+$/)
    .transform(v => v.toUpperCase()),
  side: z.enum(['LONG', 'SHORT']),
  entryPrice: z.number().positive(),
  quantity: z.number().positive(),
  fees: z.number().nonnegative().optional().default(0),
});

export type CreateTradeData = z.infer<typeof CreateTradeSchema>;
```

**Benefits:**
- Reusable on frontend and backend
- Automatic TypeScript type generation
- Runtime validation with great error messages
- Data transformation (e.g., uppercase conversion)

## Migration Guide

### Step 1: Create Validation Schema

```typescript
// src/lib/validation/schemas.ts
export const MyRequestSchema = z.object({
  field1: z.string(),
  field2: z.number(),
});
```

### Step 2: Update Route Handler

**Before:**

```typescript
export async function GET(request: NextRequest) {
  try {
    const data = await request.json();
    // manual validation
    // manual error handling
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    // manual error responses
  }
}
```

**After:**

```typescript
import { withMiddleware, withErrorHandling, withValidation, ApiResponse } from '@/lib/api/middleware';
import { MyRequestSchema } from '@/lib/validation/schemas';

export const GET = withMiddleware(
  withErrorHandling(),
  withValidation(MyRequestSchema, 'body'),
  async (req, { validatedData }) => {
    const data = validatedData as z.infer<typeof MyRequestSchema>;
    return ApiResponse.success(result);
  }
);
```

### Step 3: Update Service Layer Errors

Map service errors to API errors:

```typescript
try {
  const trade = await tradeService.closeTrade(id, exitPrice);
  return ApiResponse.success(trade);
} catch (error) {
  if (error instanceof TradeNotFoundError) {
    throw new NotFoundError(error.message);
  }
  throw error; // Will be caught by error handling middleware
}
```

## Advanced Usage

### Custom Middleware

Create your own middleware:

```typescript
function withAuth(): Middleware {
  return (handler) => async (req, context) => {
    const token = req.headers.get('authorization');

    if (!token) {
      throw new UnauthorizedError('Missing authorization header');
    }

    const user = await verifyToken(token);

    // Pass user to handler via context
    return handler(req, { ...context, user });
  };
}

// Usage
export const GET = withMiddleware(
  withErrorHandling(),
  withAuth(),
  async (req, { user }) => {
    // user is available here
    return ApiResponse.success({ userId: user.id });
  }
);
```

### Conditional Middleware

Apply middleware conditionally:

```typescript
const middlewares = [
  withErrorHandling(),
  withLogging(),
];

if (process.env.NODE_ENV === 'production') {
  middlewares.push(withRateLimit({ requestsPerMinute: 30 }));
}

export const POST = withMiddleware(
  ...middlewares,
  async (req) => {
    // Handler
  }
);
```

### Default Middleware Stack

Use the pre-configured default stack:

```typescript
import { withDefaultMiddleware } from '@/lib/api/middleware';

export const GET = withDefaultMiddleware(
  async (req) => {
    // Automatically includes: error handling, logging, rate limiting
  },
  { rateLimit: { requestsPerMinute: 120 } }
);
```

## Best Practices

### 1. Always Use Error Handling First

```typescript
// ✅ Good
export const GET = withMiddleware(
  withErrorHandling(),  // First!
  withRateLimit(),
  // ...
);

// ❌ Bad - errors won't be caught
export const GET = withMiddleware(
  withRateLimit(),
  withErrorHandling(),  // Too late
  // ...
);
```

### 2. Validate Early

```typescript
// ✅ Good - validate before expensive operations
export const POST = withMiddleware(
  withErrorHandling(),
  withValidation(Schema, 'body'),
  async (req, { validatedData }) => {
    // Data is already validated
  }
);
```

### 3. Different Rate Limits for Read vs Write

```typescript
// ✅ Good
export const GET = withMiddleware(
  withRateLimit({ requestsPerMinute: 120 }),  // More lenient
  // ...
);

export const POST = withMiddleware(
  withRateLimit({ requestsPerMinute: 30 }),   // Stricter
  // ...
);
```

### 4. Use Type-Safe Validation

```typescript
// ✅ Good - type-safe
const data = validatedData as z.infer<typeof Schema>;

// ❌ Bad - any type
const data = validatedData as any;
```

### 5. Map Service Errors to API Errors

```typescript
// ✅ Good - consistent error responses
catch (error) {
  if (error instanceof ServiceSpecificError) {
    throw new NotFoundError(error.message);
  }
  throw error;
}

// ❌ Bad - inconsistent responses
catch (error) {
  return NextResponse.json({ error: 'oops' });
}
```

## Performance Considerations

### Rate Limit Store

Current implementation uses in-memory Map. For production:

**Option 1: Redis**

```typescript
import Redis from 'ioredis';
const redis = new Redis();

async function checkRateLimit(key: string, limit: number) {
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 60); // 60 seconds
  }
  return count <= limit;
}
```

**Option 2: Upstash (Serverless Redis)**

```typescript
import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();
```

### Middleware Overhead

Middleware adds minimal overhead (~1-2ms per middleware). For ultra-high performance:

```typescript
// Skip logging in production
const middlewares = [
  withErrorHandling(),
  ...(process.env.NODE_ENV === 'development' ? [withLogging()] : []),
  withRateLimit(),
];
```

## Testing

### Testing Middleware

```typescript
import { withValidation, ApiResponse } from '@/lib/api/middleware';
import { NextRequest } from 'next/server';

describe('withValidation', () => {
  it('validates request body', async () => {
    const schema = z.object({ name: z.string() });
    const handler = jest.fn(() => Promise.resolve(ApiResponse.success({})));

    const middleware = withValidation(schema, 'body')(handler);

    const request = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ name: 'test' }),
    });

    await middleware(request, {});

    expect(handler).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        validatedData: { name: 'test' },
      })
    );
  });
});
```

### Testing Routes

```typescript
describe('POST /api/trades', () => {
  it('creates a trade', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/trades', {
        method: 'POST',
        body: JSON.stringify({
          symbol: 'AAPL',
          side: 'LONG',
          entryPrice: 150,
          quantity: 10,
        }),
      }),
      {}
    );

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toMatchObject({
      symbol: 'AAPL',
      side: 'LONG',
    });
  });
});
```

## Troubleshooting

### "Invalid JSON in request body"

**Cause:** Request body is not valid JSON or is empty.

**Fix:** Ensure client sends `Content-Type: application/json` header.

### "Rate limit exceeded"

**Cause:** Too many requests from the same IP.

**Fix:**
- Wait for rate limit window to reset
- Increase rate limit for the route
- Use authentication-based rate limiting instead of IP-based

### "Validation failed"

**Cause:** Request data doesn't match schema.

**Fix:** Check the error response for specific field errors:

```json
{
  "success": false,
  "error": "Entry price must be positive",
  "field": "entryPrice",
  "code": "VALIDATION_ERROR"
}
```

## Migration Progress

### ✅ Migrated Routes

- `POST /api/trades` - Create trade with validation
- `GET /api/trades` - List trades with query filters
- `GET /api/trades/[id]` - Get single trade
- `PATCH /api/trades/[id]` - Close trade
- `GET /api/trades/stats` - Portfolio statistics

### 📋 To Be Migrated

- `/api/predictions`
- `/api/analysis`
- `/api/search`
- `/api/watchlists/*`
- `/api/market-indices`
- `/api/insights`

## Resources

- [Zod Documentation](https://zod.dev)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Validation Schemas](../src/lib/validation/schemas.ts)
- [Middleware Implementation](../src/lib/api/middleware.ts)
