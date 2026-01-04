/**
 * OAuth Callback Route
 * 
 * Handles the OAuth callback from Supabase Auth.
 * Exchanges the auth code for a session and redirects to the app.
 * 
 * In demo mode, redirects directly to the app.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const redirect = searchParams.get('redirect') || '/';

  // In demo mode, redirect directly to the app
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL(redirect, origin));
  }

  if (code) {
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
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return NextResponse.redirect(new URL(redirect, origin));
    }
  }

  // Return to login page with error
  return NextResponse.redirect(new URL('/login?error=auth_failed', origin));
}

