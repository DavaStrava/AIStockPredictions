/**
 * API Middleware - Centralized request/response handling for Next.js API routes
 *
 * This module provides composable middleware functions that handle common concerns:
 * - Error handling and formatting
 * - Request validation
 * - Rate limiting
 * - Logging
 * - CORS headers
 *
 * @example
 * ```typescript
 * export const GET = withMiddleware(
 *   withRateLimit({ requestsPerMinute: 60 }),
 *   withValidation(TradeFiltersSchema, 'query'),
 *   async (req, { validatedData }) => {
 *     const trades = await tradeService.getUserTrades(userId, validatedData);
 *     return ApiResponse.success(trades);
 *   }
 * );
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';

/**
 * Standard API response format
 */
export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  error: string;
  field?: string;
  code?: string;
  details?: string;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Context object passed to handlers with request metadata
 */
export interface RequestContext {
  validatedData?: unknown;
  user?: { id: string; email: string };
  requestId?: string;
}

/**
 * Handler function signature
 */
export type ApiHandler<T = unknown> = (
  req: NextRequest,
  context: RequestContext
) => Promise<NextResponse<ApiResponse<T>>>;

/**
 * Middleware function signature
 */
export type Middleware = (
  handler: ApiHandler
) => ApiHandler;

/**
 * Custom error classes for better error handling
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, field?: string) {
    super(message, 400, field, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, undefined, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, undefined, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, undefined, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

/**
 * Helper class for creating standardized API responses
 */
export class ApiResponse {
  /**
   * Create a success response
   */
  static success<T>(data: T, status: number = 200): NextResponse<ApiSuccessResponse<T>> {
    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status }
    );
  }

  /**
   * Create an error response
   */
  static error(
    error: string,
    status: number = 500,
    field?: string,
    code?: string,
    details?: string
  ): NextResponse<ApiErrorResponse> {
    return NextResponse.json(
      {
        success: false,
        error,
        ...(field && { field }),
        ...(code && { code }),
        ...(details && { details }),
      },
      { status }
    );
  }
}

/**
 * Core error handling middleware
 * Catches all errors and formats them into consistent API responses
 */
