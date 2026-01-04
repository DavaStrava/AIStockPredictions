/**
 * Authentication Module - Barrel Export
 * 
 * Exports all authentication utilities for the application.
 */

export { createClient, isSupabaseConfigured } from './supabase-client';
export { 
  createServerSupabaseClient, 
  getAuthenticatedUser, 
  requireAuthenticatedUserId 
} from './supabase-server';
export { updateSession, isSupabaseConfigured as isSupabaseServerConfigured } from './supabase-middleware';

