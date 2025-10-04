import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StockDashboard from '../StockDashboard';

// Mock the fetch function
global.fetch = vi.fn();

// Mock problematic components that cause test failures
vi.mock('../MarketIndicesSidebar', () => ({
  default: () => <div data-testid="market-indices-sidebar">Market Indices Sidebar</div>
}));

vi.mock('../MarketIndexAnalysis', () => ({
  default: () => <div data-testid="market-index-analysis">Market Index Analysis</div>
}));

// Mock the ResponsiveGrid component to verify it's being used
vi.mock('../ResponsiveGrid', () => ({
  default: ({ children, columns, gap, minItemWidth }: any) => (
    <div 
      data-testid="responsive-grid"
      data-columns={JSON.stringify(columns)}
      data-gap={gap}
      data-min-item-width={minItemWidth}
    >
      {children}
    </div>
  )
}));

describe('StockDashboard ResponsiveGrid Integration', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    vi.resetAllMocks();
    
    // Mock successful API response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [
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
          }
        ]
      })
    });
  });

  it('should use ResponsiveGrid component with correct configuration', async () => {
    render(<StockDashboard />);
    
    // Wait for the component to load and render
    await screen.findByTestId('responsive-grid');
    
    const responsiveGrid = screen.getByTestId('responsive-grid');
    
    // Verify ResponsiveGrid is used with correct props
    expect(responsiveGrid).toBeInTheDocument();
    expect(responsiveGrid).toHaveAttribute('data-gap', 'gap-6');
    expect(responsiveGrid).toHaveAttribute('data-min-item-width', '320px');
    
    // Verify column configuration
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
    
    // Wait for stock cards to be rendered by looking for unique prices
    await screen.findByText('$150');
    await screen.findByText('$2800');
    
    const responsiveGrid = screen.getByTestId('responsive-grid');
    
    // Verify stock cards are rendered inside the ResponsiveGrid
    expect(responsiveGrid).toContainElement(screen.getByText('$150'));
    expect(responsiveGrid).toContainElement(screen.getByText('$2800'));
    expect(responsiveGrid).toContainElement(screen.getByText('BULLISH'));
    expect(responsiveGrid).toContainElement(screen.getByText('NEUTRAL'));
  });

  it('should handle varying numbers of stock cards', async () => {
    // Mock API response with different number of stocks
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          {
            symbol: 'TSLA',
            currentPrice: 250.00,
            prediction: {
              direction: 'bullish',
              confidence: 0.85,
              targetPrice: 280.00,
              timeframe: '1 month',
              reasoning: ['Strong earnings']
            },
            signals: [],
            riskMetrics: {
              volatility: 'medium',
              support: 240.00,
              resistance: 260.00,
              stopLoss: 230.00
            }
          }
        ]
      })
    });

    render(<StockDashboard />);
    
    // Wait for single stock card to be rendered by looking for unique price
    await screen.findByText('$250');
    
    const responsiveGrid = screen.getByTestId('responsive-grid');
    
    // Verify ResponsiveGrid still works with single item
    expect(responsiveGrid).toBeInTheDocument();
    expect(responsiveGrid).toContainElement(screen.getByText('$250'));
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
    const responsiveGrid = await screen.findByTestId('responsive-grid');
    
    // ResponsiveGrid should still be present but empty
    expect(responsiveGrid).toBeInTheDocument();
    expect(responsiveGrid.children.length).toBe(0);
  });
});