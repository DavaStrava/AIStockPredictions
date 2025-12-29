/**
 * Unit tests for usePredictions hook
 * Tests initial state, fetchPredictions, and removeTile functionality
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePredictions } from '../usePredictions';

// Mock fetch globally
global.fetch = vi.fn();

describe('usePredictions', () => {
  const mockPredictionData = [
    {
      symbol: 'AAPL',
      currentPrice: 150.00,
      prediction: {
        direction: 'bullish',
        confidence: 0.85,
        targetPrice: 160.00,
        timeframe: '1 month',
        reasoning: ['Strong earnings']
      },
      signals: [],
      riskMetrics: {
        volatility: 'medium',
        support: 145.00,
        resistance: 155.00,
        stopLoss: 140.00
      }
    },
    {
      symbol: 'GOOGL',
      currentPrice: 2800.00,
      prediction: {
        direction: 'neutral',
        confidence: 0.65,
        targetPrice: 2850.00,
        timeframe: '2 weeks',
        reasoning: ['Mixed signals']
      },
      signals: [],
      riskMetrics: {
        volatility: 'low',
        support: 2750.00,
        resistance: 2900.00,
        stopLoss: 2700.00
      }
    }
  ];

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should have empty predictions array initially', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: [] })
      });

      const { result } = renderHook(() => usePredictions());

      // Initial state before fetch completes
      expect(result.current.predictions).toEqual([]);
    });

    it('should have loading true initially', () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: [] })
      });

      const { result } = renderHook(() => usePredictions());

      expect(result.current.loading).toBe(true);
    });

    it('should have searchLoading false initially', () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: [] })
      });

      const { result } = renderHook(() => usePredictions());

      expect(result.current.searchLoading).toBe(false);
    });
  });

  describe('fetchPredictions', () => {
    it('should fetch and set predictions on mount', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockPredictionData })
      });

      const { result } = renderHook(() => usePredictions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.predictions).toEqual(mockPredictionData);
      expect(global.fetch).toHaveBeenCalledWith('/api/predictions?symbols=AAPL,GOOGL,MSFT,TSLA,NVDA');
    });

    it('should set loading to false after fetch completes', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockPredictionData })
      });

      const { result } = renderHook(() => usePredictions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: false, error: 'API Error' })
      });

      const { result } = renderHook(() => usePredictions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.predictions).toEqual([]);
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => usePredictions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.predictions).toEqual([]);
    });

    it('should merge predictions when isNewSearch is true', async () => {
      const newPrediction = {
        symbol: 'MSFT',
        currentPrice: 300.00,
        prediction: {
          direction: 'bullish',
          confidence: 0.75,
          targetPrice: 320.00,
          timeframe: '1 month',
          reasoning: ['Strong cloud growth']
        },
        signals: [],
        riskMetrics: {
          volatility: 'medium',
          support: 290.00,
          resistance: 310.00,
          stopLoss: 280.00
        }
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPredictionData })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [newPrediction] })
        });

      const { result } = renderHook(() => usePredictions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Fetch new prediction with isNewSearch=true
      await act(async () => {
        await result.current.fetchPredictions('MSFT', true);
      });

      // New prediction should be at the start, existing ones preserved
      expect(result.current.predictions.length).toBe(3);
      expect(result.current.predictions[0].symbol).toBe('MSFT');
      expect(result.current.predictions[1].symbol).toBe('AAPL');
      expect(result.current.predictions[2].symbol).toBe('GOOGL');
    });
  });

  describe('removeTile', () => {
    it('should remove the correct prediction', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockPredictionData })
      });

      const { result } = renderHook(() => usePredictions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.predictions.length).toBe(2);

      act(() => {
        result.current.removeTile('AAPL');
      });

      expect(result.current.predictions.length).toBe(1);
      expect(result.current.predictions[0].symbol).toBe('GOOGL');
    });

    it('should not affect other predictions when removing one', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockPredictionData })
      });

      const { result } = renderHook(() => usePredictions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.removeTile('AAPL');
      });

      // GOOGL should remain unchanged
      expect(result.current.predictions[0]).toEqual(mockPredictionData[1]);
    });

    it('should handle removing non-existent symbol gracefully', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockPredictionData })
      });

      const { result } = renderHook(() => usePredictions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.removeTile('NONEXISTENT');
      });

      // Predictions should remain unchanged
      expect(result.current.predictions.length).toBe(2);
    });
  });

  describe('handleStockSearch', () => {
    it('should set searchLoading during search', async () => {
      const onStockSelected = vi.fn().mockResolvedValue(undefined);

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPredictionData })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [mockPredictionData[0]] })
        });

      const { result } = renderHook(() => usePredictions(onStockSelected));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Start search
      let searchPromise: Promise<void>;
      act(() => {
        searchPromise = result.current.handleStockSearch('AAPL');
      });

      // searchLoading should be true during search
      expect(result.current.searchLoading).toBe(true);

      await act(async () => {
        await searchPromise;
      });

      // searchLoading should be false after search
      expect(result.current.searchLoading).toBe(false);
    });

    it('should call onStockSelected callback after fetching', async () => {
      const onStockSelected = vi.fn().mockResolvedValue(undefined);

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPredictionData })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [mockPredictionData[0]] })
        });

      const { result } = renderHook(() => usePredictions(onStockSelected));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.handleStockSearch('AAPL');
      });

      expect(onStockSelected).toHaveBeenCalledWith('AAPL');
    });
  });
});
