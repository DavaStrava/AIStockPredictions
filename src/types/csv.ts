/**
 * CSV Import Types
 *
 * Types for CSV parsing, format detection, and import operations
 * for both Portfolio transactions and Trade Tracker.
 */

import type { PortfolioTransactionType } from './portfolio';
import type { TradeSide, TradeStatus } from './models';

// ============================================================================
// CSV Format Detection
// ============================================================================

/**
 * Supported CSV format types.
 */
export type CSVFormatType =
  | 'fidelity'
  | 'merrill_transactions'
  | 'merrill_holdings'
  | 'trade_tracker'
  | 'unknown';

/**
 * Result of format detection.
 */
export interface CSVFormatDetectionResult {
  format: CSVFormatType;
  headerRowIndex: number;
  dataStartIndex: number;
  confidence: number;
}

// ============================================================================
// CSV Parsing
// ============================================================================

/**
 * Parsed CSV row with original row number for error reporting.
 */
export interface CSVParsedRow {
  rowNumber: number;
  data: Record<string, string>;
}

/**
 * Result of CSV parsing.
 */
export interface CSVParseResult {
  headers: string[];
  rows: CSVParsedRow[];
  totalRows: number;
}

// ============================================================================
// Validation & Import Results
// ============================================================================

/**
 * Validation error for a specific field in a row.
 */
export interface CSVValidationError {
  row: number;
  field: string;
  value: string;
  message: string;
}

/**
 * Result of importing CSV data.
 */
export interface CSVImportResult<T = unknown> {
  success: boolean;
  imported: number;
  failed: number;
  errors: CSVValidationError[];
  data?: T[];
}

// ============================================================================
// Portfolio Transaction CSV
// ============================================================================

/**
 * Parsed portfolio transaction from CSV (before database insert).
 */
export interface ParsedPortfolioTransaction {
  symbol: string | null;
  transactionType: PortfolioTransactionType;
  quantity: number | null;
  pricePerShare: number | null;
  totalAmount: number;
  fees: number;
  transactionDate: Date;
  notes?: string;
}

/**
 * Validation result for a portfolio transaction row.
 */
export interface PortfolioTransactionValidation {
  valid: boolean;
  data?: ParsedPortfolioTransaction;
  errors: CSVValidationError[];
}

// ============================================================================
// Portfolio Holdings CSV (Direct Import)
// ============================================================================

/**
 * Parsed holding from CSV for direct write to portfolio_holdings table.
 * Used for Holdings Snapshot Import workflow (bypasses transactions).
 */
export interface ParsedHolding {
  symbol: string;
  quantity: number;
  averageCostBasis: number;
  totalValue?: number;
  purchaseDate?: Date;
  sector?: string;
}

/**
 * Validation result for a holding row.
 */
export interface HoldingValidation {
  valid: boolean;
  data?: ParsedHolding;
  errors: CSVValidationError[];
}

/**
 * Result of importing holdings directly.
 */
export interface HoldingsImportResult {
  success: boolean;
  imported: number;
  updated: number;
  failed: number;
  errors: CSVValidationError[];
}

// ============================================================================
// Trade Tracker CSV
// ============================================================================

/**
 * Parsed trade from CSV (before database insert).
 */
export interface ParsedTrade {
  symbol: string;
  side: TradeSide;
  status: TradeStatus;
  entryPrice: number;
  quantity: number;
  entryDate: Date;
  exitPrice: number | null;
  exitDate: Date | null;
  fees: number;
  realizedPnl: number | null;
  notes: string | null;
}

/**
 * Validation result for a trade row.
 */
export interface TradeValidation {
  valid: boolean;
  data?: ParsedTrade;
  errors: CSVValidationError[];
}

// ============================================================================
// Column Mapping
// ============================================================================

/**
 * Column mapping configuration for transforming CSV columns to target fields.
 */
export interface CSVColumnMapping {
  csvColumn: string;
  targetField: string;
  required: boolean;
  transform?: (value: string) => unknown;
}

/**
 * Mapping configuration for a CSV format.
 */
export interface CSVFormatMapping {
  format: CSVFormatType;
  mappings: CSVColumnMapping[];
}

// ============================================================================
// Import Modal State
// ============================================================================

/**
 * Steps in the CSV import flow.
 */
export type CSVImportStep = 'upload' | 'preview' | 'confirm' | 'result';

/**
 * State for the CSV import modal.
 */
export interface CSVImportState {
  step: CSVImportStep;
  file: File | null;
  format: CSVFormatType;
  parseResult: CSVParseResult | null;
  validatedRows: Array<{
    rowNumber: number;
    valid: boolean;
    data: Record<string, unknown>;
    errors: CSVValidationError[];
  }>;
  importResult: CSVImportResult | null;
  loading: boolean;
  error: string | null;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Request body for portfolio transaction import API.
 */
export interface PortfolioImportRequest {
  transactions: ParsedPortfolioTransaction[];
}

/**
 * Request body for trade import API.
 */
export interface TradeImportRequest {
  trades: ParsedTrade[];
}

/**
 * Request body for holdings snapshot import API.
 */
export interface HoldingsImportRequest {
  holdings: ParsedHolding[];
}

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props for CSVImportModal component.
 */
export interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title: string;
  /**
   * Import type:
   * - 'portfolio': Transaction-based import (creates BUY/SELL/etc transactions)
   * - 'holdings': Direct holdings snapshot import (writes to portfolio_holdings table)
   * - 'trade': Trade tracker import
   */
  importType: 'portfolio' | 'holdings' | 'trade';
  portfolioId?: string;
}

/**
 * Props for CSVPreviewTable component.
 */
export interface CSVPreviewTableProps {
  headers: string[];
  rows: Array<{
    rowNumber: number;
    valid: boolean;
    data: Record<string, unknown>;
    errors: CSVValidationError[];
  }>;
  maxRows?: number;
}

/**
 * Props for CSVFileUpload component.
 */
export interface CSVFileUploadProps {
  onFileSelect: (file: File) => void;
  loading?: boolean;
  error?: string | null;
  accept?: string;
  maxSize?: number;
}
