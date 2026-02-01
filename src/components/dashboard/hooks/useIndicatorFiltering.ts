/**
 * useIndicatorFiltering Hook
 *
 * Provides utilities for filtering technical indicator signals.
 * Extracts only the latest signal for each indicator type.
 */

import { useCallback } from 'react';
import { TechnicalSignal } from '@/lib/technical-analysis/types';

export interface UseIndicatorFilteringReturn {
  /** Gets the latest signal for each unique indicator type */
  getLatestSignals: (signals: TechnicalSignal[]) => TechnicalSignal[];
}

/**
 * Custom hook for filtering technical indicator signals.
 */
export function useIndicatorFiltering(): UseIndicatorFilteringReturn {
  /**
   * Filters signals to return only the most recent signal for each indicator type.
   * This prevents duplicate indicators from cluttering the UI.
   */
  const getLatestSignals = useCallback((signals: TechnicalSignal[]): TechnicalSignal[] => {
    const latestSignals = new Map<string, TechnicalSignal>();

    signals.forEach(signal => {
      const existing = latestSignals.get(signal.indicator);
      if (!existing || new Date(signal.timestamp) > new Date(existing.timestamp)) {
        latestSignals.set(signal.indicator, signal);
      }
    });

    return Array.from(latestSignals.values());
  }, []);

  return {
    getLatestSignals,
  };
}
