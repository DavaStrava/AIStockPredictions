import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock the usePortfolio hook
const mockFetchHistory = vi.fn();
const mockFetchHealth = vi.fn();
const mockRefreshPortfolioData = vi.fn();
const mockSelectPortfolio = vi.fn();
const mockCreatePortfolio = vi.fn();
const mockDeletePortfolio = vi.fn();
const mockAddTransaction = vi.fn();
const mockUpdateHoldingTarget = vi.fn();
const mockFetchPortfolios = vi.fn();

vi.mock('../hooks/usePortfolio', () => ({
  usePortfolio: () => ({
    portfolios: [
      { id: 'p-1', userId: 'u-1', name: 'Main Portfolio', isDefault: true, currency: 'USD', createdAt: new Date(), updatedAt: new Date() },
    ],
    selectedPortfolioId: 'p-1',
    selectedPortfolio: { id: 'p-1', userId: 'u-1', name: 'Main Portfolio', isDefault: true, currency: 'USD', createdAt: new Date(), updatedAt: new Date() },
    summary: {
      portfolioId: 'p-1',
      portfolioName: 'Main Portfolio',
      totalEquity: 50000,
      cashBalance: 5000,
      holdingsValue: 45000,
      holdingsCount: 3,
      dayChange: 500,
      dayChangePercent: 1.01,
      totalReturn: 5000,
      totalReturnPercent: 11.11,
      dailyAlpha: 0.5,
    },
    holdings: [],
    transactions: [],
    allocation: [],
    history: [],
    rebalanceSuggestions: [],
    healthData: null,
    healthLoading: false,
    loading: false,
    error: null,
    fetchPortfolios: mockFetchPortfolios,
    createPortfolio: mockCreatePortfolio,
    deletePortfolio: mockDeletePortfolio,
    selectPortfolio: mockSelectPortfolio,
    fetchSummary: vi.fn(),
    fetchHoldings: vi.fn(),
    fetchTransactions: vi.fn(),
    fetchAllocation: vi.fn(),
    fetchHistory: mockFetchHistory,
    fetchRebalanceSuggestions: vi.fn(),
    fetchHealth: mockFetchHealth,
    refreshPortfolioData: mockRefreshPortfolioData,
    addTransaction: mockAddTransaction,
    updateHoldingTarget: mockUpdateHoldingTarget,
    clearError: vi.fn(),
  }),
}));

// Mock child components to isolate PortfolioManager testing
vi.mock('../PortfolioSummaryCard', () => ({
  PortfolioSummaryCard: () => <div data-testid="summary-card">SummaryCard</div>,
}));

vi.mock('../SummaryTab', () => ({
  SummaryTab: () => <div data-testid="summary-tab">SummaryTab</div>,
}));

vi.mock('../HoldingsDataGrid', () => ({
  HoldingsDataGrid: () => <div data-testid="holdings-grid">HoldingsGrid</div>,
}));

