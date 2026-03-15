/**
 * Merrill Lynch Transactions CSV Mapper
 *
 * Maps Merrill Lynch/Edge transaction CSV format to portfolio transactions.
 *
 * Format structure (may vary slightly):
 * - Row 1: "Exported on: 02/02/2026 12:07 AM ET"
 * - Rows 2-4: Metadata
 * - Row 5: Headers with trailing spaces
 * - Rows 6-8: Empty rows and filter text
 * - Row 9+: Data rows (first row with date pattern)
 *
 * Headers (with trailing spaces, may include Account column):
 * "Trade Date ","Settlement Date ","Account","Description","Type","Symbol/ CUSIP ","Quantity","Price","Amount"," "
 *
 * Parsing rules:
 * - Format detector finds actual data start dynamically
 * - Headers have trailing spaces - trim all values
 * - Date format: MM/DD/YYYY (quoted)
 * - Transaction type from Description: "Purchase" -> BUY, "Sale" -> SELL, "Pending Sale" -> SELL
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
  /** DRIP details extracted from description */
  dripDetails?: {
    dividendAmount: number;
    reinvPrice: number;
    reinvShares: number;
  };
}

/**
 * Extract DRIP details from reinvestment description.
 * Example: "Reinvestment Share(s) REINV AMT $14.23 REINV PRICE $659.38 REINV SHRS .0216"
 */
function extractDripDetails(description: string): {
  dividendAmount: number;
  reinvPrice: number;
  reinvShares: number;
} | null {
  const amtMatch = description.match(/REINV\s*AMT\s*\$?([\d,.]+)/i);
  const priceMatch = description.match(/REINV\s*PRICE\s*\$?([\d,.]+)/i);
  const sharesMatch = description.match(/REINV\s*SHRS?\s*([\d,.]+)/i);

  if (amtMatch && priceMatch && sharesMatch) {
    return {
      dividendAmount: parseFloat(amtMatch[1].replace(/,/g, '')),
      reinvPrice: parseFloat(priceMatch[1].replace(/,/g, '')),
      reinvShares: parseFloat(sharesMatch[1].replace(/,/g, '')),
    };
  }

  return null;
}

/**
 * Extract transaction type from Description field.
 */
