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
const mockClientQuery = vi.fn();
const mockTransaction = vi.fn();

// Create a mock client for transactions
const mockClient = {
  query: mockClientQuery,
};

// Transaction mock that executes callback with mock client
mockTransaction.mockImplementation(async (callback: (client: typeof mockClient) => Promise<unknown>) => {
  return callback(mockClient);
});

const mockDb: Partial<DatabaseConnection> = {
  query: mockQuery,
  transaction: mockTransaction,
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
    mockClientQuery.mockReset();
    mockTransaction.mockReset();
    mockGetQuote.mockReset();
    mockGetMultipleQuotes.mockReset();
    mockGetCompanyProfile.mockReset();

    // Re-establish transaction mock implementation after reset
    mockTransaction.mockImplementation(async (callback: (client: typeof mockClient) => Promise<unknown>) => {
      return callback(mockClient);
    });

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

      // Uses transaction, so mock client query
      mockClientQuery.mockResolvedValueOnce({ rows: [mockPortfolio] });

      const result = await service.createPortfolio({
        userId: 'user-123',
        name: 'My Portfolio',
        description: 'Test description',
      });

      expect(result.id).toBe('portfolio-123');
      expect(result.name).toBe('My Portfolio');
      expect(result.userId).toBe('user-123');
      expect(mockTransaction).toHaveBeenCalledTimes(1);
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

      // First call within transaction: unset existing defaults
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      // Second call within transaction: create new portfolio
      mockClientQuery.mockResolvedValueOnce({ rows: [mockPortfolio] });

      const result = await service.createPortfolio({
        userId: 'user-123',
        name: 'Default Portfolio',
        isDefault: true,
      });

      expect(result.isDefault).toBe(true);
      expect(mockClientQuery).toHaveBeenCalledTimes(2);
      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });

    it('should rollback transaction if insert fails after updating defaults', async () => {
      // First call: unset existing defaults succeeds
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      // Second call: insert fails
      mockClientQuery.mockRejectedValueOnce(new Error('Insert failed'));

      await expect(
        service.createPortfolio({
          userId: 'user-123',
          name: 'Default Portfolio',
          isDefault: true,
        })
      ).rejects.toThrow('Insert failed');

      // Transaction was called, rollback handled by transaction wrapper
      expect(mockTransaction).toHaveBeenCalledTimes(1);
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
    const mockPortfolioData = {
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
      const mockTransactionData = {
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

      mockQuery.mockResolvedValueOnce({ rows: [mockPortfolioData] }); // getPortfolioById
      mockClientQuery.mockResolvedValueOnce({ rows: [mockTransactionData] }); // insert (in transaction)

      const result = await service.addTransaction({
        portfolioId: 'portfolio-123',
        transactionType: 'DEPOSIT',
        totalAmount: 10000,
        transactionDate: new Date(),
      });

      expect(result.transactionType).toBe('DEPOSIT');
      expect(result.totalAmount).toBe(10000);
      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });

    it('should add a BUY transaction with sufficient funds', async () => {
      const mockTransactionData = {
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

      // Outside transaction
      mockQuery.mockResolvedValueOnce({ rows: [mockPortfolioData] }); // getPortfolioById
      mockGetCompanyProfile.mockResolvedValueOnce({ sector: 'Technology' }); // fetchSectorForSymbol (outside txn)

      // Inside transaction
      mockClientQuery.mockResolvedValueOnce({ rows: [{ cash_balance: '5000' }] }); // getCashBalanceForUpdate
      mockClientQuery.mockResolvedValueOnce({ rows: [mockTransactionData] }); // insert
      mockClientQuery.mockResolvedValueOnce({ rows: [{ total_bought: '10', total_sold: '0', total_cost: '1500', first_purchase: new Date().toISOString(), last_transaction: new Date().toISOString() }] }); // updateHoldingsCache query
      mockClientQuery.mockResolvedValueOnce({ rows: [] }); // upsert holding

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
      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });

    it('should throw InsufficientFundsError for BUY without enough cash', async () => {
      // Outside transaction
      mockQuery.mockResolvedValueOnce({ rows: [mockPortfolioData] }); // getPortfolioById
      mockGetCompanyProfile.mockResolvedValueOnce({ sector: 'Technology' }); // fetchSectorForSymbol

      // Inside transaction - cash balance check fails
      mockClientQuery.mockResolvedValueOnce({ rows: [{ cash_balance: '100' }] }); // getCashBalanceForUpdate (only $100)

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

    it('should rollback transaction if holdings update fails after insert', async () => {
      // Outside transaction
      mockQuery.mockResolvedValueOnce({ rows: [mockPortfolioData] }); // getPortfolioById
      mockGetCompanyProfile.mockResolvedValueOnce({ sector: 'Technology' }); // fetchSectorForSymbol

      // Inside transaction - cash check and insert succeed but holdings update fails
      mockClientQuery.mockResolvedValueOnce({ rows: [{ cash_balance: '5000' }] }); // getCashBalanceForUpdate
      mockClientQuery.mockResolvedValueOnce({ rows: [{
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
      }] }); // insert succeeds
      mockClientQuery.mockRejectedValueOnce(new Error('Holdings update failed')); // updateHoldingsCache fails

      await expect(
        service.addTransaction({
          portfolioId: 'portfolio-123',
          transactionType: 'BUY',
          assetSymbol: 'AAPL',
          quantity: 10,
          pricePerShare: 150,
          totalAmount: 1500,
          fees: 5,
          transactionDate: new Date(),
        })
      ).rejects.toThrow('Holdings update failed');

      // Transaction wrapper handles rollback
      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('addTransaction with externalClient (batch imports)', () => {
    const mockPortfolioData = {
      id: 'portfolio-123',
      user_id: 'user-123',
      name: 'My Portfolio',
      description: null,
      currency: 'USD',
      is_default: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    it('should use external client instead of internal transaction', async () => {
      const mockTransactionData = {
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

      // Setup: external client for batch operation
      const externalMockClientQuery = vi.fn();
      const externalMockClient = { query: externalMockClientQuery };

      mockQuery.mockResolvedValueOnce({ rows: [mockPortfolioData] }); // getPortfolioById
      externalMockClientQuery.mockResolvedValueOnce({ rows: [mockTransactionData] }); // insert via external client

      const result = await service.addTransaction(
        {
          portfolioId: 'portfolio-123',
          transactionType: 'DEPOSIT',
          totalAmount: 10000,
          transactionDate: new Date(),
        },
        externalMockClient as any
      );

      expect(result.transactionType).toBe('DEPOSIT');
      expect(result.totalAmount).toBe(10000);
      // Internal transaction should NOT be called when external client is provided
      expect(mockTransaction).not.toHaveBeenCalled();
      // External client should be used
      expect(externalMockClientQuery).toHaveBeenCalled();
    });

    it('should support batch BUY transactions with external client', async () => {
      const mockTransactionData = {
        id: 'txn-123',
        portfolio_id: 'portfolio-123',
        asset_symbol: 'AAPL',
        transaction_type: 'BUY',
        quantity: '10',
        price_per_share: '150',
        fees: '0',
        total_amount: '-1500',
        transaction_date: new Date().toISOString(),
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Setup: external client for batch operation
      const externalMockClientQuery = vi.fn();
      const externalMockClient = { query: externalMockClientQuery };

      mockQuery.mockResolvedValueOnce({ rows: [mockPortfolioData] }); // getPortfolioById
      mockGetCompanyProfile.mockResolvedValueOnce({ sector: 'Technology' }); // fetchSectorForSymbol

      // All calls go through external client
      externalMockClientQuery.mockResolvedValueOnce({ rows: [{ cash_balance: '5000' }] }); // getCashBalanceForUpdate
      externalMockClientQuery.mockResolvedValueOnce({ rows: [mockTransactionData] }); // insert
      externalMockClientQuery.mockResolvedValueOnce({
        rows: [{
          total_bought: '10',
          total_sold: '0',
          total_cost: '1500',
          first_purchase: new Date().toISOString(),
          last_transaction: new Date().toISOString()
        }]
      }); // updateHoldingsCache query
      externalMockClientQuery.mockResolvedValueOnce({ rows: [] }); // upsert holding

      const result = await service.addTransaction(
        {
          portfolioId: 'portfolio-123',
          transactionType: 'BUY',
          assetSymbol: 'AAPL',
          quantity: 10,
          pricePerShare: 150,
          totalAmount: 1500,
          transactionDate: new Date(),
        },
        externalMockClient as any
      );

      expect(result.transactionType).toBe('BUY');
      expect(result.assetSymbol).toBe('AAPL');
      // Internal transaction should NOT be called
      expect(mockTransaction).not.toHaveBeenCalled();
      // All 4 operations should go through external client
      expect(externalMockClientQuery).toHaveBeenCalledTimes(4);
    });

    it('should propagate errors to caller when using external client', async () => {
      // Setup: external client for batch operation
      const externalMockClientQuery = vi.fn();
      const externalMockClient = { query: externalMockClientQuery };

      mockQuery.mockResolvedValueOnce({ rows: [mockPortfolioData] }); // getPortfolioById
      externalMockClientQuery.mockRejectedValueOnce(new Error('Database constraint violation'));

      await expect(
        service.addTransaction(
          {
            portfolioId: 'portfolio-123',
            transactionType: 'DEPOSIT',
            totalAmount: 10000,
            transactionDate: new Date(),
          },
          externalMockClient as any
        )
      ).rejects.toThrow('Database constraint violation');

      // Error should propagate without internal transaction handling
      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it('should allow multiple transactions in same external transaction scope', async () => {
      // This simulates what happens during CSV batch import
      const mockTxnData1 = {
        id: 'txn-1',
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

      const mockTxnData2 = {
        id: 'txn-2',
        portfolio_id: 'portfolio-123',
        asset_symbol: 'AAPL',
        transaction_type: 'BUY',
        quantity: '10',
        price_per_share: '150',
        fees: '0',
        total_amount: '-1500',
        transaction_date: new Date().toISOString(),
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Shared external client simulating a single transaction scope
      const batchClientQuery = vi.fn();
      const batchClient = { query: batchClientQuery };

      // First transaction: DEPOSIT
      mockQuery.mockResolvedValueOnce({ rows: [mockPortfolioData] });
      batchClientQuery.mockResolvedValueOnce({ rows: [mockTxnData1] });

      const result1 = await service.addTransaction(
        {
          portfolioId: 'portfolio-123',
          transactionType: 'DEPOSIT',
          totalAmount: 10000,
          transactionDate: new Date(),
        },
        batchClient as any
      );

      // Second transaction: BUY
      mockQuery.mockResolvedValueOnce({ rows: [mockPortfolioData] });
      mockGetCompanyProfile.mockResolvedValueOnce({ sector: 'Technology' });
      batchClientQuery.mockResolvedValueOnce({ rows: [{ cash_balance: '10000' }] });
      batchClientQuery.mockResolvedValueOnce({ rows: [mockTxnData2] });
      batchClientQuery.mockResolvedValueOnce({
        rows: [{
          total_bought: '10',
          total_sold: '0',
          total_cost: '1500',
          first_purchase: new Date().toISOString(),
          last_transaction: new Date().toISOString()
        }]
      });
      batchClientQuery.mockResolvedValueOnce({ rows: [] });

      const result2 = await service.addTransaction(
        {
          portfolioId: 'portfolio-123',
          transactionType: 'BUY',
          assetSymbol: 'AAPL',
          quantity: 10,
          pricePerShare: 150,
          totalAmount: 1500,
          transactionDate: new Date(),
        },
        batchClient as any
      );

      expect(result1.transactionType).toBe('DEPOSIT');
      expect(result2.transactionType).toBe('BUY');
      // Both should use the same client
      expect(batchClientQuery).toHaveBeenCalled();
      // No internal transactions should be created
      expect(mockTransaction).not.toHaveBeenCalled();
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