vi.mock('../TransactionModal', () => ({
  TransactionModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="transaction-modal">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

vi.mock('../PortfolioTreeMap', () => ({
  PortfolioTreeMap: () => <div data-testid="allocation-map">AllocationMap</div>,
}));

vi.mock('../PerformanceChart', () => ({
  PerformanceChart: () => <div data-testid="performance-chart">PerformanceChart</div>,
}));

vi.mock('../PortfolioCSVImport', () => ({
  PortfolioCSVImport: () => <div data-testid="csv-import">CSVImport</div>,
}));

vi.mock('../HealthDashboard', () => ({
  HealthDashboard: () => <div data-testid="health-dashboard">HealthDashboard</div>,
}));

vi.mock('../DividendsTab', () => ({
  DividendsTab: () => <div data-testid="dividends-tab">DividendsTab</div>,
}));

vi.mock('@/components/ConfirmationModal', () => ({
  ConfirmationModal: () => null,
}));

// Dynamic import of PortfolioManager after mocks are set up
import { PortfolioManager } from '../PortfolioManager';

describe('PortfolioManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Tab Rendering', () => {
    it('should render all 7 tabs', () => {
      render(<PortfolioManager />);

      expect(screen.getByText('Summary')).toBeInTheDocument();
      expect(screen.getByText('Holdings')).toBeInTheDocument();
      expect(screen.getByText('Health Score')).toBeInTheDocument();
      expect(screen.getByText('Dividends')).toBeInTheDocument();
      expect(screen.getByText('Transactions')).toBeInTheDocument();
      expect(screen.getByText('Allocation')).toBeInTheDocument();
      expect(screen.getByText('Performance')).toBeInTheDocument();
    });

    it('should show Summary tab as default active tab', () => {
      render(<PortfolioManager />);

      expect(screen.getByTestId('summary-tab')).toBeInTheDocument();
    });

    it('should not show other tab content when Summary is active', () => {
      render(<PortfolioManager />);

      expect(screen.queryByTestId('holdings-grid')).not.toBeInTheDocument();
      expect(screen.queryByTestId('health-dashboard')).not.toBeInTheDocument();
      expect(screen.queryByTestId('dividends-tab')).not.toBeInTheDocument();
      expect(screen.queryByTestId('performance-chart')).not.toBeInTheDocument();
      expect(screen.queryByTestId('allocation-map')).not.toBeInTheDocument();
    });
  });

  describe('Tab Switching', () => {
    it('should switch to Holdings tab on click', () => {
      render(<PortfolioManager />);

      fireEvent.click(screen.getByText('Holdings'));

      expect(screen.getByTestId('holdings-grid')).toBeInTheDocument();
      expect(screen.queryByTestId('summary-tab')).not.toBeInTheDocument();
    });

    it('should switch to Health Score tab on click', () => {
      render(<PortfolioManager />);

      fireEvent.click(screen.getByText('Health Score'));

      expect(screen.getByTestId('health-dashboard')).toBeInTheDocument();
      expect(screen.queryByTestId('summary-tab')).not.toBeInTheDocument();
    });

    it('should switch to Dividends tab on click', () => {
      render(<PortfolioManager />);

      fireEvent.click(screen.getByText('Dividends'));

      expect(screen.getByTestId('dividends-tab')).toBeInTheDocument();
      expect(screen.queryByTestId('summary-tab')).not.toBeInTheDocument();
    });

    it('should switch to Transactions tab on click', () => {
      render(<PortfolioManager />);

      fireEvent.click(screen.getByText('Transactions'));

      // Transactions tab content is inline, not a separate component
      expect(screen.queryByTestId('summary-tab')).not.toBeInTheDocument();
    });

    it('should switch to Allocation tab on click', () => {
      render(<PortfolioManager />);

      fireEvent.click(screen.getByText('Allocation'));

      expect(screen.getByTestId('allocation-map')).toBeInTheDocument();
    });

    it('should switch to Performance tab on click', () => {
      render(<PortfolioManager />);

      fireEvent.click(screen.getByText('Performance'));

      expect(screen.getByTestId('performance-chart')).toBeInTheDocument();
    });

    it('should switch back to Summary from another tab', () => {
      render(<PortfolioManager />);

      fireEvent.click(screen.getByText('Holdings'));
      expect(screen.getByTestId('holdings-grid')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Summary'));
      expect(screen.getByTestId('summary-tab')).toBeInTheDocument();
      expect(screen.queryByTestId('holdings-grid')).not.toBeInTheDocument();
    });
  });

  describe('Portfolio Header', () => {
    it('should render the portfolio summary card', () => {
      render(<PortfolioManager />);

      expect(screen.getByTestId('summary-card')).toBeInTheDocument();
    });

    it('should render the selected portfolio name', () => {
      render(<PortfolioManager />);

      expect(screen.getByText('Main Portfolio')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<PortfolioManager />);

      expect(screen.getByText('+ Buy Stock')).toBeInTheDocument();
      expect(screen.getByText('+ Deposit')).toBeInTheDocument();
    });
  });

  describe('Lazy Loading', () => {
    it('should trigger fetchHealth when Health Score tab is selected', async () => {
      render(<PortfolioManager />);

      fireEvent.click(screen.getByText('Health Score'));

      await waitFor(() => {
        expect(mockFetchHealth).toHaveBeenCalledWith('p-1');
      });
    });
  });
});
