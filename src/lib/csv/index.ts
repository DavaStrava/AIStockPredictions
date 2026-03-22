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
  isHoldingsCompatible,
} from './formatDetector';

// Mappers
export { validateFidelityRow, mapFidelityRows } from './fidelityMapper';
export { validateMerrillTransactionRow, mapMerrillTransactionRows } from './merrillTransactionsMapper';
export {
  validateMerrillHoldingsRow,
  mapMerrillHoldingsRows,
  validateMerrillHoldingForSnapshot,
  mapMerrillHoldingsToHoldings,
} from './merrillHoldingsMapper';
export {
  validateMerrillPortfolioRow,
  mapMerrillPortfolioToHoldings,
  extractCashBalance,
  parseMerrillPortfolioSymbol,
  type MerrillPortfolioMapResult,
} from './merrillPortfolioMapper';
export { validateTradeRow, mapTradeRows } from './tradeCSVMapper';
