/**
 * Merrill Lynch Portfolio Export CSV Mapper
 *
 * Converts Merrill Lynch "Portfolio Export" format to holdings for direct import.
 * This format differs from Merrill Holdings and Merrill Transactions.
 *
 * File structure:
 * - Row 1: "Exported on: MM/DD/YYYY HH:MM AM/PM ET"
 * - Row 3: Account info
 * - Row 7: Account summary header
 * - Row 8: Account summary values
 * - Row 11: Holdings header: Symbol, Description, Quantity, % of Portfolio, Unit Cost, Price, Value, etc.
 * - Row 12-N: Stock holdings data
 * - "Balances" section: Money accounts (cash, liquidity funds)
 *
 * Parsing rules:
 * - Symbol may have trailing `!` for recent purchases (strip it)
 * - Skip rows with 0 quantity
 * - Skip "Money accounts" rows (they represent cash/liquidity funds)
 * - Extract cash balance from Money accounts for portfolio cash position
 * - Unit Cost = average cost basis
 * - Price = current market price (informational)
 * - Value = current market value
 */

import type {
  CSVParsedRow,
  CSVValidationError,
  ParsedHolding,
  HoldingValidation,
} from '@/types/csv';

/**
 * Parse numeric value, handling:
 * - Quoted values: "123.45"
 * - Commas: "1,234.56"
 * - Dollar signs: "$123.45"
 * - Percentage signs: "12.34%"
 * - Empty/dash values: "", "--", "-"
 */