function parseTransactionType(description: string): TransactionTypeResult {
  const upperDesc = description.toUpperCase();

  // Reinvestment transactions (DRIP) - now captured as DIVIDEND_REINVESTMENT
  if (upperDesc.includes('REINVESTMENT') && !upperDesc.includes('STOCK DIVIDEND')) {
    const dripDetails = extractDripDetails(description);
    if (dripDetails) {
      return { type: 'DIVIDEND_REINVESTMENT', dripDetails };
    }
    // If we can't extract DRIP details, still import it but without the details
    return { type: 'DIVIDEND_REINVESTMENT' };
  }

  // Skip stock dividends with $0 amount (like stock splits)
  if (upperDesc.includes('STOCK DIVIDEND DUE BILL')) {
    return { type: null, skip: true, reason: 'Stock dividend due bill - skipped' };
  }

  // Skip exchange/corporate action rows (stock conversions)
  if (upperDesc.startsWith('EXCHANGE')) {
    return { type: null, skip: true, reason: 'Exchange/corporate action - skipped' };
  }

  // Fractional share sales - import as regular SELL
  if (upperDesc.includes('FRAC SHR') || upperDesc.includes('FRACTIONAL SHARE')) {
    if (upperDesc.includes('SALE')) {
      return { type: 'SELL' };
    }
    return { type: null, skip: true, reason: 'Fractional share cleanup - skipped' };
  }

  // Purchase = BUY
  if (upperDesc.startsWith('PURCHASE') || upperDesc.includes('PURCHASE')) {
    return { type: 'BUY' };
  }

  // Pending Sale = SELL (handle Merrill's pending sale format)
  if (upperDesc.startsWith('PENDING SALE') || upperDesc.includes('PENDING SALE')) {
    return { type: 'SELL' };
  }

  // Sale = SELL
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

  // Bank Interest - now captured as INTEREST
  if (upperDesc.includes('BANK INTEREST') || upperDesc.includes('INTEREST CREDIT')) {
    return { type: 'INTEREST' };
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
 * Parse settlement date from Merrill format (MM/DD/YYYY).
 * Handles "Pending" text in settlement dates like "03/16/2026 Pending"
 */
function parseSettlementDate(dateStr: string): Date | null {
  // Remove "Pending" text if present
  const cleaned = dateStr.replace(/\s*Pending\s*/i, '').trim();
  return parseMerrillDate(cleaned);
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
  const settlementDateStr = getField(data, 'Settlement Date', 'Settlement Date ');
  const description = getField(data, 'Description');
  const symbolField = getField(data, 'Symbol/ CUSIP', 'Symbol/  CUSIP  ', 'Symbol');
  const quantity = getField(data, 'Quantity');
  const price = getField(data, 'Price');
  const amount = getField(data, 'Amount');

  // Skip empty rows
  if (!tradeDate && !description && !symbolField) {
    return { valid: false, errors: [{ row: row.rowNumber, field: '', value: '', message: 'Empty row - skipped' }] };
  }

  // Parse transaction type from description first
  let txTypeResult = parseTransactionType(description);

  // Skip transactions that should be ignored
  if (txTypeResult.skip) {
    return {
      valid: false,
      errors: [{ row: row.rowNumber, field: '', value: '', message: txTypeResult.reason || 'Skipped' }],
    };
  }

  // Fallback: Use Amount sign to determine BUY/SELL when Description is ambiguous
  // In Merrill Edge: negative Amount = cash out = BUY, positive Amount = cash in = SELL
  const amountValueForDetection = parseNumber(amount);
  if (!txTypeResult.type && symbol && quantity) {
    const symbolValue = cleanSymbol(symbolField);
    const quantityValue = parseNumber(quantity);

    // If we have a valid symbol and quantity, use Amount sign to determine transaction type
    if (symbolValue && Math.abs(quantityValue) > 0) {
      if (amountValueForDetection < 0) {
        // Negative amount = cash out = BUY
        txTypeResult = { type: 'BUY' };
      } else if (amountValueForDetection > 0) {
        // Positive amount = cash in = SELL
        txTypeResult = { type: 'SELL' };
      }
    }
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

  // Parse settlement date (optional)
  const settlementDate = settlementDateStr ? parseSettlementDate(settlementDateStr) : null;

  // Determine which transaction types require symbol
  const isBuySell = transactionType === 'BUY' || transactionType === 'SELL';
  const isDrip = transactionType === 'DIVIDEND_REINVESTMENT';
  const needsSymbol = isBuySell || isDrip || transactionType === 'DIVIDEND';

  const symbol = cleanSymbol(symbolField);

  if (isBuySell && (!symbol || !/^[A-Z0-9]{1,6}$/i.test(symbol))) {
    errors.push({
      row: row.rowNumber,
      field: 'Symbol',
      value: symbolField,
      message: 'Invalid symbol. Must be 1-6 alphanumeric characters',
    });
  }

  // DRIP needs a symbol
  if (isDrip && (!symbol || !/^[A-Z0-9]{1,6}$/i.test(symbol))) {
    errors.push({
      row: row.rowNumber,
      field: 'Symbol',
      value: symbolField,
      message: 'Invalid symbol for reinvestment. Must be 1-6 alphanumeric characters',
    });
  }

  // Dividends need a symbol (INTEREST does not)
  if (transactionType === 'DIVIDEND' && !symbol) {
    // Dividend without a valid symbol - might be bank interest misclassified
    return {
      valid: false,
      errors: [{ row: row.rowNumber, field: '', value: '', message: 'Dividend without symbol - skipped' }],
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

  // Build parsed transaction with trade tracking fields
  const parsed: ParsedPortfolioTransaction = {
    symbol: needsSymbol ? symbol : null,
    transactionType,
    quantity: null,
    pricePerShare: null,
    totalAmount: 0,
    fees: 0, // Merrill doesn't have separate fee columns in this format
    transactionDate,
    notes: '',
    importSource: 'merrill_edge',
    rawDescription: description,
    settlementDate: settlementDate || undefined,
  };

  // Handle different transaction types
  if (isBuySell) {
    parsed.quantity = quantityValue;
    parsed.pricePerShare = priceValue;
    // BUY: cash out (negative), SELL: cash in (positive)
    // Merrill already has correct sign in Amount column
    parsed.totalAmount = Math.abs(amountValue);
    parsed.notes = `Imported from Merrill Edge: ${description.substring(0, 100)}`;
    parsed.side = 'LONG'; // Default to long positions
    // Mark both BUY and SELL as trades for tracking
    // BUY starts as OPEN, SELL will trigger auto-close of matching BUYs
    parsed.tradeStatus = transactionType === 'BUY' ? 'OPEN' : 'CLOSED';
  } else if (isDrip) {
    // DIVIDEND_REINVESTMENT: dividend + automatic buy
    // totalAmount = 0 (dividend and buy cancel out)
    const dripDetails = txTypeResult.dripDetails;
    if (dripDetails) {
      parsed.quantity = dripDetails.reinvShares;
      parsed.pricePerShare = dripDetails.reinvPrice;
      parsed.notes = `Dividend: $${dripDetails.dividendAmount.toFixed(2)}`;
    } else {
      // Fall back to CSV values if DRIP parsing failed
      parsed.quantity = quantityValue;
      parsed.pricePerShare = priceValue;
      parsed.notes = `DRIP: ${description.substring(0, 100)}`;
    }
    parsed.totalAmount = 0; // Net zero cash impact
  } else if (transactionType === 'DIVIDEND' || transactionType === 'INTEREST') {
    // Cash income
    parsed.totalAmount = Math.abs(amountValue);
    parsed.notes = `Imported from Merrill Edge: ${description.substring(0, 100)}`;
  } else if (transactionType === 'DEPOSIT' || transactionType === 'WITHDRAW') {
    // Cash movements
    parsed.totalAmount = Math.abs(amountValue);
    parsed.notes = `Imported from Merrill Edge: ${description.substring(0, 100)}`;
  }

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
