/**
 * Merrill Lynch Transactions CSV Mapper
 *
 * Maps Merrill Lynch transaction CSV format to portfolio transactions.
 *
 * Format structure:
 * - Row 1: "Exported on: 02/02/2026 12:07 AM ET"
 * - Rows 2-5: Metadata
 * - Row 6: Empty quotes
 * - Row 7: Headers with trailing spaces
 * - Row 8+: Data rows
 *
 * Headers (with trailing spaces):
 * "Trade Date ","Settlement Date ","Description","Type","Symbol/ CUSIP ","Quantity","Price","Amount"," "
 *
 * Parsing rules:
 * - Skip first 5 rows (metadata) and row 7 (blank data row)
 * - Headers have trailing spaces - trim all values
 * - Date format: MM/DD/YYYY (quoted)
 * - Transaction type from Description: "Purchase" -> BUY, "Sale" -> SELL
 * - Symbol: Extract from "Symbol/ CUSIP" column
 * - Quantity: Absolute value (negative = SELL indicator)
 * - Price: Strip $ and commas
 * - Stop at summary row ("Total activity from...")
 */

import type {
  CSVParsedRow,
  ParsedPortfolioTransaction,
  PortfolioTransactionValidation,
  CSVValidationError,
} from '@/types/csv';
import type { PortfolioTransactionType } from '@/types/portfolio';

/**
 * Parse date in MM/DD/YYYY format.
 */
function parseMerrillDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Remove quotes and trim
  const cleaned = dateStr.replace(/"/g, '').trim();
  const parts = cleaned.split('/');
  if (parts.length !== 3) return null;

  const month = parseInt(parts[0], 10) - 1;
  const day = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  if (isNaN(month) || isNaN(day) || isNaN(year)) return null;

  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return null;

  return date;
}

/**
 * Parse numeric value, removing $, commas, and quotes.
 */
