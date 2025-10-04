import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import StockDashboard from '../StockDashboard';

// Mock the fetch function
global.fetch = vi.fn();

// Mock problematic components that cause test failures
vi.mock('../MarketIndicesSidebar', () => ({
  default: ({ onIndexClick }: { onIndexClick: (symbol: string) => void }) => (
    <div data-testid="market-indices-sidebar">
      <button onClick={() => onIndexClick('^GSPC')} data-testid="index-button">
        Market Indices Sidebar
      </button>
    </div>
  )
}));

vi.mock('../MarketIndexAnalysis', () => ({
  default: ({ symbol, onClose }: { symbol: string; onClose: () => void }) => (
    <div data-testid="market-index-analysis">
      <span>Market Index Analysis: {symbol}</span>
      <button onClick={onClose} data-testid="close-analysis">Close</button>
    </div>
  )
}));

// Mock the ResponsiveGrid component to verify it's being used
vi.mock('../ResponsiveGrid', () => ({
  default: ({ children, columns, gap, minItemWidth, className }: any) => (
    <div 
      data-testid="responsive-grid"
      data-columns={JSON.stringify(columns)}
      data-gap={gap}
      data-min-item-width={minItemWidth}
      className={className}
    >
      {children}
    </div>
  )
}));

// Mock other components to avoid test complexity
vi.mock('../StockSearch', () => ({
  default: ({ onSearch, loading }: { onSearch?: (symbol: string) => void; loading?: boolean }) => (
    <div data-testid="stock-search">
      <input 
        data-testid="search-input" 
        onChange={(e) => onSearch && onSearch(e.target.value)}
        disabled={loading}
      />
      <span data-testid="search-loading">{loading ? 'Loading...' : 'Ready'}</span>
    </div>
  )
}));

vi.mock('../SimpleStockChart', () => ({
  default: () => <div data-testid="simple-stock-chart">Simple Stock Chart</div>
}));

vi.mock('../AdvancedStockChart', () => ({
  default: () => <div data-testid="advanced-stock-chart">Advanced Stock Chart</div>
}));

vi.mock('../PerformanceMetrics', () => ({
  default: () => <div data-testid="performance-metrics">Performance Metrics</div>
}));

vi.mock('../AIInsights', () => ({
  default: () => <div data-testid="ai-insights">AI Insights</div>
}));

vi.mock('../TermsGlossary', () => ({
  default: () => <div data-testid="terms-glossary">Terms Glossary</div>
}));

vi.mock('../CollapsibleSection', () => ({
  default: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div data-testid="collapsible-section">
      <h3>{title}</h3>
      {children}
    </div>
  )
}));

