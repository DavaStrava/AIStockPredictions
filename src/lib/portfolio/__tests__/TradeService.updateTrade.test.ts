/**
 * Unit Tests: TradeService.updateTrade
 *
 * Tests for the updateTrade method which allows updating
 * trade notes and fees without modifying core trade data.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TradeService, TradeValidationError, TradeNotFoundError } from '../TradeService';

// Mock database connection
const createMockDb = () => ({
  query: vi.fn(),
  getPool: vi.fn(),
  getClient: vi.fn(),
  transaction: vi.fn(),
  close: vi.fn(),
  healthCheck: vi.fn(),
});

// Mock FMP provider
const createMockFmpProvider = () => ({
  getQuote: vi.fn(),
  getMultipleQuotes: vi.fn(),
  getHistoricalData: vi.fn(),
  searchStocks: vi.fn(),
  getCompanyProfile: vi.fn(),
  validateApiKey: vi.fn(),
});

// Sample trade row as returned by database
const createMockTradeRow = (overrides = {}) => ({
  id: 'trade-123',
  user_id: 'user-456',
  symbol: 'AAPL',
  side: 'LONG',
  status: 'OPEN',
  entry_price: '150.00',
  quantity: '10',
  entry_date: new Date('2024-01-15'),
  exit_price: null,
  exit_date: null,
  fees: '0',
  realized_pnl: null,
  notes: null,
  prediction_id: null,
  created_at: new Date('2024-01-15'),
  updated_at: new Date('2024-01-15'),
  ...overrides,
});

describe('TradeService.updateTrade', () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let mockFmpProvider: ReturnType<typeof createMockFmpProvider>;
  let tradeService: TradeService;

  beforeEach(() => {
    mockDb = createMockDb();
    mockFmpProvider = createMockFmpProvider();
    tradeService = new TradeService(mockDb as never, mockFmpProvider as never);
    vi.clearAllMocks();
  });

  describe('successful updates', () => {
    it('should update notes successfully', async () => {
      const existingRow = createMockTradeRow();
      const updatedRow = createMockTradeRow({ notes: 'My trade reasoning' });

      // First call: getTradeById
      mockDb.query.mockResolvedValueOnce({ rows: [existingRow], rowCount: 1 });
      // Second call: UPDATE query
      mockDb.query.mockResolvedValueOnce({ rows: [updatedRow], rowCount: 1 });

      const result = await tradeService.updateTrade('trade-123', { notes: 'My trade reasoning' });

      expect(result.notes).toBe('My trade reasoning');
      expect(mockDb.query).toHaveBeenCalledTimes(2);

      // Verify UPDATE query contains notes parameter
      const updateCall = mockDb.query.mock.calls[1];
      expect(updateCall[0]).toContain('UPDATE trades');
      expect(updateCall[0]).toContain('notes');
      expect(updateCall[1]).toContain('My trade reasoning');
    });

    it('should update fees successfully', async () => {
      const existingRow = createMockTradeRow();
      const updatedRow = createMockTradeRow({ fees: '9.99' });

      mockDb.query.mockResolvedValueOnce({ rows: [existingRow], rowCount: 1 });
      mockDb.query.mockResolvedValueOnce({ rows: [updatedRow], rowCount: 1 });

      const result = await tradeService.updateTrade('trade-123', { fees: 9.99 });

      expect(result.fees).toBe(9.99);
    });

    it('should update both notes and fees', async () => {
      const existingRow = createMockTradeRow();
      const updatedRow = createMockTradeRow({ notes: 'Updated notes', fees: '5.00' });

      mockDb.query.mockResolvedValueOnce({ rows: [existingRow], rowCount: 1 });
      mockDb.query.mockResolvedValueOnce({ rows: [updatedRow], rowCount: 1 });

      const result = await tradeService.updateTrade('trade-123', {
        notes: 'Updated notes',
        fees: 5.00
      });

      expect(result.notes).toBe('Updated notes');
      expect(result.fees).toBe(5);
    });

    it('should allow clearing notes with empty string', async () => {
      const existingRow = createMockTradeRow({ notes: 'Old notes' });
      const updatedRow = createMockTradeRow({ notes: '' });

      mockDb.query.mockResolvedValueOnce({ rows: [existingRow], rowCount: 1 });
      mockDb.query.mockResolvedValueOnce({ rows: [updatedRow], rowCount: 1 });

      const result = await tradeService.updateTrade('trade-123', { notes: '' });

      // Note: mapRowToTrade converts empty string to null for notes
      expect(result.notes).toBeNull();
    });

    it('should return existing trade if no fields to update', async () => {
      const existingRow = createMockTradeRow({ notes: 'Existing notes' });

      mockDb.query.mockResolvedValueOnce({ rows: [existingRow], rowCount: 1 });

      const result = await tradeService.updateTrade('trade-123', {});

      expect(result.notes).toBe('Existing notes');
      // Should only call getTradeById, not UPDATE
      expect(mockDb.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('validation errors', () => {
    it('should throw TradeNotFoundError for non-existent trade', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await expect(
        tradeService.updateTrade('non-existent', { notes: 'test' })
      ).rejects.toThrow(TradeNotFoundError);
    });

    it('should throw TradeValidationError for negative fees', async () => {
      const existingRow = createMockTradeRow();
      mockDb.query.mockResolvedValueOnce({ rows: [existingRow], rowCount: 1 });

      await expect(
        tradeService.updateTrade('trade-123', { fees: -10 })
      ).rejects.toThrow(TradeValidationError);
    });

    it('should throw TradeValidationError for NaN fees', async () => {
      const existingRow = createMockTradeRow();
      mockDb.query.mockResolvedValueOnce({ rows: [existingRow], rowCount: 1 });

      await expect(
        tradeService.updateTrade('trade-123', { fees: NaN })
      ).rejects.toThrow(TradeValidationError);
    });

    it('should throw TradeValidationError for Infinity fees', async () => {
      const existingRow = createMockTradeRow();
      mockDb.query.mockResolvedValueOnce({ rows: [existingRow], rowCount: 1 });

      await expect(
        tradeService.updateTrade('trade-123', { fees: Infinity })
      ).rejects.toThrow(TradeValidationError);
    });

    it('should throw TradeValidationError for notes exceeding max length', async () => {
      const existingRow = createMockTradeRow();
      mockDb.query.mockResolvedValueOnce({ rows: [existingRow], rowCount: 1 });

      const longNotes = 'a'.repeat(5001);

      try {
        await tradeService.updateTrade('trade-123', { notes: longNotes });
        // Should not reach here
        expect.fail('Expected TradeValidationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TradeValidationError);
        expect((error as TradeValidationError).field).toBe('notes');
        expect((error as TradeValidationError).code).toBe('MAX_LENGTH_EXCEEDED');
      }
    });

    it('should allow notes at exactly max length (5000 chars)', async () => {
      const existingRow = createMockTradeRow();
      const exactMaxNotes = 'a'.repeat(5000);
      const updatedRow = createMockTradeRow({ notes: exactMaxNotes });

      mockDb.query.mockResolvedValueOnce({ rows: [existingRow], rowCount: 1 });
      mockDb.query.mockResolvedValueOnce({ rows: [updatedRow], rowCount: 1 });

      const result = await tradeService.updateTrade('trade-123', { notes: exactMaxNotes });

      expect(result.notes).toBe(exactMaxNotes);
    });
  });

  describe('edge cases', () => {
    it('should allow zero fees', async () => {
      const existingRow = createMockTradeRow({ fees: '10.00' });
      const updatedRow = createMockTradeRow({ fees: '0' });

      mockDb.query.mockResolvedValueOnce({ rows: [existingRow], rowCount: 1 });
      mockDb.query.mockResolvedValueOnce({ rows: [updatedRow], rowCount: 1 });

      const result = await tradeService.updateTrade('trade-123', { fees: 0 });

      expect(result.fees).toBe(0);
    });

    it('should handle null notes value', async () => {
      const existingRow = createMockTradeRow({ notes: 'Some notes' });
      const updatedRow = createMockTradeRow({ notes: null });

      mockDb.query.mockResolvedValueOnce({ rows: [existingRow], rowCount: 1 });
      mockDb.query.mockResolvedValueOnce({ rows: [updatedRow], rowCount: 1 });

      const result = await tradeService.updateTrade('trade-123', { notes: null as unknown as string });

      expect(result.notes).toBeNull();
    });

    it('should preserve other fields when updating notes', async () => {
      const existingRow = createMockTradeRow({
        symbol: 'TSLA',
        entry_price: '200.00',
        quantity: '50',
      });
      const updatedRow = createMockTradeRow({
        symbol: 'TSLA',
        entry_price: '200.00',
        quantity: '50',
        notes: 'New notes',
      });

      mockDb.query.mockResolvedValueOnce({ rows: [existingRow], rowCount: 1 });
      mockDb.query.mockResolvedValueOnce({ rows: [updatedRow], rowCount: 1 });

      const result = await tradeService.updateTrade('trade-123', { notes: 'New notes' });

      expect(result.symbol).toBe('TSLA');
      expect(result.entryPrice).toBe(200);
      expect(result.quantity).toBe(50);
      expect(result.notes).toBe('New notes');
    });
  });
});
