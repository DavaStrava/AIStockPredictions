/**
 * Fidelity CSV Mapper
 *
 * Maps Fidelity transaction CSV format to portfolio transactions.
 *
 * Header row (row 3):
 * Run Date,Action,Symbol,Description,Type,Price ($),Quantity,Commission ($),Fees ($),Accrued Interest ($),Amount ($),Cash Balance ($),Settlement Date
 *
 * Parsing rules:
 * - Skip BOM character at file start
 * - Skip blank rows and disclaimer text at end
 * - Date format: MM/DD/YYYY
 * - Transaction type from Action field: "YOU BOUGHT" -> BUY, "YOU SOLD" -> SELL, contains "DIV" -> DIVIDEND
 * - Quantity: Positive number (supports fractional)
 * - Price: Number without $ symbol
 * - Fees: Sum of Commission ($) + Fees ($)
 * - Amount: Negative = BUY, Positive = SELL
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
function parseFidelityDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  const parts = dateStr.split('/');
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
 * Parse numeric value, removing $ and commas.
 */
function parseNumber(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[$,]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Determine transaction type from Fidelity Action field.
 */
function parseTransactionType(action: string): PortfolioTransactionType | null {
  const upperAction = action.toUpperCase();

  if (upperAction.includes('YOU BOUGHT') || upperAction.includes('BOUGHT')) {
    return 'BUY';
  }
  if (upperAction.includes('YOU SOLD') || upperAction.includes('SOLD')) {
    return 'SELL';
  }
  if (upperAction.includes('DIVIDEND') || upperAction.includes('DIV')) {
    return 'DIVIDEND';
  }
  if (upperAction.includes('DEPOSIT') || upperAction.includes('TRANSFERRED')) {
    return 'DEPOSIT';
  }
  if (upperAction.includes('WITHDRAW') || upperAction.includes('REDEMPTION')) {
    return 'WITHDRAW';
  }

  return null;
}

/**
 * Check if a row is a disclaimer/footer row that should be skipped.
 */
function isDisclaimerRow(row: CSVParsedRow): boolean {
  const values = Object.values(row.data);
  const firstValue = values[0] || '';

  // Disclaimer rows typically start with quotes containing legal text
  if (firstValue.includes('The data and information')) return true;
  if (firstValue.includes('Brokerage services')) return true;
  if (firstValue.includes('Fidelity Brokerage')) return true;

  return false;
}

/**
 * Validate a single Fidelity row.
 */
export function validateFidelityRow(row: CSVParsedRow): PortfolioTransactionValidation {
  const errors: CSVValidationError[] = [];
  const data = row.data;

  // Skip disclaimer rows
  if (isDisclaimerRow(row)) {
    return { valid: false, errors: [{ row: row.rowNumber, field: '', value: '', message: 'Disclaimer row - skipped' }] };
  }

  // Get required fields
  const runDate = data['Run Date'] || '';
  const action = data['Action'] || '';
  const symbol = data['Symbol'] || '';
  const price = data['Price ($)'] || '';
  const quantity = data['Quantity'] || '';
  const commission = data['Commission ($)'] || '';
  const fees = data['Fees ($)'] || '';
  const amount = data['Amount ($)'] || '';

  // Parse transaction type
  const transactionType = parseTransactionType(action);
  if (!transactionType) {
    // Skip rows with unrecognized action types silently (may be transfers, etc.)
    return {
      valid: false,
      errors: [{ row: row.rowNumber, field: 'Action', value: action, message: `Unrecognized action type: ${action}` }],
    };
  }

  // Parse date
  const transactionDate = parseFidelityDate(runDate);
  if (!transactionDate) {
    errors.push({
      row: row.rowNumber,
      field: 'Run Date',
      value: runDate,
      message: 'Invalid date format. Expected MM/DD/YYYY',
    });
  }

  // For BUY/SELL, validate symbol
  const isBuySell = transactionType === 'BUY' || transactionType === 'SELL';
  if (isBuySell) {
    if (!symbol || !/^[A-Z]{1,5}$/.test(symbol.toUpperCase())) {
      errors.push({
        row: row.rowNumber,
        field: 'Symbol',
        value: symbol,
        message: 'Invalid symbol. Must be 1-5 uppercase letters',
      });
    }
  }

  // Parse numeric values
  const priceValue = parseNumber(price);
  const quantityValue = parseNumber(quantity);
  const commissionValue = parseNumber(commission);
  const feesValue = parseNumber(fees);
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
      errors: [{ row: row.rowNumber, field: 'Run Date', value: runDate, message: 'Invalid date format' }],
    };
  }

  // Build parsed transaction
  const totalFees = commissionValue + feesValue;
  const totalAmount = Math.abs(amountValue);

  const parsed: ParsedPortfolioTransaction = {
    symbol: isBuySell || transactionType === 'DIVIDEND' ? symbol.toUpperCase() : null,
    transactionType,
    quantity: isBuySell ? Math.abs(quantityValue) : null,
    pricePerShare: isBuySell ? priceValue : null,
    totalAmount: totalAmount,
    fees: totalFees,
    transactionDate,
    notes: `Imported from Fidelity: ${action}`,
  };

  return { valid: true, data: parsed, errors: [] };
}

/**
 * Map multiple Fidelity rows to portfolio transactions.
 */
export function mapFidelityRows(
  rows: CSVParsedRow[]
): { transactions: ParsedPortfolioTransaction[]; errors: CSVValidationError[] } {
  const transactions: ParsedPortfolioTransaction[] = [];
  const errors: CSVValidationError[] = [];

  for (const row of rows) {
    const result = validateFidelityRow(row);

    if (result.valid && result.data) {
      transactions.push(result.data);
    } else {
      // Only add non-disclaimer errors
      const realErrors = result.errors.filter((e) => !e.message.includes('skipped'));
      errors.push(...realErrors);
    }
  }

  return { transactions, errors };
}

export default mapFidelityRows;
