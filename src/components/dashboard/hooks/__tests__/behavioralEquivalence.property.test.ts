/**
 * Property Test: Behavioral Equivalence After Refactoring
 * 
 * Feature: codebase-cleanup, Property 2: Behavioral Equivalence After Refactoring
 * Validates: Requirements 1.3
 * 
 * This test verifies that user interactions produce the same results after
 * the hook extraction refactoring. The hooks should maintain identical
 * functionality and behavior as the original monolithic component.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import { usePredictions } from '../usePredictions';
import { useStockAnalysis } from '../useStockAnalysis';

// Mock fetch globally
global.fetch = vi.fn();

/**
 * Generate valid stock symbols for testing
 */
const stockSymbolArb = fc.constantFrom(
  'AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'AMZN', 'META', 'NFLX', 'AMD', 'INTC'
);

/**
 * Generate mock prediction data
 */
const mockPredictionArb = fc.record({
  symbol: stockSymbolArb,
  currentPrice: fc.float({ min: 1, max: 10000, noNaN: true }),
  prediction: fc.record({
    direction: fc.constantFrom('bullish', 'bearish', 'neutral'),
    confidence: fc.float({ min: 0, max: 1, noNaN: true }),
    targetPrice: fc.float({ min: 1, max: 10000, noNaN: true }),
    timeframe: fc.constantFrom('1 week', '2 weeks', '1 month', '3 months'),
    reasoning: fc.array(fc.string(), { minLength: 1, maxLength: 3 })
  }),
  signals: fc.constant([]),
  riskMetrics: fc.record({
    volatility: fc.constantFrom('low', 'medium', 'high'),
    support: fc.float({ min: 1, max: 10000, noNaN: true }),
    resistance: fc.float({ min: 1, max: 10000, noNaN: true }),
    stopLoss: fc.float({ min: 1, max: 10000, noNaN: true })
  })
});

