/**
 * usePredictionStyles Hook
 *
 * Provides consistent styling utilities for prediction direction states.
 * Handles color mapping for bullish/bearish/neutral states with dark mode support.
 */

import { useCallback } from 'react';

export type PredictionDirection = 'bullish' | 'bearish' | 'neutral';

export interface UsePredictionStylesReturn {
  /** Get text color class for a direction */
  getDirectionColor: (direction: string) => string;
  /** Get background gradient and border classes for a direction */
  getDirectionBg: (direction: string) => string;
}

/**
 * Custom hook for prediction direction styling.
 * Returns memoized style utility functions.
 */
export function usePredictionStyles(): UsePredictionStylesReturn {
  /**
   * Maps prediction direction to text color classes.
   * Uses improved contrast ratios for accessibility (700/300 scale).
   */
  const getDirectionColor = useCallback((direction: string): string => {
    switch (direction) {
      case 'bullish':
        return 'text-green-700 dark:text-green-300';
      case 'bearish':
        return 'text-red-700 dark:text-red-300';
      case 'neutral':
        return 'text-yellow-700 dark:text-yellow-300';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  }, []);

  /**
   * Maps prediction direction to background gradient classes.
   * Creates sophisticated visual feedback with gradients, opacity, and hover states.
   */
  const getDirectionBg = useCallback((direction: string): string => {
    switch (direction) {
      case 'bullish':
        return 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 border-green-300 dark:border-green-600 hover:from-green-200 hover:to-green-300 dark:hover:from-green-800/40 dark:hover:to-green-700/40 hover:border-green-400 dark:hover:border-green-500';
      case 'bearish':
        return 'bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 border-red-300 dark:border-red-600 hover:from-red-200 hover:to-red-300 dark:hover:from-red-800/40 dark:hover:to-red-700/40 hover:border-red-400 dark:hover:border-red-500';
      case 'neutral':
        return 'bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 border-yellow-300 dark:border-yellow-600 hover:from-yellow-200 hover:to-yellow-300 dark:hover:from-yellow-800/40 dark:hover:to-yellow-700/40 hover:border-yellow-400 dark:hover:border-yellow-500';
      default:
        return 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900/30 dark:to-gray-800/30 border-gray-300 dark:border-gray-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-800/40 dark:hover:to-gray-700/40 hover:border-gray-400 dark:hover:border-gray-500';
    }
  }, []);

  return {
    getDirectionColor,
    getDirectionBg,
  };
}
