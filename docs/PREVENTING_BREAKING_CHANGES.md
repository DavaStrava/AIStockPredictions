# Preventing Breaking Changes During Refactoring

**Created:** 2026-01-31
**Last Updated:** 2026-01-31

This guide provides strategies to prevent breaking changes when refactoring code, especially API routes.

---

## Problem We Solved

During Phase 1.2 migration, we accidentally changed the API response structure:

```typescript
// Before (what frontend expected)
{ success: true, data: [...], metadata: {...} }

// After (what we initially returned)
{ success: true, data: { predictions: [...], metadata: {...} } }
```

Result: **Frontend broke** because `predictions.map()` tried to call `.map()` on an object instead of an array.

---

## Prevention Strategies

### 1. API Contract Tests ⭐ **HIGHEST PRIORITY**

**What:** Tests that verify the EXACT structure of API responses.

**Why:** Catches breaking changes before they reach the frontend.

**How:**
```bash
# Run contract tests before committing
npm test -- contract-tests
```

**Location:** `src/__tests__/api/contract-tests.test.ts`

**Example:**
```typescript
test('GET /api/predictions returns array in data field', async () => {
  const response = await fetch('/api/predictions?symbols=AAPL');
  const json = await response.json();

  // This would have caught our bug!
  expect(Array.isArray(json.data)).toBe(true);
  expect(json.data[0]).toHaveProperty('symbol');
  expect(json.data[0]).toHaveProperty('currentPrice');
});
```

**When to run:**
- ✅ Before every commit that touches API routes
- ✅ In CI/CD pipeline before deployment
- ✅ After any middleware changes

---

### 2. TypeScript API Contracts ⭐ **HIGH PRIORITY**

**What:** Shared TypeScript types for API responses.

**Why:** Compile-time safety - TypeScript catches mismatches.

**How:**

**Step 1: Define contracts**
```typescript
// src/types/api-contracts.ts
export interface PredictionsResponse {
  success: true;
  data: PredictionResult[]; // ← Forces array type
  metadata: {...};
}
```

**Step 2: Use in backend**
```typescript
// src/app/api/predictions/route.ts
import { PredictionsResponse } from '@/types/api-contracts';

export const GET = async (): Promise<NextResponse<PredictionsResponse>> => {
  return NextResponse.json({
    success: true,
    data: predictions, // ← TypeScript verifies this is an array
    metadata: {...}
  });
};
```

**Step 3: Use in frontend**
```typescript
// src/hooks/usePredictions.ts
import { PredictionsResponse } from '@/types/api-contracts';

const response = await fetch('/api/predictions');
const json: PredictionsResponse = await response.json();

// TypeScript knows json.data is an array
json.data.map(p => ...); // ✅ Type-safe
```

**Benefits:**
- ✅ Compile errors if structure changes
- ✅ IntelliSense autocomplete
- ✅ Self-documenting API
- ✅ Refactoring confidence

---

### 3. Integration Tests

**What:** Tests that hit actual API endpoints with real HTTP requests.

**Why:** Catches issues that unit tests miss (routing, middleware, serialization).

**Example:**
```typescript
// src/__tests__/integration/api-routes.test.ts
describe('API Routes Integration', () => {
  let server: NextServer;

  beforeAll(async () => {
    server = await startTestServer();
  });

  test('GET /api/predictions works end-to-end', async () => {
    const response = await fetch('http://localhost:3000/api/predictions');
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });
});
```

**When to write:**
- ✅ For all critical user flows
- ✅ Before major refactoring
- ✅ When adding new endpoints

---

### 4. Response Validation Middleware

**What:** Runtime validation that asserts response structure.

**Why:** Catches bugs in development before users see them.

**Example:**
```typescript
// src/lib/api/validation-middleware.ts
import { z } from 'zod';

const PredictionsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(z.object({
    symbol: z.string(),
    currentPrice: z.number(),
    // ... etc
  })),
  metadata: z.object({...}),
});

export function withResponseValidation<T>(
  schema: z.ZodSchema<T>
): Middleware {
  return (handler) => async (req, context) => {
    const response = await handler(req, context);
    const json = await response.json();

    // Validate in development only
    if (process.env.NODE_ENV === 'development') {
      const result = schema.safeParse(json);
      if (!result.success) {
        console.error('❌ Response validation failed:', result.error);
        throw new Error('Response validation failed');
      }
    }

    return NextResponse.json(json);
  };
}
```

**Usage:**
```typescript
export const GET = withMiddleware(
  withErrorHandling(),
  withResponseValidation(PredictionsResponseSchema), // ← Validates on dev
  async (req) => {
    // handler
  }
);
```

---

### 5. Snapshot Testing

**What:** Save expected outputs and compare against future runs.

**Why:** Detects unintended changes to complex objects.

**Example:**
```typescript
test('predictions response matches snapshot', () => {
  const response = {
    success: true,
    data: mockPredictions,
    metadata: {...}
  };

  expect(response).toMatchSnapshot();
});
```

**Warning:** Can be brittle if overused. Best for stable APIs.

---

### 6. Gradual Migration Strategy

**What:** Run old and new code side-by-side before switching.

**Why:** Zero-downtime migration, easy rollback.

**Pattern 1: Parallel Routes**
```typescript
// Keep old route during migration
/api/predictions        ← Old route (keep working)
/api/v2/predictions     ← New route (test first)

// After testing, switch:
/api/predictions        ← New route
/api/legacy/predictions ← Old route (deprecated)
```

**Pattern 2: Feature Flags**
```typescript
export const GET = async (req: NextRequest) => {
  const useNewMiddleware = process.env.FEATURE_NEW_MIDDLEWARE === 'true';

  if (useNewMiddleware) {
    return newImplementation(req);
  } else {
    return oldImplementation(req);
  }
};
```

