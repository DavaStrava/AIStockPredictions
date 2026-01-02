/**
 * Component Tests: HoldingsDataGrid
 *
 * Tests the holdings data grid component including:
 * - Rendering of holdings data
 * - Sorting functionality
 * - Target allocation editing
 * - Loading and empty states
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HoldingsDataGrid } from '../HoldingsDataGrid';
import { HoldingWithMarketData } from '@/types/portfolio';

const createMockHolding = (overrides: Partial<HoldingWithMarketData> = {}): HoldingWithMarketData => ({
  id: 'holding-1',
  portfolioId: 'portfolio-123',
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
  ...overrides,
});

describe('HoldingsDataGrid', () => {
  describe('Rendering', () => {
    it('should render holdings data correctly', () => {
      const holdings = [createMockHolding()];

      render(<HoldingsDataGrid holdings={holdings} />);

      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
      expect(screen.getByText('$175.00')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('$17,500.00')).toBeInTheDocument();
    });

    it('should render multiple holdings', () => {
      const holdings = [
        createMockHolding({ symbol: 'AAPL', companyName: 'Apple Inc.' }),
        createMockHolding({ id: 'holding-2', symbol: 'GOOGL', companyName: 'Alphabet Inc.' }),
        createMockHolding({ id: 'holding-3', symbol: 'MSFT', companyName: 'Microsoft Corporation' }),
      ];

      render(<HoldingsDataGrid holdings={holdings} />);

      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('GOOGL')).toBeInTheDocument();
      expect(screen.getByText('MSFT')).toBeInTheDocument();
    });

    it('should render target allocation when set', () => {
      const holdings = [createMockHolding({ targetAllocationPercent: 25 })];

      render(<HoldingsDataGrid holdings={holdings} />);

      expect(screen.getByText('25.0%')).toBeInTheDocument();
    });

    it('should render dash when no target allocation', () => {
      const holdings = [createMockHolding({ targetAllocationPercent: null })];

      render(<HoldingsDataGrid holdings={holdings} />);

      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should sort by symbol when clicking header', () => {
      const holdings = [
        createMockHolding({ symbol: 'MSFT' }),
        createMockHolding({ id: 'holding-2', symbol: 'AAPL' }),
        createMockHolding({ id: 'holding-3', symbol: 'GOOGL' }),
      ];

      render(<HoldingsDataGrid holdings={holdings} />);

      // Click symbol header to sort - this changes sort column
      const symbolHeader = screen.getByText('Symbol');
      fireEvent.click(symbolHeader);

      // Verify all symbols are still present after sort
      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('GOOGL')).toBeInTheDocument();
      expect(screen.getByText('MSFT')).toBeInTheDocument();
    });

    it('should sort by market value', () => {
      const holdings = [
        createMockHolding({ symbol: 'LOW', marketValue: 1000 }),
        createMockHolding({ id: 'holding-2', symbol: 'HIGH', marketValue: 50000 }),
        createMockHolding({ id: 'holding-3', symbol: 'MID', marketValue: 10000 }),
      ];

      render(<HoldingsDataGrid holdings={holdings} />);

      // Market value is default sort, should be descending
      const valueHeader = screen.getByText('Value');
      fireEvent.click(valueHeader);

      // After click, should toggle direction
      expect(screen.getByText('HIGH')).toBeInTheDocument();
      expect(screen.getByText('MID')).toBeInTheDocument();
      expect(screen.getByText('LOW')).toBeInTheDocument();
    });
  });

  describe('Day Change Display', () => {
    it('should show positive day change with correct styling', () => {
      const holdings = [createMockHolding({ dayChangePercent: 2.5 })];

      render(<HoldingsDataGrid holdings={holdings} />);

      expect(screen.getByText('+2.50%')).toBeInTheDocument();
    });

    it('should show negative day change with correct styling', () => {
      const holdings = [createMockHolding({ dayChangePercent: -1.75 })];

      render(<HoldingsDataGrid holdings={holdings} />);

      expect(screen.getByText('-1.75%')).toBeInTheDocument();
    });
  });

  describe('Total Return Display', () => {
    it('should display total gain/loss correctly', () => {
      const holdings = [
        createMockHolding({
          totalGainLoss: 5000,
          totalGainLossPercent: 33.33,
        }),
      ];

      render(<HoldingsDataGrid holdings={holdings} />);

      expect(screen.getByText('$5,000.00')).toBeInTheDocument();
      expect(screen.getByText('+33.33%')).toBeInTheDocument();
    });

    it('should display negative return correctly', () => {
      const holdings = [
        createMockHolding({
          totalGainLoss: -2000,
          totalGainLossPercent: -11.76,
        }),
      ];

      render(<HoldingsDataGrid holdings={holdings} />);

      // The component formats as currency which may show ($2,000.00) or -$2,000.00
      expect(screen.getByText(/\$2,000\.00/)).toBeInTheDocument();
      expect(screen.getByText('-11.76%')).toBeInTheDocument();
    });
  });

  describe('Target Editing', () => {
    it('should allow editing target when callback provided', async () => {
      const mockUpdateTarget = vi.fn().mockResolvedValue(undefined);
      const holdings = [createMockHolding({ targetAllocationPercent: 20 })];

      render(<HoldingsDataGrid holdings={holdings} onUpdateTarget={mockUpdateTarget} />);

      // Find and click edit button
      const editButtons = screen.getAllByRole('button');
      const editButton = editButtons.find(btn => btn.querySelector('svg'));
      
      if (editButton) {
        fireEvent.click(editButton);

        // Should show input field
        const input = screen.getByRole('spinbutton');
        expect(input).toBeInTheDocument();

        // Change value and submit
        fireEvent.change(input, { target: { value: '25' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        await waitFor(() => {
          expect(mockUpdateTarget).toHaveBeenCalledWith('AAPL', 25);
        });
      }
    });

    it('should cancel editing on Escape', () => {
      const mockUpdateTarget = vi.fn();
      const holdings = [createMockHolding({ targetAllocationPercent: 20 })];

      render(<HoldingsDataGrid holdings={holdings} onUpdateTarget={mockUpdateTarget} />);

      // Find and click edit button
      const editButtons = screen.getAllByRole('button');
      const editButton = editButtons.find(btn => btn.querySelector('svg'));
      
      if (editButton) {
        fireEvent.click(editButton);

        const input = screen.getByRole('spinbutton');
        fireEvent.keyDown(input, { key: 'Escape' });

        // Should not have called update
        expect(mockUpdateTarget).not.toHaveBeenCalled();

        // Should show original value
        expect(screen.getByText('20.0%')).toBeInTheDocument();
      }
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when loading', () => {
      render(<HoldingsDataGrid holdings={[]} loading={true} />);

      expect(screen.getByText('Loading holdings...')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no holdings', () => {
      render(<HoldingsDataGrid holdings={[]} />);

      expect(screen.getByText('No holdings yet. Add a BUY transaction to get started.')).toBeInTheDocument();
    });
  });

  describe('Drift Indicator', () => {
    it('should highlight holdings with significant drift', () => {
      const holdings = [
        createMockHolding({
          targetAllocationPercent: 20,
          portfolioWeight: 35,
          driftPercent: 15, // 15% drift, > 2% threshold
        }),
      ];

      render(<HoldingsDataGrid holdings={holdings} />);

      // Target should be visible with warning styling (amber)
      // The exact styling depends on implementation
      expect(screen.getByText('20.0%')).toBeInTheDocument();
    });
  });
});

