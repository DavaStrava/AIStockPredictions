/**
 * User Authentication Utility
 *
 * Provides user ID resolution for API routes.
 * Uses Supabase auth in production, falls back to demo user in development.
 *
 * SECURITY: Demo mode is only enabled when:
 * - NODE_ENV is 'development' OR
 * - ALLOW_DEMO_MODE is explicitly set to 'true'
 * This prevents accidental demo mode in production if Supabase vars are missing.
 */

import { getDatabase } from '@/lib/database/connection';
import { getAuthenticatedUser } from './supabase-server';

const DEMO_USER_EMAIL = 'demo@example.com';

/** Database row type for user queries */
interface UserRow {
  id: string;
}

/** Cached demo user ID to avoid repeated database calls */
let cachedDemoUserId: string | null = null;

/** Track if we've already logged the demo mode warning */
let demoModeWarningLogged = false;

/**
 * Checks if demo mode is allowed based on environment.
 * Demo mode is only allowed in development or when explicitly enabled.
 */
function isDemoModeAllowed(): boolean {
  // Demo mode is allowed in development
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // Demo mode can be explicitly enabled via env var (for testing/staging)
  if (process.env.ALLOW_DEMO_MODE === 'true') {
    return true;
  }

  return false;
}

/**
 * Gets the user ID from the authenticated session or creates/gets a demo user.
 * In production (with Supabase), returns the authenticated user's ID.
 * In development (without Supabase config), falls back to demo user.
 *
 * SECURITY: Demo mode is blocked in production unless explicitly enabled.
 *
 * @returns The user's ID
 * @throws Error if authentication is required but not present
 */
export async function getDemoUserId(): Promise<string> {
  // Try to get authenticated user first (production mode)
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const user = await getAuthenticatedUser();
    if (user) {
      // Ensure user exists in our users table (upsert by ID)
      const db = getDatabase();
      await db.query(
        `INSERT INTO users (id, email) VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`,
        [user.id, user.email || '']
      );
      return user.id;
    }
    // If Supabase is configured but no user, throw error
    throw new Error('Authentication required');
  }

  // SECURITY: Block demo mode in production unless explicitly allowed
  if (!isDemoModeAllowed()) {
    console.error(
      'SECURITY ERROR: Demo mode blocked in production. ' +
      'Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for authentication, ' +
      'or set ALLOW_DEMO_MODE=true if this is intentional (not recommended for production).'
    );
    throw new Error('Authentication service not configured');
  }

  // Log warning once when demo mode is used
  if (!demoModeWarningLogged) {
    console.warn(
      'WARNING: Running in demo mode with shared demo user. ' +
      'This should only be used for local development.'
    );
    demoModeWarningLogged = true;
  }

  // Development mode: use demo user
  return getDemoUserIdLocal();
}

/**
 * Gets or creates a demo user for local development.
 * Uses INSERT ... ON CONFLICT to handle race conditions safely.
 * Results are cached in memory for performance.
 * 
 * @returns The demo user's ID
 * @throws Error if database operation fails
 */
async function getDemoUserIdLocal(): Promise<string> {
  if (cachedDemoUserId) {
    return cachedDemoUserId;
  }

  const db = getDatabase();

  try {
    const result = await db.query<UserRow>(
      `INSERT INTO users (email) VALUES ($1)
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
       RETURNING id`,
      [DEMO_USER_EMAIL]
    );

    if (!result.rows[0]?.id) {
      throw new Error('Failed to get or create demo user');
    }

    cachedDemoUserId = result.rows[0].id;
    return cachedDemoUserId;
  } catch (error) {
    console.error('Demo user creation failed:', error);
    throw new Error('Authentication service unavailable');
  }
}

/**
 * Clears the cached demo user ID.
 * Useful for testing or when the user might have been deleted.
 */
export function clearDemoUserCache(): void {
  cachedDemoUserId = null;
}
