/**
 * Trade Tracker CSV Mapper
 *
 * Maps custom Trade Tracker CSV format to JournalTrade records.
 *
 * CSV columns:
 * Symbol,Side,EntryPrice,Quantity,EntryDate,ExitPrice,ExitDate,Fees,Notes
 *
 * Parsing rules:
 * - Symbol: 1-5 uppercase letters
 * - Side: LONG or SHORT
 * - EntryPrice: positive number
 * - Quantity: positive number
 * - EntryDate: YYYY-MM-DD format
 * - ExitPrice: positive number or empty (if empty, trade is OPEN)
 * - ExitDate: required if ExitPrice provided
 * - Fees: non-negative number
 * - Notes: optional text
 *
 * Status determination:
 * - CLOSED if ExitPrice is provided
 * - OPEN if ExitPrice is empty/missing
 *
 * P&L calculation (for closed trades):
 * - LONG: (exitPrice - entryPrice) * quantity - fees
 * - SHORT: (entryPrice - exitPrice) * quantity - fees
 */

import type {
  CSVParsedRow,
  ParsedTrade,
  TradeValidation,
  CSVValidationError,
} from '@/types/csv';
import type { TradeSide, TradeStatus } from '@/types/models';

/**
 * Parse date in YYYY-MM-DD format.
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;

  const cleaned = dateStr.trim();

  // Try YYYY-MM-DD format first
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    const date = new Date(cleaned + 'T00:00:00');
    if (!isNaN(date.getTime())) return date;
  }

  // Try MM/DD/YYYY format
  const parts = cleaned.split('/');
  if (parts.length === 3) {
    const month = parseInt(parts[0], 10) - 1;
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) return date;
    }
  }

  return null;
}

/**
 * Parse numeric value.
 */
function parseNumber(value: string): number | null {
  if (!value || value.trim() === '') return null;

  const cleaned = value.replace(/[$,]/g, '').trim();
  const num = parseFloat(cleaned);

  return isNaN(num) ? null : num;
}

/**
 * Parse trade side.
 */
function parseSide(value: string): TradeSide | null {
  const upper = value.toUpperCase().trim();

  if (upper === 'LONG' || upper === 'L') return 'LONG';
  if (upper === 'SHORT' || upper === 'S') return 'SHORT';

  return null;
}

/**
 * Calculate realized P&L for a closed trade.
 */
function calculatePnL(
  side: TradeSide,
  entryPrice: number,
  exitPrice: number,
  quantity: number,
  fees: number
): number {
  if (side === 'LONG') {
    return (exitPrice - entryPrice) * quantity - fees;
  } else {
    return (entryPrice - exitPrice) * quantity - fees;
  }
}

/**
 * Get field value with fallback names.
 */
function getField(data: Record<string, string>, ...names: string[]): string {
  for (const name of names) {
    if (data[name] !== undefined) return data[name];

    // Try case-insensitive match
    const lowerName = name.toLowerCase();
    for (const key of Object.keys(data)) {
      if (key.toLowerCase() === lowerName) return data[key];
    }
  }
  return '';
}

/**
 * Validate a single trade row.
 */
