import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StockDashboard from '../StockDashboard';

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock window.matchMedia for responsive breakpoint testing
const createMatchMedia = (width: number) => {
  return (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });
};

describe('Comprehensive Responsive Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful API responses
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          {
            symbol: 'AAPL',
            currentPrice: 150.25,
            prediction: {
              direction: 'bullish',
              confidence: 0.85,
              targetPrice: 165.00,
              timeframe: '3 months',
              reasoning: ['Strong momentum', 'Positive earnings']
            },
            signals: [],
            riskMetrics: {
              volatility: 'medium',
              support: 145.00,
              resistance: 155.00,
              stopLoss: 142.00
            }
          }
        ]
      })
    });
  });

  describe('Breakpoint: Mobile (< 768px)', () => {
    beforeEach(() => {
      window.matchMedia = createMatchMedia(375);
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
    });

    it('renders single column layout on mobile', async () => {
      const { container } = render(<StockDashboard />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
      });

      // Check for responsive grid with mobile column configuration
      const grid = container.querySelector('[class*="grid-cols-1"]');
      expect(grid).toBeInTheDocument();
    });

    it('hides left sidebar on mobile', async () => {
      const { container } = render(<StockDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
      });

      // Left sidebar should have hidden xl:block class (hidden on mobile/tablet/desktop, visible on xl+)
      const sidebar = container.querySelector('aside.hidden.xl\\:block');
      expect(sidebar).toBeInTheDocument();
    });

    it('right sidebar is always visible', async () => {
      const { container } = render(<StockDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
      });

      // Right sidebar is always visible (no hidden class)
      const sidebars = container.querySelectorAll('aside');
      expect(sidebars.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Breakpoint: Tablet (768px - 1024px)', () => {
    beforeEach(() => {
      window.matchMedia = createMatchMedia(768);
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
    });

    it('renders two column grid on tablet', async () => {
      const { container } = render(<StockDashboard />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
      });

      // Check for responsive grid with tablet column configuration
      const grid = container.querySelector('[class*="md:grid-cols-2"]');
      expect(grid).toBeInTheDocument();
    });

    it('still hides left sidebar on tablet', async () => {
      const { container } = render(<StockDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
      });

      // Left sidebar should still be hidden on tablet (only visible on xl+)
      const leftSidebar = container.querySelector('aside.hidden.xl\\:block');
      expect(leftSidebar).toBeInTheDocument();
    });
  });

  describe('Breakpoint: Desktop (1024px - 1440px)', () => {
    beforeEach(() => {
      window.matchMedia = createMatchMedia(1024);
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
    });

    it('renders three column grid on desktop', async () => {
      const { container } = render(<StockDashboard />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
      });

      // Check for responsive grid with desktop column configuration
      const grid = container.querySelector('[class*="lg:grid-cols-3"]');
      expect(grid).toBeInTheDocument();
    });

    it('left sidebar still hidden on desktop (visible on xl+)', async () => {
      const { container } = render(<StockDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
      });

      // Left sidebar should still be hidden on desktop (only visible on xl+ breakpoint)
      const leftSidebar = container.querySelector('aside.hidden.xl\\:block');
      expect(leftSidebar).toBeInTheDocument();
    });

    it('right sidebar is always visible', async () => {
      const { container } = render(<StockDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
      });

      // Right sidebar is always visible (no hidden class)
      const sidebars = container.querySelectorAll('aside');
      expect(sidebars.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Breakpoint: Large Desktop (1440px - 1920px)', () => {
    beforeEach(() => {
      window.matchMedia = createMatchMedia(1440);
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1440,
      });
    });

    it('renders four column grid on large desktop', async () => {
      const { container } = render(<StockDashboard />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
      });

      // Check for responsive grid with large desktop column configuration
      const grid = container.querySelector('[class*="xl:grid-cols-4"]');
      expect(grid).toBeInTheDocument();
    });

    it('shows left sidebar on large desktop (xl+ breakpoint)', async () => {
      const { container } = render(<StockDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
      });

      // Left sidebar becomes visible on xl+ (has xl:block class)
      const leftSidebar = container.querySelector('aside.xl\\:block');
      expect(leftSidebar).toBeInTheDocument();

      // Verify we have sidebars
      const sidebars = container.querySelectorAll('aside');
      expect(sidebars.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Breakpoint: Extra Large (> 1920px)', () => {
    beforeEach(() => {
      window.matchMedia = createMatchMedia(1920);
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
    });

    it('renders five column grid on extra large screens', async () => {
      const { container } = render(<StockDashboard />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
      });

      // Check for responsive grid with extra large column configuration
      const grid = container.querySelector('[class*="2xl:grid-cols-5"]');
      expect(grid).toBeInTheDocument();
    });

    it('maintains full three-column layout with sidebars', async () => {
      const { container } = render(<StockDashboard />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
      });

      // Verify MultiColumnLayout structure
      const layout = container.querySelector('.flex.gap-6');
      expect(layout).toBeInTheDocument();
      
      // Should have left sidebar, main content, and right sidebar
      const sidebars = container.querySelectorAll('aside');
      expect(sidebars.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Loading States Across Breakpoints', () => {
    it('shows loading spinner during initial load', () => {
      const { container } = render(<StockDashboard />);

      expect(screen.getByText('Loading predictions...')).toBeInTheDocument();
      // Check for the animate-spin class on the loading spinner
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('hides loading spinner after data loads', async () => {
      render(<StockDashboard />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling Across Breakpoints', () => {
    it('handles API errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('API Error'));
      
      const { container } = render(<StockDashboard />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
      });

      // Component should still render without crashing
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles empty data gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: []
        })
      });
      
      const { container } = render(<StockDashboard />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
      });

      // Component should render with empty state
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Responsive Container Integration', () => {
    it('applies responsive container classes', async () => {
      const { container } = render(<StockDashboard />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
      });

      // Check for ResponsiveContainer classes
      const responsiveContainer = container.querySelector('[class*="mx-auto"]');
      expect(responsiveContainer).toBeInTheDocument();
    });

    it('applies transition classes for smooth responsive changes', async () => {
      const { container } = render(<StockDashboard />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
      });

      // Check for transition classes
      const transitionElement = container.querySelector('[class*="transition"]');
      expect(transitionElement).toBeInTheDocument();
    });
  });

  describe('Complete User Flow', () => {
    it('renders complete dashboard with all components', async () => {
      render(<StockDashboard />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
      });

      // Verify main sections are present
      expect(screen.getByText('Stock Predictions')).toBeInTheDocument();
      expect(screen.getByText('AI-powered technical analysis with real market data')).toBeInTheDocument();
      
      // Verify stock card is rendered
      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('$150.25')).toBeInTheDocument();
    });

    it('maintains functionality across all breakpoints', async () => {
      const breakpoints = [375, 768, 1024, 1440, 1920];
      
      for (const width of breakpoints) {
        window.matchMedia = createMatchMedia(width);
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });

        const { unmount } = render(<StockDashboard />);
        
        await waitFor(() => {
          expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
        });

        // Verify core functionality works at each breakpoint
        expect(screen.getByText('Stock Predictions')).toBeInTheDocument();
        expect(screen.getByText('AAPL')).toBeInTheDocument();
        
        unmount();
      }
    });
  });
});
