/**
 * Supabase Middleware Utilities
 * 
 * Provides utilities for session refresh in Next.js middleware.
 * In development mode (without Supabase config), skips authentication.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Checks if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/**
 * Updates the session cookies and returns the user if authenticated.
 * Used in Next.js middleware to refresh sessions on every request.
 * 
 * In development mode (without Supabase config), returns null user
 * to allow the app to work without authentication.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Skip Supabase auth if not configured (development/demo mode)
  if (!isSupabaseConfigured()) {
    return { user: null, response: supabaseResponse, isDemoMode: true };
  }

  const supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh session if exists
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user, response: supabaseResponse, isDemoMode: false };
}

