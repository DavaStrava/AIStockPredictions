/**
 * Next.js Middleware - Authentication Guard
 * 
 * Protects all routes except /login and public assets.
 * Redirects unauthenticated users to the login page.
 * 
 * In development mode (without Supabase config), allows all requests
 * and uses demo user authentication.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/auth/supabase-middleware';

// Routes that don't require authentication
const publicRoutes = ['/login', '/auth/callback'];

// Static file extensions to skip
const staticExtensions = ['.ico', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.css', '.js'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files
  if (staticExtensions.some(ext => pathname.endsWith(ext))) {
    return NextResponse.next();
  }

  // Skip middleware for Next.js internals
  if (pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // Update session and get user
  const { user, response, isDemoMode } = await updateSession(request);

  // In demo mode (no Supabase config), allow all requests
  // The demo-user.ts module will handle creating a demo user for API routes
  if (isDemoMode) {
    return response;
  }

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    // If user is already logged in and trying to access login, redirect to home
    if (user && pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return response;
  }

  // Protect all other routes - redirect to login if not authenticated
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
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

