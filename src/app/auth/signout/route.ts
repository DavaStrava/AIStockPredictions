/**
 * Signout Route
 * 
 * Handles user logout by clearing the Supabase session.
 * In demo mode, just redirects to the login page.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST() {
  // In demo mode, just redirect to login (or home)
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL('/', appUrl));
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
          // Server Component context
        }
      },
    },
  });

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL('/login', appUrl));
}

