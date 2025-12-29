/**
 * SimpleStockChart Component Tests
 * Tests validate empty states, edge cases, and correctness properties.
 */

import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import SimpleStockChart, { formatVolume } from '../SimpleStockChart';
import { PriceData } from '@/lib/technical-analysis/types';

vi.mock('recharts', () => ({
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

function createMockPriceData(overrides: Partial<PriceData> = {}): PriceData {
  return {
    date: new Date('2024-01-01'),
    open: 100,
    high: 105,
    low: 98,
    close: 103,
    volume: 1000000,
    ...overrides,
  };
}

describe('SimpleStockChart - Unit Tests', () => {
  describe('Empty State Handling', () => {
    it('should render empty state when priceData is undefined', () => {
      // @ts-expect-error Testing undefined case
      render(<SimpleStockChart symbol="TEST" priceData={undefined} />);
      expect(screen.getByText('No price data available')).toBeInTheDocument();
    });

    it('should render empty state when priceData is null', () => {
      // @ts-expect-error Testing null case
      render(<SimpleStockChart symbol="TEST" priceData={null} />);
      expect(screen.getByText('No price data available')).toBeInTheDocument();
    });

    it('should render empty state when priceData is empty array', () => {
      render(<SimpleStockChart symbol="TEST" priceData={[]} />);
      expect(screen.getByText('No price data available')).toBeInTheDocument();
    });

    it('should render prompt when symbol is empty string', () => {
      render(<SimpleStockChart symbol="" priceData={[createMockPriceData()]} />);
      expect(screen.getByText('Select a stock to view price overview')).toBeInTheDocument();
    });

    it('should render prompt when symbol is whitespace only', () => {
      render(<SimpleStockChart symbol="   " priceData={[createMockPriceData()]} />);
      expect(screen.getByText('Select a stock to view price overview')).toBeInTheDocument();
    });
  });

  describe('Volume Formatting Function', () => {
    it('should format billions correctly', () => {
      expect(formatVolume(1_000_000_000)).toBe('1.0B');
      expect(formatVolume(2_500_000_000)).toBe('2.5B');
    });

    it('should format millions correctly', () => {
      expect(formatVolume(1_000_000)).toBe('1.0M');
      expect(formatVolume(2_500_000)).toBe('2.5M');
    });

    it('should format thousands correctly', () => {
      expect(formatVolume(1_000)).toBe('1.0K');
      expect(formatVolume(2_500)).toBe('2.5K');
    });

    it('should return raw number for values under 1000', () => {
      expect(formatVolume(0)).toBe('0');
      expect(formatVolume(999)).toBe('999');
    });
  });

  describe('Valid Data Rendering', () => {
    it('should render chart when valid data is provided', () => {
      render(<SimpleStockChart symbol="TEST" priceData={[createMockPriceData()]} />);
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });

    it('should display current price from last data point', () => {
      const mockData = [createMockPriceData({ close: 100 }), createMockPriceData({ close: 150.50 })];
      render(<SimpleStockChart symbol="TEST" priceData={mockData} />);
      expect(screen.getByText('$150.50')).toBeInTheDocument();
    });

    it('should display high and low prices', () => {
      render(<SimpleStockChart symbol="TEST" priceData={[createMockPriceData({ high: 110.25, low: 95.75 })]} />);
      expect(screen.getByText('H: $110.25')).toBeInTheDocument();
      expect(screen.getByText('L: $95.75')).toBeInTheDocument();
    });

    it('should display formatted volume', () => {
      render(<SimpleStockChart symbol="TEST" priceData={[createMockPriceData({ volume: 2_500_000 })]} />);
      expect(screen.getByText('Vol: 2.5M')).toBeInTheDocument();
    });
  });

  describe('Price Change Display Format', () => {
    it('should display positive price change with + prefix', () => {
      const mockData = [
        createMockPriceData({ close: 100 }),
        createMockPriceData({ close: 110 }),
      ];
      render(<SimpleStockChart symbol="TEST" priceData={mockData} />);
      expect(screen.getByText(/\+\$10\.00/)).toBeInTheDocument();
      expect(screen.getByText(/\+10\.00%/)).toBeInTheDocument();
    });

    it('should display negative price change with $ followed by negative number', () => {
      const mockData = [
        createMockPriceData({ close: 100 }),
        createMockPriceData({ close: 90 }),
      ];
      render(<SimpleStockChart symbol="TEST" priceData={mockData} />);
      // Component outputs: $-10.00 (-10.00%)
      expect(screen.getByText(/\$-10\.00/)).toBeInTheDocument();
      expect(screen.getByText(/-10\.00%/)).toBeInTheDocument();
    });

    it('should display zero change with + prefix', () => {
      const mockData = [
        createMockPriceData({ close: 100 }),
        createMockPriceData({ close: 100 }),
      ];
      render(<SimpleStockChart symbol="TEST" priceData={mockData} />);
      expect(screen.getByText(/\+\$0\.00/)).toBeInTheDocument();
      expect(screen.getByText(/\+0\.00%/)).toBeInTheDocument();
    });
  });
});

describe('SimpleStockChart - Property-Based Tests', () => {
  const priceDataArbitrary = fc.record({
    date: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
    open: fc.double({ min: 0.01, max: 10000, noNaN: true }),
    high: fc.double({ min: 0.01, max: 10000, noNaN: true }),
    low: fc.double({ min: 0.01, max: 10000, noNaN: true }),
    close: fc.double({ min: 0.01, max: 10000, noNaN: true }),
    volume: fc.integer({ min: 0, max: 1_000_000_000_000 }),
  });

  const symbolArbitrary = fc.string({ minLength: 1, maxLength: 5 }).map(s =>
    s.replace(/[^A-Za-z]/g, 'A').toUpperCase() || 'AAPL'
  );

  describe('Property 1: Component Interface Acceptance', () => {
    it('should accept any valid props without crashing', () => {
      fc.assert(
        fc.property(symbolArbitrary, fc.array(priceDataArbitrary, { minLength: 1, maxLength: 100 }), (symbol, priceData) => {
          expect(() => render(<SimpleStockChart symbol={symbol} priceData={priceData} />)).not.toThrow();
        }),
        { numRuns: 100 }
      );
    });

    it('should render without errors for any valid props', () => {
      fc.assert(
        fc.property(symbolArbitrary, fc.array(priceDataArbitrary, { minLength: 1, maxLength: 50 }), (symbol, priceData) => {
          const { container } = render(<SimpleStockChart symbol={symbol} priceData={priceData} />);
          expect(container.firstChild).not.toBeNull();
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: Graceful Null/Undefined Handling', () => {
    const falsyPriceDataArbitrary = fc.constantFrom(undefined, null, []);

    it('should handle any falsy priceData without crashing', () => {
      fc.assert(
        fc.property(symbolArbitrary, falsyPriceDataArbitrary, (symbol, priceData) => {
          // @ts-expect-error Testing falsy values
          expect(() => render(<SimpleStockChart symbol={symbol} priceData={priceData} />)).not.toThrow();
        }),
        { numRuns: 100 }
      );
    });

    it('should display empty state for any falsy priceData', () => {
      fc.assert(
        fc.property(symbolArbitrary, falsyPriceDataArbitrary, (symbol, priceData) => {
          cleanup();
          // @ts-expect-error Testing falsy values
          render(<SimpleStockChart symbol={symbol} priceData={priceData} />);
          expect(screen.getByText('No price data available')).toBeInTheDocument();
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 5: Price Change Calculation', () => {
    it('should correctly calculate price change for any valid price data', () => {
      fc.assert(
        fc.property(symbolArbitrary, fc.array(priceDataArbitrary, { minLength: 2, maxLength: 50 }), (symbol, priceData) => {
          cleanup();
          const { container } = render(<SimpleStockChart symbol={symbol} priceData={priceData} />);
          const firstClose = priceData[0].close;
          const lastClose = priceData[priceData.length - 1].close;
          const expectedChange = lastClose - firstClose;
          const expectedPercent = ((expectedChange) / firstClose) * 100;

          const changeSpan = container.querySelector('span.ml-2.text-sm.font-medium');
          expect(changeSpan).not.toBeNull();

          const text = changeSpan?.textContent || '';
          // Component format: +$X.XX for positive, $-X.XX for negative (negative sign is part of number)
          const isPositive = expectedChange >= 0;
          const expectedChangeStr = isPositive 
            ? '+$' + expectedChange.toFixed(2) 
            : '$' + expectedChange.toFixed(2);
          const expectedPercentStr = isPositive 
            ? '+' + expectedPercent.toFixed(2) + '%' 
            : expectedPercent.toFixed(2) + '%';

          const normalizedText = text.replace(/\s+/g, '');
          const normalizedExpectedChange = expectedChangeStr.replace(/\s+/g, '');
          const normalizedExpectedPercent = expectedPercentStr.replace(/\s+/g, '');

          expect(normalizedText).toContain(normalizedExpectedChange);
          expect(normalizedText).toContain(normalizedExpectedPercent);
        }),
        { numRuns: 100 }
      );
    });

    it('should display zero change when first and last prices are equal', () => {
      fc.assert(
        fc.property(symbolArbitrary, fc.double({ min: 0.01, max: 10000, noNaN: true }), (symbol, price) => {
          cleanup();
          const priceData = [
            { date: new Date('2024-01-01'), open: price, high: price + 5, low: price - 5, close: price, volume: 1000000 },
            { date: new Date('2024-01-02'), open: price, high: price + 5, low: price - 5, close: price, volume: 1000000 },
          ];
          render(<SimpleStockChart symbol={symbol} priceData={priceData} />);
          expect(screen.getByText(/\+\$0\.00/)).toBeInTheDocument();
          expect(screen.getByText(/\+0\.00%/)).toBeInTheDocument();
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 6: Price Change Color Styling', () => {
    it('should apply green color classes for positive price changes', () => {
      fc.assert(
        fc.property(symbolArbitrary, fc.double({ min: 0.01, max: 5000, noNaN: true }), fc.double({ min: 0.01, max: 5000, noNaN: true }), (symbol, firstPrice, increase) => {
          cleanup();
          const lastPrice = firstPrice + increase;
          const priceData = [
            { date: new Date('2024-01-01'), open: firstPrice, high: firstPrice + 5, low: firstPrice - 5, close: firstPrice, volume: 1000000 },
            { date: new Date('2024-01-02'), open: lastPrice, high: lastPrice + 5, low: lastPrice - 5, close: lastPrice, volume: 1000000 },
          ];
          const { container } = render(<SimpleStockChart symbol={symbol} priceData={priceData} />);
          expect(container.querySelector('.text-green-600')).toBeInTheDocument();
        }),
        { numRuns: 100 }
      );
    });

    it('should apply red color classes for negative price changes', () => {
      fc.assert(
        fc.property(symbolArbitrary, fc.double({ min: 100, max: 10000, noNaN: true }), fc.double({ min: 0.01, max: 99, noNaN: true }), (symbol, firstPrice, decrease) => {
          cleanup();
          const lastPrice = firstPrice - decrease;
          const priceData = [
            { date: new Date('2024-01-01'), open: firstPrice, high: firstPrice + 5, low: firstPrice - 5, close: firstPrice, volume: 1000000 },
            { date: new Date('2024-01-02'), open: lastPrice, high: lastPrice + 5, low: lastPrice - 5, close: lastPrice, volume: 1000000 },
          ];
          const { container } = render(<SimpleStockChart symbol={symbol} priceData={priceData} />);
          expect(container.querySelector('.text-red-600')).toBeInTheDocument();
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 7: Volume Formatting', () => {
    it('should format billions with B suffix', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1_000_000_000, max: 999_000_000_000 }), (volume) => {
          expect(formatVolume(volume)).toMatch(/^\d+\.\d+B$/);
        }),
        { numRuns: 100 }
      );
    });

    it('should format millions with M suffix', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1_000_000, max: 999_999_999 }), (volume) => {
          expect(formatVolume(volume)).toMatch(/^\d+\.\d+M$/);
        }),
        { numRuns: 100 }
      );
    });

    it('should format thousands with K suffix', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1_000, max: 999_999 }), (volume) => {
          expect(formatVolume(volume)).toMatch(/^\d+\.\d+K$/);
        }),
        { numRuns: 100 }
      );
    });

    it('should return raw number for values under 1000', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 999 }), (volume) => {
          expect(formatVolume(volume)).toBe(volume.toString());
        }),
        { numRuns: 100 }
      );
    });
  });
});
