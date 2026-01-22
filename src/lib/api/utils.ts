/**
 * API Utilities
 *
 * Shared utilities for API routes including error handling,
 * response formatting, and rate limiting.
 */

import { NextResponse } from 'next/server';

/**
 * Standard API error response structure.
 */
interface ApiErrorResponse {
  success: false;
  error: string;
  details?: string;
  field?: string;
  code?: string;
}

/**
 * Creates a standardized error response for API routes.
 * In production, error details are hidden from the client to prevent information leakage.
 * In development, full error details are included for debugging.
 *
 * @param error - The error that occurred
 * @param userMessage - User-friendly error message to display
 * @param statusCode - HTTP status code (default: 500)
 * @param options - Additional options for the error response
 * @returns NextResponse with appropriate error structure
 */
export function createErrorResponse(
  error: unknown,
  userMessage: string,
  statusCode: number = 500,
  options?: {
    field?: string;
    code?: string;
  }
): NextResponse<ApiErrorResponse> {
  // Always log the full error server-side
  console.error(`API Error [${statusCode}]:`, error);

  const response: ApiErrorResponse = {
    success: false,
    error: userMessage,
  };

  // Only include error details in development
  if (process.env.NODE_ENV === 'development') {
    response.details = error instanceof Error ? error.message : String(error);
  }

  // Add optional fields if provided
  if (options?.field) {
    response.field = options.field;
  }
  if (options?.code) {
    response.code = options.code;
  }

  return NextResponse.json(response, { status: statusCode });
}

/**
 * Checks if the current environment is production.
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Simple in-memory rate limiter for API routes.
 * Note: This is per-instance and won't work across multiple serverless instances.
 * For production, consider using Redis or a dedicated rate limiting service.
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limiting configuration.
 */
export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

/**
 * Default rate limit: 100 requests per minute.
 */
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60 * 1000,
};

/**
 * Checks if a request should be rate limited.
 *
 * @param identifier - Unique identifier for the client (e.g., IP address, user ID)
 * @param config - Rate limiting configuration
 * @returns Object containing whether the request is allowed and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Clean up expired entries periodically (every 100 checks)
  if (Math.random() < 0.01) {
    cleanupExpiredEntries(now);
  }

  if (!entry || now > entry.resetTime) {
    // First request or window expired - create new entry
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    };
  }

  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    };
  }

  // Increment count
  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn: entry.resetTime - now,
  };
}

/**
 * Cleans up expired rate limit entries to prevent memory leaks.
 */
function cleanupExpiredEntries(now: number): void {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Creates a rate limit exceeded response.
 *
 * @param resetIn - Time in milliseconds until the rate limit resets
 * @returns NextResponse with 429 status
 */
export function createRateLimitResponse(resetIn: number): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(resetIn / 1000),
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil(resetIn / 1000)),
        'X-RateLimit-Reset': String(Date.now() + resetIn),
      },
    }
  );
}

/**
 * Gets a client identifier from the request for rate limiting.
 * Uses X-Forwarded-For header (for proxied requests) or falls back to a default.
 *
 * @param request - The incoming request
 * @returns Client identifier string
 */
export function getClientIdentifier(request: Request): string {
  // Try to get the real IP from proxy headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP if there are multiple
    return forwardedFor.split(',')[0].trim();
  }

  // Fall back to a header that might contain the real IP
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // In development or when no IP is available, use a default
  return 'unknown-client';
}

/**
 * Creates a 403 Forbidden response for unauthorized access attempts.
 *
 * @param message - Optional custom message
 * @returns NextResponse with 403 status
 */
export function createForbiddenResponse(message: string = 'You do not have permission to access this resource'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status: 403 }
  );
}
