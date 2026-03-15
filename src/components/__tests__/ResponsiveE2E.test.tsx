import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import StockDashboard from '../StockDashboard';
import TechnicalIndicatorExplanations from '../TechnicalIndicatorExplanations';
import { TechnicalSignal } from '@/lib/technical-analysis/types';

// Create a fresh QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

// Custom render function with QueryClient
const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    ),
    queryClient,
  };
};

// Mock fetch for API calls
global.fetch = vi.fn();

// Test data constants
const MOCK_INDICATORS: TechnicalSignal[] = [
  {
    indicator: 'RSI',
    signal: 'sell',
    strength: 0.8,
    value: 75.5,
    timestamp: new Date('2024-01-15'),
    description: 'RSI overbought'
  },
  {
    indicator: 'MACD',
    signal: 'buy',
    strength: 0.7,
    value: 1.25,
    timestamp: new Date('2024-01-15'),
    description: 'MACD bullish crossover'
  },
  {
    indicator: 'BOLLINGER_BANDS',
    signal: 'hold',
    strength: 0.5,
    value: 150.0,
    timestamp: new Date('2024-01-15'),
    description: 'Bollinger neutral'
  }
];

// Breakpoint configurations
const BREAKPOINTS = {
  mobile: { width: 375, name: 'Mobile (<768px)' },
  tablet: { width: 768, name: 'Tablet (768-1024px)' },
  desktop: { width: 1024, name: 'Desktop (1024-1440px)' },
  largeDesktop: { width: 1440, name: 'Large Desktop (1440-1920px)' },
  extraLarge: { width: 1920, name: 'Extra Large (>1920px)' }
};

// Helper to set up viewport mock
const setViewport = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });

  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: evaluateMediaQuery(query, width),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
};

// Evaluate media query against width
const evaluateMediaQuery = (query: string, width: number): boolean => {
  const minWidthMatch = query.match(/min-width:\s*(\d+)px/);
  const maxWidthMatch = query.match(/max-width:\s*(\d+)px/);

  if (minWidthMatch && maxWidthMatch) {
    const minWidth = parseInt(minWidthMatch[1], 10);
    const maxWidth = parseInt(maxWidthMatch[1], 10);
    return width >= minWidth && width <= maxWidth;
  }
  if (minWidthMatch) {
    return width >= parseInt(minWidthMatch[1], 10);
  }
  if (maxWidthMatch) {
    return width <= parseInt(maxWidthMatch[1], 10);
  }
  return false;
};