export function withErrorHandling(): Middleware {
  return (handler) => async (req, context) => {
    try {
      return await handler(req, context);
    } catch (error) {
      // Log the error for debugging
      console.error('[API Error]', {
        path: req.nextUrl.pathname,
        method: req.method,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Handle specific error types
      if (error instanceof ApiError) {
        return ApiResponse.error(
          error.message,
          error.statusCode,
          error.field,
          error.code
        );
      }

      if (error instanceof ZodError) {
        const firstError = error.errors[0];
        return ApiResponse.error(
          firstError.message,
          400,
          firstError.path.join('.'),
          'VALIDATION_ERROR',
          JSON.stringify(error.errors)
        );
      }

      // Generic error response
      return ApiResponse.error(
        'Internal server error',
        500,
        undefined,
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };
}

/**
 * Request validation middleware using Zod schemas
 *
 * @param schema - Zod schema to validate against
 * @param source - Where to get data from: 'body', 'query', or 'params'
 *
 * @example
 * ```typescript
 * export const POST = withMiddleware(
 *   withValidation(CreateTradeSchema, 'body'),
 *   async (req, { validatedData }) => {
 *     const trade = await tradeService.create(validatedData);
 *     return ApiResponse.success(trade);
 *   }
 * );
 * ```
 */
export function withValidation<T>(
  schema: ZodSchema<T>,
  source: 'body' | 'query' | 'params' = 'body'
): Middleware {
  return (handler) => async (req, context) => {
    let data: unknown;

    // Extract data from the specified source
    if (source === 'body') {
      try {
        data = await req.json();
      } catch {
        throw new ValidationError('Invalid JSON in request body');
      }
    } else if (source === 'query') {
      const searchParams = req.nextUrl.searchParams;
      data = Object.fromEntries(searchParams.entries());
    } else {
      // For params, we'd need to extract from the URL pattern
      // This would be set by the Next.js route handler
      data = context.validatedData || {};
    }

    // Validate the data
    const result = schema.safeParse(data);

    if (!result.success) {
      throw result.error;
    }

    // Pass validated data to the handler
    return handler(req, {
      ...context,
      validatedData: result.data,
    });
  };
}

/**
 * Rate limiting middleware
 * Limits requests per IP address to prevent abuse
 *
 * @param options - Rate limiting configuration
 *
 * @example
 * ```typescript
 * export const POST = withMiddleware(
 *   withRateLimit({ requestsPerMinute: 10 }),
 *   async (req) => {
 *     // Handler logic
 *   }
 * );
 * ```
 */
export interface RateLimitOptions {
  requestsPerMinute?: number;
  requestsPerHour?: number;
}

// In-memory rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function withRateLimit(options: RateLimitOptions = {}): Middleware {
  const { requestsPerMinute = 60, requestsPerHour = 1000 } = options;

  return (handler) => async (req, context) => {
    // Get client identifier (IP address)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
               req.headers.get('x-real-ip') ||
               'unknown';

    const now = Date.now();
    const minuteKey = `${ip}:minute`;
    const hourKey = `${ip}:hour`;

    // Check minute limit
    const minuteLimit = rateLimitStore.get(minuteKey);
    if (minuteLimit) {
      if (now < minuteLimit.resetAt) {
        if (minuteLimit.count >= requestsPerMinute) {
          throw new RateLimitError(
            `Rate limit exceeded: ${requestsPerMinute} requests per minute allowed`
          );
        }
        minuteLimit.count++;
      } else {
        // Reset the counter
        rateLimitStore.set(minuteKey, { count: 1, resetAt: now + 60000 });
      }
    } else {
      rateLimitStore.set(minuteKey, { count: 1, resetAt: now + 60000 });
    }

    // Check hour limit
    const hourLimit = rateLimitStore.get(hourKey);
    if (hourLimit) {
      if (now < hourLimit.resetAt) {
        if (hourLimit.count >= requestsPerHour) {
          throw new RateLimitError(
            `Rate limit exceeded: ${requestsPerHour} requests per hour allowed`
          );
        }
        hourLimit.count++;
      } else {
        rateLimitStore.set(hourKey, { count: 1, resetAt: now + 3600000 });
      }
    } else {
      rateLimitStore.set(hourKey, { count: 1, resetAt: now + 3600000 });
    }

    // Cleanup old entries periodically (every 100 requests)
    if (Math.random() < 0.01) {
      for (const [key, value] of rateLimitStore.entries()) {
        if (now > value.resetAt) {
          rateLimitStore.delete(key);
        }
      }
    }

    return handler(req, context);
  };
}

/**
 * CORS middleware
 * Adds CORS headers to responses
 */
export function withCors(allowedOrigins: string[] = ['*']): Middleware {
  return (handler) => async (req, context) => {
    const response = await handler(req, context);

    const origin = req.headers.get('origin');
    if (origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin))) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      response.headers.set('Access-Control-Max-Age', '86400');
    }

    return response;
  };
}

/**
 * Request logging middleware
 * Logs request details for debugging and monitoring
 */
export function withLogging(): Middleware {
  return (handler) => async (req, context) => {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    console.log('[API Request]', {
      requestId,
      method: req.method,
      path: req.nextUrl.pathname,
      query: Object.fromEntries(req.nextUrl.searchParams),
      timestamp: new Date().toISOString(),
    });

    const response = await handler(req, { ...context, requestId });

    const duration = Date.now() - startTime;
    console.log('[API Response]', {
      requestId,
      status: response.status,
      duration: `${duration}ms`,
    });

    // Add request ID to response headers for tracing
    response.headers.set('X-Request-ID', requestId);

    return response;
  };
}

/**
 * Compose multiple middleware functions into a single handler
 * Middleware are applied in order (left to right)
 *
 * @param middlewares - Middleware functions to apply
 * @param handler - Final handler function
 *
 * @example
 * ```typescript
 * export const POST = withMiddleware(
 *   withErrorHandling(),
 *   withRateLimit({ requestsPerMinute: 10 }),
 *   withValidation(CreateTradeSchema, 'body'),
 *   withLogging(),
 *   async (req, { validatedData }) => {
 *     const trade = await tradeService.create(validatedData);
 *     return ApiResponse.success(trade);
 *   }
 * );
 * ```
 */
export function withMiddleware(
  ...args: [...Middleware[], ApiHandler]
): ApiHandler {
  const handler = args.pop() as ApiHandler;
  const middlewares = args as Middleware[];

  // Compose middleware from right to left
  return middlewares.reduceRight(
    (next, middleware) => middleware(next),
    handler
  );
}

/**
 * Default middleware stack for most API routes
 * Includes error handling, logging, and rate limiting
 */
export function withDefaultMiddleware(
  handler: ApiHandler,
  options: { rateLimit?: RateLimitOptions } = {}
): ApiHandler {
  return withMiddleware(
    withErrorHandling(),
    withLogging(),
    withRateLimit(options.rateLimit),
    handler
  );
}