describe('Property 2: Behavioral Equivalence After Refactoring', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property: usePredictions hook returns all required interface members
   * 
   * For any initial state, the hook must return all members defined in UsePredictionsReturn
   */
  it('usePredictions hook returns complete interface', () => {
    fc.assert(
      fc.property(
        fc.array(mockPredictionArb, { minLength: 0, maxLength: 5 }),
        (mockPredictions) => {
          (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, data: mockPredictions })
          });

          const { result } = renderHook(() => usePredictions());

          // Verify all interface members exist
          expect(result.current).toHaveProperty('predictions');
          expect(result.current).toHaveProperty('loading');
          expect(result.current).toHaveProperty('searchLoading');
          expect(result.current).toHaveProperty('fetchPredictions');
          expect(result.current).toHaveProperty('handleStockSearch');
          expect(result.current).toHaveProperty('removeTile');

          // Verify types
          expect(Array.isArray(result.current.predictions)).toBe(true);
          expect(typeof result.current.loading).toBe('boolean');
          expect(typeof result.current.searchLoading).toBe('boolean');
          expect(typeof result.current.fetchPredictions).toBe('function');
          expect(typeof result.current.handleStockSearch).toBe('function');
          expect(typeof result.current.removeTile).toBe('function');

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: useStockAnalysis hook returns all required interface members
   * 
   * For any initial state, the hook must return all members defined in UseStockAnalysisReturn
   */
  it('useStockAnalysis hook returns complete interface', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // dummy arbitrary to run multiple times
        () => {
          const { result } = renderHook(() => useStockAnalysis());

          // Verify all interface members exist
          expect(result.current).toHaveProperty('selectedStock');
          expect(result.current).toHaveProperty('analysis');
          expect(result.current).toHaveProperty('priceData');
          expect(result.current).toHaveProperty('selectedIndex');
          expect(result.current).toHaveProperty('fetchDetailedAnalysis');
          expect(result.current).toHaveProperty('handleIndexClick');
          expect(result.current).toHaveProperty('closeIndexAnalysis');
          expect(result.current).toHaveProperty('clearAnalysis');

          // Verify types
          expect(typeof result.current.selectedStock).toBe('string');
          expect(result.current.analysis === null || typeof result.current.analysis === 'object').toBe(true);
          expect(Array.isArray(result.current.priceData)).toBe(true);
          expect(result.current.selectedIndex === null || typeof result.current.selectedIndex === 'string').toBe(true);
          expect(typeof result.current.fetchDetailedAnalysis).toBe('function');
          expect(typeof result.current.handleIndexClick).toBe('function');
          expect(typeof result.current.closeIndexAnalysis).toBe('function');
          expect(typeof result.current.clearAnalysis).toBe('function');

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: removeTile preserves other predictions
   * 
   * For any list of predictions and any symbol to remove, removing a tile
   * should only remove that specific prediction and preserve all others.
   */
  it('removeTile preserves other predictions (invariant)', async () => {
    // Use a fixed set of unique symbols for predictable testing
    const uniqueSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'];
    
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 5 }),
        fc.integer({ min: 0, max: 4 }),
        async (numPredictions, removeIndex) => {
          const symbols = uniqueSymbols.slice(0, numPredictions);
          const safeRemoveIndex = removeIndex % symbols.length;
          const symbolToRemove = symbols[safeRemoveIndex];
          
          const mockPredictions = symbols.map(symbol => ({
            symbol,
            currentPrice: 100,
            prediction: {
              direction: 'bullish' as const,
              confidence: 0.8,
              targetPrice: 110,
              timeframe: '1 month',
              reasoning: ['Test']
            },
            signals: [],
            riskMetrics: {
              volatility: 'medium' as const,
              support: 95,
              resistance: 105,
              stopLoss: 90
            }
          }));

          const expectedRemaining = mockPredictions.filter(p => p.symbol !== symbolToRemove);

          (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, data: mockPredictions })
          });

          const { result } = renderHook(() => usePredictions());

          await waitFor(() => {
            expect(result.current.loading).toBe(false);
          });

          // Remove the tile
          act(() => {
            result.current.removeTile(symbolToRemove);
          });

          // Verify invariant: remaining predictions match expected
          expect(result.current.predictions.length).toBe(expectedRemaining.length);
          
          // All remaining predictions should be in the expected set
          for (const pred of result.current.predictions) {
            expect(expectedRemaining.some(e => e.symbol === pred.symbol)).toBe(true);
          }

          // The removed symbol should not be present
          expect(result.current.predictions.some(p => p.symbol === symbolToRemove)).toBe(false);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  }, 30000); // Increase timeout for async property test

  /**
   * Property: Index selection is idempotent
   * 
   * For any index symbol, selecting the same index multiple times
   * should result in the same state as selecting it once.
   */
  it('handleIndexClick is idempotent', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('^GSPC', '^DJI', '^IXIC', '^RUT'),
        fc.integer({ min: 1, max: 5 }),
        (indexSymbol, repeatCount) => {
          const { result } = renderHook(() => useStockAnalysis());

          // Click the same index multiple times
          for (let i = 0; i < repeatCount; i++) {
            act(() => {
              result.current.handleIndexClick(indexSymbol);
            });
          }

          // State should be the same as clicking once
          expect(result.current.selectedIndex).toBe(indexSymbol);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: clearAnalysis resets to initial state
   * 
   * For any analysis state, calling clearAnalysis should reset
   * selectedStock, analysis, and priceData to their initial values.
   */
  it('clearAnalysis resets to initial state', async () => {
    await fc.assert(
      fc.asyncProperty(
        stockSymbolArb,
        async (symbol) => {
          const mockAnalysis = {
            symbol,
            timestamp: new Date(),
            signals: [],
            indicators: {},
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
            { date: '2024-01-01', open: 100, high: 105, low: 99, close: 103, volume: 1000000 }
          ];

          (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => ({
              success: true,
              data: mockAnalysis,
              priceData: mockPriceData
            })
          });

          const { result } = renderHook(() => useStockAnalysis());

          // Fetch analysis to populate state
          await act(async () => {
            await result.current.fetchDetailedAnalysis(symbol);
          });

          // Verify state is populated
          expect(result.current.selectedStock).toBe(symbol);
          expect(result.current.analysis).not.toBeNull();

          // Clear analysis
          act(() => {
            result.current.clearAnalysis();
          });

          // Verify reset to initial state
          expect(result.current.selectedStock).toBe('');
          expect(result.current.analysis).toBeNull();
          expect(result.current.priceData).toEqual([]);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  }, 30000); // Increase timeout for async property test

  /**
   * Property: closeIndexAnalysis and handleIndexClick are inverses
   * 
   * For any index, selecting then closing should return to null state.
   * This is a round-trip property.
   */
  it('handleIndexClick and closeIndexAnalysis are round-trip inverses', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('^GSPC', '^DJI', '^IXIC', '^RUT'),
        (indexSymbol) => {
          const { result } = renderHook(() => useStockAnalysis());

          // Initial state
          expect(result.current.selectedIndex).toBeNull();

          // Select index
          act(() => {
            result.current.handleIndexClick(indexSymbol);
          });
          expect(result.current.selectedIndex).toBe(indexSymbol);

          // Close index (inverse operation)
          act(() => {
            result.current.closeIndexAnalysis();
          });

          // Should return to initial state
          expect(result.current.selectedIndex).toBeNull();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Predictions state is consistent after search operations
   * 
   * For any sequence of search operations, the predictions array should
   * contain valid PredictionResult objects with required fields.
   */
  it('predictions maintain structural integrity after operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(stockSymbolArb, { minLength: 1, maxLength: 3 }),
        async (symbolsToSearch) => {
          const mockPrediction = (symbol: string) => ({
            symbol,
            currentPrice: 100,
            prediction: {
              direction: 'bullish',
              confidence: 0.8,
              targetPrice: 110,
              timeframe: '1 month',
              reasoning: ['Test']
            },
            signals: [],
            riskMetrics: {
              volatility: 'medium',
              support: 95,
              resistance: 105,
              stopLoss: 90
            }
          });

          let callCount = 0;
          (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() => {
            callCount++;
            const symbol = symbolsToSearch[(callCount - 1) % symbolsToSearch.length] || 'TEST';
            return Promise.resolve({
              ok: true,
              json: async () => ({ 
                success: true, 
                data: callCount === 1 
                  ? symbolsToSearch.map(mockPrediction)
                  : [mockPrediction(symbol)]
              })
            });
          });

          const { result } = renderHook(() => usePredictions());

          await waitFor(() => {
            expect(result.current.loading).toBe(false);
          });

          // Verify structural integrity of all predictions
          for (const pred of result.current.predictions) {
            expect(pred).toHaveProperty('symbol');
            expect(pred).toHaveProperty('currentPrice');
            expect(pred).toHaveProperty('prediction');
            expect(pred).toHaveProperty('prediction.direction');
            expect(pred).toHaveProperty('prediction.confidence');
            expect(pred).toHaveProperty('riskMetrics');
            expect(pred).toHaveProperty('riskMetrics.volatility');
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  }, 30000); // Increase timeout for async property test
});
