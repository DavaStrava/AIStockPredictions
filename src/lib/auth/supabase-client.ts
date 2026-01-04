/**
 * Supabase Client Configuration
 * 
 * Provides client-side Supabase instance for authentication.
 * Uses browser cookies for session persistence via @supabase/ssr.
 * 
 * In demo mode (without Supabase config), returns null.
 */

import { createBrowserClient, type SupabaseClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Checks if Supabase is configured on the client side
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/**
 * Creates a Supabase client for use in browser/client components.
 * Session is automatically managed via cookies.
 * 
 * Returns null in demo mode (when Supabase is not configured).
 */
export function createClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  return createBrowserClient(supabaseUrl!, supabaseAnonKey!);
}