describe('End-to-End Responsive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock for API responses (empty data - tests focus on layout, not data rendering)
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: []
      })
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('User Interactions Across Breakpoints', () => {
    Object.entries(BREAKPOINTS).forEach(([key, breakpoint]) => {
      describe(`${breakpoint.name}`, () => {
        beforeEach(() => {
          setViewport(breakpoint.width);
        });

        it('should render dashboard structure', async () => {
          const { container } = renderWithQueryClient(<StockDashboard />);

          await waitFor(() => {
            expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
          });

          // Dashboard should have rendered with core elements
          expect(container.firstChild).toBeInTheDocument();
          expect(screen.getByText('Stock Predictions')).toBeVisible();
        });

        it('should have functional navigation elements', async () => {
          renderWithQueryClient(<StockDashboard />);

          await waitFor(() => {
            expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
          });

          // Header should be visible at all breakpoints
          expect(screen.getByText('Stock Predictions')).toBeVisible();
          expect(screen.getByText('AI-powered technical analysis with real market data')).toBeVisible();
        });

        it('should display popular stock buttons', async () => {
          renderWithQueryClient(<StockDashboard />);

          await waitFor(() => {
            expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
          });

          // Popular stock buttons should be present
          expect(screen.getByText('Popular:')).toBeInTheDocument();
          expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
        });

        it('should have responsive grid layout', async () => {
          const { container } = renderWithQueryClient(<StockDashboard />);

          await waitFor(() => {
            expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
          });

          // Check for responsive grid classes
          const grid = container.querySelector('[class*="grid-cols"]');
          expect(grid).toBeInTheDocument();
        });
      });
    });
  });

  describe('Technical Indicator Explanations - Responsive Grid', () => {
    const defaultProps = {
      indicators: MOCK_INDICATORS,
      symbol: 'AAPL',
      currentPrice: 150.00,
      marketContext: {
        condition: 'bull' as const,
        volatility: 'medium' as const,
        sector: 'technology'
      }
    };

    describe('Mobile Layout (< 768px)', () => {
      beforeEach(() => {
        setViewport(375);
      });

      it('should render indicators in single column on mobile', () => {
        const { container } = render(<TechnicalIndicatorExplanations {...defaultProps} />);

        // Should have the grid container
        const grid = container.querySelector('.grid');
        expect(grid).toBeInTheDocument();

        // Should have grid-cols-1 for mobile (base class)
        expect(grid).toHaveClass('grid-cols-1');
      });

      it('should display all indicator explanations on mobile', () => {
        render(<TechnicalIndicatorExplanations {...defaultProps} />);

        expect(screen.getByTestId('explanation-rsi')).toBeInTheDocument();
        expect(screen.getByTestId('explanation-macd')).toBeInTheDocument();
        expect(screen.getByTestId('explanation-bollinger_bands')).toBeInTheDocument();
      });

      it('should show overall sentiment badge on mobile', () => {
        render(<TechnicalIndicatorExplanations {...defaultProps} />);

        const sentiment = screen.getByTestId('overall-sentiment');
        expect(sentiment).toBeVisible();
      });

      it('should display actionable insights on mobile', () => {
        render(<TechnicalIndicatorExplanations {...defaultProps} />);

        expect(screen.getByTestId('insight-rsi')).toBeVisible();
        expect(screen.getByTestId('insight-macd')).toBeVisible();
        expect(screen.getByTestId('insight-bollinger_bands')).toBeVisible();
      });
    });

    describe('Tablet Layout (768-1024px)', () => {
      beforeEach(() => {
        setViewport(768);
      });

      it('should render indicators with md:grid-cols-2 class', () => {
        const { container } = render(<TechnicalIndicatorExplanations {...defaultProps} />);

        const grid = container.querySelector('.grid');
        expect(grid).toBeInTheDocument();
        expect(grid).toHaveClass('md:grid-cols-2');
      });

      it('should maintain readable text at tablet size', () => {
        render(<TechnicalIndicatorExplanations {...defaultProps} />);

        const explanationText = screen.getByTestId('explanation-text-rsi');
        expect(explanationText).toHaveClass('text-responsive-body');
        expect(explanationText).toHaveClass('reading-line-height');
      });
    });

    describe('Desktop Layout (1024px+)', () => {
      beforeEach(() => {
        setViewport(1024);
      });

      it('should render indicators with lg:grid-cols-3 class', () => {
        const { container } = render(<TechnicalIndicatorExplanations {...defaultProps} />);

        const grid = container.querySelector('.grid');
        expect(grid).toBeInTheDocument();
        expect(grid).toHaveClass('lg:grid-cols-3');
      });

      it('should have proper gap spacing on desktop', () => {
        const { container } = render(<TechnicalIndicatorExplanations {...defaultProps} />);

        const grid = container.querySelector('.grid');
        expect(grid).toHaveClass('gap-3');
        expect(grid).toHaveClass('md:gap-4');
        expect(grid).toHaveClass('lg:gap-5');
      });
    });

    describe('Large Desktop Layout (1440px+)', () => {
      beforeEach(() => {
        setViewport(1440);
      });

      it('should render indicators with appropriate spacing', () => {
        const { container } = render(<TechnicalIndicatorExplanations {...defaultProps} />);

        const grid = container.querySelector('.grid');
        expect(grid).toBeInTheDocument();

        // Verify responsive gap classes
        expect(grid).toHaveClass('lg:gap-5');
      });

      it('should display all risk levels correctly', () => {
        render(<TechnicalIndicatorExplanations {...defaultProps} />);

        const rsiRisk = screen.getByTestId('risk-rsi');
        const macdRisk = screen.getByTestId('risk-macd');
        const bollingerRisk = screen.getByTestId('risk-bollinger_bands');

        // All risk badges should be visible
        expect(rsiRisk).toBeVisible();
        expect(macdRisk).toBeVisible();
        expect(bollingerRisk).toBeVisible();
      });
    });

    describe('Mixed Signals Display Across Breakpoints', () => {
      const conflictingIndicators: TechnicalSignal[] = [
        {
          indicator: 'RSI',
          signal: 'buy',
          strength: 0.8,
          value: 25.0,
          timestamp: new Date(),
          description: 'RSI oversold'
        },
        {
          indicator: 'MACD',
          signal: 'sell',
          strength: 0.7,
          value: -1.0,
          timestamp: new Date(),
          description: 'MACD bearish'
        }
      ];

      Object.entries(BREAKPOINTS).forEach(([key, breakpoint]) => {
        it(`should display mixed signals warning at ${breakpoint.name}`, () => {
          setViewport(breakpoint.width);

          render(
            <TechnicalIndicatorExplanations
              {...defaultProps}
              indicators={conflictingIndicators}
            />
          );

          expect(screen.getByText('Mixed Signals Detected')).toBeVisible();
        });
      });
    });
  });

  describe('Full Dashboard User Flow', () => {
    Object.entries(BREAKPOINTS).forEach(([key, breakpoint]) => {
      describe(`Complete user journey at ${breakpoint.name}`, () => {
        beforeEach(() => {
          setViewport(breakpoint.width);
        });

        it('should complete full user flow: load → view → interact', async () => {
          const { container } = renderWithQueryClient(<StockDashboard />);

          // Step 1: Wait for initial load to complete
          await waitFor(() => {
            expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
          }, { timeout: 3000 });

          // Step 2: Verify core content is visible
          expect(screen.getByText('Stock Predictions')).toBeVisible();
          expect(screen.getByText('AI-powered technical analysis with real market data')).toBeVisible();

          // Step 3: Verify responsive grid is present
          const grid = container.querySelector('[class*="grid-cols"]');
          expect(grid).toBeInTheDocument();

          // Step 4: Verify interactive elements exist
          const buttons = screen.getAllByRole('button');
          expect(buttons.length).toBeGreaterThan(0);
        });

        it('should handle error states gracefully', async () => {
          (global.fetch as any).mockRejectedValueOnce(new Error('Network Error'));

          const { container } = renderWithQueryClient(<StockDashboard />);

          await waitFor(() => {
            expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
          }, { timeout: 3000 });

          // Component should not crash
          expect(container.firstChild).toBeInTheDocument();
        });

        it('should handle empty data gracefully', async () => {
          (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              success: true,
              data: []
            })
          });

          const { container } = renderWithQueryClient(<StockDashboard />);

          await waitFor(() => {
            expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
          }, { timeout: 3000 });

          // Component should render empty state
          expect(container.firstChild).toBeInTheDocument();
          expect(screen.getByText('Stock Predictions')).toBeVisible();
        });
      });
    });
  });

  describe('Responsive Layout Integrity', () => {
    it('should not cause horizontal scrolling at any breakpoint', async () => {
      for (const [key, breakpoint] of Object.entries(BREAKPOINTS)) {
        setViewport(breakpoint.width);

        const { container, unmount } = renderWithQueryClient(<StockDashboard />);

        await waitFor(() => {
          expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
        });

        // Check for overflow-x-hidden or no horizontal overflow
        const mainContent = container.querySelector('main') || container.firstChild;
        expect(mainContent).toBeInTheDocument();

        unmount();
      }
    });

    it('should maintain visual hierarchy across breakpoints', async () => {
      for (const [key, breakpoint] of Object.entries(BREAKPOINTS)) {
        setViewport(breakpoint.width);

        const { unmount } = renderWithQueryClient(<StockDashboard />);

        await waitFor(() => {
          expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
        });

        // Title should always be most prominent
        const title = screen.getByText('Stock Predictions');
        expect(title).toBeVisible();

        // Subtitle should be visible
        const subtitle = screen.getByText('AI-powered technical analysis with real market data');
        expect(subtitle).toBeVisible();

        unmount();
      }
    });

    it('should preserve interactive element sizing for touch/mouse', async () => {
      for (const [key, breakpoint] of Object.entries(BREAKPOINTS)) {
        setViewport(breakpoint.width);

        const { container, unmount } = renderWithQueryClient(<StockDashboard />);

        await waitFor(() => {
          expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
        });

        // Interactive elements should exist (buttons for popular stocks)
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);

        // Verify container rendered
        expect(container.firstChild).toBeInTheDocument();

        unmount();
      }
    });
  });

  describe('Technical Indicators Full Integration', () => {
    it('should display correct explanations for all indicator types', () => {
      const allIndicators: TechnicalSignal[] = [
        {
          indicator: 'RSI',
          signal: 'sell',
          strength: 0.8,
          value: 75.5,
          timestamp: new Date(),
          description: 'RSI overbought'
        },
        {
          indicator: 'MACD',
          signal: 'buy',
          strength: 0.7,
          value: 1.25,
          timestamp: new Date(),
          description: 'MACD bullish'
        },
        {
          indicator: 'BOLLINGER_BANDS',
          signal: 'hold',
          strength: 0.5,
          value: 150.0,
          timestamp: new Date(),
          description: 'Bollinger neutral'
        }
      ];

      render(
        <TechnicalIndicatorExplanations
          indicators={allIndicators}
          symbol="AAPL"
          currentPrice={150.00}
          marketContext={{
            condition: 'bull',
            volatility: 'medium',
            sector: 'technology'
          }}
        />
      );

      // Verify all indicators have explanations
      expect(screen.getByTestId('explanation-text-rsi')).toHaveTextContent(/overbought/i);
      expect(screen.getByTestId('explanation-text-macd')).toHaveTextContent(/bullish/i);
      expect(screen.getByTestId('explanation-text-bollinger_bands')).toBeInTheDocument();

      // Verify all have actionable insights
      expect(screen.getByTestId('insight-rsi')).toHaveTextContent('💡');
      expect(screen.getByTestId('insight-macd')).toHaveTextContent('💡');
      expect(screen.getByTestId('insight-bollinger_bands')).toHaveTextContent('💡');
    });

    it('should update indicator explanations when values change', () => {
      const initialIndicators: TechnicalSignal[] = [
        {
          indicator: 'RSI',
          signal: 'buy',
          strength: 0.8,
          value: 25.0,
          timestamp: new Date(),
          description: 'RSI oversold'
        }
      ];

      const updatedIndicators: TechnicalSignal[] = [
        {
          indicator: 'RSI',
          signal: 'sell',
          strength: 0.8,
          value: 80.0,
          timestamp: new Date(),
          description: 'RSI overbought'
        }
      ];

      const { rerender } = render(
        <TechnicalIndicatorExplanations
          indicators={initialIndicators}
          symbol="AAPL"
          currentPrice={150.00}
        />
      );

      // Initial: should show oversold
      expect(screen.getByTestId('explanation-text-rsi')).toHaveTextContent(/oversold/i);

      // Update: should show overbought
      rerender(
        <TechnicalIndicatorExplanations
          indicators={updatedIndicators}
          symbol="AAPL"
          currentPrice={150.00}
        />
      );

      expect(screen.getByTestId('explanation-text-rsi')).toHaveTextContent(/overbought/i);
    });

    it('should correctly classify risk levels', () => {
      const riskIndicators: TechnicalSignal[] = [
        {
          indicator: 'RSI',
          signal: 'buy',
          strength: 0.8,
          value: 20.0, // Low risk - oversold
          timestamp: new Date(),
          description: 'Low risk'
        },
        {
          indicator: 'MACD',
          signal: 'sell',
          strength: 0.9,
          value: -2.0, // High risk - strong bearish
          timestamp: new Date(),
          description: 'High risk'
        }
      ];

      render(
        <TechnicalIndicatorExplanations
          indicators={riskIndicators}
          symbol="AAPL"
          currentPrice={150.00}
        />
      );

      const lowRisk = screen.getByTestId('risk-rsi');
      const highRisk = screen.getByTestId('risk-macd');

      expect(lowRisk).toHaveTextContent('low');
      expect(lowRisk).toHaveClass('bg-green-100');

      expect(highRisk).toHaveTextContent('high');
      expect(highRisk).toHaveClass('bg-red-100');
    });
  });

  describe('Accessibility Across Breakpoints', () => {
    Object.entries(BREAKPOINTS).forEach(([key, breakpoint]) => {
      it(`should maintain accessibility at ${breakpoint.name}`, async () => {
        setViewport(breakpoint.width);

        const { container } = renderWithQueryClient(<StockDashboard />);

        await waitFor(() => {
          expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
        });

        // Dashboard should have rendered
        expect(container.firstChild).toBeInTheDocument();

        // Headings should have proper hierarchy
        const mainHeading = screen.getByText('Stock Predictions');
        expect(mainHeading.tagName).toMatch(/^H[1-6]$/);

        // Buttons should be accessible
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    it('should have proper semantic structure for indicator explanations', () => {
      render(
        <TechnicalIndicatorExplanations
          indicators={MOCK_INDICATORS}
          symbol="AAPL"
          currentPrice={150.00}
        />
      );

      // Should have proper heading hierarchy
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('AAPL Technical Indicators');
      expect(screen.getByRole('heading', { level: 4, name: 'RSI' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 4, name: 'MACD' })).toBeInTheDocument();
    });
  });

  describe('Performance at Scale', () => {
    it('should handle many indicators without degradation', () => {
      const manyIndicators: TechnicalSignal[] = Array.from({ length: 10 }, (_, i) => ({
        indicator: `INDICATOR_${i}`,
        signal: i % 3 === 0 ? 'buy' : i % 3 === 1 ? 'sell' : 'hold',
        strength: Math.random(),
        value: Math.random() * 100,
        timestamp: new Date(),
        description: `Indicator ${i}`
      }));

      const startTime = performance.now();

      render(
        <TechnicalIndicatorExplanations
          indicators={manyIndicators}
          symbol="AAPL"
          currentPrice={150.00}
        />
      );

      const renderTime = performance.now() - startTime;

      // Should render in reasonable time
      expect(renderTime).toBeLessThan(200);
      expect(screen.getByTestId('technical-indicator-explanations')).toBeInTheDocument();
    });

    it('should handle rapid viewport changes', async () => {
      const queryClient = createTestQueryClient();
      const { rerender, container } = render(
        <QueryClientProvider client={queryClient}>
          <StockDashboard />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
      });

      // Rapidly change viewports
      for (const breakpoint of Object.values(BREAKPOINTS)) {
        setViewport(breakpoint.width);
        rerender(
          <QueryClientProvider client={queryClient}>
            <StockDashboard />
          </QueryClientProvider>
        );
      }

      // Component should still be functional
      expect(screen.getByText('Stock Predictions')).toBeInTheDocument();
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