export function validateTradeRow(row: CSVParsedRow): TradeValidation {
  const errors: CSVValidationError[] = [];
  const data = row.data;

  // Get fields
  const symbol = getField(data, 'Symbol', 'symbol').toUpperCase().trim();
  const sideStr = getField(data, 'Side', 'side');
  const entryPriceStr = getField(data, 'EntryPrice', 'Entry Price', 'entry_price');
  const quantityStr = getField(data, 'Quantity', 'quantity', 'Qty');
  const entryDateStr = getField(data, 'EntryDate', 'Entry Date', 'entry_date');
  const exitPriceStr = getField(data, 'ExitPrice', 'Exit Price', 'exit_price');
  const exitDateStr = getField(data, 'ExitDate', 'Exit Date', 'exit_date');
  const feesStr = getField(data, 'Fees', 'fees', 'Commission');
  const notes = getField(data, 'Notes', 'notes', 'Comment');

  // Skip empty rows
  if (!symbol && !sideStr && !entryPriceStr) {
    return { valid: false, errors: [{ row: row.rowNumber, field: '', value: '', message: 'Empty row - skipped' }] };
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

  // Validate side
  const side = parseSide(sideStr);
  if (!side) {
    errors.push({
      row: row.rowNumber,
      field: 'Side',
      value: sideStr,
      message: 'Invalid side. Must be LONG or SHORT',
    });
  }

  // Validate entry price
  const entryPrice = parseNumber(entryPriceStr);
  if (entryPrice === null || entryPrice <= 0) {
    errors.push({
      row: row.rowNumber,
      field: 'EntryPrice',
      value: entryPriceStr,
      message: 'Entry price must be a positive number',
    });
  }

  // Validate quantity
  const quantity = parseNumber(quantityStr);
  if (quantity === null || quantity <= 0) {
    errors.push({
      row: row.rowNumber,
      field: 'Quantity',
      value: quantityStr,
      message: 'Quantity must be a positive number',
    });
  }

  // Validate entry date
  const entryDate = parseDate(entryDateStr);
  if (!entryDate) {
    errors.push({
      row: row.rowNumber,
      field: 'EntryDate',
      value: entryDateStr,
      message: 'Invalid entry date. Expected YYYY-MM-DD or MM/DD/YYYY',
    });
  }

  // Validate exit price (optional)
  const exitPrice = parseNumber(exitPriceStr);
  if (exitPriceStr && exitPriceStr.trim() !== '' && (exitPrice === null || exitPrice <= 0)) {
    errors.push({
      row: row.rowNumber,
      field: 'ExitPrice',
      value: exitPriceStr,
      message: 'Exit price must be a positive number if provided',
    });
  }

  // Validate exit date (required if exit price provided)
  const exitDate = parseDate(exitDateStr);
  if (exitPrice !== null && exitPrice > 0 && !exitDate) {
    errors.push({
      row: row.rowNumber,
      field: 'ExitDate',
      value: exitDateStr,
      message: 'Exit date is required when exit price is provided',
    });
  }

  // Parse fees (default to 0)
  const fees = parseNumber(feesStr) || 0;
  if (fees < 0) {
    errors.push({
      row: row.rowNumber,
      field: 'Fees',
      value: feesStr,
      message: 'Fees cannot be negative',
    });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Determine status and calculate P&L
  const hasExit = exitPrice !== null && exitPrice > 0 && exitDate !== null;
  const status: TradeStatus = hasExit ? 'CLOSED' : 'OPEN';

  let realizedPnl: number | null = null;
  if (hasExit && side && entryPrice && quantity) {
    realizedPnl = calculatePnL(side, entryPrice, exitPrice!, quantity, fees);
  }

  // Build parsed trade
  const parsed: ParsedTrade = {
    symbol,
    side: side!,
    status,
    entryPrice: entryPrice!,
    quantity: quantity!,
    entryDate: entryDate!,
    exitPrice: hasExit ? exitPrice! : null,
    exitDate: hasExit ? exitDate! : null,
    fees,
    realizedPnl,
    notes: notes || null,
  };

  return { valid: true, data: parsed, errors: [] };
}

/**
 * Map multiple trade rows to parsed trades.
 */
export function mapTradeRows(
  rows: CSVParsedRow[]
): { trades: ParsedTrade[]; errors: CSVValidationError[] } {
  const trades: ParsedTrade[] = [];
  const errors: CSVValidationError[] = [];

  for (const row of rows) {
    const result = validateTradeRow(row);

    if (result.valid && result.data) {
      trades.push(result.data);
    } else {
      // Only add real errors (not skip messages)
      const realErrors = result.errors.filter((e) => !e.message.includes('skipped'));
      errors.push(...realErrors);
    }
  }

  return { trades, errors };
}

export default mapTradeRows;
