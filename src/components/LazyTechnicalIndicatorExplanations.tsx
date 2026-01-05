'use client';

import { lazy, Suspense, useMemo, useState, useEffect } from 'react';
import { TechnicalSignal } from '@/lib/technical-analysis/types';
import { MarketContext } from '@/lib/technical-analysis/explanations';
import { LazyTechnicalIndicatorExplanationsProps } from '@/types';

/**
 * Loading skeleton for technical indicator explanations
 */
const ExplanationsSkeleton = () => {
  return (
    <div data-testid="explanations-skeleton" className="space-responsive-card">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-5">
        {[1, 2, 3].map((i) => (
          <div 
            key={i}
            className="padding-responsive-card border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
          >
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-3 animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Lazy-loaded TechnicalIndicatorExplanations component
 */
const TechnicalIndicatorExplanations = lazy(() => 
  import('./TechnicalIndicatorExplanations')
);

/**
 * Cache for generated explanations
 * Key format: `${symbol}-${indicatorNames}-${currentPrice}`
 */
const explanationsCache = new Map<string, {
  data: any;
  timestamp: number;
}>();

/**
 * Cache TTL in milliseconds (5 minutes)
 */
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Generate cache key from props
 */
function generateCacheKey(
  symbol: string,
  indicators: TechnicalSignal[],
  currentPrice: number
): string {
  const indicatorNames = indicators
    .map(i => `${i.indicator}-${i.value.toFixed(2)}`)
    .sort()
    .join('|');
  return `${symbol}-${indicatorNames}-${currentPrice.toFixed(2)}`;
}

/**
 * Get cached explanations if available and not expired
 */
function getCachedExplanations(cacheKey: string): any | null {
  const cached = explanationsCache.get(cacheKey);
  
  if (!cached) {
    return null;
  }
  
  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    // Cache expired, remove it
    explanationsCache.delete(cacheKey);
    return null;
  }
  
  return cached.data;
}

/**
 * Set cached explanations
 */
function setCachedExplanations(cacheKey: string, data: any): void {
  explanationsCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  
  // Limit cache size to prevent memory issues
  if (explanationsCache.size > 50) {
    // Remove oldest entries
    const entries = Array.from(explanationsCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = entries.slice(0, 10);
    toRemove.forEach(([key]) => explanationsCache.delete(key));
  }
}

/**
 * LazyTechnicalIndicatorExplanations Component
 * 
 * Provides lazy loading and caching for technical indicator explanations:
 * - Lazy loads the explanation component to reduce initial bundle size
 * - Caches generated explanations to avoid redundant computation
 * - Shows skeleton loading state during initial load
 * - Optimizes performance with large datasets
 */
export default function LazyTechnicalIndicatorExplanations({
  indicators,
  symbol,
  currentPrice,
  marketContext
}: LazyTechnicalIndicatorExplanationsProps) {
  const [shouldLoad, setShouldLoad] = useState(false);
  
  // Generate cache key
  const cacheKey = useMemo(
    () => generateCacheKey(symbol, indicators, currentPrice),
    [symbol, indicators, currentPrice]
  );
  
  // Check if we have cached data
  const cachedData = useMemo(
    () => getCachedExplanations(cacheKey),
    [cacheKey]
  );
  
  // Trigger lazy loading on mount or when cache is empty
  useEffect(() => {
    if (!cachedData) {
      // Small delay to prioritize critical rendering
      const timer = setTimeout(() => {
        setShouldLoad(true);
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      setShouldLoad(true);
    }
  }, [cachedData]);
  
  // If we have cached data and component is loaded, use it
  if (cachedData && shouldLoad) {
    return (
      <Suspense fallback={<ExplanationsSkeleton />}>
        <TechnicalIndicatorExplanations
          indicators={indicators}
          symbol={symbol}
          currentPrice={currentPrice}
          marketContext={marketContext}
        />
      </Suspense>
    );
  }
  
  // If not loaded yet, show skeleton
  if (!shouldLoad) {
    return <ExplanationsSkeleton />;
  }
  
  // Load component and cache results
  return (
    <Suspense fallback={<ExplanationsSkeleton />}>
      <TechnicalIndicatorExplanations
        indicators={indicators}
        symbol={symbol}
        currentPrice={currentPrice}
        marketContext={marketContext}
      />
    </Suspense>
  );
}

/**
 * Export cache utilities for testing and manual cache management
 */
export const cacheUtils = {
  clear: () => explanationsCache.clear(),
  size: () => explanationsCache.size,
  has: (key: string) => explanationsCache.has(key),
  get: getCachedExplanations,
  set: setCachedExplanations
};
