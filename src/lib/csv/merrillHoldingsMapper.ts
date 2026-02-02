/**
 * Merrill Lynch Holdings CSV Mapper
 *
 * Converts Merrill Lynch holdings snapshot to BUY transactions.
 * Used for initial portfolio setup from current positions.
 *
 * Headers:
 * "COB Date","Security #","Symbol","CUSIP #","Security Description","Account Nickname",
 * "Account Registration","Account #","Quantity","Price ($)","Value ($)",
 * "Unrealized Gain/Loss ($)","Unrealized Gain/Loss (%)",...
 *
 * Parsing rules:
 * - All values quoted
 * - Date format: M/DD/YYYY (no leading zero on month)
 * - Quantity: Supports fractional (e.g., "15.0933", "288.7031")
 * - Price: Strip commas (e.g., "27,040.00" -> 27040.00)
 * - Negative values in parentheses: "(352.96)" -> -352.96
 * - Skip money market funds (e.g., "TSTXX")
 * - Import as: BUY transactions with COB Date as transaction date
 */

import type {
  CSVParsedRow,
  ParsedPortfolioTransaction,
  PortfolioTransactionValidation,
  CSVValidationError,
} from '@/types/csv';

/**
 * Parse date in M/DD/YYYY or MM/DD/YYYY format.
 */
function parseMerrillHoldingsDate(dateStr: string): Date | null {
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
 * Parse numeric value, handling:
 * - Quoted values: "123.45"
 * - Commas: "1,234.56"
 * - Parentheses for negative: "(123.45)"
 */
function parseNumber(value: string): number {
  if (!value) return 0;

  // Remove quotes
  let cleaned = value.replace(/"/g, '').trim();

  // Handle parentheses for negative
  const isNegative = cleaned.startsWith('(') && cleaned.endsWith(')');
  if (isNegative) {
    cleaned = cleaned.slice(1, -1);
  }

  // Remove commas and dollar signs
  cleaned = cleaned.replace(/[$,]/g, '');

  // Handle "--" as zero
  if (cleaned === '--' || cleaned === '-') return 0;

  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;

  return isNegative ? -num : num;
}

/**
 * Check if symbol is a money market fund (should be skipped).
 */
function isMoneyMarketFund(symbol: string): boolean {
  // Common money market fund patterns
  const mmPatterns = [
    /^TST[A-Z]{2}$/, // TSTXX
    /^CORE[A-Z]*$/,
    /^SPAXX$/,
    /^FCASH$/,
    /^VMFXX$/,
    /^FDRXX$/,
  ];

  const upperSymbol = symbol.toUpperCase();
  return mmPatterns.some((pattern) => pattern.test(upperSymbol));
}

/**
 * Validate a single Merrill holdings row.
 */
export function validateMerrillHoldingsRow(row: CSVParsedRow): PortfolioTransactionValidation {
  const errors: CSVValidationError[] = [];
  const data = row.data;

  // Get fields
  const cobDate = data['COB Date'] || '';
  const symbol = (data['Symbol'] || '').replace(/"/g, '').trim().toUpperCase();
  const quantity = data['Quantity'] || '';
  const price = data['Price ($)'] || '';
  const value = data['Value ($)'] || '';

  // Skip empty rows
  if (!cobDate && !symbol) {
    return { valid: false, errors: [{ row: row.rowNumber, field: '', value: '', message: 'Empty row - skipped' }] };
  }

  // Skip money market funds
  if (isMoneyMarketFund(symbol)) {
    return {
      valid: false,
      errors: [{ row: row.rowNumber, field: 'Symbol', value: symbol, message: 'Money market fund - skipped' }],
    };
  }

  // Validate symbol
  if (!symbol || !/^[A-Z]{1,5}$/.test(symbol)) {
    errors.push({
      row: row.rowNumber,
      field: 'Symbol',
      value: symbol,
      message: 'Invalid symbol. Must be 1-5 uppercase letters',
    });
  }

  // Parse date
  const transactionDate = parseMerrillHoldingsDate(cobDate);
  if (!transactionDate) {
    errors.push({
      row: row.rowNumber,
      field: 'COB Date',
      value: cobDate,
      message: 'Invalid date format. Expected M/DD/YYYY',
    });
  }

  // Parse numeric values
  const quantityValue = parseNumber(quantity);
  const priceValue = parseNumber(price);
  const valueValue = parseNumber(value);

  // Validate quantity
  if (quantityValue <= 0) {
    errors.push({
      row: row.rowNumber,
      field: 'Quantity',
      value: quantity,
      message: 'Quantity must be a positive number',
    });
  }

  // Validate price
  if (priceValue <= 0) {
    errors.push({
      row: row.rowNumber,
      field: 'Price ($)',
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
      errors: [{ row: row.rowNumber, field: 'COB Date', value: cobDate, message: 'Invalid date format' }],
    };
  }

  // Build parsed transaction (as BUY)
  // Use the value as total amount, or calculate from price * quantity
  const totalAmount = valueValue > 0 ? valueValue : priceValue * quantityValue;

  const parsed: ParsedPortfolioTransaction = {
    symbol,
    transactionType: 'BUY',
    quantity: quantityValue,
    pricePerShare: priceValue,
    totalAmount,
    fees: 0,
    transactionDate,
    notes: `Imported from Merrill Lynch Holdings snapshot (COB: ${cobDate})`,
  };

  return { valid: true, data: parsed, errors: [] };
}

/**
 * Map multiple Merrill holdings rows to portfolio transactions.
 */
export function mapMerrillHoldingsRows(
  rows: CSVParsedRow[]
): { transactions: ParsedPortfolioTransaction[]; errors: CSVValidationError[] } {
  const transactions: ParsedPortfolioTransaction[] = [];
  const errors: CSVValidationError[] = [];

  for (const row of rows) {
    const result = validateMerrillHoldingsRow(row);

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

export default mapMerrillHoldingsRows;
