/**
 * Mock Request Utilities for API Route Testing
 *
 * This module provides helper functions for creating mock NextRequest objects
 * that can be used in API route tests. It standardizes the creation of mock
 * requests to ensure consistent testing patterns across the codebase.
 */

import { NextRequest } from 'next/server';

/**
 * Options for creating a mock NextRequest
 */
export interface MockRequestOptions {
  /** The URL path (default: 'http://localhost:3000/api/test') */
  url?: string;
  /** HTTP method (default: 'GET') */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Request body (will be JSON stringified) */
  body?: unknown;
  /** Request headers */
  headers?: Record<string, string>;
  /** URL search parameters */
  searchParams?: Record<string, string>;
}

/**
 * Creates a mock NextRequest object for API route testing.
 *
 * @example
 * // GET request with query params
 * const request = createMockNextRequest({
 *   url: 'http://localhost:3000/api/trades',
 *   searchParams: { status: 'OPEN', symbol: 'AAPL' }
 * });
 *
 * @example
 * // POST request with body
 * const request = createMockNextRequest({
 *   url: 'http://localhost:3000/api/trades',
 *   method: 'POST',
 *   body: { symbol: 'AAPL', side: 'LONG', entryPrice: 150, quantity: 10 }
 * });
 *
 * @example
 * // PATCH request with custom headers
 * const request = createMockNextRequest({
 *   url: 'http://localhost:3000/api/trades/123',
 *   method: 'PATCH',
 *   body: { exitPrice: 160 },
 *   headers: { 'X-Forwarded-For': '192.168.1.1' }
 * });
 */
export function createMockNextRequest(options: MockRequestOptions = {}): NextRequest {
  const {
    url = 'http://localhost:3000/api/test',
    method = 'GET',
    body,
    headers = {},
    searchParams = {},
  } = options;

  // Build URL with search params
  const urlObj = new URL(url);
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });

  // Build request init
  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  // Add body for non-GET requests
  if (body !== undefined && method !== 'GET') {
    requestInit.body = JSON.stringify(body);
  }

  return new NextRequest(urlObj.toString(), requestInit);
}

/**
 * Creates a mock GET request with query parameters.
 *
 * @example
 * const request = createMockGetRequest('/api/trades', { status: 'OPEN' });
 */
export function createMockGetRequest(
  path: string,
  searchParams: Record<string, string> = {},
  headers: Record<string, string> = {}
): NextRequest {
  return createMockNextRequest({
    url: `http://localhost:3000${path}`,
    method: 'GET',
    searchParams,
    headers,
  });
}

/**
 * Creates a mock POST request with a JSON body.
 *
 * @example
 * const request = createMockPostRequest('/api/trades', {
 *   symbol: 'AAPL',
 *   side: 'LONG',
 *   entryPrice: 150,
 *   quantity: 10
 * });
 */
export function createMockPostRequest<T = unknown>(
  path: string,
  body: T,
  headers: Record<string, string> = {}
): NextRequest {
  return createMockNextRequest({
    url: `http://localhost:3000${path}`,
    method: 'POST',
    body,
    headers,
  });
}

/**
 * Creates a mock PATCH request with a JSON body.
 *
 * @example
 * const request = createMockPatchRequest('/api/trades/123', { exitPrice: 160 });
 */
export function createMockPatchRequest<T = unknown>(
  path: string,
  body: T,
  headers: Record<string, string> = {}
): NextRequest {
  return createMockNextRequest({
    url: `http://localhost:3000${path}`,
    method: 'PATCH',
    body,
    headers,
  });
}

/**
 * Creates a mock DELETE request.
 *
 * @example
 * const request = createMockDeleteRequest('/api/trades/123');
 */
export function createMockDeleteRequest(
  path: string,
  headers: Record<string, string> = {}
): NextRequest {
  return createMockNextRequest({
    url: `http://localhost:3000${path}`,
    method: 'DELETE',
    headers,
  });
}

/**
 * Creates a mock PUT request with a JSON body.
 *
 * @example
 * const request = createMockPutRequest('/api/portfolios/123', { name: 'Updated Portfolio' });
 */
export function createMockPutRequest<T = unknown>(
  path: string,
  body: T,
  headers: Record<string, string> = {}
): NextRequest {
  return createMockNextRequest({
    url: `http://localhost:3000${path}`,
    method: 'PUT',
    body,
    headers,
  });
}

/**
 * Helper to extract and parse JSON body from a NextResponse.
 * Use this in tests to easily get the response data.
 *
 * @example
 * const response = await GET(request);
 * const data = await parseResponseJson(response);
 * expect(data.success).toBe(true);
 */
export async function parseResponseJson<T = unknown>(
  response: Response
): Promise<T> {
  return response.json() as Promise<T>;
}

/**
 * Type for standard API response structure
 */
export interface ApiResponseBody<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  field?: string;
  code?: string;
}

/**
 * Helper to create route params for dynamic routes.
 *
 * @example
 * // For /api/trades/[id]/route.ts
 * const response = await GET(request, createRouteParams({ id: '123' }));
 */
export function createRouteParams<T extends Record<string, string>>(
  params: T
): { params: Promise<T> } {
  return { params: Promise.resolve(params) };
}
