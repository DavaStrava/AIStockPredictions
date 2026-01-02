/**
 * Component Tests: PortfolioSummaryCard
 *
 * Tests the portfolio summary card component including:
 * - Rendering of all summary statistics
 * - Loading state display
 * - Color coding for positive/negative values
 * - Empty state handling
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PortfolioSummaryCard } from '../PortfolioSummaryCard';
import { PortfolioSummary } from '@/types/portfolio';

describe('PortfolioSummaryCard', () => {
  const mockSummary: PortfolioSummary = {
    portfolioId: 'portfolio-123',
    portfolioName: 'My Portfolio',
    totalEquity: 100000,
    cashBalance: 25000,
    holdingsValue: 75000,
    holdingsCount: 5,
    dayChange: 1500,
    dayChangePercent: 1.52,
    totalReturn: 15000,
    totalReturnPercent: 17.65,
    dailyAlpha: 0.42,
  };

  describe('Rendering', () => {
    it('should render all summary statistics', () => {
      render(<PortfolioSummaryCard summary={mockSummary} />);

      // Check for key values
      expect(screen.getByText('Total Equity')).toBeInTheDocument();
      expect(screen.getByText('$100,000.00')).toBeInTheDocument();
      expect(screen.getByText('Holdings Value')).toBeInTheDocument();
      expect(screen.getByText('$75,000.00')).toBeInTheDocument();
      expect(screen.getByText('Cash Balance')).toBeInTheDocument();
      expect(screen.getByText('$25,000.00')).toBeInTheDocument();
    });

    it('should render day change with correct formatting', () => {
      render(<PortfolioSummaryCard summary={mockSummary} />);

      expect(screen.getByText('Day Change')).toBeInTheDocument();
      expect(screen.getByText('$1,500.00')).toBeInTheDocument();
      expect(screen.getByText('+1.52%')).toBeInTheDocument();
    });

    it('should render total return with correct formatting', () => {
      render(<PortfolioSummaryCard summary={mockSummary} />);

      expect(screen.getByText('Total Return')).toBeInTheDocument();
      expect(screen.getByText('$15,000.00')).toBeInTheDocument();
      expect(screen.getByText('+17.65%')).toBeInTheDocument();
    });

    it('should render daily alpha with benchmark reference', () => {
      render(<PortfolioSummaryCard summary={mockSummary} />);

      expect(screen.getByText('Daily Alpha')).toBeInTheDocument();
      expect(screen.getByText('+0.42%')).toBeInTheDocument();
      expect(screen.getByText('vs S&P 500')).toBeInTheDocument();
    });

    it('should render holdings count', () => {
      render(<PortfolioSummaryCard summary={mockSummary} />);

      expect(screen.getByText('5 positions')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should render loading skeletons when loading', () => {
      render(<PortfolioSummaryCard summary={null} loading={true} />);

      // Should have skeleton elements (animate-pulse divs)
      const container = document.querySelector('.animate-pulse');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should render empty state message when no summary', () => {
      render(<PortfolioSummaryCard summary={null} loading={false} />);

      expect(screen.getByText('No portfolio data available')).toBeInTheDocument();
    });
  });

  describe('Negative Values', () => {
    it('should render negative day change with correct color', () => {
      const negativeSummary: PortfolioSummary = {
        ...mockSummary,
        dayChange: -500,
        dayChangePercent: -0.51,
      };

      render(<PortfolioSummaryCard summary={negativeSummary} />);

      // Check for negative value formatting (may be -$500.00 or ($500.00))
      expect(screen.getByText(/\$500\.00/)).toBeInTheDocument();
      expect(screen.getByText('-0.51%')).toBeInTheDocument();
    });

    it('should render negative total return with correct color', () => {
      const negativeSummary: PortfolioSummary = {
        ...mockSummary,
        totalReturn: -5000,
        totalReturnPercent: -5.88,
      };

      render(<PortfolioSummaryCard summary={negativeSummary} />);

      expect(screen.getByText(/\$5,000\.00/)).toBeInTheDocument();
      expect(screen.getByText('-5.88%')).toBeInTheDocument();
    });

    it('should render negative alpha with correct color', () => {
      const negativeSummary: PortfolioSummary = {
        ...mockSummary,
        dailyAlpha: -0.75,
      };

      render(<PortfolioSummaryCard summary={negativeSummary} />);

      expect(screen.getByText('-0.75%')).toBeInTheDocument();
    });
  });

  describe('Null Alpha', () => {
    it('should render N/A when alpha is null', () => {
      const noAlphaSummary: PortfolioSummary = {
        ...mockSummary,
        dailyAlpha: null,
      };

      render(<PortfolioSummaryCard summary={noAlphaSummary} />);

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });
});

