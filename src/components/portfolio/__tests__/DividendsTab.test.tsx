import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DividendsTab } from '../DividendsTab';
import { HoldingWithMarketData, PortfolioTransaction } from '@/types/portfolio';

const createMockHolding = (overrides: Partial<HoldingWithMarketData> = {}): HoldingWithMarketData => ({
  id: 'h-1',
  portfolioId: 'p-1',
  symbol: 'AAPL',
  quantity: 100,
  averageCostBasis: 150,
  totalCostBasis: 15000,
  targetAllocationPercent: null,
  sector: 'Technology',
  firstPurchaseDate: new Date('2024-01-01'),
  lastTransactionDate: new Date('2024-06-15'),
  createdAt: new Date(),
  updatedAt: new Date(),
  currentPrice: 175,
  marketValue: 17500,
  portfolioWeight: 35,
  driftPercent: null,
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

const createMockTransaction = (
  overrides: Partial<PortfolioTransaction> = {}
): PortfolioTransaction => ({
  id: 'txn-1',
  portfolioId: 'p-1',
  assetSymbol: 'AAPL',
  transactionType: 'DIVIDEND',
  quantity: null,
  pricePerShare: null,
  fees: 0,
  totalAmount: 24,
  transactionDate: new Date('2024-09-15'),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('DividendsTab', () => {
  describe('Summary Cards', () => {
    it('should render annual income correctly', () => {
      const holdings = [
        createMockHolding({ estimatedAnnualIncome: 500, dividendYield: 2.86 }),
        createMockHolding({ id: 'h-2', symbol: 'KO', estimatedAnnualIncome: 300, dividendYield: 3.1 }),
      ];

      render(<DividendsTab holdings={holdings} transactions={[]} />);

      const annualIncomeLabels = screen.getAllByText('Annual Income');
      expect(annualIncomeLabels.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('$800.00')).toBeInTheDocument();
    });

    it('should render weighted average yield', () => {
      const holdings = [
        createMockHolding({
          marketValue: 10000,
          estimatedAnnualIncome: 200,
          dividendYield: 2.0,
        }),
        createMockHolding({
          id: 'h-2',
          symbol: 'KO',
          marketValue: 10000,
          estimatedAnnualIncome: 300,
          dividendYield: 3.0,
        }),
      ];

      render(<DividendsTab holdings={holdings} transactions={[]} />);

      expect(screen.getByText('Weighted Avg Yield')).toBeInTheDocument();
      // (200+300) / (10000+10000) * 100 = 2.50%
      expect(screen.getByText('2.50%')).toBeInTheDocument();
    });

    it('should render monthly income', () => {
      const holdings = [
        createMockHolding({ estimatedAnnualIncome: 1200 }),
      ];

      render(<DividendsTab holdings={holdings} transactions={[]} />);

      expect(screen.getByText('Monthly Income')).toBeInTheDocument();
      expect(screen.getByText('$100.00')).toBeInTheDocument();
    });
  });

  describe('Dividend Holdings Table', () => {
    it('should only show holdings with dividend yield > 0', () => {
      const holdings = [
        createMockHolding({ symbol: 'AAPL', dividendYield: 0.55, companyName: 'Apple Inc.' }),
        createMockHolding({ id: 'h-2', symbol: 'TSLA', dividendYield: 0, companyName: 'Tesla Inc.' }),
        createMockHolding({ id: 'h-3', symbol: 'KO', dividendYield: 3.1, companyName: 'Coca-Cola Co.' }),
      ];

      render(<DividendsTab holdings={holdings} transactions={[]} />);

      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('KO')).toBeInTheDocument();
      // TSLA should not appear in the dividend table (yield is 0)
      // But TSLA might appear in the summary calc, just not in the table
      const rows = screen.getAllByRole('row');
      // header row + 2 data rows
      expect(rows.length).toBe(3);
    });

    it('should show empty state when no dividend holdings', () => {
      const holdings = [
        createMockHolding({ dividendYield: 0, estimatedAnnualIncome: 0 }),
      ];

      render(<DividendsTab holdings={holdings} transactions={[]} />);

      expect(screen.getByText('No dividend-paying holdings in this portfolio')).toBeInTheDocument();
    });

    it('should sort by annual income descending', () => {
      const holdings = [
        createMockHolding({ symbol: 'LOW', dividendYield: 1.0, estimatedAnnualIncome: 50 }),
        createMockHolding({ id: 'h-2', symbol: 'HIGH', dividendYield: 3.0, estimatedAnnualIncome: 500 }),
        createMockHolding({ id: 'h-3', symbol: 'MID', dividendYield: 2.0, estimatedAnnualIncome: 200 }),
      ];

      render(<DividendsTab holdings={holdings} transactions={[]} />);

      const rows = screen.getAllByRole('row');
      // First data row (index 1) should be HIGH (highest income)
      expect(rows[1]).toHaveTextContent('HIGH');
    });
  });

  describe('Dividend History', () => {
    it('should show dividend transactions', () => {
      const transactions = [
        createMockTransaction({ assetSymbol: 'AAPL', totalAmount: 24 }),
        createMockTransaction({ id: 'txn-2', assetSymbol: 'KO', totalAmount: 45 }),
      ];

      render(<DividendsTab holdings={[]} transactions={transactions} />);

      expect(screen.getByText('Dividend History')).toBeInTheDocument();
      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('KO')).toBeInTheDocument();
    });

    it('should filter out non-dividend transactions', () => {
      const transactions = [
        createMockTransaction({ assetSymbol: 'AAPL', transactionType: 'DIVIDEND' }),
        createMockTransaction({ id: 'txn-2', assetSymbol: 'MSFT', transactionType: 'BUY' }),
      ];

      render(<DividendsTab holdings={[]} transactions={transactions} />);

      expect(screen.getByText('AAPL')).toBeInTheDocument();
      // MSFT is a BUY transaction, should not appear in dividend history
      expect(screen.queryByText('MSFT')).not.toBeInTheDocument();
    });

    it('should show empty state when no dividend transactions', () => {
      render(<DividendsTab holdings={[]} transactions={[]} />);

      expect(screen.getByText('No dividend transactions recorded')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should render loading skeleton', () => {
      const { container } = render(
        <DividendsTab holdings={[]} transactions={[]} loading />
      );

      const pulseElements = container.querySelectorAll('.animate-pulse');
      expect(pulseElements.length).toBeGreaterThan(0);
    });
  });
});
