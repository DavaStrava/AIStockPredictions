/**
 * Demo User Authentication Utility
 * 
 * Provides demo user management for development purposes.
 * In production, this would be replaced with proper authentication.
 */

import { getDatabase } from '@/lib/database/connection';

const DEMO_USER_EMAIL = 'demo@example.com';

/** Database row type for user queries */
interface UserRow {
  id: string;
}

/** Cached demo user ID to avoid repeated database calls */
let cachedDemoUserId: string | null = null;

/**
 * Gets or creates a demo user for development purposes.
 * Uses INSERT ... ON CONFLICT to handle race conditions safely.
 * Results are cached in memory for performance.
 * 
 * @returns The demo user's ID
 * @throws Error if database operation fails
 */
export async function getDemoUserId(): Promise<string> {
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
