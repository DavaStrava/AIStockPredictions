/**
 * Unit Tests: PortfolioService
 *
 * Tests the core business logic for portfolio management including:
 * - Portfolio CRUD operations
 * - Transaction validation and processing
 * - Holdings calculations
 * - Cost basis calculations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  PortfolioService,
  PortfolioValidationError,
  PortfolioNotFoundError,
  InsufficientFundsError,
} from '../PortfolioService';
import { DatabaseConnection } from '../../database/connection';
import { FMPDataProvider } from '../../data-providers/fmp';

// Mock the database connection
const mockQuery = vi.fn();
const mockDb: Partial<DatabaseConnection> = {
  query: mockQuery,
};

// Mock the FMP provider
const mockGetQuote = vi.fn();
const mockGetMultipleQuotes = vi.fn();
const mockGetCompanyProfile = vi.fn();
const mockFmpProvider: Partial<FMPDataProvider> = {
  getQuote: mockGetQuote,
  getMultipleQuotes: mockGetMultipleQuotes,
  getCompanyProfile: mockGetCompanyProfile,
};

describe('PortfolioService', () => {
  let service: PortfolioService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.mockReset();
    mockGetQuote.mockReset();
    mockGetMultipleQuotes.mockReset();
    mockGetCompanyProfile.mockReset();

    service = new PortfolioService(
      mockDb as DatabaseConnection,
      mockFmpProvider as FMPDataProvider
    );
  });

  describe('createPortfolio', () => {
    it('should create a portfolio with valid data', async () => {
      const mockPortfolio = {
        id: 'portfolio-123',
        user_id: 'user-123',
        name: 'My Portfolio',
        description: 'Test description',
        currency: 'USD',
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockPortfolio] });

      const result = await service.createPortfolio({
        userId: 'user-123',
        name: 'My Portfolio',
        description: 'Test description',
      });

      expect(result.id).toBe('portfolio-123');
      expect(result.name).toBe('My Portfolio');
      expect(result.userId).toBe('user-123');
    });

    it('should throw PortfolioValidationError for empty name', async () => {
      await expect(
        service.createPortfolio({
          userId: 'user-123',
          name: '',
        })
      ).rejects.toThrow(PortfolioValidationError);
    });

    it('should throw PortfolioValidationError for missing userId', async () => {
      await expect(
        service.createPortfolio({
          userId: '',
          name: 'Test',
        })
      ).rejects.toThrow(PortfolioValidationError);
    });

    it('should unset other defaults when creating a default portfolio', async () => {
      const mockPortfolio = {
        id: 'portfolio-123',
        user_id: 'user-123',
        name: 'Default Portfolio',
        description: null,
        currency: 'USD',
        is_default: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // First call: unset existing defaults
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // Second call: create new portfolio
      mockQuery.mockResolvedValueOnce({ rows: [mockPortfolio] });

      const result = await service.createPortfolio({
        userId: 'user-123',
        name: 'Default Portfolio',
        isDefault: true,
      });

      expect(result.isDefault).toBe(true);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });
  });

  describe('getPortfolioById', () => {
    it('should return portfolio when found', async () => {
      const mockPortfolio = {
        id: 'portfolio-123',
        user_id: 'user-123',
        name: 'My Portfolio',
        description: null,
        currency: 'USD',
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockPortfolio] });

      const result = await service.getPortfolioById('portfolio-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('portfolio-123');
    });

    it('should return null when portfolio not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await service.getPortfolioById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('deletePortfolio', () => {
    it('should delete existing portfolio', async () => {
      const mockPortfolio = {
        id: 'portfolio-123',
        user_id: 'user-123',
        name: 'My Portfolio',
        description: null,
        currency: 'USD',
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // First call: get portfolio
      mockQuery.mockResolvedValueOnce({ rows: [mockPortfolio] });
      // Second call: delete
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(service.deletePortfolio('portfolio-123')).resolves.not.toThrow();
    });

    it('should throw PortfolioNotFoundError for non-existent portfolio', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(service.deletePortfolio('nonexistent-id')).rejects.toThrow(
        PortfolioNotFoundError
      );
    });
  });

  describe('addTransaction', () => {
    const mockPortfolio = {
      id: 'portfolio-123',
      user_id: 'user-123',
      name: 'My Portfolio',
      description: null,
      currency: 'USD',
      is_default: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    it('should add a DEPOSIT transaction', async () => {
      const mockTransaction = {
        id: 'txn-123',
        portfolio_id: 'portfolio-123',
        asset_symbol: null,
        transaction_type: 'DEPOSIT',
        quantity: null,
        price_per_share: null,
        fees: '0',
        total_amount: '10000',
        transaction_date: new Date().toISOString(),
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockPortfolio] }); // getPortfolioById
      mockQuery.mockResolvedValueOnce({ rows: [mockTransaction] }); // insert

      const result = await service.addTransaction({
        portfolioId: 'portfolio-123',
        transactionType: 'DEPOSIT',
        totalAmount: 10000,
        transactionDate: new Date(),
      });

      expect(result.transactionType).toBe('DEPOSIT');
      expect(result.totalAmount).toBe(10000);
    });

    it('should add a BUY transaction with sufficient funds', async () => {
      const mockTransaction = {
        id: 'txn-123',
        portfolio_id: 'portfolio-123',
        asset_symbol: 'AAPL',
        transaction_type: 'BUY',
        quantity: '10',
        price_per_share: '150',
        fees: '5',
        total_amount: '-1505',
        transaction_date: new Date().toISOString(),
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockPortfolio] }); // getPortfolioById
      mockQuery.mockResolvedValueOnce({ rows: [{ cash_balance: '5000' }] }); // getCashBalance
      mockQuery.mockResolvedValueOnce({ rows: [mockTransaction] }); // insert
      mockQuery.mockResolvedValueOnce({ rows: [{ total_bought: '10', total_sold: '0', total_cost: '1500', first_purchase: new Date().toISOString(), last_transaction: new Date().toISOString() }] }); // update holdings
      mockGetCompanyProfile.mockResolvedValueOnce({ sector: 'Technology' }); // get sector
      mockQuery.mockResolvedValueOnce({ rows: [] }); // upsert holding

      const result = await service.addTransaction({
        portfolioId: 'portfolio-123',
        transactionType: 'BUY',
        assetSymbol: 'AAPL',
        quantity: 10,
        pricePerShare: 150,
        totalAmount: 1500,
        fees: 5,
        transactionDate: new Date(),
      });

      expect(result.transactionType).toBe('BUY');
      expect(result.assetSymbol).toBe('AAPL');
    });

    it('should throw InsufficientFundsError for BUY without enough cash', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockPortfolio] }); // getPortfolioById
      mockQuery.mockResolvedValueOnce({ rows: [{ cash_balance: '100' }] }); // getCashBalance (only $100)

      await expect(
        service.addTransaction({
          portfolioId: 'portfolio-123',
          transactionType: 'BUY',
          assetSymbol: 'AAPL',
          quantity: 10,
          pricePerShare: 150,
          totalAmount: 1500,
          transactionDate: new Date(),
        })
      ).rejects.toThrow(InsufficientFundsError);
    });

    it('should throw PortfolioValidationError for BUY without symbol', async () => {
      await expect(
        service.addTransaction({
          portfolioId: 'portfolio-123',
          transactionType: 'BUY',
          quantity: 10,
          pricePerShare: 150,
          totalAmount: 1500,
          transactionDate: new Date(),
        })
      ).rejects.toThrow(PortfolioValidationError);
    });

    it('should throw PortfolioValidationError for invalid transaction type', async () => {
      await expect(
        service.addTransaction({
          portfolioId: 'portfolio-123',
          transactionType: 'INVALID' as 'BUY',
          totalAmount: 1000,
          transactionDate: new Date(),
        })
      ).rejects.toThrow(PortfolioValidationError);
    });

    it('should throw PortfolioValidationError for negative totalAmount', async () => {
      await expect(
        service.addTransaction({
          portfolioId: 'portfolio-123',
          transactionType: 'DEPOSIT',
          totalAmount: -100,
          transactionDate: new Date(),
        })
      ).rejects.toThrow(PortfolioValidationError);
    });
  });

  describe('getCashBalance', () => {
    it('should calculate cash balance from transactions', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ cash_balance: '5000' }] });

      const result = await service.getCashBalance('portfolio-123');

      expect(result).toBe(5000);
    });

    it('should return 0 for portfolio with no transactions', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ cash_balance: null }] });

      const result = await service.getCashBalance('portfolio-123');

      expect(result).toBe(0);
    });
  });

  describe('getHoldingsWithMarketData', () => {
    it('should enrich holdings with market data', async () => {
      const mockHoldings = [
        {
          id: 'holding-1',
          portfolio_id: 'portfolio-123',
          symbol: 'AAPL',
          quantity: '10',
          average_cost_basis: '150',
          total_cost_basis: '1500',
          target_allocation_percent: '20',
          sector: 'Technology',
          first_purchase_date: new Date().toISOString(),
          last_transaction_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockQuotes = [
        {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          price: 175,
          change: 2.5,
          changesPercentage: 1.45,
          previousClose: 172.5,
        },
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockHoldings });
      mockGetMultipleQuotes.mockResolvedValueOnce(mockQuotes);

      const result = await service.getHoldingsWithMarketData('portfolio-123');

      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('AAPL');
      expect(result[0].currentPrice).toBe(175);
      expect(result[0].marketValue).toBe(1750); // 10 * 175
      expect(result[0].totalGainLoss).toBe(250); // 1750 - 1500
      expect(result[0].companyName).toBe('Apple Inc.');
    });

    it('should handle empty holdings', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await service.getHoldingsWithMarketData('portfolio-123');

      expect(result).toHaveLength(0);
    });

    it('should handle FMP API failure gracefully', async () => {
      const mockHoldings = [
        {
          id: 'holding-1',
          portfolio_id: 'portfolio-123',
          symbol: 'AAPL',
          quantity: '10',
          average_cost_basis: '150',
          total_cost_basis: '1500',
          target_allocation_percent: null,
          sector: 'Technology',
          first_purchase_date: new Date().toISOString(),
          last_transaction_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockHoldings });
      mockGetMultipleQuotes.mockRejectedValueOnce(new Error('API Error'));

      const result = await service.getHoldingsWithMarketData('portfolio-123');

      expect(result).toHaveLength(1);
      expect(result[0].currentPrice).toBe(0); // No price available
    });
  });

  describe('getPortfolioSummary', () => {
    it('should calculate complete portfolio summary', async () => {
      const mockPortfolio = {
        id: 'portfolio-123',
        user_id: 'user-123',
        name: 'My Portfolio',
        description: null,
        currency: 'USD',
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockHoldings = [
        {
          id: 'holding-1',
          portfolio_id: 'portfolio-123',
          symbol: 'AAPL',
          quantity: '10',
          average_cost_basis: '150',
          total_cost_basis: '1500',
          target_allocation_percent: null,
          sector: 'Technology',
          first_purchase_date: new Date().toISOString(),
          last_transaction_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockQuotes = [
        {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          price: 175,
          change: 2.5,
          changesPercentage: 1.45,
          previousClose: 172.5,
        },
      ];

      const mockSpyQuote = {
        symbol: 'SPY',
        changesPercentage: 0.5,
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockPortfolio] }); // getPortfolioById
      mockQuery.mockResolvedValueOnce({ rows: [{ cash_balance: '5000' }] }); // getCashBalance
      mockQuery.mockResolvedValueOnce({ rows: mockHoldings }); // getHoldings
      mockGetMultipleQuotes.mockResolvedValueOnce(mockQuotes); // holdings quotes
      mockQuery.mockResolvedValueOnce({ rows: [{ net_deposits: '6500' }] }); // net deposits
      mockGetQuote.mockResolvedValueOnce(mockSpyQuote); // SPY quote

      const result = await service.getPortfolioSummary('portfolio-123');

      expect(result.portfolioId).toBe('portfolio-123');
      expect(result.cashBalance).toBe(5000);
      expect(result.holdingsValue).toBe(1750);
      expect(result.totalEquity).toBe(6750); // 5000 + 1750
      expect(result.holdingsCount).toBe(1);
    });

    it('should throw PortfolioNotFoundError for non-existent portfolio', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(service.getPortfolioSummary('nonexistent-id')).rejects.toThrow(
        PortfolioNotFoundError
      );
    });
  });

  describe('getRebalanceSuggestions', () => {
    it('should suggest rebalancing for drifted holdings', async () => {
      const mockHoldings = [
        {
          id: 'holding-1',
          portfolio_id: 'portfolio-123',
          symbol: 'AAPL',
          quantity: '100',
          average_cost_basis: '150',
          total_cost_basis: '15000',
          target_allocation_percent: '50',
          sector: 'Technology',
          first_purchase_date: new Date().toISOString(),
          last_transaction_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'holding-2',
          portfolio_id: 'portfolio-123',
          symbol: 'GOOGL',
          quantity: '10',
          average_cost_basis: '100',
          total_cost_basis: '1000',
          target_allocation_percent: '50',
          sector: 'Technology',
          first_purchase_date: new Date().toISOString(),
          last_transaction_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockQuotes = [
        { symbol: 'AAPL', name: 'Apple Inc.', price: 150, change: 0, changesPercentage: 0, previousClose: 150 },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 100, change: 0, changesPercentage: 0, previousClose: 100 },
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockHoldings });
      mockGetMultipleQuotes.mockResolvedValueOnce(mockQuotes);

      const result = await service.getRebalanceSuggestions('portfolio-123', 2);

      // AAPL is 15000 / 16000 = 93.75%, target is 50% → drift +43.75%
      // GOOGL is 1000 / 16000 = 6.25%, target is 50% → drift -43.75%
      expect(result.length).toBeGreaterThan(0);
      const aaplSuggestion = result.find((s) => s.symbol === 'AAPL');
      expect(aaplSuggestion?.action).toBe('SELL');
    });

    it('should not suggest changes for holdings within threshold', async () => {
      const mockHoldings = [
        {
          id: 'holding-1',
          portfolio_id: 'portfolio-123',
          symbol: 'AAPL',
          quantity: '10',
          average_cost_basis: '150',
          total_cost_basis: '1500',
          target_allocation_percent: '50.5', // Close to actual
          sector: 'Technology',
          first_purchase_date: new Date().toISOString(),
          last_transaction_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'holding-2',
          portfolio_id: 'portfolio-123',
          symbol: 'GOOGL',
          quantity: '15',
          average_cost_basis: '100',
          total_cost_basis: '1500',
          target_allocation_percent: '49.5', // Close to actual
          sector: 'Technology',
          first_purchase_date: new Date().toISOString(),
          last_transaction_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockQuotes = [
        { symbol: 'AAPL', name: 'Apple Inc.', price: 150, change: 0, changesPercentage: 0, previousClose: 150 },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 100, change: 0, changesPercentage: 0, previousClose: 100 },
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockHoldings });
      mockGetMultipleQuotes.mockResolvedValueOnce(mockQuotes);

      const result = await service.getRebalanceSuggestions('portfolio-123', 2);

      // Both are close to their targets, should have no suggestions
      expect(result.length).toBe(0);
    });
  });
});





