/**
 * useSearch Hook
 *
 * Provides stock search functionality with React Query.
 * Includes debouncing for better UX and request deduplication.
 */

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, SearchResult } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-client';

/**
 * Return type for the useSearch hook
 */
export interface UseSearchReturn {
  query: string;
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  setQuery: (query: string) => void;
  clearSearch: () => void;
}

/**
 * Hook for stock search with debouncing.
 *
 * @param debounceMs - Debounce delay in milliseconds (default: 300)
 * @param limit - Maximum number of results (default: 10)
 * @returns UseSearchReturn - Search state and functions
 */
export function useSearch(debounceMs = 300, limit = 10): UseSearchReturn {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Search query - only runs when debouncedQuery has at least 1 character
  const searchQuery = useQuery({
    queryKey: queryKeys.search.stocks(debouncedQuery, limit),
    queryFn: () => api.search.stocks(debouncedQuery, limit),
    enabled: debouncedQuery.length >= 1,
    // Keep results while typing
    placeholderData: (previousData) => previousData,
  });

  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
  }, []);

  return {
    query,
    results: searchQuery.data ?? [],
    loading: searchQuery.isLoading || searchQuery.isFetching,
    error: searchQuery.error?.message ?? null,
    setQuery,
    clearSearch,
  };
}

/**
 * Hook for direct search (no debouncing)
 */
export function useSearchQuery(query: string, limit = 10) {
  return useQuery({
    queryKey: queryKeys.search.stocks(query, limit),
    queryFn: () => api.search.stocks(query, limit),
    enabled: query.length >= 1,
  });
}

/**
 * Hook for prefetching search results (useful for autocomplete)
 */
export function usePrefetchSearch() {
  const queryClient = useQueryClient();

  return useCallback(
    (query: string, limit = 10) => {
      if (query.length >= 1) {
        queryClient.prefetchQuery({
          queryKey: queryKeys.search.stocks(query, limit),
          queryFn: () => api.search.stocks(query, limit),
        });
      }
    },
    [queryClient]
  );
}
