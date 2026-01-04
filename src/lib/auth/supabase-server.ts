/**
 * Supabase Server Client Configuration
 * 
 * Provides server-side Supabase instance for API routes and server components.
 * Handles cookie-based session management for SSR.
 * 
 * In demo mode (without Supabase config), returns null.
 */

import { createServerClient, type CookieOptions, type SupabaseClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Checks if Supabase is configured on the server side
 */
export function isSupabaseServerConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/**
 * Creates a Supabase client for use in server components and API routes.
 * Reads and writes session cookies for authentication persistence.
 * 
 * Returns null in demo mode (when Supabase is not configured).
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseServerConfigured()) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing sessions.
        }
      },
    },
  });
}

/**
 * Gets the authenticated user from the current session.
 * Returns null if not authenticated or if Supabase is not configured.
 */
export async function getAuthenticatedUser() {
  const supabase = await createServerSupabaseClient();
  
  // In demo mode, return null
  if (!supabase) {
    return null;
  }

  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

/**
 * Gets the authenticated user ID or throws an error.
 * Use this in API routes that require authentication.
 */
export async function requireAuthenticatedUserId(): Promise<string> {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user.id;
}

