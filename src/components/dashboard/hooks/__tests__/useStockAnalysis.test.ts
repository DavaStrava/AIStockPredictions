/**
 * Unit tests for useStockAnalysis hook
 * Tests initial state, fetchDetailedAnalysis, and clearAnalysis functionality
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useStockAnalysis } from '../useStockAnalysis';

// Mock fetch globally
global.fetch = vi.fn();

describe('useStockAnalysis', () => {
  const mockAnalysisData = {
    symbol: 'AAPL',
    timestamp: new Date('2024-01-15'),
    signals: [
      {
        indicator: 'RSI',
        signal: 'buy',
        strength: 0.7,
        value: 35,
        timestamp: new Date('2024-01-15'),
        description: 'RSI indicates oversold conditions'
      }
    ],
    indicators: {
      rsi: [{ date: new Date('2024-01-15'), value: 35, overbought: false, oversold: true }]
    },
    summary: {
      overall: 'bullish',
      strength: 0.7,
      confidence: 0.8,
      trendDirection: 'up',
      momentum: 'increasing',
      volatility: 'medium'
    }
  };

  const mockPriceData = [
    { date: '2024-01-01', open: 145, high: 150, low: 144, close: 148, volume: 1000000 },
    { date: '2024-01-02', open: 148, high: 152, low: 147, close: 150, volume: 1100000 }
  ];

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should have empty selectedStock initially', () => {
      const { result } = renderHook(() => useStockAnalysis());
      expect(result.current.selectedStock).toBe('');
    });

    it('should have null analysis initially', () => {
      const { result } = renderHook(() => useStockAnalysis());
      expect(result.current.analysis).toBeNull();
    });

    it('should have empty priceData array initially', () => {
      const { result } = renderHook(() => useStockAnalysis());
      expect(result.current.priceData).toEqual([]);
    });

    it('should have null selectedIndex initially', () => {
      const { result } = renderHook(() => useStockAnalysis());
      expect(result.current.selectedIndex).toBeNull();
    });
  });

  describe('fetchDetailedAnalysis', () => {
    it('should fetch and set analysis data correctly', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockAnalysisData,
          priceData: mockPriceData
        })
      });

      const { result } = renderHook(() => useStockAnalysis());

      await act(async () => {
        await result.current.fetchDetailedAnalysis('AAPL');
      });

      expect(result.current.selectedStock).toBe('AAPL');
      expect(result.current.analysis).toEqual(mockAnalysisData);
      expect(result.current.priceData.length).toBe(2);
      expect(global.fetch).toHaveBeenCalledWith('/api/analysis?symbol=AAPL&period=1year');
    });

    it('should convert date strings to Date objects in priceData', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockAnalysisData,
          priceData: mockPriceData
        })
      });

      const { result } = renderHook(() => useStockAnalysis());

      await act(async () => {
        await result.current.fetchDetailedAnalysis('AAPL');
      });

      expect(result.current.priceData[0].date).toBeInstanceOf(Date);
      expect(result.current.priceData[1].date).toBeInstanceOf(Date);
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: false, error: 'Analysis failed' })
      });

      const { result } = renderHook(() => useStockAnalysis());

      await act(async () => {
        await result.current.fetchDetailedAnalysis('INVALID');
      });

      expect(result.current.analysis).toBeNull();
      expect(result.current.priceData).toEqual([]);
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useStockAnalysis());

      await act(async () => {
        await result.current.fetchDetailedAnalysis('AAPL');
      });

      expect(result.current.analysis).toBeNull();
      expect(result.current.priceData).toEqual([]);
    });

    it('should handle HTTP errors gracefully', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500
      });

      const { result } = renderHook(() => useStockAnalysis());

      await act(async () => {
        await result.current.fetchDetailedAnalysis('AAPL');
      });

      expect(result.current.analysis).toBeNull();
      expect(result.current.priceData).toEqual([]);
    });

    it('should update state when switching between stocks', async () => {
      const mockAnalysisData2 = {
        ...mockAnalysisData,
        symbol: 'GOOGL'
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: mockAnalysisData,
            priceData: mockPriceData
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: mockAnalysisData2,
            priceData: mockPriceData
          })
        });

      const { result } = renderHook(() => useStockAnalysis());

      await act(async () => {
        await result.current.fetchDetailedAnalysis('AAPL');
      });

      expect(result.current.selectedStock).toBe('AAPL');

      await act(async () => {
        await result.current.fetchDetailedAnalysis('GOOGL');
      });

      expect(result.current.selectedStock).toBe('GOOGL');
      expect(result.current.analysis?.symbol).toBe('GOOGL');
    });
  });

  describe('clearAnalysis', () => {
    it('should reset all analysis state', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockAnalysisData,
          priceData: mockPriceData
        })
      });

      const { result } = renderHook(() => useStockAnalysis());

      // First, load some analysis data
      await act(async () => {
        await result.current.fetchDetailedAnalysis('AAPL');
      });

      expect(result.current.selectedStock).toBe('AAPL');
      expect(result.current.analysis).not.toBeNull();
      expect(result.current.priceData.length).toBeGreaterThan(0);

      // Now clear the analysis
      act(() => {
        result.current.clearAnalysis();
      });

      expect(result.current.selectedStock).toBe('');
      expect(result.current.analysis).toBeNull();
      expect(result.current.priceData).toEqual([]);
    });

    it('should not affect selectedIndex when clearing analysis', async () => {
      const { result } = renderHook(() => useStockAnalysis());

      // Set selectedIndex
      act(() => {
        result.current.handleIndexClick('^GSPC');
      });

      expect(result.current.selectedIndex).toBe('^GSPC');

      // Clear analysis
      act(() => {
        result.current.clearAnalysis();
      });

      // selectedIndex should remain unchanged
      expect(result.current.selectedIndex).toBe('^GSPC');
    });
  });

  describe('handleIndexClick', () => {
    it('should set selectedIndex correctly', () => {
      const { result } = renderHook(() => useStockAnalysis());

      act(() => {
        result.current.handleIndexClick('^GSPC');
      });

      expect(result.current.selectedIndex).toBe('^GSPC');
    });

    it('should update selectedIndex when clicking different indices', () => {
      const { result } = renderHook(() => useStockAnalysis());

      act(() => {
        result.current.handleIndexClick('^GSPC');
      });

      expect(result.current.selectedIndex).toBe('^GSPC');

      act(() => {
        result.current.handleIndexClick('^DJI');
      });

      expect(result.current.selectedIndex).toBe('^DJI');
    });
  });

  describe('closeIndexAnalysis', () => {
    it('should set selectedIndex to null', () => {
      const { result } = renderHook(() => useStockAnalysis());

      // First set an index
      act(() => {
        result.current.handleIndexClick('^GSPC');
      });

      expect(result.current.selectedIndex).toBe('^GSPC');

      // Close the index analysis
      act(() => {
        result.current.closeIndexAnalysis();
      });

      expect(result.current.selectedIndex).toBeNull();
    });

    it('should not affect analysis state when closing index', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockAnalysisData,
          priceData: mockPriceData
        })
      });

      const { result } = renderHook(() => useStockAnalysis());

      // Load analysis data
      await act(async () => {
        await result.current.fetchDetailedAnalysis('AAPL');
      });

      // Set index
      act(() => {
        result.current.handleIndexClick('^GSPC');
      });

      // Close index
      act(() => {
        result.current.closeIndexAnalysis();
      });

      // Analysis state should remain unchanged
      expect(result.current.selectedStock).toBe('AAPL');
      expect(result.current.analysis).not.toBeNull();
      expect(result.current.priceData.length).toBeGreaterThan(0);
    });
  });
});
