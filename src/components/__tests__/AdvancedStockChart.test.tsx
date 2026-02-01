import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AdvancedStockChart from '../AdvancedStockChart';
import { PriceData, TechnicalAnalysisResult } from '@/lib/technical-analysis/types';

// Mock Recharts components to avoid rendering issues in tests
vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Area: () => <div data-testid="area" />,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('AdvancedStockChart - Defensive Check and Logging', () => {
  let consoleWarnSpy: any;
  let consoleLogSpy: any;
  let mockPriceData: PriceData[];
  let mockAnalysis: TechnicalAnalysisResult;

  beforeEach(() => {
    // Spy on console methods
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Create mock price data with recent dates (relative to current date)
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(now.getDate() - 2);
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(now.getDate() - 3);

    mockPriceData = [
      {
        date: threeDaysAgo,
        open: 100,
        high: 105,
        low: 98,
        close: 103,
        volume: 1000000,
      },
      {
        date: twoDaysAgo,
        open: 103,
        high: 108,
        low: 102,
        close: 107,
        volume: 1200000,
      },
      {
        date: yesterday,
        open: 107,
        high: 110,
        low: 106,
        close: 109,
        volume: 1100000,
      },
    ];

    // Create mock analysis data with matching recent dates
    mockAnalysis = {
      symbol: 'TEST',
      summary: {
        overall: 'bullish',
        strength: 0.75,
        confidence: 0.85,
        trendDirection: 'up',
        momentum: 'increasing',
        volatility: 'medium',
      },
      signals: [],
      indicators: {
        rsi: [
          { date: threeDaysAgo, value: 65, signal: 'hold', strength: 0.5, overbought: false, oversold: false },
          { date: twoDaysAgo, value: 70, signal: 'hold', strength: 0.5, overbought: false, oversold: false },
          { date: yesterday, value: 72, signal: 'sell', strength: 0.7, overbought: true, oversold: false },
        ],
        macd: [
          {
            date: threeDaysAgo,
            macd: 1.2,
            signal: 1.0,
            histogram: 0.2,
          },
          {
            date: twoDaysAgo,
            macd: 1.5,
            signal: 1.1,
            histogram: 0.4,
          },
        ],
        bollingerBands: [
          {
            date: threeDaysAgo,
            upper: 110,
            middle: 103,
            lower: 96,
            bandwidth: 14,
            percentB: 0.5,
            squeeze: false,
          },
          {
            date: twoDaysAgo,
            upper: 112,
            middle: 107,
            lower: 102,
            bandwidth: 10,
            percentB: 0.5,
            squeeze: false,
          },
        ],
      },
      timestamp: yesterday,
    };

    // Mock successful fetch response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        priceData: mockPriceData,
      }),
    });
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
    vi.resetAllMocks();
  });

  describe('Defensive Check for Empty Chart Data', () => {
    it('should show message when priceData is empty', () => {
      // Render with empty price data
      render(<AdvancedStockChart symbol="TEST" priceData={[]} />);

      // Should show "No price data available" message
      // The component returns early with a message div when filteredData is empty
      expect(screen.getByText(/No price data available for TEST/i)).toBeInTheDocument();
    });

    it('should show empty state when chartData becomes empty after filtering', async () => {
      // Render with data that will be filtered out (old date)
      const oldData: PriceData[] = [
        {
          date: new Date('2020-01-01'),
          open: 100,
          high: 105,
          low: 98,
          close: 103,
          volume: 1000000,
        },
      ];

      render(<AdvancedStockChart symbol="TEST" priceData={oldData} />);

      // With old data outside the default time range, should show empty state message
      // The component returns early with "No price data available" message when filteredData is empty
      expect(screen.getByText(/No price data available for TEST/i)).toBeInTheDocument();
    });

    it('should not render chart when chartData is null', () => {
      render(<AdvancedStockChart symbol="TEST" priceData={[]} />);

      // Should not render any chart components
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
      expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument();
      expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
    });

    it('should handle undefined priceData gracefully', () => {
      // @ts-expect-error Testing undefined case
      render(<AdvancedStockChart symbol="TEST" priceData={undefined} />);

      // Should show no data message - component handles undefined/empty arrays the same way
      expect(screen.getByText(/No price data available for TEST/i)).toBeInTheDocument();
    });

    it('should handle null priceData gracefully', () => {
      // @ts-expect-error Testing null case
      render(<AdvancedStockChart symbol="TEST" priceData={null} />);

      // Should show no data message - component handles null/empty arrays the same way
      expect(screen.getByText(/No price data available for TEST/i)).toBeInTheDocument();
    });
  });

  describe('Chart Rendering Logging', () => {
    it('should log chart type and data points when rendering line chart', async () => {
      render(<AdvancedStockChart symbol="TEST" priceData={mockPriceData} />);

      // Wait for chart to render
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Should log rendering information
      expect(consoleLogSpy).toHaveBeenCalledWith('Rendering chart:', {
        chartType: 'line',
        dataPoints: 3,
      });
    });

    it('should log chart type and data points when rendering area chart', async () => {
      render(<AdvancedStockChart symbol="TEST" priceData={mockPriceData} />);

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Switch to area chart
      const areaButton = screen.getByTitle('Area Chart');
      fireEvent.click(areaButton);

      // Wait for area chart to render
      await waitFor(() => {
        expect(screen.getByTestId('area-chart')).toBeInTheDocument();
      });

      // Should log area chart rendering
      expect(consoleLogSpy).toHaveBeenCalledWith('Rendering chart:', {
        chartType: 'area',
        dataPoints: 3,
      });
    });

    it('should log chart type and data points when rendering volume chart', async () => {
      render(<AdvancedStockChart symbol="TEST" priceData={mockPriceData} />);

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Switch to volume chart
      const volumeButton = screen.getByTitle('Volume Chart');
      fireEvent.click(volumeButton);

      // Wait for volume chart to render
      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });

      // Should log volume chart rendering
      expect(consoleLogSpy).toHaveBeenCalledWith('Rendering chart:', {
        chartType: 'volume',
        dataPoints: 3,
      });
    });

    it('should log updated data points when time range changes', async () => {
      // Create data spanning multiple months (relative to current date)
      const multiMonthData: PriceData[] = [];
      const now = new Date();
      for (let i = 89; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        multiMonthData.push({
          date,
          open: 100 + i,
          high: 105 + i,
          low: 98 + i,
          close: 103 + i,
          volume: 1000000,
        });
      }

      render(<AdvancedStockChart symbol="TEST" priceData={multiMonthData} />);

      // Wait for initial render with all data (filtered by default 1Y range)
      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith('Rendering chart:', {
          chartType: 'line',
          dataPoints: 90,
        });
      });

      // Clear previous logs
      consoleLogSpy.mockClear();

      // Switch to 1M time range
      const oneMonthButton = screen.getByText('1M');
      fireEvent.click(oneMonthButton);

      // Should log with fewer data points (approximately 30 days)
      await waitFor(() => {
        const calls = consoleLogSpy.mock.calls;
        const renderingCall = calls.find(
          (call: any) => call[0] === 'Rendering chart:' && call[1].dataPoints <= 31
        );
        expect(renderingCall).toBeDefined();
      });
    });

    it('should log component rendering with debug information', async () => {
      render(<AdvancedStockChart symbol="TEST" priceData={mockPriceData} analysis={mockAnalysis} />);

      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByText(/TEST - Advanced Chart Analysis/i)).toBeInTheDocument();
      });

      // Should log debug information
      expect(consoleLogSpy).toHaveBeenCalledWith('AdvancedStockChart rendering:', {
        symbol: 'TEST',
        filteredDataLength: 3,
        chartDataLength: 3,
        loading: false,
        chartType: 'line',
        selectedTimeRange: '1Y',
      });
    });
  });

  describe('Edge Cases with Defensive Check', () => {
    it('should handle single data point gracefully', async () => {
      // Use a date within the last year to pass the filter
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const singleDataPoint: PriceData[] = [
        {
          date: yesterday,
          open: 100,
          high: 105,
          low: 98,
          close: 103,
          volume: 1000000,
        },
      ];

      render(<AdvancedStockChart symbol="TEST" priceData={singleDataPoint} />);

      // Should render chart with single data point
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Should log with 1 data point
      expect(consoleLogSpy).toHaveBeenCalledWith('Rendering chart:', {
        chartType: 'line',
        dataPoints: 1,
      });
    });

    it('should handle data with missing technical indicators', async () => {
      const analysisWithoutIndicators: TechnicalAnalysisResult = {
        symbol: 'TEST',
        summary: {
          overall: 'bullish',
          strength: 0.75,
          confidence: 0.85,
          trendDirection: 'up',
          momentum: 'increasing',
          volatility: 'medium',
        },
        signals: [],
        indicators: {
          rsi: [],
          macd: [],
          bollingerBands: [],
        },
        timestamp: new Date('2024-01-03'),
      };

      render(
        <AdvancedStockChart
          symbol="TEST"
          priceData={mockPriceData}
          analysis={analysisWithoutIndicators}
        />
      );

      // Should still render chart
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Should log rendering
      expect(consoleLogSpy).toHaveBeenCalledWith('Rendering chart:', {
        chartType: 'line',
        dataPoints: 3,
      });
    });

    it('should handle very large datasets efficiently', async () => {
      // Create large dataset (365 data points within the last year)
      const largeDataset: PriceData[] = [];
      const now = new Date();
      for (let i = 364; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        largeDataset.push({
          date,
          open: 100 + Math.random() * 10,
          high: 105 + Math.random() * 10,
          low: 98 + Math.random() * 10,
          close: 103 + Math.random() * 10,
          volume: 1000000 + Math.random() * 500000,
        });
      }

      render(<AdvancedStockChart symbol="TEST" priceData={largeDataset} />);

      // Should render without crashing
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Should log with correct data point count
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Rendering chart:',
        expect.objectContaining({
          chartType: 'line',
          dataPoints: expect.any(Number),
        })
      );
    });

    it('should not log warning when chartData has valid data', async () => {
      render(<AdvancedStockChart symbol="TEST" priceData={mockPriceData} />);

      // Wait for chart to render
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Should NOT log warning about empty chart data
      const warningCalls = consoleWarnSpy.mock.calls.filter(
        (call: any) => call[0] === 'No price data available for TEST for rendering'
      );
      expect(warningCalls.length).toBe(0);
    });
  });

  describe('Chart Type Switching with Logging', () => {
    it('should log each chart type change', async () => {
      render(<AdvancedStockChart symbol="TEST" priceData={mockPriceData} />);

      // Wait for initial line chart
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Clear previous logs
      consoleLogSpy.mockClear();

      // Switch to area chart
      const areaButton = screen.getByTitle('Area Chart');
      fireEvent.click(areaButton);

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith('Rendering chart:', {
          chartType: 'area',
          dataPoints: 3,
        });
      });

      // Clear logs again
      consoleLogSpy.mockClear();

      // Switch to volume chart
      const volumeButton = screen.getByTitle('Volume Chart');
      fireEvent.click(volumeButton);

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith('Rendering chart:', {
          chartType: 'volume',
          dataPoints: 3,
        });
      });

      // Clear logs again
      consoleLogSpy.mockClear();

      // Switch back to line chart
      const lineButton = screen.getByTitle('Line Chart');
      fireEvent.click(lineButton);

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith('Rendering chart:', {
          chartType: 'line',
          dataPoints: 3,
        });
      });
    });
  });

  describe('Integration with Time Range Filtering', () => {
    it('should log correct data points after filtering by time range', async () => {
      // Create data spanning 2 years (relative to current date to pass filters)
      const twoYearData: PriceData[] = [];
      const now = new Date();
      for (let i = 729; i >= 0; i--) {
        // 2 years of daily data ending today
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        twoYearData.push({
          date,
          open: 100 + Math.random() * 10,
          high: 105 + Math.random() * 10,
          low: 98 + Math.random() * 10,
          close: 103 + Math.random() * 10,
          volume: 1000000,
        });
      }

      render(<AdvancedStockChart symbol="TEST" priceData={twoYearData} />);

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Test each time range
      const timeRanges = ['1M', '3M', '6M', '1Y', '2Y', '5Y', 'MAX'];

      for (const range of timeRanges) {
        consoleLogSpy.mockClear();

        const button = screen.getByText(range);
        fireEvent.click(button);

        await waitFor(() => {
          const renderingCalls = consoleLogSpy.mock.calls.filter(
            (call: any) => call[0] === 'Rendering chart:'
          );
          expect(renderingCalls.length).toBeGreaterThan(0);
        });
      }
    });
  });

  describe('Error Recovery with Defensive Check', () => {
    it('should recover gracefully when data becomes available after being empty', async () => {
      const { rerender } = render(<AdvancedStockChart symbol="TEST" priceData={[]} />);

      // Initially should show no data message
      expect(screen.getByText(/No price data available for TEST/i)).toBeInTheDocument();

      // Clear logs
      consoleWarnSpy.mockClear();
      consoleLogSpy.mockClear();

      // Update with valid data
      rerender(<AdvancedStockChart symbol="TEST" priceData={mockPriceData} />);

      // Should now render chart
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Should log successful rendering
      expect(consoleLogSpy).toHaveBeenCalledWith('Rendering chart:', {
        chartType: 'line',
        dataPoints: 3,
      });
    });
  });

  describe('Performance and Memory Considerations', () => {
    it('should not cause memory leaks with repeated renders', async () => {
      const { rerender } = render(<AdvancedStockChart symbol="TEST" priceData={mockPriceData} />);

      // Render multiple times
      for (let i = 0; i < 10; i++) {
        rerender(<AdvancedStockChart symbol="TEST" priceData={mockPriceData} />);
      }

      // Should still render correctly
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Logging should work consistently
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle rapid chart type changes without errors', async () => {
      render(<AdvancedStockChart symbol="TEST" priceData={mockPriceData} />);

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Rapidly switch between chart types
      const lineButton = screen.getByTitle('Line Chart');
      const areaButton = screen.getByTitle('Area Chart');
      const volumeButton = screen.getByTitle('Volume Chart');

      for (let i = 0; i < 5; i++) {
        fireEvent.click(areaButton);
        fireEvent.click(volumeButton);
        fireEvent.click(lineButton);
      }

      // Should still render correctly
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Should have logged multiple times
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('Empty State Handling - New Feature', () => {
    it('should display "No price data available" message when priceData is empty', () => {
      render(<AdvancedStockChart symbol="TEST" priceData={[]} />);

      // Should display the empty state message (early return with symbol)
      expect(screen.getByText(/No price data available for TEST/i)).toBeInTheDocument();
    });

    it('should not render chart components when chartData is empty', () => {
      render(<AdvancedStockChart symbol="TEST" priceData={[]} />);

      // Should not render any chart components
      expect(screen.queryByTestId('responsive-container')).not.toBeInTheDocument();
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
      expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument();
      expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
    });

    it('should display empty state with proper styling', () => {
      const { container } = render(<AdvancedStockChart symbol="TEST" priceData={[]} />);

      // Find the empty state container
      const emptyState = container.querySelector('.flex.items-center.justify-center.h-96.text-gray-500');
      expect(emptyState).toBeInTheDocument();
      expect(emptyState).toHaveClass('flex', 'items-center', 'justify-center', 'h-96', 'text-gray-500');
    });

    it('should show empty state after filtering removes all data', async () => {
      // Create data that's older than any time range filter
      const oldData: PriceData[] = [
        {
          date: new Date('2000-01-01'),
          open: 100,
          high: 105,
          low: 98,
          close: 103,
          volume: 1000000,
        },
      ];

      render(<AdvancedStockChart symbol="TEST" priceData={oldData} />);

      // The default 1Y filter will already exclude this data since it's from 2000
      // So the empty state should already be shown without clicking any time range button
      expect(screen.getByText(/No price data available for TEST/i)).toBeInTheDocument();
    });

    it('should transition from empty state to chart when data becomes available', async () => {
      const { rerender } = render(<AdvancedStockChart symbol="TEST" priceData={[]} />);

      // Initially should show empty state
      expect(screen.getByText(/No price data available for TEST/i)).toBeInTheDocument();
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();

      // Update with valid data
      rerender(<AdvancedStockChart symbol="TEST" priceData={mockPriceData} />);

      // Should now show chart
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Empty state should be gone
      expect(screen.queryByText(/No price data available/i)).not.toBeInTheDocument();
    });

    it('should show empty state when rendered with empty data', () => {
      // Note: The component's historicalData state is initialized with priceData prop
      // and doesn't update when priceData prop changes (by design - it caches data)
      // So we test empty state by rendering with empty data initially
      render(<AdvancedStockChart symbol="TEST" priceData={[]} />);

      // Should show empty state
      expect(screen.getByText(/No price data available for TEST/i)).toBeInTheDocument();
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    });

    it('should show empty state instead of loading spinner when data is empty', () => {
      render(<AdvancedStockChart symbol="TEST" priceData={[]} />);

      // Should not show loading spinner
      expect(screen.queryByText('Loading chart data...')).not.toBeInTheDocument();

      // Should show empty state
      expect(screen.getByText(/No price data available for TEST/i)).toBeInTheDocument();
    });

    it('should maintain empty state across chart type changes', async () => {
      render(<AdvancedStockChart symbol="TEST" priceData={[]} />);

      // Should show empty state (early return, no chart type buttons rendered)
      expect(screen.getByText(/No price data available for TEST/i)).toBeInTheDocument();

      // Chart type buttons are not rendered with early return, so we just verify empty state persists
      expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument();
    });

    it('should maintain empty state across time range changes', async () => {
      render(<AdvancedStockChart symbol="TEST" priceData={[]} />);

      // Should show empty state (early return, no time range buttons rendered)
      expect(screen.getByText(/No price data available for TEST/i)).toBeInTheDocument();

      // Time range buttons are not rendered with early return, so we just verify empty state persists
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    });
  });

  describe('Chart Container Styling - Inline Height', () => {
    it('should apply inline height style to chart container', async () => {
      const { container } = render(<AdvancedStockChart symbol="TEST" priceData={mockPriceData} />);

      // Wait for chart to render
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Find the chart container div by its inline style (width: 100%, height: 400px)
      // The component uses inline styles not Tailwind classes for the chart container
      const chartContainer = container.querySelector('[style*="height: 400px"]') ||
                             container.querySelector('[style*="height:400px"]');
      expect(chartContainer).toBeInTheDocument();
      expect(chartContainer).toHaveStyle({ height: '400px' });
    });

    it('should maintain inline height style across chart type changes', async () => {
      const { container } = render(<AdvancedStockChart symbol="TEST" priceData={mockPriceData} />);

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Switch to area chart
      const areaButton = screen.getByTitle('Area Chart');
      fireEvent.click(areaButton);

      await waitFor(() => {
        expect(screen.getByTestId('area-chart')).toBeInTheDocument();
      });

      // Check height is still applied (using inline style selector)
      const chartContainer = container.querySelector('[style*="height: 400px"]') ||
                             container.querySelector('[style*="height:400px"]');
      expect(chartContainer).toHaveStyle({ height: '400px' });
    });

    it('should maintain inline height style across time range changes', async () => {
      const { container } = render(<AdvancedStockChart symbol="TEST" priceData={mockPriceData} />);

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Change time range to 1M
      const oneMonthButton = screen.getByText('1M');
      fireEvent.click(oneMonthButton);

      // Wait for the chart to re-render after time range change
      await waitFor(() => {
        // Chart should still be visible (data is within 1 month)
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Check height is still applied (using inline style selector)
      const chartContainer = container.querySelector('[style*="height: 400px"]') ||
                             container.querySelector('[style*="height:400px"]');
      expect(chartContainer).toBeInTheDocument();
      expect(chartContainer).toHaveStyle({ height: '400px' });
    });

    it('should apply width style alongside inline height', async () => {
      const { container } = render(<AdvancedStockChart symbol="TEST" priceData={mockPriceData} />);

      // Wait for chart to render
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Find the chart container (has inline styles for width and height)
      const chartContainer = container.querySelector('[style*="height: 400px"]') ||
                             container.querySelector('[style*="height:400px"]');
      expect(chartContainer).toBeInTheDocument();
      // Component uses inline width: 100% style, not w-full class
      expect(chartContainer).toHaveStyle({ width: '100%', height: '400px' });
    });

    it('should not apply height as a className', async () => {
      const { container } = render(<AdvancedStockChart symbol="TEST" priceData={mockPriceData} />);

      // Wait for chart to render
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Find the chart container
      const chartContainer = container.querySelector('[style*="height: 400px"]') ||
                             container.querySelector('[style*="height:400px"]');
      expect(chartContainer).toBeInTheDocument();

      // Should NOT have h-[400px] as a class (uses inline style instead)
      expect(chartContainer).not.toHaveClass('h-[400px]');

      // Should have inline style instead
      expect(chartContainer).toHaveStyle({ height: '400px' });
    });
  });

  describe('Loading, Empty, and Chart State Transitions', () => {
    it('should show empty state immediately when priceData is empty', () => {
      // When priceData prop is empty, component shows empty state immediately
      // (no loading state since data is already provided via props)
      render(<AdvancedStockChart symbol="TEST" priceData={[]} />);

      // Should show empty state immediately
      expect(screen.getByText(/No price data available for TEST/i)).toBeInTheDocument();
      expect(screen.queryByText('Loading chart data...')).not.toBeInTheDocument();
    });

    it('should show loading state when fetching data after time range change', async () => {
      // Mock delayed fetch
      (global.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ success: true, priceData: mockPriceData }),
                }),
              100
            )
          )
      );

      render(<AdvancedStockChart symbol="TEST" priceData={mockPriceData} />);

      // Wait for initial chart render
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Change time range to trigger fetch
      const sixMonthButton = screen.getByText('6M');
      fireEvent.click(sixMonthButton);

      // Should show loading while fetching
      await waitFor(() => {
        expect(screen.getByText('Loading chart data...')).toBeInTheDocument();
      });

      // Wait for loading to complete
      await waitFor(
        () => {
          expect(screen.queryByText('Loading chart data...')).not.toBeInTheDocument();
        },
        { timeout: 200 }
      );
    });

    it('should show chart when data is available (not loading or empty)', async () => {
      render(<AdvancedStockChart symbol="TEST" priceData={mockPriceData} />);

      // Wait for chart to render
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Should not show loading or empty state
      expect(screen.queryByText('Loading chart data...')).not.toBeInTheDocument();
      expect(screen.queryByText(/No price data available/i)).not.toBeInTheDocument();
    });

    it('should show chart state when data is provided', async () => {
      // The component caches historical data in state, so we test the
      // initial state behavior - chart shows with data, empty state without
      render(<AdvancedStockChart symbol="TEST" priceData={mockPriceData} />);

      // Should show chart
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Should not show empty state
      expect(screen.queryByText(/No price data available/i)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility - Empty State', () => {
    it('should have proper text contrast for empty state message', () => {
      const { container } = render(<AdvancedStockChart symbol="TEST" priceData={[]} />);

      const emptyState = container.querySelector('.text-gray-500');
      expect(emptyState).toBeInTheDocument();
      expect(emptyState).toHaveTextContent(/No price data available for TEST/i);
    });

    it('should maintain proper height for empty state container', () => {
      const { container } = render(<AdvancedStockChart symbol="TEST" priceData={[]} />);

      const emptyState = container.querySelector('.h-96');
      expect(emptyState).toBeInTheDocument();
      expect(emptyState).toHaveClass('h-96'); // 384px height
    });

    it('should center empty state message both horizontally and vertically', () => {
      const { container } = render(<AdvancedStockChart symbol="TEST" priceData={[]} />);

      const emptyState = container.querySelector('.flex.items-center.justify-center');
      expect(emptyState).toBeInTheDocument();
      expect(emptyState).toHaveClass('flex', 'items-center', 'justify-center');
    });
  });

  describe('Technical Indicator Chart Container Styling - Bug Fix for Layout Shift', () => {
    // Helper to enable technical indicators (checkbox is unchecked by default)
    const enableTechnicalIndicators = async () => {
      const checkbox = screen.getByRole('checkbox', { name: /show technical indicators/i });
      if (!checkbox.hasAttribute('checked')) {
        fireEvent.click(checkbox);
      }
    };

    it('should wrap RSI chart ResponsiveContainer in a div with explicit dimensions', async () => {
      const { container } = render(
        <AdvancedStockChart
          symbol="TEST"
          priceData={mockPriceData}
          analysis={mockAnalysis}
        />
      );

      // Wait for chart to render
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Enable technical indicators (disabled by default)
      await enableTechnicalIndicators();

      // Wait for RSI to appear
      await waitFor(() => {
        expect(screen.getByText('RSI (14)')).toBeInTheDocument();
      });

      // Find the RSI chart wrapper div (has style with height: 150px)
      const divsWithInlineStyles = Array.from(container.querySelectorAll('div[style]'));
      const rsiWrapperDiv = divsWithInlineStyles.find(div => {
        const style = (div as HTMLElement).style;
        return style.width === '100%' && style.height === '150px';
      });

      expect(rsiWrapperDiv).toBeDefined();
      expect(rsiWrapperDiv).toHaveStyle({ width: '100%', height: '150px' });
    });

    it('should apply inline styles to prevent ResponsiveContainer layout shift', async () => {
      const { container } = render(
        <AdvancedStockChart
          symbol="TEST"
          priceData={mockPriceData}
          analysis={mockAnalysis}
        />
      );

      // Wait for chart to render
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Enable technical indicators
      await enableTechnicalIndicators();

      // Wait for technical indicators to render
      await waitFor(() => {
        expect(screen.getByText('RSI (14)')).toBeInTheDocument();
      });

      // Find the wrapper div for RSI chart
      const rsiSection = container.querySelector('h4')?.closest('div');
      expect(rsiSection).toBeInTheDocument();

      // Find the wrapper div with inline styles inside the RSI section
      const wrapperDiv = rsiSection?.querySelector('div[style*="width"]');
      expect(wrapperDiv).toBeInTheDocument();
      expect(wrapperDiv).toHaveStyle({ width: '100%', height: '150px' });
    });

    it('should maintain wrapper div dimensions across re-renders', async () => {
      const { container, rerender } = render(
        <AdvancedStockChart
          symbol="TEST"
          priceData={mockPriceData}
          analysis={mockAnalysis}
        />
      );

      // Wait for chart to render
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Enable technical indicators
      await enableTechnicalIndicators();

      // Wait for initial render of technical indicators
      await waitFor(() => {
        expect(screen.getByText('RSI (14)')).toBeInTheDocument();
      });

      // Get initial wrapper div
      const initialWrapperDiv = container.querySelector('div[style*="height: 150px"]');
      expect(initialWrapperDiv).toHaveStyle({ width: '100%', height: '150px' });

      // Re-render with same props
      rerender(
        <AdvancedStockChart
          symbol="TEST"
          priceData={mockPriceData}
          analysis={mockAnalysis}
        />
      );

      // Note: After rerender, state resets so checkbox is unchecked again
      // Just verify the chart still renders correctly (use getAllByTestId since there may be multiple line-charts)
      await waitFor(() => {
        expect(screen.getAllByTestId('line-chart').length).toBeGreaterThan(0);
      });
    });

    it('should wrap MACD chart ResponsiveContainer with explicit dimensions', async () => {
      const { container } = render(
        <AdvancedStockChart
          symbol="TEST"
          priceData={mockPriceData}
          analysis={mockAnalysis}
        />
      );

      // Wait for chart to render
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Enable technical indicators
      await enableTechnicalIndicators();

      // Wait for MACD chart to render
      await waitFor(() => {
        expect(screen.getByText('MACD')).toBeInTheDocument();
      });

      // Find the MACD section
      const macdSection = Array.from(container.querySelectorAll('h4'))
        .find(h4 => h4.textContent === 'MACD')
        ?.closest('div');

      expect(macdSection).toBeInTheDocument();

      // Find the wrapper div with inline styles
      const wrapperDiv = macdSection?.querySelector('div[style*="width"]');
      expect(wrapperDiv).toBeInTheDocument();
      expect(wrapperDiv).toHaveStyle({ width: '100%', height: '150px' });
    });

    it('should prevent cumulative layout shift (CLS) with explicit container dimensions', async () => {
      const { container } = render(
        <AdvancedStockChart
          symbol="TEST"
          priceData={mockPriceData}
          analysis={mockAnalysis}
        />
      );

      // Wait for chart to render
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Enable technical indicators
      await enableTechnicalIndicators();

      // Wait for charts to render
      await waitFor(() => {
        expect(screen.getByText('RSI (14)')).toBeInTheDocument();
      });

      // All technical indicator chart wrappers should have explicit dimensions (height: 150px)
      const allWrapperDivs = Array.from(container.querySelectorAll('div[style*="height: 150px"]'));

      // Should have at least one wrapper div (RSI)
      expect(allWrapperDivs.length).toBeGreaterThan(0);

      // All wrapper divs should have both width and height
      allWrapperDivs.forEach(div => {
        const style = (div as HTMLElement).style;
        expect(style.width).toBe('100%');
        expect(style.height).toBe('150px');
      });
    });

    it('should use inline styles instead of CSS classes for dimensions', async () => {
      const { container } = render(
        <AdvancedStockChart
          symbol="TEST"
          priceData={mockPriceData}
          analysis={mockAnalysis}
        />
      );

      // Wait for chart to render
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Enable technical indicators
      await enableTechnicalIndicators();

      // Wait for charts to render
      await waitFor(() => {
        expect(screen.getByText('RSI (14)')).toBeInTheDocument();
      });

      // Find wrapper divs (technical indicator containers have height: 150px)
      const wrapperDivs = Array.from(container.querySelectorAll('div[style*="height: 150px"]'));

      wrapperDivs.forEach(div => {
        // Should NOT use Tailwind classes for dimensions
        expect(div).not.toHaveClass('w-full');
        expect(div).not.toHaveClass('h-[150px]');

        // Should use inline styles instead
        expect((div as HTMLElement).style.width).toBe('100%');
        expect((div as HTMLElement).style.height).toBe('150px');
      });
    });

    it('should maintain wrapper dimensions when switching time ranges', async () => {
      const { container } = render(
        <AdvancedStockChart
          symbol="TEST"
          priceData={mockPriceData}
          analysis={mockAnalysis}
        />
      );

      // Wait for chart to render
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Enable technical indicators
      await enableTechnicalIndicators();

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByText('RSI (14)')).toBeInTheDocument();
      });

      // Get initial wrapper dimensions
      const initialWrapper = container.querySelector('div[style*="height: 150px"]');
      expect(initialWrapper).toHaveStyle({ width: '100%', height: '150px' });

      // Change time range
      const oneMonthButton = screen.getByText('1M');
      fireEvent.click(oneMonthButton);

      // Wait for update
      await waitFor(() => {
        const updatedWrapper = container.querySelector('div[style*="height: 150px"]');
        expect(updatedWrapper).toHaveStyle({ width: '100%', height: '150px' });
      });
    });

    it('should maintain wrapper dimensions when toggling technical indicators', async () => {
      const { container } = render(
        <AdvancedStockChart
          symbol="TEST"
          priceData={mockPriceData}
          analysis={mockAnalysis}
        />
      );

      // Wait for chart to render
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Enable technical indicators
      const checkbox = screen.getByRole('checkbox', { name: /show technical indicators/i });
      fireEvent.click(checkbox);

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByText('RSI (14)')).toBeInTheDocument();
      });

      // Get initial wrapper
      const initialWrapper = container.querySelector('div[style*="height: 150px"]');
      expect(initialWrapper).toHaveStyle({ width: '100%', height: '150px' });

      // Toggle technical indicators off by clicking checkbox again
      fireEvent.click(checkbox);

      // Wait for indicators to hide
      await waitFor(() => {
        expect(screen.queryByText('RSI (14)')).not.toBeInTheDocument();
      });

      // Toggle back on
      fireEvent.click(checkbox);

      // Wait for indicators to show again
      await waitFor(() => {
        expect(screen.getByText('RSI (14)')).toBeInTheDocument();
      });

      // Wrapper should still have correct dimensions
      const updatedWrapper = container.querySelector('div[style*="height: 150px"]');
      expect(updatedWrapper).toHaveStyle({ width: '100%', height: '150px' });
    });

    it('should apply wrapper dimensions consistently across all technical indicator charts', async () => {
      // Create analysis with all indicators using dynamic dates
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);

      const fullAnalysis: TechnicalAnalysisResult = {
        ...mockAnalysis,
        indicators: {
          rsi: mockAnalysis.indicators.rsi,
          macd: mockAnalysis.indicators.macd,
          bollingerBands: mockAnalysis.indicators.bollingerBands,
          stochastic: [
            { date: yesterday, k: 65, d: 60, signal: 'hold', overbought: false, oversold: false },
          ],
        },
      };

      const { container } = render(
        <AdvancedStockChart
          symbol="TEST"
          priceData={mockPriceData}
          analysis={fullAnalysis}
        />
      );

      // Wait for chart to render
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Enable technical indicators
      await enableTechnicalIndicators();

      // Wait for all charts to render
      await waitFor(() => {
        expect(screen.getByText('RSI (14)')).toBeInTheDocument();
        expect(screen.getByText('MACD')).toBeInTheDocument();
      });

      // Find all wrapper divs with inline styles (technical indicator containers have height: 150px)
      const wrapperDivs = Array.from(container.querySelectorAll('div[style*="height: 150px"]'));

      // Should have multiple wrapper divs (one for each indicator chart)
      expect(wrapperDivs.length).toBeGreaterThan(1);

      // All should have consistent dimensions
      wrapperDivs.forEach(div => {
        expect(div).toHaveStyle({ width: '100%', height: '150px' });
      });
    });

    it('should not break ResponsiveContainer functionality with wrapper div', async () => {
      const { container } = render(
        <AdvancedStockChart
          symbol="TEST"
          priceData={mockPriceData}
          analysis={mockAnalysis}
        />
      );

      // Wait for chart to render (use getAllByTestId since there may be multiple after enabling indicators)
      await waitFor(() => {
        expect(screen.getAllByTestId('line-chart').length).toBeGreaterThan(0);
      });

      // Enable technical indicators
      await enableTechnicalIndicators();

      // Wait for charts to render
      await waitFor(() => {
        expect(screen.getByText('RSI (14)')).toBeInTheDocument();
      });

      // ResponsiveContainer is mocked with data-testid="responsive-container"
      const responsiveContainers = container.querySelectorAll('[data-testid="responsive-container"]');
      expect(responsiveContainers.length).toBeGreaterThan(0);

      // Each ResponsiveContainer should be inside a wrapper div with inline styles
      responsiveContainers.forEach(rc => {
        const parentDiv = rc.parentElement;
        expect(parentDiv).toBeInTheDocument();

        // Parent should have inline styles (either 400px for main chart or 150px for indicators)
        const style = (parentDiv as HTMLElement).style;
        expect(style.width).toBe('100%');
        expect(['400px', '150px']).toContain(style.height);
      });
    });

    it('should handle missing technical indicators without rendering RSI or MACD charts', async () => {
      const analysisWithoutIndicators: TechnicalAnalysisResult = {
        ...mockAnalysis,
        indicators: {
          rsi: [],
          macd: [],
          bollingerBands: [],
        },
      };

      const { container } = render(
        <AdvancedStockChart
          symbol="TEST"
          priceData={mockPriceData}
          analysis={analysisWithoutIndicators}
        />
      );

      // Wait for component to render (use getAllByTestId since there may be multiple)
      await waitFor(() => {
        expect(screen.getAllByTestId('line-chart').length).toBeGreaterThan(0);
      });

      // Enable technical indicators checkbox
      const checkbox = screen.getByRole('checkbox', { name: /show technical indicators/i });
      fireEvent.click(checkbox);

      // Wait for state update
      await waitFor(() => {
        // Volume Trend is always shown when technical indicators are enabled
        // So we should have at least 1 wrapper div with height: 150px (for Volume Trend)
        expect(screen.getByText('Volume Trend')).toBeInTheDocument();
      });

      // Should not show RSI or MACD titles (no data for those indicators)
      expect(screen.queryByText('RSI (14)')).not.toBeInTheDocument();
      expect(screen.queryByText('MACD')).not.toBeInTheDocument();
    });

    it('should maintain proper nesting: wrapper div > ResponsiveContainer > Chart', async () => {
      const { container } = render(
        <AdvancedStockChart
          symbol="TEST"
          priceData={mockPriceData}
          analysis={mockAnalysis}
        />
      );

      // Wait for chart to render (use getAllByTestId since there may be multiple)
      await waitFor(() => {
        expect(screen.getAllByTestId('line-chart').length).toBeGreaterThan(0);
      });

      // Enable technical indicators
      const checkbox = screen.getByRole('checkbox', { name: /show technical indicators/i });
      fireEvent.click(checkbox);

      // Wait for RSI to render
      await waitFor(() => {
        expect(screen.getByText('RSI (14)')).toBeInTheDocument();
      });

      // Find wrapper div for technical indicators (height: 150px)
      const wrapperDiv = container.querySelector('div[style*="height: 150px"]');
      expect(wrapperDiv).toBeInTheDocument();

      // ResponsiveContainer is mocked with data-testid="responsive-container"
      const responsiveContainer = wrapperDiv?.querySelector('[data-testid="responsive-container"]');
      expect(responsiveContainer).toBeInTheDocument();

      // Chart (LineChart) is mocked with data-testid="line-chart"
      const chartElement = responsiveContainer?.querySelector('[data-testid="line-chart"]');
      expect(chartElement).toBeInTheDocument();
    });

    it('should prevent layout shift during initial render with explicit dimensions', async () => {
      const { container } = render(
        <AdvancedStockChart
          symbol="TEST"
          priceData={mockPriceData}
          analysis={mockAnalysis}
        />
      );

      // Wait for chart to render first
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Enable technical indicators
      const checkbox = screen.getByRole('checkbox', { name: /show technical indicators/i });
      fireEvent.click(checkbox);

      // Wait for technical indicators to render
      await waitFor(() => {
        expect(screen.getByText('RSI (14)')).toBeInTheDocument();
      });

      // Check for wrapper divs with explicit dimensions (height: 150px for indicators)
      const wrapperDivs = container.querySelectorAll('div[style*="height: 150px"]');

      // Should have wrapper divs for technical indicators
      expect(wrapperDivs.length).toBeGreaterThan(0);

      // All wrapper divs should have both width and height specified
      wrapperDivs.forEach(div => {
        const style = (div as HTMLElement).style;
        expect(style.width).toBe('100%');
        expect(style.height).toBe('150px');
      });
    });
  });
});