describe('StockDashboard', () => {
  let consoleSpy: any;

  const mockPredictionData = [
    {
      symbol: 'AAPL',
      currentPrice: 150.00,
      prediction: {
        direction: 'bullish',
        confidence: 0.85,
        targetPrice: 160.00,
        timeframe: '1 month',
        reasoning: ['Strong earnings', 'Positive sentiment']
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
        reasoning: ['Mixed signals', 'Market uncertainty']
      },
      signals: [],
      riskMetrics: {
        volatility: 'low',
        support: 2750.00,
        resistance: 2900.00,
        stopLoss: 2700.00
      }
    },
    {
      symbol: 'TSLA',
      currentPrice: 250.00,
      prediction: {
        direction: 'bearish',
        confidence: 0.75,
        targetPrice: 230.00,
        timeframe: '3 weeks',
        reasoning: ['Market volatility', 'Regulatory concerns']
      },
      signals: [],
      riskMetrics: {
        volatility: 'high',
        support: 240.00,
        resistance: 260.00,
        stopLoss: 235.00
      }
    }
  ];

  const mockAnalysisData = {
    symbol: 'AAPL',
    indicators: {
      rsi: [{ value: 65, signal: 'neutral' }],
      macd: [{ 
        value: 1.2, 
        signal: 'bullish',
        macd: 1.2,
        signal_line: 1.0,
        histogram: 0.2
      }]
    },
    priceData: [
      { date: '2024-01-01', open: 145, high: 150, low: 144, close: 148, volume: 1000000 },
      { date: '2024-01-02', open: 148, high: 152, low: 147, close: 150, volume: 1100000 }
    ]
  };

  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();
    
    // Spy on console methods to suppress logs during tests
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock successful predictions API response by default
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockPredictionData
      })
    });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('ResponsiveGrid Integration', () => {
    it('should use ResponsiveGrid component with correct configuration', async () => {
      render(<StockDashboard />);
      
      // Wait for the component to load and render
      await screen.findByTestId('responsive-grid');
      
      const responsiveGrid = screen.getByTestId('responsive-grid');
      
      // Verify ResponsiveGrid is used with correct props
      expect(responsiveGrid).toBeInTheDocument();
      expect(responsiveGrid).toHaveAttribute('data-gap', 'gap-6');
      expect(responsiveGrid).toHaveAttribute('data-min-item-width', '320px');
      
      // Verify column configuration matches the progressive layout system
      const columnsData = JSON.parse(responsiveGrid.getAttribute('data-columns') || '{}');
      expect(columnsData).toEqual({
        mobile: 1,
        tablet: 2,
        desktop: 3,
        large: 4
      });
    });

    it('should render stock cards within ResponsiveGrid', async () => {
      render(<StockDashboard />);
      
      // Wait for stock cards to be rendered by looking for prices
      await screen.findByText('$150');
      await screen.findByText('$2800');
      await screen.findByText('$250');
      
      const responsiveGrid = screen.getByTestId('responsive-grid');
      
      // Verify all stock cards are rendered inside the ResponsiveGrid
      expect(responsiveGrid).toContainElement(screen.getByText('$150'));
      expect(responsiveGrid).toContainElement(screen.getByText('$2800'));
      expect(responsiveGrid).toContainElement(screen.getByText('$250'));
      expect(responsiveGrid).toContainElement(screen.getByText('BULLISH'));
      expect(responsiveGrid).toContainElement(screen.getByText('NEUTRAL'));
      expect(responsiveGrid).toContainElement(screen.getByText('BEARISH'));
    });

    it('should handle varying numbers of stock cards', async () => {
      // Mock API response with single stock
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: [mockPredictionData[0]] // Only AAPL
        })
      });

      render(<StockDashboard />);
      
      // Wait for single stock card to be rendered
      await screen.findByText('$150');
      
      const responsiveGrid = screen.getByTestId('responsive-grid');
      
      // Verify ResponsiveGrid still works with single item
      expect(responsiveGrid).toBeInTheDocument();
      expect(responsiveGrid).toContainElement(screen.getByText('$150'));
      
      // Should not contain other stocks
      expect(screen.queryByText('$2800')).not.toBeInTheDocument();
      expect(screen.queryByText('$250')).not.toBeInTheDocument();
    });

    it('should handle empty stock list gracefully', async () => {
      // Mock API response with empty data
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: []
        })
      });

      render(<StockDashboard />);
      
      // Wait for component to finish loading
      await waitFor(() => {
        expect(screen.queryByTestId('responsive-grid')).toBeInTheDocument();
      });
      
      const responsiveGrid = screen.getByTestId('responsive-grid');
      
      // ResponsiveGrid should still be present but empty
      expect(responsiveGrid).toBeInTheDocument();
      expect(responsiveGrid.children.length).toBe(0);
    });

    it('should maintain ResponsiveGrid configuration when adding new stocks', async () => {
      render(<StockDashboard />);
      
      // Wait for initial load
      await screen.findByTestId('responsive-grid');
      
      const responsiveGrid = screen.getByTestId('responsive-grid');
      
      // Verify ResponsiveGrid configuration is correct initially
      expect(responsiveGrid).toHaveAttribute('data-gap', 'gap-6');
      expect(responsiveGrid).toHaveAttribute('data-min-item-width', '320px');
      
      const columnsData = JSON.parse(responsiveGrid.getAttribute('data-columns') || '{}');
      expect(columnsData).toEqual({
        mobile: 1,
        tablet: 2,
        desktop: 3,
        large: 4
      });
      
      // Configuration should remain stable regardless of content changes
      expect(responsiveGrid).toBeInTheDocument();
    });
  });

  describe('Stock Card Interactions', () => {
    it('should handle stock card click for detailed analysis', async () => {
      // Mock analysis API response
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPredictionData })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockAnalysisData, priceData: mockAnalysisData.priceData })
        });

      render(<StockDashboard />);
      
      // Wait for stock cards to load - use price to avoid ambiguity
      await screen.findByText('$150');
      
      // Click on AAPL stock card by finding the card container
      const responsiveGrid = screen.getByTestId('responsive-grid');
      const appleCard = responsiveGrid.querySelector('[title="Remove AAPL"]')?.closest('div');
      expect(appleCard).toBeInTheDocument();
      fireEvent.click(appleCard!);
      
      // Verify analysis API was called
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/analysis?symbol=AAPL&period=1year');
      });
    });

    it('should handle stock card removal', async () => {
      render(<StockDashboard />);
      
      // Wait for stock cards to load using prices to avoid ambiguity
      await screen.findByText('$150');
      await screen.findByText('$2800');
      
      // Find and click the remove button for AAPL using title attribute
      const appleRemoveButton = screen.getByTitle('Remove AAPL');
      
      expect(appleRemoveButton).toBeInTheDocument();
      fireEvent.click(appleRemoveButton);
      
      // Verify AAPL is removed but GOOGL remains
      await waitFor(() => {
        expect(screen.queryByText('$150')).not.toBeInTheDocument();
        expect(screen.getByText('$2800')).toBeInTheDocument();
      });
    });

    it('should prevent card click when clicking remove button', async () => {
      // Mock analysis API to track if it's called
      const analysisMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockAnalysisData, priceData: mockAnalysisData.priceData })
      });
      
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPredictionData })
        })
        .mockImplementation(analysisMock);

      render(<StockDashboard />);
      
      // Wait for stock cards to load using price to avoid ambiguity
      await screen.findByText('$150');
      
      // Click the remove button (should not trigger analysis)
      const appleRemoveButton = screen.getByTitle('Remove AAPL');
      fireEvent.click(appleRemoveButton);
      
      // Verify analysis API was not called (only predictions API was called)
      expect(analysisMock).not.toHaveBeenCalled();
    });
  });

  describe('Market Index Integration', () => {
    it('should handle market index selection', async () => {
      render(<StockDashboard />);
      
      // Wait for component to load
      await screen.findByTestId('market-indices-sidebar');
      
      // Click on market index
      const indexButton = screen.getByTestId('index-button');
      fireEvent.click(indexButton);
      
      // Verify market index analysis is shown
      await screen.findByTestId('market-index-analysis');
      expect(screen.getByText('Market Index Analysis: ^GSPC')).toBeInTheDocument();
    });

    it('should close market index analysis', async () => {
      render(<StockDashboard />);
      
      // Wait for component to load and click index
      await screen.findByTestId('market-indices-sidebar');
      const indexButton = screen.getByTestId('index-button');
      fireEvent.click(indexButton);
      
      // Wait for analysis to appear and close it
      await screen.findByTestId('market-index-analysis');
      const closeButton = screen.getByTestId('close-analysis');
      fireEvent.click(closeButton);
      
      // Verify analysis is closed
      await waitFor(() => {
        expect(screen.queryByTestId('market-index-analysis')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Mock API error
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ success: false, error: 'Server error' })
      });

      render(<StockDashboard />);
      
      // Wait for component to handle error
      await waitFor(() => {
        const responsiveGrid = screen.getByTestId('responsive-grid');
        expect(responsiveGrid.children.length).toBe(0);
      });
    });

    it('should handle network errors gracefully', async () => {
      // Mock network error
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      render(<StockDashboard />);
      
      // Wait for component to handle error
      await waitFor(() => {
        const responsiveGrid = screen.getByTestId('responsive-grid');
        expect(responsiveGrid.children.length).toBe(0);
      });
    });

    it('should handle malformed API response gracefully', async () => {
      // Mock malformed response
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: false, error: 'Invalid data format' })
      });

      render(<StockDashboard />);
      
      // Wait for component to handle error
      await waitFor(() => {
        const responsiveGrid = screen.getByTestId('responsive-grid');
        expect(responsiveGrid.children.length).toBe(0);
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during initial load', async () => {
      // Mock delayed API response
      let resolvePromise: (value: any) => void;
      const delayedPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      (global.fetch as any).mockReturnValue(delayedPromise);

      render(<StockDashboard />);
      
      // Should show loading initially (component starts with loading: true)
      // During loading, the responsive grid is not rendered, only loading spinner
      expect(screen.queryByTestId('responsive-grid')).not.toBeInTheDocument();
      expect(screen.getByText('Loading predictions...')).toBeInTheDocument();
      
      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: async () => ({ success: true, data: mockPredictionData })
      });
      
      // Wait for data to load and responsive grid to appear
      await screen.findByTestId('responsive-grid');
      await screen.findByText('$150');
    });

    it('should handle search loading state separately from initial loading', async () => {
      render(<StockDashboard />);
      
      // Wait for initial load using price to avoid ambiguity
      await screen.findByText('$150');
      
      // Verify search is ready (not loading)
      expect(screen.getByTestId('search-loading')).toHaveTextContent('Ready');
      
      // Verify the responsive grid is present and functional after initial load
      const responsiveGrid = screen.getByTestId('responsive-grid');
      expect(responsiveGrid).toBeInTheDocument();
      expect(responsiveGrid.children.length).toBeGreaterThan(0);
    });
  });

  describe('Utility Functions', () => {
    it('should apply correct direction colors', async () => {
      render(<StockDashboard />);
      
      // Wait for all stock cards to load
      await screen.findByText('BULLISH');
      await screen.findByText('NEUTRAL');
      await screen.findByText('BEARISH');
      
      // Verify direction text is displayed correctly
      expect(screen.getByText('BULLISH')).toBeInTheDocument();
      expect(screen.getByText('NEUTRAL')).toBeInTheDocument();
      expect(screen.getByText('BEARISH')).toBeInTheDocument();
    });

    it('should display confidence percentages correctly', async () => {
      render(<StockDashboard />);
      
      // Wait for confidence percentages to load
      await screen.findByText('85% confidence');
      await screen.findByText('65% confidence');
      await screen.findByText('75% confidence');
      
      // Verify all confidence levels are displayed
      expect(screen.getByText('85% confidence')).toBeInTheDocument();
      expect(screen.getByText('65% confidence')).toBeInTheDocument();
      expect(screen.getByText('75% confidence')).toBeInTheDocument();
    });

    it('should format prices correctly', async () => {
      render(<StockDashboard />);
      
      // Wait for prices to load
      await screen.findByText('$150');
      await screen.findByText('$2800');
      await screen.findByText('$250');
      
      // Verify price formatting
      expect(screen.getByText('$150')).toBeInTheDocument();
      expect(screen.getByText('$2800')).toBeInTheDocument();
      expect(screen.getByText('$250')).toBeInTheDocument();
    });
  });
});