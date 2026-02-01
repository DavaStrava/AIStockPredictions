/**
 * Next.js Middleware - Authentication Guard & Security Headers
 *
 * Protects all routes except /login and public assets.
 * Redirects unauthenticated users to the login page.
 * Adds security headers to all responses.
 *
 * In development mode (without Supabase config), allows all requests
 * and uses demo user authentication.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/auth/supabase-middleware';

// Security headers to add to all responses
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
} as const;

/**
 * Adds security headers to a response
 */
function addSecurityHeaders(response: NextResponse, request: NextRequest): NextResponse {
  // Add security headers
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  // Add HSTS header for HTTPS connections
  if (request.nextUrl.protocol === 'https:') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  return response;
}

// Routes that don't require authentication
const publicRoutes = ['/login', '/auth/callback'];

// Static file extensions to skip
const staticExtensions = ['.ico', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.css', '.js'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files (still add security headers)
  if (staticExtensions.some(ext => pathname.endsWith(ext))) {
    return addSecurityHeaders(NextResponse.next(), request);
  }

  // Skip middleware for Next.js internals (still add security headers)
  if (pathname.startsWith('/_next')) {
    return addSecurityHeaders(NextResponse.next(), request);
  }

  // Update session and get user
  const { user, response, isDemoMode } = await updateSession(request);

  // In demo mode (no Supabase config), allow all requests
  // The demo-user.ts module will handle creating a demo user for API routes
  if (isDemoMode) {
    return addSecurityHeaders(response, request);
  }

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    // If user is already logged in and trying to access login, redirect to home
    if (user && pathname === '/login') {
      const redirectResponse = NextResponse.redirect(new URL('/', request.url));
      return addSecurityHeaders(redirectResponse, request);
    }
    return addSecurityHeaders(response, request);
  }

  // Protect all other routes - redirect to login if not authenticated
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    return addSecurityHeaders(redirectResponse, request);
  }

  return addSecurityHeaders(response, request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

