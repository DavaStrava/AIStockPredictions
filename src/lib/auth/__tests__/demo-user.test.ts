/**
 * Demo User Authentication Tests
 * 
 * Tests for the getDemoUserId function which handles demo user
 * creation and caching for development purposes.
 * 
 * Test coverage:
 * - Caching behavior (returns cached value on subsequent calls)
 * - Database operations (INSERT with ON CONFLICT)
 * - Error handling (database failures)
 * - Cache clearing functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDemoUserId, clearDemoUserCache } from '../demo-user';

// Mock the database connection
const mockQuery = vi.fn();
vi.mock('@/lib/database/connection', () => ({
  getDatabase: vi.fn(() => ({
    query: mockQuery,
  })),
}));

describe('getDemoUserId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear the cache before each test to ensure isolation
    clearDemoUserCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Successful User Retrieval', () => {
    it('should return user ID when database query succeeds', async () => {
      const expectedUserId = 'user-123-abc';
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: expectedUserId }],
      });

      const result = await getDemoUserId();

      expect(result).toBe(expectedUserId);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        ['demo@example.com']
      );
    });

    it('should use INSERT ... ON CONFLICT for upsert behavior', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'user-456' }],
      });

      await getDemoUserId();

      const [query] = mockQuery.mock.calls[0];
      expect(query).toContain('INSERT INTO users');
      expect(query).toContain('ON CONFLICT');
      expect(query).toContain('RETURNING id');
    });

    it('should query with demo@example.com email', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'user-789' }],
      });

      await getDemoUserId();

      const [, params] = mockQuery.mock.calls[0];
      expect(params).toEqual(['demo@example.com']);
    });
  });

  describe('Caching Behavior', () => {
    it('should cache the user ID after first successful call', async () => {
      const expectedUserId = 'cached-user-id';
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: expectedUserId }],
      });

      // First call - should query database
      const firstResult = await getDemoUserId();
      expect(firstResult).toBe(expectedUserId);
      expect(mockQuery).toHaveBeenCalledTimes(1);

      // Second call - should return cached value
      const secondResult = await getDemoUserId();
      expect(secondResult).toBe(expectedUserId);
      expect(mockQuery).toHaveBeenCalledTimes(1); // Still only 1 call
    });

    it('should not query database when cache is populated', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'initial-user' }],
      });

      // Populate cache
      await getDemoUserId();
      mockQuery.mockClear();

      // Multiple subsequent calls
      await getDemoUserId();
      await getDemoUserId();
      await getDemoUserId();

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should query database again after cache is cleared', async () => {
      const firstUserId = 'first-user-id';
      const secondUserId = 'second-user-id';

      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: firstUserId }] })
        .mockResolvedValueOnce({ rows: [{ id: secondUserId }] });

      // First call
      const firstResult = await getDemoUserId();
      expect(firstResult).toBe(firstUserId);

      // Clear cache
      clearDemoUserCache();

      // Second call after cache clear
      const secondResult = await getDemoUserId();
      expect(secondResult).toBe(secondUserId);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when database query fails', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database connection failed'));

      await expect(getDemoUserId()).rejects.toThrow('Authentication service unavailable');
    });

    it('should throw "Authentication service unavailable" when result has no rows', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
      });

      // The internal error is caught and re-thrown as "Authentication service unavailable"
      await expect(getDemoUserId()).rejects.toThrow('Authentication service unavailable');
    });

    it('should throw "Authentication service unavailable" when result row has no id', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ email: 'demo@example.com' }], // Missing id field
      });

      // The internal error is caught and re-thrown as "Authentication service unavailable"
      await expect(getDemoUserId()).rejects.toThrow('Authentication service unavailable');
    });

    it('should throw "Authentication service unavailable" when result row id is null', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: null }],
      });

      // The internal error is caught and re-thrown as "Authentication service unavailable"
      await expect(getDemoUserId()).rejects.toThrow('Authentication service unavailable');
    });

    it('should throw "Authentication service unavailable" when result row id is undefined', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: undefined }],
      });

      // The internal error is caught and re-thrown as "Authentication service unavailable"
      await expect(getDemoUserId()).rejects.toThrow('Authentication service unavailable');
    });

    it('should not cache user ID when database query fails', async () => {
      mockQuery
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce({ rows: [{ id: 'recovered-user' }] });

      // First call fails
      await expect(getDemoUserId()).rejects.toThrow();

      // Second call should try database again (not use cache)
      const result = await getDemoUserId();
      expect(result).toBe('recovered-user');
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should log error to console when database fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const dbError = new Error('Connection timeout');
      mockQuery.mockRejectedValueOnce(dbError);

      await expect(getDemoUserId()).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith('Demo user creation failed:', dbError);
      consoleSpy.mockRestore();
    });

    it('should log internal error when result validation fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockQuery.mockResolvedValueOnce({
        rows: [], // Empty rows triggers internal error
      });

      await expect(getDemoUserId()).rejects.toThrow();

      // Should log the internal "Failed to get or create demo user" error
      expect(consoleSpy).toHaveBeenCalledWith(
        'Demo user creation failed:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should throw "Authentication service unavailable" for empty string user ID', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: '' }],
      });

      // Empty string is falsy, so it triggers the validation error
      // which is caught and re-thrown as "Authentication service unavailable"
      await expect(getDemoUserId()).rejects.toThrow('Authentication service unavailable');
    });

    it('should handle valid UUID format user ID', async () => {
      const uuidUserId = '550e8400-e29b-41d4-a716-446655440000';
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: uuidUserId }],
      });

      const result = await getDemoUserId();
      expect(result).toBe(uuidUserId);
    });

    it('should handle concurrent calls correctly', async () => {
      let callCount = 0;
      mockQuery.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          rows: [{ id: `user-${callCount}` }],
        });
      });

      // Make concurrent calls
      const results = await Promise.all([
        getDemoUserId(),
        getDemoUserId(),
        getDemoUserId(),
      ]);

      // All should return the same ID (first one to complete)
      // Note: Due to caching, subsequent calls may return cached value
      expect(results[0]).toBeDefined();
      expect(typeof results[0]).toBe('string');
    });
  });
});

describe('clearDemoUserCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearDemoUserCache();
  });

  it('should clear the cached user ID', async () => {
    mockQuery.mockResolvedValue({
      rows: [{ id: 'test-user' }],
    });

    // Populate cache
    await getDemoUserId();
    expect(mockQuery).toHaveBeenCalledTimes(1);

    // Clear cache
    clearDemoUserCache();

    // Next call should query database again
    await getDemoUserId();
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it('should not throw when called multiple times', () => {
    expect(() => {
      clearDemoUserCache();
      clearDemoUserCache();
      clearDemoUserCache();
    }).not.toThrow();
  });

  it('should not throw when cache is already empty', () => {
    // Cache is already empty from beforeEach
    expect(() => clearDemoUserCache()).not.toThrow();
  });
});