function parseNumber(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[$,"]/g, '').trim();

  // Handle negative values (Merrill uses negative for purchases)
  const isNegative = cleaned.startsWith('-');
  const absValue = cleaned.replace('-', '');

  const num = parseFloat(absValue);
  if (isNaN(num)) return 0;

  return isNegative ? -num : num;
}

/**
 * Transaction type result with skip flag for rows to ignore.
 */
interface TransactionTypeResult {
  type: PortfolioTransactionType | null;
  skip?: boolean;
  reason?: string;
}

/**
 * Extract transaction type from Description field.
 */
function parseTransactionType(description: string): TransactionTypeResult {
  const upperDesc = description.toUpperCase();

  // Skip reinvestment transactions (DRIP) - the dividend is already captured separately
  if (upperDesc.includes('REINVESTMENT')) {
    return { type: null, skip: true, reason: 'Reinvestment (DRIP) - skipped' };
  }

  // Skip stock dividends with $0 amount (like stock splits)
  if (upperDesc.includes('STOCK DIVIDEND DUE BILL')) {
    return { type: null, skip: true, reason: 'Stock dividend due bill - skipped' };
  }

  // Skip exchange/corporate action rows (stock conversions)
  if (upperDesc.startsWith('EXCHANGE')) {
    return { type: null, skip: true, reason: 'Exchange/corporate action - skipped' };
  }

  // Skip fractional share sales from DRIP cleanup
  if (upperDesc.includes('FRAC SHR') || upperDesc.includes('FRACTIONAL SHARE')) {
    return { type: null, skip: true, reason: 'Fractional share cleanup - skipped' };
  }

  // Purchase = BUY
  if (upperDesc.startsWith('PURCHASE') || upperDesc.includes('PURCHASE')) {
    return { type: 'BUY' };
  }

  // Sale = SELL (but not fractional share sales from DRIP)
  if (upperDesc.startsWith('SALE') || upperDesc.includes('SALE')) {
    return { type: 'SELL' };
  }

  // Dividend (including foreign dividend, but not stock dividend or reinvestment)
  if (
    (upperDesc.includes('DIVIDEND') || upperDesc.includes('DIV')) &&
    !upperDesc.includes('REINV') &&
    !upperDesc.includes('STOCK DIVIDEND')
  ) {
    return { type: 'DIVIDEND' };
  }

  // Bank Interest
  if (upperDesc.includes('BANK INTEREST')) {
    return { type: 'DIVIDEND' }; // Treat interest as dividend income
  }

  // Funds Received = Deposit
  if (upperDesc.includes('FUNDS RECEIVED')) {
    return { type: 'DEPOSIT' };
  }

  // Generic deposit/transfer in
  if (upperDesc.includes('DEPOSIT') || upperDesc.includes('TRANSFER IN')) {
    return { type: 'DEPOSIT' };
  }

  // Withdrawal
  if (upperDesc.includes('WITHDRAWAL') || upperDesc.includes('TRANSFER OUT')) {
    return { type: 'WITHDRAW' };
  }

  return { type: null };
}

/**
 * Clean symbol from Merrill format (remove CUSIP, trim spaces).
 */
function cleanSymbol(symbolField: string): string {
  // Remove quotes and extra spaces
  const cleaned = symbolField.replace(/"/g, '').trim();

  // Skip pure numeric CUSIPs (bank interest uses these)
  if (/^\d+$/.test(cleaned)) {
    return '';
  }

  // If it looks like a ticker symbol (1-6 letters/numbers), use it
  // Extended to 6 chars for symbols like GOOGL, TSTXX
  if (/^[A-Z]{1,6}$/.test(cleaned.toUpperCase())) {
    return cleaned.toUpperCase();
  }

  // Handle symbols with numbers like "USBPRH"
  if (/^[A-Z0-9]{1,6}$/i.test(cleaned)) {
    return cleaned.toUpperCase();
  }

  // Otherwise, try to extract the ticker from the start
  const match = cleaned.match(/^([A-Z]{1,6})/i);
  return match ? match[1].toUpperCase() : '';
}

/**
 * Check if row is a summary/total row that should be skipped.
 */
function isSummaryRow(row: CSVParsedRow): boolean {
  const values = Object.values(row.data);
  const firstValue = values[0] || '';

  if (firstValue.toLowerCase().includes('total activity')) return true;
  if (firstValue.toLowerCase().includes('total from')) return true;

  return false;
}

/**
 * Get field value from row, handling Merrill's trailing space headers.
 */
function getField(data: Record<string, string>, ...possibleNames: string[]): string {
  for (const name of possibleNames) {
    // Try exact match
    if (data[name] !== undefined) return data[name];

    // Try with trailing space
    if (data[`${name} `] !== undefined) return data[`${name} `];

    // Try trimmed match
    for (const key of Object.keys(data)) {
      if (key.trim() === name) return data[key];
    }
  }
  return '';
}

/**
 * Validate a single Merrill transaction row.
 */
export function validateMerrillTransactionRow(row: CSVParsedRow): PortfolioTransactionValidation {
  const errors: CSVValidationError[] = [];
  const data = row.data;

  // Skip summary rows
  if (isSummaryRow(row)) {
    return { valid: false, errors: [{ row: row.rowNumber, field: '', value: '', message: 'Summary row - skipped' }] };
  }

  // Get fields (handling trailing spaces in headers)
  const tradeDate = getField(data, 'Trade Date', 'Trade Date ');
  const description = getField(data, 'Description');
  const symbolField = getField(data, 'Symbol/ CUSIP', 'Symbol/  CUSIP  ', 'Symbol');
  const quantity = getField(data, 'Quantity');
  const price = getField(data, 'Price');
  const amount = getField(data, 'Amount');

  // Skip empty rows
  if (!tradeDate && !description && !symbolField) {
    return { valid: false, errors: [{ row: row.rowNumber, field: '', value: '', message: 'Empty row - skipped' }] };
  }

  // Parse transaction type
  const txTypeResult = parseTransactionType(description);

  // Skip transactions that should be ignored
  if (txTypeResult.skip) {
    return {
      valid: false,
      errors: [{ row: row.rowNumber, field: '', value: '', message: txTypeResult.reason || 'Skipped' }],
    };
  }

  const transactionType = txTypeResult.type;
  if (!transactionType) {
    return {
      valid: false,
      errors: [{ row: row.rowNumber, field: 'Description', value: description, message: `Unrecognized transaction type` }],
    };
  }

  // Parse date
  const transactionDate = parseMerrillDate(tradeDate);
  if (!transactionDate) {
    errors.push({
      row: row.rowNumber,
      field: 'Trade Date',
      value: tradeDate,
      message: 'Invalid date format. Expected MM/DD/YYYY',
    });
  }

  // For BUY/SELL, validate symbol
  const isBuySell = transactionType === 'BUY' || transactionType === 'SELL';
  const symbol = cleanSymbol(symbolField);

  if (isBuySell) {
    if (!symbol || !/^[A-Z0-9]{1,6}$/i.test(symbol)) {
      errors.push({
        row: row.rowNumber,
        field: 'Symbol',
        value: symbolField,
        message: 'Invalid symbol. Must be 1-6 alphanumeric characters',
      });
    }
  }

  // Skip dividends with no symbol (bank interest)
  if (transactionType === 'DIVIDEND' && !symbol) {
    // Bank interest without a valid symbol - skip
    return {
      valid: false,
      errors: [{ row: row.rowNumber, field: '', value: '', message: 'Bank interest without symbol - skipped' }],
    };
  }

  // Parse numeric values
  const priceValue = Math.abs(parseNumber(price));
  const quantityValue = Math.abs(parseNumber(quantity));
  const amountValue = parseNumber(amount);

  // Validate quantity for BUY/SELL
  if (isBuySell && quantityValue <= 0) {
    errors.push({
      row: row.rowNumber,
      field: 'Quantity',
      value: quantity,
      message: 'Quantity must be a positive number',
    });
  }

  // Validate price for BUY/SELL
  if (isBuySell && priceValue <= 0) {
    errors.push({
      row: row.rowNumber,
      field: 'Price',
      value: price,
      message: 'Price must be a positive number',
    });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Ensure transactionDate is valid (should always be true after error check above)
  if (!transactionDate) {
    return {
      valid: false,
      errors: [{ row: row.rowNumber, field: 'Trade Date', value: tradeDate, message: 'Invalid date format' }],
    };
  }

  // Build parsed transaction
  const parsed: ParsedPortfolioTransaction = {
    symbol: isBuySell || transactionType === 'DIVIDEND' ? symbol : null,
    transactionType,
    quantity: isBuySell ? quantityValue : null,
    pricePerShare: isBuySell ? priceValue : null,
    totalAmount: Math.abs(amountValue),
    fees: 0, // Merrill doesn't have separate fee columns in this format
    transactionDate,
    notes: `Imported from Merrill Lynch: ${description.substring(0, 50)}`,
  };

  return { valid: true, data: parsed, errors: [] };
}

/**
 * Map multiple Merrill transaction rows to portfolio transactions.
 */
export function mapMerrillTransactionRows(
  rows: CSVParsedRow[]
): { transactions: ParsedPortfolioTransaction[]; errors: CSVValidationError[] } {
  const transactions: ParsedPortfolioTransaction[] = [];
  const errors: CSVValidationError[] = [];

  for (const row of rows) {
    const result = validateMerrillTransactionRow(row);

    if (result.valid && result.data) {
      transactions.push(result.data);
    } else {
      // Only add real errors (not skip messages)
      const realErrors = result.errors.filter((e) => !e.message.includes('skipped'));
      errors.push(...realErrors);
    }
  }

  return { transactions, errors };
}

export default mapMerrillTransactionRows;