function parseNumber(value: string): number {
  if (!value) return 0;

  // Remove quotes
  let cleaned = value.replace(/"/g, '').trim();

  // Handle empty/dash values
  if (cleaned === '' || cleaned === '--' || cleaned === '-' || cleaned === 'N/A') {
    return 0;
  }

  // Remove dollar signs, percent signs, and commas
  cleaned = cleaned.replace(/[$%,]/g, '');

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Clean symbol by removing trailing `!` and whitespace.
 * The `!` indicates a recently purchased stock in Merrill exports.
 */
export function parseMerrillPortfolioSymbol(symbol: string): string {
  if (!symbol) return '';

  // Remove quotes, trim whitespace, remove trailing `!`, uppercase
  return symbol
    .replace(/"/g, '')
    .trim()
    .replace(/\s*!$/, '')
    .toUpperCase();
}

/**
 * Check if a row represents a money account (cash/liquidity fund).
 *
 * In Merrill Portfolio Export format, the first column (Symbol) contains
 * category labels like "Money accounts", "Cash balance", "Balances", etc.
 * The fund name (e.g., "ML DIRECT DEPOSIT PROGRM") is in the Description column.
 */
export function isMoneyAccountRow(row: CSVParsedRow): boolean {
  const data = row.data;

  // Check first column for money account/cash indicators
  const firstCol = String(data['Symbol '] || data['Symbol'] || '').replace(/"/g, '').trim().toLowerCase();

  // These are the category labels in the first column (all non-stock rows)
  const cashCategories = [
    'money accounts',
    'cash balance',
    'pending activity',
    'total',
    'balances',
  ];

  return cashCategories.includes(firstCol);
}

/**
 * Check if a row should be skipped entirely.
 * Skip: empty rows, section headers, summary rows, money accounts.
 */
function shouldSkipRow(row: CSVParsedRow): { skip: boolean; reason?: string } {
  const data = row.data;

  // Get the symbol column (may have trailing space in header)
  const symbolRaw = String(data['Symbol '] || data['Symbol'] || '');
  const symbolTrimmed = symbolRaw.replace(/"/g, '').trim();

  // Skip empty symbol rows
  if (!symbolTrimmed) {
    return { skip: true, reason: 'Empty row' };
  }

  // Skip money account rows (these have category labels in first column)
  if (isMoneyAccountRow(row)) {
    return { skip: true, reason: 'Money account row' };
  }

  return { skip: false };
}

/**
 * Validate a single Merrill Portfolio row for holdings import.
 */
export function validateMerrillPortfolioRow(row: CSVParsedRow): HoldingValidation {
  const errors: CSVValidationError[] = [];
  const data = row.data;

  // Check if row should be skipped
  const skipCheck = shouldSkipRow(row);
  if (skipCheck.skip) {
    return {
      valid: false,
      errors: [{ row: row.rowNumber, field: '', value: '', message: `${skipCheck.reason} - skipped` }],
    };
  }

  // Get fields (header may have trailing space: "Symbol ")
  const symbolRaw = String(data['Symbol '] || data['Symbol'] || '');
  const symbol = parseMerrillPortfolioSymbol(symbolRaw);
  const quantityRaw = String(data['Quantity'] || '');
  const unitCostRaw = String(data['Unit Cost'] || '');
  const valueRaw = String(data['Value'] || '');

  // Parse numeric values
  const quantity = parseNumber(quantityRaw);
  const unitCost = parseNumber(unitCostRaw);
  const value = parseNumber(valueRaw);

  // Skip rows with 0 quantity (e.g., sold positions still showing)
  if (quantity === 0) {
    return {
      valid: false,
      errors: [{ row: row.rowNumber, field: 'Quantity', value: quantityRaw, message: 'Zero quantity - skipped' }],
    };
  }

  // Validate symbol format:
  // - 1-6 characters
  // - Uppercase letters, optionally with numbers or dots (e.g., BRK.A, BRK.B, BF.B)
  // - Must start with a letter
  if (!symbol || !/^[A-Z][A-Z0-9.]{0,5}$/.test(symbol)) {
    errors.push({
      row: row.rowNumber,
      field: 'Symbol',
      value: symbol,
      message: 'Invalid symbol. Must be 1-6 characters starting with a letter (e.g., AAPL, BRK.A)',
    });
  }

  // Validate quantity is positive
  if (quantity < 0) {
    errors.push({
      row: row.rowNumber,
      field: 'Quantity',
      value: quantityRaw,
      message: 'Quantity must be a positive number',
    });
  }

  // Unit cost can be 0 for gifted shares or transfers
  if (unitCost < 0) {
    errors.push({
      row: row.rowNumber,
      field: 'Unit Cost',
      value: unitCostRaw,
      message: 'Unit cost cannot be negative',
    });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Build parsed holding
  const totalValue = value > 0 ? value : quantity * unitCost;

  const parsed: ParsedHolding = {
    symbol,
    quantity,
    averageCostBasis: unitCost,
    totalValue,
    // No purchase date in this format; will use current date on import
  };

  return { valid: true, data: parsed, errors: [] };
}

/**
 * Extract cash balance from Money accounts rows.
 * Returns the sum of all money account values minus pending activity.
 *
 * CSV structure for cash rows:
 * - "Money accounts" ,"ML DIRECT DEPOSIT PROGRM" ,...,"$47,651.00",...
 * - "Money accounts" ,"BLACKROCK LIQUIDITY FUND" ,...,"$150,717.21",...
 * - "Cash balance" ,...,"$44,797.17",...
 * - "Pending activity" ,...,"-$34,856.43",...  (negative value to subtract)
 *
 * The first column (Symbol) contains "Money accounts", "Cash balance", or "Pending activity",
 * not the fund name. The fund name is in the Description column.
 */
export function extractCashBalance(rows: CSVParsedRow[]): number {
  let cashBalance = 0;

  for (const row of rows) {
    const data = row.data;
    // First column may be "Symbol " (with space) or "Symbol"
    const firstCol = String(data['Symbol '] || data['Symbol'] || '').replace(/"/g, '').trim().toLowerCase();

    // Check if this is a money account, cash balance, or pending activity row
    if (firstCol === 'money accounts' || firstCol === 'cash balance' || firstCol === 'pending activity') {
      const valueRaw = String(data['Value'] || '');
      const value = parseNumber(valueRaw);
      // Add the value (parseNumber handles negative values like "-$34,856.43")
      cashBalance += value;
    }
  }

  return cashBalance;
}

/**
 * Result of mapping Merrill Portfolio CSV, including cash balance.
 */
export interface MerrillPortfolioMapResult {
  holdings: ParsedHolding[];
  cashBalance: number;
  errors: CSVValidationError[];
}

/**
 * Map Merrill Portfolio Export rows to ParsedHolding[] with cash balance.
 */
export function mapMerrillPortfolioToHoldings(rows: CSVParsedRow[]): MerrillPortfolioMapResult {
  const holdings: ParsedHolding[] = [];
  const errors: CSVValidationError[] = [];

  for (const row of rows) {
    const result = validateMerrillPortfolioRow(row);

    if (result.valid && result.data) {
      holdings.push(result.data);
    } else {
      // Only add real errors (not skip messages)
      const realErrors = result.errors.filter((e) => !e.message.includes('skipped'));
      errors.push(...realErrors);
    }
  }

  // Extract cash balance from money account rows
  const cashBalance = extractCashBalance(rows);

  return { holdings, cashBalance, errors };
}

export default mapMerrillPortfolioToHoldings;
