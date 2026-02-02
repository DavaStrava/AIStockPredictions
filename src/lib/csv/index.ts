/**
 * CSV Library Barrel Exports
 *
 * Centralized exports for CSV parsing, format detection, and mapping utilities.
 */

// Core utilities
export { parseCSV, parseCSVFile, readFileAsText, type CSVParseOptions } from './csvParser';
export {
  detectCSVFormat,
  getFormatDisplayName,
  isPortfolioCompatible,
  isTradeCompatible,
} from './formatDetector';

// Mappers
export { validateFidelityRow, mapFidelityRows } from './fidelityMapper';
export { validateMerrillTransactionRow, mapMerrillTransactionRows } from './merrillTransactionsMapper';
export { validateMerrillHoldingsRow, mapMerrillHoldingsRows } from './merrillHoldingsMapper';
export { validateTradeRow, mapTradeRows } from './tradeCSVMapper';
