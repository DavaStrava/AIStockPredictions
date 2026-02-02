/**
 * CSV Mapper Tests
 *
 * Tests for CSV parsing and mapping functions, focusing on:
 * - Date parsing edge cases
 * - Null handling for transaction dates
 * - Validation of transaction data
 */

import { describe, it, expect } from 'vitest';
import { validateFidelityRow, mapFidelityRows } from '../fidelityMapper';
import { validateMerrillTransactionRow, mapMerrillTransactionRows } from '../merrillTransactionsMapper';
import { validateMerrillHoldingsRow, mapMerrillHoldingsRows } from '../merrillHoldingsMapper';
import type { CSVParsedRow } from '@/types/csv';

describe('Fidelity Mapper', () => {
  describe('validateFidelityRow', () => {
    it('should parse valid BUY transaction', () => {
      const row: CSVParsedRow = {
        rowNumber: 1,
        data: {
          'Run Date': '01/15/2026',
          'Action': 'YOU BOUGHT APPLE INC (AAPL)',
          'Symbol': 'AAPL',
          'Price ($)': '150.00',
          'Quantity': '10',
          'Commission ($)': '0',
          'Fees ($)': '0',
          'Amount ($)': '-1500.00',
        },
      };

      const result = validateFidelityRow(row);
      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.transactionType).toBe('BUY');
      expect(result.data?.symbol).toBe('AAPL');
      expect(result.data?.quantity).toBe(10);
      expect(result.data?.pricePerShare).toBe(150);
      expect(result.data?.transactionDate).toBeInstanceOf(Date);
    });

    it('should parse valid SELL transaction', () => {
      const row: CSVParsedRow = {
        rowNumber: 1,
        data: {
          'Run Date': '01/15/2026',
          'Action': 'YOU SOLD APPLE INC (AAPL)',
          'Symbol': 'AAPL',
          'Price ($)': '155.00',
          'Quantity': '5',
          'Commission ($)': '0',
          'Fees ($)': '0',
          'Amount ($)': '775.00',
        },
      };

      const result = validateFidelityRow(row);
      expect(result.valid).toBe(true);
      expect(result.data?.transactionType).toBe('SELL');
    });

    it('should parse DIVIDEND transaction', () => {
      const row: CSVParsedRow = {
        rowNumber: 1,
        data: {
          'Run Date': '01/15/2026',
          'Action': 'DIVIDEND RECEIVED',
          'Symbol': 'AAPL',
          'Price ($)': '',
          'Quantity': '',
          'Commission ($)': '',
          'Fees ($)': '',
          'Amount ($)': '50.00',
        },
      };

      const result = validateFidelityRow(row);
      expect(result.valid).toBe(true);
      expect(result.data?.transactionType).toBe('DIVIDEND');
    });

    it('should reject row with invalid date format', () => {
      const row: CSVParsedRow = {
        rowNumber: 1,
        data: {
          'Run Date': 'invalid-date',
          'Action': 'YOU BOUGHT APPLE INC (AAPL)',
          'Symbol': 'AAPL',
          'Price ($)': '150.00',
          'Quantity': '10',
          'Commission ($)': '0',
          'Fees ($)': '0',
          'Amount ($)': '-1500.00',
        },
      };

      const result = validateFidelityRow(row);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'Run Date')).toBe(true);
    });

    it('should reject row with empty date', () => {
      const row: CSVParsedRow = {
        rowNumber: 1,
        data: {
          'Run Date': '',
          'Action': 'YOU BOUGHT APPLE INC (AAPL)',
          'Symbol': 'AAPL',
          'Price ($)': '150.00',
          'Quantity': '10',
          'Commission ($)': '0',
          'Fees ($)': '0',
          'Amount ($)': '-1500.00',
        },
      };

      const result = validateFidelityRow(row);
      expect(result.valid).toBe(false);
    });

    it('should reject row with invalid symbol for BUY', () => {
      const row: CSVParsedRow = {
        rowNumber: 1,
        data: {
          'Run Date': '01/15/2026',
          'Action': 'YOU BOUGHT INVALID123',
          'Symbol': 'INVALID123',
          'Price ($)': '150.00',
          'Quantity': '10',
          'Commission ($)': '0',
          'Fees ($)': '0',
          'Amount ($)': '-1500.00',
        },
      };

      const result = validateFidelityRow(row);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'Symbol')).toBe(true);
    });

    it('should reject row with zero quantity for BUY', () => {
      const row: CSVParsedRow = {
        rowNumber: 1,
        data: {
          'Run Date': '01/15/2026',
          'Action': 'YOU BOUGHT APPLE INC (AAPL)',
          'Symbol': 'AAPL',
          'Price ($)': '150.00',
          'Quantity': '0',
          'Commission ($)': '0',
          'Fees ($)': '0',
          'Amount ($)': '0',
        },
      };

      const result = validateFidelityRow(row);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'Quantity')).toBe(true);
    });

    it('should reject row with zero price for BUY', () => {
      const row: CSVParsedRow = {
        rowNumber: 1,
        data: {
          'Run Date': '01/15/2026',
          'Action': 'YOU BOUGHT APPLE INC (AAPL)',
          'Symbol': 'AAPL',
          'Price ($)': '0',
          'Quantity': '10',
          'Commission ($)': '0',
          'Fees ($)': '0',
          'Amount ($)': '0',
        },
      };

      const result = validateFidelityRow(row);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'Price ($)')).toBe(true);
    });

    it('should skip disclaimer rows', () => {
      const row: CSVParsedRow = {
        rowNumber: 1,
        data: {
          'Run Date': 'The data and information in this spreadsheet...',
          'Action': '',
          'Symbol': '',
          'Price ($)': '',
          'Quantity': '',
          'Commission ($)': '',
          'Fees ($)': '',
          'Amount ($)': '',
        },
      };

      const result = validateFidelityRow(row);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('skipped'))).toBe(true);
    });

    it('should skip unrecognized action types', () => {
      const row: CSVParsedRow = {
        rowNumber: 1,
        data: {
          'Run Date': '01/15/2026',
          'Action': 'TRANSFER TO BROKERAGE',
          'Symbol': '',
          'Price ($)': '',
          'Quantity': '',
          'Commission ($)': '',
          'Fees ($)': '',
          'Amount ($)': '1000.00',
        },
      };

      const result = validateFidelityRow(row);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Unrecognized action type'))).toBe(true);
    });

    it('should calculate total fees from commission and fees', () => {
      const row: CSVParsedRow = {
        rowNumber: 1,
        data: {
          'Run Date': '01/15/2026',
          'Action': 'YOU BOUGHT APPLE INC (AAPL)',
          'Symbol': 'AAPL',
          'Price ($)': '150.00',
          'Quantity': '10',
          'Commission ($)': '5.00',
          'Fees ($)': '2.50',
          'Amount ($)': '-1507.50',
        },
      };

      const result = validateFidelityRow(row);
      expect(result.valid).toBe(true);
      expect(result.data?.fees).toBe(7.5);
    });
  });

  describe('mapFidelityRows', () => {
    it('should map multiple valid rows', () => {
      const rows: CSVParsedRow[] = [
        {
          rowNumber: 1,
          data: {
            'Run Date': '01/15/2026',
            'Action': 'YOU BOUGHT APPLE INC (AAPL)',
            'Symbol': 'AAPL',
            'Price ($)': '150.00',
            'Quantity': '10',
            'Commission ($)': '0',
            'Fees ($)': '0',
            'Amount ($)': '-1500.00',
          },
        },
        {
          rowNumber: 2,
          data: {
            'Run Date': '01/16/2026',
            'Action': 'YOU BOUGHT GOOGLE (GOOGL)',
            'Symbol': 'GOOGL',
            'Price ($)': '140.00',
            'Quantity': '5',
            'Commission ($)': '0',
            'Fees ($)': '0',
            'Amount ($)': '-700.00',
          },
        },
      ];

      const result = mapFidelityRows(rows);
      expect(result.transactions).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should filter out invalid rows and collect errors', () => {
      const rows: CSVParsedRow[] = [
        {
          rowNumber: 1,
          data: {
            'Run Date': '01/15/2026',
            'Action': 'YOU BOUGHT APPLE INC (AAPL)',
            'Symbol': 'AAPL',
            'Price ($)': '150.00',
            'Quantity': '10',
            'Commission ($)': '0',
            'Fees ($)': '0',
            'Amount ($)': '-1500.00',
          },
        },
        {
          rowNumber: 2,
          data: {
            'Run Date': 'invalid',
            'Action': 'YOU BOUGHT GOOGLE (GOOGL)',
            'Symbol': 'GOOGL',
            'Price ($)': '140.00',
            'Quantity': '5',
            'Commission ($)': '0',
            'Fees ($)': '0',
            'Amount ($)': '-700.00',
          },
        },
      ];

      const result = mapFidelityRows(rows);
      expect(result.transactions).toHaveLength(1);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

describe('Merrill Transactions Mapper', () => {
  describe('validateMerrillTransactionRow', () => {
    it('should parse valid Purchase transaction', () => {
      const row: CSVParsedRow = {
        rowNumber: 1,
        data: {
          'Trade Date': '01/15/2026',
          'Trade Date ': '01/15/2026',
          'Description': 'Purchase APPLE INC',
          'Symbol/ CUSIP': 'AAPL',
          'Symbol/  CUSIP  ': 'AAPL',
          'Quantity': '10',
          'Price': '$150.00',
          'Amount': '-$1,500.00',
        },
      };

      const result = validateMerrillTransactionRow(row);
      expect(result.valid).toBe(true);
      expect(result.data?.transactionType).toBe('BUY');
    });

    it('should parse valid Sale transaction', () => {
      const row: CSVParsedRow = {
        rowNumber: 1,
        data: {
          'Trade Date': '01/15/2026',
          'Description': 'Sale APPLE INC',
          'Symbol/ CUSIP': 'AAPL',
          'Quantity': '-10',
          'Price': '$155.00',
          'Amount': '$1,550.00',
        },
      };

      const result = validateMerrillTransactionRow(row);
      expect(result.valid).toBe(true);
      expect(result.data?.transactionType).toBe('SELL');
    });

    it('should reject row with invalid date', () => {
      const row: CSVParsedRow = {
        rowNumber: 1,
        data: {
          'Trade Date': 'not-a-date',
          'Description': 'Purchase APPLE INC',
          'Symbol/ CUSIP': 'AAPL',
          'Quantity': '10',
          'Price': '$150.00',
          'Amount': '-$1,500.00',
        },
      };

      const result = validateMerrillTransactionRow(row);
      expect(result.valid).toBe(false);
    });

    it('should skip empty rows', () => {
      const row: CSVParsedRow = {
        rowNumber: 1,
        data: {
          'Trade Date': '',
          'Description': '',
          'Symbol/ CUSIP': '',
          'Quantity': '',
          'Price': '',
          'Amount': '',
        },
      };

      const result = validateMerrillTransactionRow(row);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('skipped'))).toBe(true);
    });

    it('should skip summary rows', () => {
      const row: CSVParsedRow = {
        rowNumber: 1,
        data: {
          'Trade Date': 'Total activity from 01/01/2026',
          'Description': '',
          'Symbol/ CUSIP': '',
          'Quantity': '',
          'Price': '',
          'Amount': '$5,000.00',
        },
      };

      const result = validateMerrillTransactionRow(row);
      expect(result.valid).toBe(false);
    });

    it('should handle trailing spaces in column names', () => {
      const row: CSVParsedRow = {
        rowNumber: 1,
        data: {
          'Trade Date ': '01/15/2026',
          'Description': 'Purchase APPLE INC',
          'Symbol/  CUSIP  ': 'AAPL',
          'Quantity': '10',
          'Price': '$150.00',
          'Amount': '-$1,500.00',
        },
      };

      const result = validateMerrillTransactionRow(row);
      expect(result.valid).toBe(true);
    });
  });
});

describe('Merrill Holdings Mapper', () => {
  describe('validateMerrillHoldingsRow', () => {
    it('should parse valid holding as BUY transaction', () => {
      const row: CSVParsedRow = {
        rowNumber: 1,
        data: {
          'COB Date': '1/30/2026',
          'Symbol': 'AAPL',
          'Quantity': '100',
          'Price ($)': '150.00',
          'Value ($)': '15,000.00',
        },
      };

      const result = validateMerrillHoldingsRow(row);
      expect(result.valid).toBe(true);
      expect(result.data?.transactionType).toBe('BUY');
      expect(result.data?.symbol).toBe('AAPL');
      expect(result.data?.quantity).toBe(100);
    });

    it('should reject row with invalid date format', () => {
      const row: CSVParsedRow = {
        rowNumber: 1,
        data: {
          'COB Date': 'invalid',
          'Symbol': 'AAPL',
          'Quantity': '100',
          'Price ($)': '150.00',
          'Value ($)': '15,000.00',
        },
      };

      const result = validateMerrillHoldingsRow(row);
      expect(result.valid).toBe(false);
    });

    it('should skip money market funds', () => {
      const row: CSVParsedRow = {
        rowNumber: 1,
        data: {
          'COB Date': '1/30/2026',
          'Symbol': 'TSTXX',
          'Quantity': '1000',
          'Price ($)': '1.00',
          'Value ($)': '1,000.00',
        },
      };

      const result = validateMerrillHoldingsRow(row);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Money market'))).toBe(true);
    });

    it('should handle fractional quantities', () => {
      const row: CSVParsedRow = {
        rowNumber: 1,
        data: {
          'COB Date': '1/30/2026',
          'Symbol': 'AAPL',
          'Quantity': '15.5',
          'Price ($)': '150.00',
          'Value ($)': '2,325.00',
        },
      };

      const result = validateMerrillHoldingsRow(row);
      expect(result.valid).toBe(true);
      expect(result.data?.quantity).toBe(15.5);
    });

    it('should skip empty rows', () => {
      const row: CSVParsedRow = {
        rowNumber: 1,
        data: {
          'COB Date': '',
          'Symbol': '',
          'Quantity': '',
          'Price ($)': '',
          'Value ($)': '',
        },
      };

      const result = validateMerrillHoldingsRow(row);
      expect(result.valid).toBe(false);
    });
  });
});
