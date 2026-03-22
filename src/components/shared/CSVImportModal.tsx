/**
 * CSVImportModal Component
 *
 * Multi-step modal for CSV import flow:
 * 1. Upload - Select and validate CSV file
 * 2. Preview - Review parsed data with validation errors
 * 3. Confirm - Confirm import before committing
 * 4. Result - Show import results
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Upload, Check, AlertCircle, FileText } from 'lucide-react';
import { CSVFileUpload } from './CSVFileUpload';
import { CSVPreviewTable } from './CSVPreviewTable';
import {
  parseCSV,
  readFileAsText,
  detectCSVFormat,
  getFormatDisplayName,
  isPortfolioCompatible,
  isTradeCompatible,
  isHoldingsCompatible,
  mapFidelityRows,
  mapMerrillTransactionRows,
  mapMerrillHoldingsRows,
  mapMerrillHoldingsToHoldings,
  mapMerrillPortfolioToHoldings,
  mapTradeRows,
} from '@/lib/csv';
import type {
  CSVImportModalProps,
  CSVImportStep,
  CSVFormatType,
  CSVParseResult,
  CSVValidationError,
  ParsedPortfolioTransaction,
  ParsedHolding,
  ParsedTrade,
  CSVImportResult,
  HoldingsImportResult,
} from '@/types/csv';

interface ValidatedRow {
  rowNumber: number;
  valid: boolean;
  data: Record<string, unknown>;
  errors: CSVValidationError[];
}

interface ModalState {
  step: CSVImportStep;
  file: File | null;
  format: CSVFormatType;
  parseResult: CSVParseResult | null;
  validatedRows: ValidatedRow[];
  validData: ParsedPortfolioTransaction[] | ParsedHolding[] | ParsedTrade[];
  cashBalance: number | null; // Cash balance extracted from portfolio export
  importResult: CSVImportResult | HoldingsImportResult | null;
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: ModalState = {
  step: 'upload',
  file: null,
  format: 'unknown',
  parseResult: null,
  validatedRows: [],
  validData: [],
  cashBalance: null,
  importResult: null,
  loading: false,
  error: null,
};

export function CSVImportModal({
  isOpen,
  onClose,
  onSuccess,
  title,
  importType,
  portfolioId,
}: CSVImportModalProps) {
  const [state, setState] = useState<ModalState>(INITIAL_STATE);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setState(INITIAL_STATE);
    }
  }, [isOpen]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // Read file content
        const content = await readFileAsText(file);

        // Detect format
        const detection = detectCSVFormat(content);

        // Check format compatibility
        if (importType === 'portfolio' && !isPortfolioCompatible(detection.format)) {
          throw new Error(
            `This file format (${getFormatDisplayName(detection.format)}) is not compatible with portfolio import. ` +
              'Please use Fidelity or Merrill Lynch format.'
          );
        }
        if (importType === 'holdings' && !isHoldingsCompatible(detection.format)) {
          throw new Error(
            `This file format (${getFormatDisplayName(detection.format)}) is not compatible with holdings import. ` +
              'Please use Merrill Lynch Holdings or Portfolio Export format.'
          );
        }
        if (importType === 'trade' && !isTradeCompatible(detection.format)) {
          throw new Error(
            `This file format (${getFormatDisplayName(detection.format)}) is not compatible with trade import. ` +
              'Please use Trade Tracker or Merrill Lynch format.'
          );
        }

        // Parse CSV with detected format
        // dataSkipRows = rows to skip after header before data starts
        const dataSkipRows = detection.dataStartIndex - detection.headerRowIndex - 1;
        const parsed = parseCSV(content, {
          skipRows: detection.headerRowIndex,
          headerRowIndex: 0,
          dataSkipRows: dataSkipRows > 0 ? dataSkipRows : 0,
          trimValues: true,
        });

        // Validate and map rows based on format
        let validatedRows: ValidatedRow[] = [];
        let validData: ParsedPortfolioTransaction[] | ParsedHolding[] | ParsedTrade[] = [];
        let cashBalance: number | null = null;

        if (importType === 'portfolio') {
          const result = mapPortfolioData(detection.format, parsed);
          validatedRows = result.validatedRows;
          validData = result.transactions;
        } else if (importType === 'holdings') {
          const result = mapHoldingsData(detection.format, parsed);
          validatedRows = result.validatedRows;
          validData = result.holdings;
          cashBalance = result.cashBalance;
        } else {
          const result = mapTradeData(detection.format, parsed);
          validatedRows = result.validatedRows;
          validData = result.trades;
        }

        setState((prev) => ({
          ...prev,
          file,
          format: detection.format,
          parseResult: parsed,
          validatedRows,
          validData,
          cashBalance,
          step: 'preview',
          loading: false,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to parse file',
        }));
      }
    },
    [importType]
  );

  const handleConfirm = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      let endpoint: string;
      let body: Record<string, unknown>;

      if (importType === 'portfolio') {
        endpoint = `/api/portfolios/${portfolioId}/transactions/import`;
        body = { transactions: state.validData };
      } else if (importType === 'holdings') {
        endpoint = `/api/portfolios/${portfolioId}/holdings/import`;
        body = { holdings: state.validData };
        // Include cash balance if extracted from the CSV
        if (state.cashBalance !== null && state.cashBalance > 0) {
          body.cashBalance = state.cashBalance;
        }
      } else {
        endpoint = '/api/trades/import';
        body = { trades: state.validData };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }

      setState((prev) => ({
        ...prev,
        importResult: result,
        step: 'result',
        loading: false,
      }));

      // Call onSuccess immediately after successful import to refresh data
      if (result.success) {
        onSuccess();
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Import failed',
      }));
    }
  }, [importType, portfolioId, state.validData, state.cashBalance, onSuccess]);

  const handleBack = useCallback(() => {
    setState((prev) => {
      switch (prev.step) {
        case 'preview':
          return { ...INITIAL_STATE };
        case 'confirm':
          return { ...prev, step: 'preview' };
        default:
          return prev;
      }
    });
  }, []);

  const handleNext = useCallback(() => {
    setState((prev) => {
      switch (prev.step) {
        case 'preview':
          return { ...prev, step: 'confirm' };
        default:
          return prev;
      }
    });
  }, []);

  const handleClose = useCallback(() => {
    if (state.step === 'result' && state.importResult?.success) {
      onSuccess();
    }
    onClose();
  }, [state.step, state.importResult, onSuccess, onClose]);

  if (!isOpen) return null;

  const validCount = state.validatedRows.filter((r) => r.valid).length;
  const canProceed = validCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - disabled during loading to prevent accidental closure */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${
          state.loading ? 'cursor-not-allowed' : 'cursor-pointer'
        }`}
        onClick={state.loading ? undefined : handleClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Upload className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
              <p className="text-sm text-slate-400">
                {state.step === 'upload' && 'Select a CSV file to import'}
                {state.step === 'preview' && `Preview (${getFormatDisplayName(state.format)})`}
                {state.step === 'confirm' && `Ready to import ${validCount} records`}
                {state.step === 'result' && 'Import complete'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Upload Step */}
          {state.step === 'upload' && (
            <CSVFileUpload
              onFileSelect={handleFileSelect}
              loading={state.loading}
              error={state.error}
            />
          )}

          {/* Preview Step */}
          {state.step === 'preview' && state.parseResult && (
            <div className="space-y-4">
              {state.error && (
                <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>{state.error}</span>
                </div>
              )}

              <CSVPreviewTable
                headers={state.parseResult.headers}
                rows={state.validatedRows}
                maxRows={10}
              />
            </div>
          )}

          {/* Confirm Step */}
          {state.step === 'confirm' && (
            <div className="space-y-6">
              {state.error && (
                <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>{state.error}</span>
                </div>
              )}

              <div className="bg-slate-800/50 rounded-xl p-6 text-center">
                <FileText className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-100 mb-2">
                  Confirm Import
                </h3>
                <p className="text-slate-400 mb-4">
                  You are about to import <span className="text-indigo-400 font-semibold">{validCount}</span>{' '}
                  {importType === 'portfolio' ? 'transactions' : importType === 'holdings' ? 'holdings' : 'trades'}.
                </p>
                {state.validatedRows.filter((r) => !r.valid).length > 0 && (
                  <p className="text-amber-400 text-sm">
                    {state.validatedRows.filter((r) => !r.valid).length} rows with errors will be skipped.
                  </p>
                )}
              </div>

              <div className="bg-slate-800/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-400 mb-2">Import Details</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>File: {state.file?.name}</li>
                  <li>Format: {getFormatDisplayName(state.format)}</li>
                  <li>Total rows: {state.parseResult?.totalRows}</li>
                  <li>Valid records: {validCount}</li>
                  {state.cashBalance !== null && state.cashBalance > 0 && (
                    <li className="text-emerald-400">
                      Cash balance: ${state.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Result Step */}
          {state.step === 'result' && state.importResult && (
            <div className="space-y-6 text-center">
              {state.importResult.success ? (
                <>
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-100 mb-2">
                      Import Successful
                    </h3>
                    <p className="text-slate-400">
                      Successfully imported{' '}
                      <span className="text-emerald-400 font-semibold">
                        {state.importResult.imported}
                      </span>{' '}
                      {importType === 'portfolio' ? 'transactions' : importType === 'holdings' ? 'holdings' : 'trades'}.
                      {importType === 'holdings' && 'updated' in state.importResult && state.importResult.updated > 0 && (
                        <> ({state.importResult.updated} updated)</>
                      )}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-100 mb-2">
                      Import Failed
                    </h3>
                    <p className="text-slate-400">
                      {state.importResult.errors[0]?.message || 'An error occurred during import'}
                    </p>
                  </div>
                </>
              )}

              {state.importResult.failed > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-left">
                  <p className="text-amber-400 font-medium mb-2">
                    {state.importResult.failed} records failed to import:
                  </p>
                  <ul className="text-sm text-slate-400 space-y-1 max-h-32 overflow-y-auto">
                    {state.importResult.errors.slice(0, 5).map((error, i) => (
                      <li key={i}>
                        Row {error.row}: {error.message}
                      </li>
                    ))}
                    {state.importResult.errors.length > 5 && (
                      <li className="text-slate-500">
                        +{state.importResult.errors.length - 5} more errors
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-700">
          <div>
            {(state.step === 'preview' || state.step === 'confirm') && (
              <button
                onClick={handleBack}
                disabled={state.loading}
                className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {state.step === 'result' ? (
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
              >
                Done
              </button>
            ) : state.step === 'confirm' ? (
              <button
                onClick={handleConfirm}
                disabled={state.loading || !canProceed}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {state.loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Import {validCount} Records
                  </>
                )}
              </button>
            ) : state.step === 'preview' ? (
              <button
                onClick={handleNext}
                disabled={!canProceed}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Map CSV data to portfolio transactions based on format.
 */
function mapPortfolioData(
  format: CSVFormatType,
  parsed: CSVParseResult
): { validatedRows: ValidatedRow[]; transactions: ParsedPortfolioTransaction[] } {
  let result: { transactions: ParsedPortfolioTransaction[]; errors: CSVValidationError[] };

  switch (format) {
    case 'fidelity':
      result = mapFidelityRows(parsed.rows);
      break;
    case 'merrill_transactions':
      result = mapMerrillTransactionRows(parsed.rows);
      break;
    case 'merrill_holdings':
      result = mapMerrillHoldingsRows(parsed.rows);
      break;
    default:
      result = { transactions: [], errors: [] };
  }

  // Build validated rows for preview
  const errorsByRow = new Map<number, CSVValidationError[]>();
  result.errors.forEach((error) => {
    const existing = errorsByRow.get(error.row) || [];
    existing.push(error);
    errorsByRow.set(error.row, existing);
  });

  const validatedRows: ValidatedRow[] = parsed.rows.map((row) => {
    const errors = errorsByRow.get(row.rowNumber) || [];
    return {
      rowNumber: row.rowNumber,
      valid: errors.length === 0,
      data: row.data,
      errors,
    };
  });

  return { validatedRows, transactions: result.transactions };
}

/**
 * Map CSV data to holdings for direct import (bypasses transactions).
 */
function mapHoldingsData(
  format: CSVFormatType,
  parsed: CSVParseResult
): { validatedRows: ValidatedRow[]; holdings: ParsedHolding[]; cashBalance: number | null } {
  let result: { holdings: ParsedHolding[]; errors: CSVValidationError[] };
  let cashBalance: number | null = null;

  switch (format) {
    case 'merrill_holdings':
      result = mapMerrillHoldingsToHoldings(parsed.rows);
      break;
    case 'merrill_portfolio': {
      const portfolioResult = mapMerrillPortfolioToHoldings(parsed.rows);
      result = { holdings: portfolioResult.holdings, errors: portfolioResult.errors };
      cashBalance = portfolioResult.cashBalance > 0 ? portfolioResult.cashBalance : null;
      break;
    }
    default:
      result = { holdings: [], errors: [] };
  }

  // Build validated rows for preview
  const errorsByRow = new Map<number, CSVValidationError[]>();
  result.errors.forEach((error) => {
    const existing = errorsByRow.get(error.row) || [];
    existing.push(error);
    errorsByRow.set(error.row, existing);
  });

  const validatedRows: ValidatedRow[] = parsed.rows.map((row) => {
    const errors = errorsByRow.get(row.rowNumber) || [];
    return {
      rowNumber: row.rowNumber,
      valid: errors.length === 0,
      data: row.data,
      errors,
    };
  });

  return { validatedRows, holdings: result.holdings, cashBalance };
}

/**
 * Map CSV data to trades based on format.
 */
function mapTradeData(
  format: CSVFormatType,
  parsed: CSVParseResult
): { validatedRows: ValidatedRow[]; trades: ParsedTrade[] } {
  let result: { trades: ParsedTrade[]; errors: CSVValidationError[] };

  switch (format) {
    case 'trade_tracker':
      result = mapTradeRows(parsed.rows);
      break;
    case 'merrill_transactions':
      // Convert Merrill transactions to trades with BUY/SELL matching
      const portfolioResult = mapMerrillTransactionRows(parsed.rows);

      // Type with pre-computed timestamp for performance
      type TxWithTimestamp = ParsedPortfolioTransaction & { _timestamp: number };

      // Filter and add pre-computed timestamps to avoid repeated Date parsing
      const buyTrades: TxWithTimestamp[] = portfolioResult.transactions
        .filter((t) => t.transactionType === 'BUY' && t.symbol && t.quantity && t.pricePerShare)
        .map((t) => ({ ...t, _timestamp: new Date(t.transactionDate).getTime() }));
      const sellTrades: TxWithTimestamp[] = portfolioResult.transactions
        .filter((t) => t.transactionType === 'SELL' && t.symbol && t.quantity && t.pricePerShare)
        .map((t) => ({ ...t, _timestamp: new Date(t.transactionDate).getTime() }));

      // Sort both by timestamp (oldest first)
      buyTrades.sort((a, b) => a._timestamp - b._timestamp);
      sellTrades.sort((a, b) => a._timestamp - b._timestamp);

      // Track open buys per symbol (FIFO queue)
      const openBuysPerSymbol = new Map<string, TxWithTimestamp[]>();

      // Process all buys first to build the queue
      for (const buy of buyTrades) {
        const symbol = buy.symbol!;
        if (!openBuysPerSymbol.has(symbol)) {
          openBuysPerSymbol.set(symbol, []);
        }
        openBuysPerSymbol.get(symbol)!.push(buy);
      }

      const trades: ParsedTrade[] = [];

      // Process sells by matching against open buys (FIFO)
      // Only match BUYs that occurred BEFORE the SELL date (can't sell before buying)
      for (const sell of sellTrades) {
        const symbol = sell.symbol!;
        const openBuys = openBuysPerSymbol.get(symbol);
        const sellDate = sell._timestamp;

        if (openBuys && openBuys.length > 0) {
          // Find the first BUY that occurred before this SELL (FIFO, respecting chronology)
          const eligibleBuyIndex = openBuys.findIndex((buy) => buy._timestamp <= sellDate);

          if (eligibleBuyIndex === -1) {
            // No BUY occurred before this SELL - skip this sell (can't close a position we don't have yet)
            continue;
          }

          // Remove the matched buy from the queue
          const matchedBuy = openBuys.splice(eligibleBuyIndex, 1)[0];

          // Create a CLOSED trade with entry from BUY and exit from SELL
          const entryPrice = matchedBuy.pricePerShare!;
          const exitPrice = sell.pricePerShare!;
          const quantity = Math.min(matchedBuy.quantity!, sell.quantity!);
          const fees = (matchedBuy.fees || 0) + (sell.fees || 0);
          const realizedPnl = (exitPrice - entryPrice) * quantity - fees;

          trades.push({
            symbol,
            side: 'LONG' as const,
            status: 'CLOSED' as const,
            entryPrice,
            quantity,
            entryDate: matchedBuy.transactionDate,
            exitPrice,
            exitDate: sell.transactionDate,
            fees,
            realizedPnl,
            notes: `Matched: ${matchedBuy.notes || ''} → ${sell.notes || ''}`.substring(0, 200) || null,
          });

          // Handle partial fills: if buy had more shares, put remainder back at the same position
          const remainingBuyQty = matchedBuy.quantity! - quantity;
          if (remainingBuyQty > 0) {
            openBuys.splice(eligibleBuyIndex, 0, {
              ...matchedBuy,
              quantity: remainingBuyQty,
            });
          }

          // Handle partial fills: if sell had more shares than matched buy
          let remainingSellQty = sell.quantity! - quantity;
          while (remainingSellQty > 0) {
            // Find next eligible buy (must be before sell date)
            const nextEligibleIndex = openBuys.findIndex((buy) => buy._timestamp <= sellDate);

            if (nextEligibleIndex === -1) {
              // No more eligible buys - remaining sell quantity is orphaned
              break;
            }

            const nextBuy = openBuys.splice(nextEligibleIndex, 1)[0];
            const matchQty = Math.min(nextBuy.quantity!, remainingSellQty);
            const nextEntryPrice = nextBuy.pricePerShare!;
            const nextFees = (nextBuy.fees || 0) + ((sell.fees || 0) * (matchQty / sell.quantity!));
            const nextPnl = (exitPrice - nextEntryPrice) * matchQty - nextFees;

            trades.push({
              symbol,
              side: 'LONG' as const,
              status: 'CLOSED' as const,
              entryPrice: nextEntryPrice,
              quantity: matchQty,
              entryDate: nextBuy.transactionDate,
              exitPrice,
              exitDate: sell.transactionDate,
              fees: nextFees,
              realizedPnl: nextPnl,
              notes: `Matched: ${nextBuy.notes || ''} → ${sell.notes || ''}`.substring(0, 200) || null,
            });

            remainingSellQty -= matchQty;
            const nextRemainingBuyQty = nextBuy.quantity! - matchQty;
            if (nextRemainingBuyQty > 0) {
              openBuys.splice(nextEligibleIndex, 0, {
                ...nextBuy,
                quantity: nextRemainingBuyQty,
              });
            }
          }
        }
        // If no matching buy found, the sell is ignored (can't close a position we don't have)
      }

      // Add remaining open buys as OPEN trades
      for (const [, openBuys] of openBuysPerSymbol) {
        for (const buy of openBuys) {
          trades.push({
            symbol: buy.symbol!,
            side: 'LONG' as const,
            status: 'OPEN' as const,
            entryPrice: buy.pricePerShare!,
            quantity: buy.quantity!,
            entryDate: buy.transactionDate,
            exitPrice: null,
            exitDate: null,
            fees: buy.fees || 0,
            realizedPnl: null,
            notes: buy.notes || null,
          });
        }
      }

      // Sort final trades by entry date for consistent ordering
      trades.sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

      result = { trades, errors: portfolioResult.errors };
      break;
    default:
      result = { trades: [], errors: [] };
  }

  // Build validated rows for preview
  const errorsByRow = new Map<number, CSVValidationError[]>();
  result.errors.forEach((error) => {
    const existing = errorsByRow.get(error.row) || [];
    existing.push(error);
    errorsByRow.set(error.row, existing);
  });

  const validatedRows: ValidatedRow[] = parsed.rows.map((row) => {
    const errors = errorsByRow.get(row.rowNumber) || [];
    return {
      rowNumber: row.rowNumber,
      valid: errors.length === 0,
      data: row.data,
      errors,
    };
  });

  return { validatedRows, trades: result.trades };
}

export default CSVImportModal;