**Pattern 3: Response Adapter**
```typescript
// Adapter ensures backward compatibility
function adaptResponse(newResponse: NewFormat): OldFormat {
  return {
    success: newResponse.success,
    data: newResponse.data.predictions, // ← Extract array
    metadata: newResponse.data.metadata,
  };
}
```

---

### 7. Pre-commit Checklist

Create a checklist for API changes:

```markdown
## API Change Checklist

Before committing changes to API routes:

- [ ] Response structure unchanged OR backward compatible
- [ ] Contract tests pass (`npm test -- contract-tests`)
- [ ] TypeScript types updated in `api-contracts.ts`
- [ ] Integration tests pass
- [ ] Tested in browser (dev server)
- [ ] Checked network tab for actual response structure
- [ ] Documentation updated
```

**Automate with Git Hook:**
```bash
# .husky/pre-commit
#!/bin/sh
npm run test:contracts || {
  echo "❌ Contract tests failed! API changes may break frontend."
  exit 1
}
```

---

### 8. Smoke Tests in CI/CD

**What:** Automated tests that run on every PR/deploy.

**Example GitHub Actions:**
```yaml
# .github/workflows/api-tests.yml
name: API Contract Tests

on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run test:contracts
```

---

### 9. Documentation

**What:** Document expected response structures.

**Example:**
```typescript
/**
 * GET /api/predictions
 *
 * Returns stock predictions based on technical analysis.
 *
 * Query Parameters:
 * @param {string} symbols - Comma-separated stock symbols (optional)
 *
 * Response Structure:
 * ```json
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "symbol": "AAPL",
 *       "currentPrice": 150.25,
 *       "prediction": {...}
 *     }
 *   ],
 *   "metadata": {...}
 * }
 * ```
 *
 * IMPORTANT: `data` MUST be an array, not an object!
 *           Frontend code uses .map() on this field.
 */
```

---

### 10. Manual Testing Checklist

Before deploying API changes:

1. ✅ **Network Tab Check**
   - Open browser DevTools → Network tab
   - Trigger API call
   - Verify response JSON structure

2. ✅ **Console Check**
   - Look for "cannot read property" errors
   - Look for ".map is not a function" errors

3. ✅ **Test with Real Data**
   - Don't just test with mocks
   - Test with actual API responses

4. ✅ **Test Error Cases**
   - What if API returns error?
   - What if data is empty?
   - What if network fails?

---

## Quick Reference

### When Refactoring API Routes

**Before starting:**
1. Read current response structure
2. Write contract test for current behavior
3. Document expected structure

**During refactoring:**
1. Keep response structure identical
2. Run contract tests frequently
3. Test in browser

**After refactoring:**
1. Contract tests pass ✅
2. Integration tests pass ✅
3. Manual browser test ✅
4. Update documentation ✅

---

## Tools & Commands

```bash
# Run contract tests only
npm test -- contract-tests

# Run all tests
npm test

# Run integration tests (with server running)
npm run test:integration

# Type check entire project
npm run type-check

# Build (catches type errors)
npm run build
```

---

## Common Pitfalls

### ❌ Don't Do This

```typescript
// Changing response structure without checking frontend
return ApiResponse.success({
  predictions: data,  // ← Frontend expects data to BE predictions, not contain them
  metadata: {...}
});
```

### ✅ Do This Instead

```typescript
// Maintain exact structure
return NextResponse.json({
  success: true,
  data: predictions,  // ← data IS the array
  metadata: {...}
});
```

### ❌ Don't Do This

```typescript
// Assuming structure without testing
const predictions = response.data.predictions; // ← Will break if data IS predictions
```

### ✅ Do This Instead

```typescript
// Use TypeScript contracts
import { PredictionsResponse } from '@/types/api-contracts';

const response: PredictionsResponse = await fetch(...).then(r => r.json());
const predictions = response.data; // ← TypeScript enforces correct structure
```

---

## Phase-Specific Recommendations

### Phase 1: API Infrastructure (Current)
- ✅ **DONE:** Middleware infrastructure
- 🔄 **NEXT:** Add contract tests (this document)
- 📋 **TODO:** Add response validation middleware
- 📋 **TODO:** Set up CI/CD tests

### Phase 2: State Management
- **Before React Query migration:**
  1. Write contract tests for ALL used endpoints
  2. Document current hook behavior
  3. Create TypeScript contracts

### Phase 3: Component Refactoring
- Lower risk (UI only, doesn't affect API)
- Still test data flow end-to-end

---

## Resources

**Files Created:**
- `src/__tests__/api/contract-tests.test.ts` - Contract tests
- `src/types/api-contracts.ts` - TypeScript contracts
- `docs/PREVENTING_BREAKING_CHANGES.md` - This guide

**Next Steps:**
1. Run contract tests: `npm test -- contract-tests`
2. Add tests to CI/CD pipeline
3. Create pre-commit hook
4. Update existing hooks to use TypeScript contracts

---

## Lessons Learned

**From Phase 1.2 Migration:**

1. **Middleware is great, but backward compatibility matters**
   - Middleware reduced code 50%+
   - But initial implementation broke frontend
   - Solution: Keep response structure identical

2. **Type safety isn't enough**
   - TypeScript only checks what you tell it to check
   - Need runtime validation (tests) too

3. **Test at the boundary**
   - Unit tests passed
   - Integration would have caught it
   - Always test HTTP layer

4. **Developer experience matters**
   - Quick feedback loop (contract tests) > slow (manual testing)
   - Automate as much as possible

---

**Remember:** The best test is the one that would have caught the bug! 🐛✅
