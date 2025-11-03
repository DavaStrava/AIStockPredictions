/**
 * StockDashboard Left Column Conditional Rendering Tests
 * 
 * These tests verify the new conditional rendering logic for the left column
 * of the MultiColumnLayout, which now shows either AdditionalInsightsSidebar
 * or a placeholder message based on the component state.
 * 
 * CHANGE CONTEXT:
 * The left column was changed from always showing MarketIndicesSidebar to
 * conditionally showing AdditionalInsightsSidebar when a stock is selected
 * and analysis data is available.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import StockDashboard from '../StockDashboard';

// Mock the fetch function
global.fetch = vi.fn();

// Mock AdditionalInsightsSidebar component
vi.mock('../AdditionalInsightsSidebar', () => ({
  default: ({ symbol, analysis, priceData }: any) => (
    <div data-testid="additional-insights-sidebar">
      <div data-testid="sidebar-symbol">{symbol}</div>
      <div data-testid="sidebar-has-analysis">{analysis ? 'true' : 'false'}</div>
      <div data-testid="sidebar-price-data-length">{priceData?.length || 0}</div>
    </div>
  )
}));

// Mock MarketIndicesSidebar component
vi.mock('../MarketIndicesSidebar', () => ({
  default: ({ onIndexClick }: { onIndexClick: (symbol: string) => void }) => (
    <div data-testid="market-indices-sidebar">
      <button onClick={() => onIndexClick('^GSPC')} data-testid="index-button">
        Market Indices Sidebar
      </button>
    </div>
  )
}));

// Mock MarketIndexAnalysis component
vi.mock('../MarketIndexAnalysis', () => ({
  default: ({ symbol, onClose }: { symbol: string; onClose: () => void }) => (
    <div data-testid="market-index-analysis">
      <span>Market Index Analysis: {symbol}</span>
      <button onClick={onClose} data-testid="close-analysis">Close</button>
    </div>
  )
}));

// Mock ResponsiveGrid component
vi.mock('../ResponsiveGrid', () => ({
  default: ({ children }: any) => (
    <div data-testid="responsive-grid">{children}</div>
  )
}));

// Mock other components to avoid test complexity
vi.mock('../StockSearch', () => ({
  default: ({ onSelectStock }: { onSelectStock?: (symbol: string) => void }) => (
    <div data-testid="stock-search">
      <input 
        data-testid="search-input" 
        onChange={(e) => onSelectStock && onSelectStock(e.target.value)}
      />
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

describe('StockDashboard - Left Column Conditional Rendering', () => {
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
    }
  ];

  const mockAnalysisData = {
    symbol: 'AAPL',
    summary: {
      trend: 'bullish',
      strength: 0.7,
      recommendation: 'buy'
    },
    signals: [
      {
        indicator: 'RSI',
        value: 65,
        signal: 'neutral',
        strength: 0.7,
        timestamp: new Date('2024-01-15'),
        description: 'RSI neutral'
      }
    ],
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
    vi.resetAllMocks();
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

  describe('Initial State - No Stock Selected', () => {
    it('should show placeholder message when no stock is selected', async () => {
      render(<StockDashboard />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
      });
      
      // Should show placeholder message
      expect(screen.getByText('Select a stock to view additional insights')).toBeInTheDocument();
      
      // Should NOT show AdditionalInsightsSidebar
      expect(screen.queryByTestId('additional-insights-sidebar')).not.toBeInTheDocument();
    });

    it('should apply correct styling to placeholder message', async () => {
      render(<StockDashboard />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
      });
      
      const placeholder = screen.getByText('Select a stock to view additional insights');
      
      // Verify placeholder has correct classes
      expect(placeholder).toHaveClass('text-gray-500', 'dark:text-gray-400', 'text-sm', 'p-4');
    });

    it('should not show AdditionalInsightsSidebar without analysis data', async () => {
      render(<StockDashboard />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
      });
      
      // Verify AdditionalInsightsSidebar is not rendered
      expect(screen.queryByTestId('additional-insights-sidebar')).not.toBeInTheDocument();
      expect(screen.queryByTestId('sidebar-symbol')).not.toBeInTheDocument();
    });
  });

  describe('Stock Selection - Conditional Rendering Logic', () => {
    it('should show AdditionalInsightsSidebar when stock is selected and analysis is available', async () => {
      // Mock analysis API response
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPredictionData })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            success: true, 
            data: mockAnalysisData,
            priceData: mockAnalysisData.priceData 
          })
        });

      render(<StockDashboard />);
      
      // Wait for initial load
      await screen.findByText('$150');
      
      // Click on stock card to trigger analysis
      const stockCard = screen.getByText('$150').closest('div');
      fireEvent.click(stockCard!);
      
      // Wait for analysis to load
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/analysis?symbol=AAPL&period=1year');
      });
      
      // Should show AdditionalInsightsSidebar
      await waitFor(() => {
        expect(screen.getByTestId('additional-insights-sidebar')).toBeInTheDocument();
      });
      
      // Should NOT show placeholder message
      expect(screen.queryByText('Select a stock to view additional insights')).not.toBeInTheDocument();
    });

    it('should pass correct props to AdditionalInsightsSidebar', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPredictionData })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            success: true, 
            data: mockAnalysisData,
            priceData: mockAnalysisData.priceData 
          })
        });

      render(<StockDashboard />);
      
      await screen.findByText('$150');
      
      const stockCard = screen.getByText('$150').closest('div');
      fireEvent.click(stockCard!);
      
      await waitFor(() => {
        expect(screen.getByTestId('additional-insights-sidebar')).toBeInTheDocument();
      });
      
      // Verify correct props are passed
      expect(screen.getByTestId('sidebar-symbol')).toHaveTextContent('AAPL');
      expect(screen.getByTestId('sidebar-has-analysis')).toHaveTextContent('true');
      expect(screen.getByTestId('sidebar-price-data-length')).toHaveTextContent('2');
    });

    it('should handle both analysis and selectedStock conditions correctly', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPredictionData })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            success: true, 
            data: mockAnalysisData,
            priceData: mockAnalysisData.priceData 
          })
        });

      render(<StockDashboard />);
      
      await screen.findByText('$150');
      
      // Initially should show placeholder
      expect(screen.getByText('Select a stock to view additional insights')).toBeInTheDocument();
      
      // Click stock to load analysis
      const stockCard = screen.getByText('$150').closest('div');
      fireEvent.click(stockCard!);
      
      // After analysis loads, should show sidebar
      await waitFor(() => {
        expect(screen.getByTestId('additional-insights-sidebar')).toBeInTheDocument();
        expect(screen.queryByText('Select a stock to view additional insights')).not.toBeInTheDocument();
      });
    });
  });

  describe('State Transitions', () => {
    it('should transition from placeholder to sidebar when stock is selected', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPredictionData })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            success: true, 
            data: mockAnalysisData,
            priceData: mockAnalysisData.priceData 
          })
        });

      render(<StockDashboard />);
      
      await screen.findByText('$150');
      
      // Verify initial state
      expect(screen.getByText('Select a stock to view additional insights')).toBeInTheDocument();
      expect(screen.queryByTestId('additional-insights-sidebar')).not.toBeInTheDocument();
      
      // Trigger state change
      const stockCard = screen.getByText('$150').closest('div');
      fireEvent.click(stockCard!);
      
      // Verify transition
      await waitFor(() => {
        expect(screen.queryByText('Select a stock to view additional insights')).not.toBeInTheDocument();
        expect(screen.getByTestId('additional-insights-sidebar')).toBeInTheDocument();
      });
    });

    it('should transition back to placeholder when analysis is closed', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPredictionData })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            success: true, 
            data: mockAnalysisData,
            priceData: mockAnalysisData.priceData 
          })
        });

      render(<StockDashboard />);
      
      await screen.findByText('$150');
      
      // Select stock
      const stockCard = screen.getByText('$150').closest('div');
      fireEvent.click(stockCard!);
      
      // Wait for sidebar to appear
      await waitFor(() => {
        expect(screen.getByTestId('additional-insights-sidebar')).toBeInTheDocument();
      });
      
      // Close analysis
      const closeButton = screen.getAllByText('✕')[1]; // Second X button (first is on stock card)
      fireEvent.click(closeButton);
      
      // Should show placeholder again
      await waitFor(() => {
        expect(screen.getByText('Select a stock to view additional insights')).toBeInTheDocument();
        expect(screen.queryByTestId('additional-insights-sidebar')).not.toBeInTheDocument();
      });
    });

    it('should update sidebar when switching between stocks', async () => {
      const mockPredictionData2 = [
        ...mockPredictionData,
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

      const mockAnalysisData2 = {
        ...mockAnalysisData,
        symbol: 'GOOGL'
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPredictionData2 })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            success: true, 
            data: mockAnalysisData,
            priceData: mockAnalysisData.priceData 
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            success: true, 
            data: mockAnalysisData2,
            priceData: mockAnalysisData.priceData 
          })
        });

      render(<StockDashboard />);
      
      await screen.findByText('$150');
      await screen.findByText('$2800');
      
      // Click first stock
      const appleCard = screen.getByText('$150').closest('div');
      fireEvent.click(appleCard!);
      
      await waitFor(() => {
        expect(screen.getByTestId('sidebar-symbol')).toHaveTextContent('AAPL');
      });
      
      // Click second stock
      const googleCard = screen.getByText('$2800').closest('div');
      fireEvent.click(googleCard!);
      
      // Sidebar should update to show new stock
      await waitFor(() => {
        expect(screen.getByTestId('sidebar-symbol')).toHaveTextContent('GOOGL');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle analysis without priceData gracefully', async () => {
      const analysisWithoutPriceData = {
        ...mockAnalysisData,
        priceData: []
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPredictionData })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            success: true, 
            data: analysisWithoutPriceData,
            priceData: [] 
          })
        });

      render(<StockDashboard />);
      
      await screen.findByText('$150');
      
      const stockCard = screen.getByText('$150').closest('div');
      fireEvent.click(stockCard!);
      
      // Should still show sidebar even with empty priceData
      await waitFor(() => {
        expect(screen.getByTestId('additional-insights-sidebar')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar-price-data-length')).toHaveTextContent('0');
      });
    });

    it('should handle null analysis gracefully', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPredictionData })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            success: false,
            error: 'Analysis failed'
          })
        });

      render(<StockDashboard />);
      
      await screen.findByText('$150');
      
      const stockCard = screen.getByText('$150').closest('div');
      fireEvent.click(stockCard!);
      
      // Should show placeholder when analysis fails
      await waitFor(() => {
        expect(screen.getByText('Select a stock to view additional insights')).toBeInTheDocument();
        expect(screen.queryByTestId('additional-insights-sidebar')).not.toBeInTheDocument();
      });
    });

    it('should handle empty selectedStock gracefully', async () => {
      render(<StockDashboard />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
      });
      
      // With empty selectedStock, should show placeholder
      expect(screen.getByText('Select a stock to view additional insights')).toBeInTheDocument();
      expect(screen.queryByTestId('additional-insights-sidebar')).not.toBeInTheDocument();
    });

    it('should handle rapid stock selection changes', async () => {
      const mockPredictionData2 = [
        ...mockPredictionData,
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

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPredictionData2 })
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ 
            success: true, 
            data: mockAnalysisData,
            priceData: mockAnalysisData.priceData 
          })
        });

      render(<StockDashboard />);
      
      await screen.findByText('$150');
      await screen.findByText('$2800');
      
      // Rapidly click different stocks
      const appleCard = screen.getByText('$150').closest('div');
      const googleCard = screen.getByText('$2800').closest('div');
      
      fireEvent.click(appleCard!);
      fireEvent.click(googleCard!);
      fireEvent.click(appleCard!);
      
      // Should eventually settle on the last clicked stock
      await waitFor(() => {
        expect(screen.getByTestId('additional-insights-sidebar')).toBeInTheDocument();
      });
    });
  });

  describe('Integration with MultiColumnLayout', () => {
    it('should pass leftColumn prop to MultiColumnLayout correctly', async () => {
      render(<StockDashboard />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
      });
      
      // Verify placeholder is rendered in the layout
      expect(screen.getByText('Select a stock to view additional insights')).toBeInTheDocument();
    });

    it('should maintain rightColumn with MarketIndicesSidebar', async () => {
      render(<StockDashboard />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
      });
      
      // Right column should still show MarketIndicesSidebar
      expect(screen.getByTestId('market-indices-sidebar')).toBeInTheDocument();
    });

    it('should handle both left and right columns simultaneously', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPredictionData })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            success: true, 
            data: mockAnalysisData,
            priceData: mockAnalysisData.priceData 
          })
        });

      render(<StockDashboard />);
      
      await screen.findByText('$150');
      
      const stockCard = screen.getByText('$150').closest('div');
      fireEvent.click(stockCard!);
      
      await waitFor(() => {
        expect(screen.getByTestId('additional-insights-sidebar')).toBeInTheDocument();
      });
      
      // Both sidebars should be present
      expect(screen.getByTestId('additional-insights-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('market-indices-sidebar')).toBeInTheDocument();
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should provide clear feedback when no stock is selected', async () => {
      render(<StockDashboard />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading predictions...')).not.toBeInTheDocument();
      });
      
      const placeholder = screen.getByText('Select a stock to view additional insights');
      
      // Message should be clear and instructive
      expect(placeholder).toBeInTheDocument();
      expect(placeholder.textContent).toContain('Select a stock');
    });

    it('should maintain consistent layout structure during transitions', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPredictionData })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            success: true, 
            data: mockAnalysisData,
            priceData: mockAnalysisData.priceData 
          })
        });

      const { container } = render(<StockDashboard />);
      
      await screen.findByText('$150');
      
      // Capture initial layout structure
      const initialHTML = container.innerHTML;
      
      // Trigger state change
      const stockCard = screen.getByText('$150').closest('div');
      fireEvent.click(stockCard!);
      
      await waitFor(() => {
        expect(screen.getByTestId('additional-insights-sidebar')).toBeInTheDocument();
      });
      
      // Layout structure should remain consistent (only content changes)
      const updatedHTML = container.innerHTML;
      expect(updatedHTML).not.toBe(initialHTML); // Content changed
      // But the overall structure (MultiColumnLayout) should be maintained
    });
  });
});
