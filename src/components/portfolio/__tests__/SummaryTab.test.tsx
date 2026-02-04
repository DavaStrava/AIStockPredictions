import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SummaryTab } from '../SummaryTab';
import { PortfolioSummary, HoldingWithMarketData, BenchmarkDataPoint } from '@/types/portfolio';

// Mock Recharts to avoid canvas/SVG issues in tests
vi.mock('recharts', () => ({
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const createMockSummary = (overrides: Partial<PortfolioSummary> = {}): PortfolioSummary => ({
  portfolioId: 'p-1',
  portfolioName: 'Test Portfolio',
  totalEquity: 100000,
  cashBalance: 10000,
  holdingsValue: 90000,
  holdingsCount: 5,
  dayChange: 1500,
  dayChangePercent: 1.52,
  totalReturn: 15000,
  totalReturnPercent: 17.65,
  dailyAlpha: 0.35,
  ...overrides,
});

const createMockHolding = (overrides: Partial<HoldingWithMarketData> = {}): HoldingWithMarketData => ({
  id: 'h-1',
  portfolioId: 'p-1',
  symbol: 'AAPL',
  quantity: 100,
  averageCostBasis: 150,
  totalCostBasis: 15000,
  targetAllocationPercent: 20,
  sector: 'Technology',
  firstPurchaseDate: new Date('2024-01-01'),
  lastTransactionDate: new Date('2024-06-15'),
  createdAt: new Date(),
  updatedAt: new Date(),
  currentPrice: 175,
  marketValue: 17500,
  portfolioWeight: 35,
  driftPercent: 15,
  dayChange: 250,
  dayChangePercent: 1.45,
  totalGainLoss: 2500,
  totalGainLossPercent: 16.67,
  previousClose: 172.5,
  companyName: 'Apple Inc.',
  priceStatus: 'live',
  todayGain: 250,
  todayGainPercent: 1.45,
  estimatedAnnualIncome: 96,
  dividendYield: 0.55,
  yearHigh: 199.62,
  yearLow: 164.08,
  ...overrides,
});

const createMockHistory = (): BenchmarkDataPoint[] => [
  { date: '2024-09-01', portfolioValue: 85000, portfolioReturn: 0, spyReturn: 0, qqqReturn: 0 },
  { date: '2024-10-01', portfolioValue: 90000, portfolioReturn: 5.88, spyReturn: 3.5, qqqReturn: 4.0 },
  { date: '2024-11-01', portfolioValue: 95000, portfolioReturn: 11.76, spyReturn: 7.2, qqqReturn: 8.1 },
];

describe('SummaryTab', () => {
  describe('Key Metrics', () => {
    it('should render total equity', () => {
      render(
        <SummaryTab summary={createMockSummary()} holdings={[]} history={[]} />
      );

      expect(screen.getByText('Total Equity')).toBeInTheDocument();
      expect(screen.getByText('$100,000.00')).toBeInTheDocument();
    });

    it('should render total return with correct sign', () => {
      render(
        <SummaryTab
          summary={createMockSummary({ totalReturn: 15000, totalReturnPercent: 17.65 })}
          holdings={[]}
          history={[]}
        />
      );

      expect(screen.getByText('Total Return')).toBeInTheDocument();
      expect(screen.getByText('$15,000.00')).toBeInTheDocument();
      expect(screen.getByText('+17.65%')).toBeInTheDocument();
    });

    it('should render estimated annual income from holdings', () => {
      const holdings = [
        createMockHolding({ estimatedAnnualIncome: 500 }),
        createMockHolding({ id: 'h-2', symbol: 'KO', estimatedAnnualIncome: 300 }),
      ];

      render(
        <SummaryTab summary={createMockSummary()} holdings={holdings} history={[]} />
      );

      expect(screen.getByText('Est. Annual Income')).toBeInTheDocument();
      expect(screen.getByText('$800.00')).toBeInTheDocument();
    });

    it('should render holdings count', () => {
      render(
        <SummaryTab summary={createMockSummary({ holdingsCount: 5 })} holdings={[]} history={[]} />
      );

      expect(screen.getByText('Holdings')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should render loading skeleton', () => {
      const { container } = render(
        <SummaryTab summary={null} holdings={[]} history={[]} loading />
      );

      const pulseElements = container.querySelectorAll('.animate-pulse');
      expect(pulseElements.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('should render empty state when no summary and not loading', () => {
      render(
        <SummaryTab summary={null} holdings={[]} history={[]} />
      );

      expect(screen.getByText('No portfolio data available')).toBeInTheDocument();
    });
  });

  describe('Top/Bottom Performers', () => {
    it('should display top and bottom performers', () => {
      // Need 6+ holdings so both top and bottom performer sections are shown
      const holdings = [
        createMockHolding({ symbol: 'TOP1', totalGainLossPercent: 50, companyName: undefined }),
        createMockHolding({ id: 'h-2', symbol: 'TOP2', totalGainLossPercent: 30, companyName: undefined }),
        createMockHolding({ id: 'h-3', symbol: 'TOP3', totalGainLossPercent: 20, companyName: undefined }),
        createMockHolding({ id: 'h-4', symbol: 'MID', totalGainLossPercent: 10, companyName: undefined }),
        createMockHolding({ id: 'h-5', symbol: 'BOT1', totalGainLossPercent: -5, companyName: undefined }),
        createMockHolding({ id: 'h-6', symbol: 'BOT2', totalGainLossPercent: -15, companyName: undefined }),
      ];

      render(
        <SummaryTab summary={createMockSummary()} holdings={holdings} history={[]} />
      );

      expect(screen.getByText('Top Performers')).toBeInTheDocument();
      expect(screen.getByText('Bottom Performers')).toBeInTheDocument();
      expect(screen.getByText('TOP1')).toBeInTheDocument();
      expect(screen.getByText('BOT2')).toBeInTheDocument();
    });

    it('should not show performers section when no holdings', () => {
      render(
        <SummaryTab summary={createMockSummary()} holdings={[]} history={[]} />
      );

      expect(screen.queryByText('Top Performers')).not.toBeInTheDocument();
    });
  });

  describe('Performance Chart', () => {
    it('should render chart when history data exists', () => {
      render(
        <SummaryTab summary={createMockSummary()} holdings={[]} history={createMockHistory()} />
      );

      expect(screen.getByText('Portfolio Performance (90 days)')).toBeInTheDocument();
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });

    it('should show empty message when no history', () => {
      render(
        <SummaryTab summary={createMockSummary()} holdings={[]} history={[]} />
      );

      expect(screen.getByText('No performance data yet')).toBeInTheDocument();
    });
  });
});
