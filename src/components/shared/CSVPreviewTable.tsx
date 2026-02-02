/**
 * CSVPreviewTable Component
 *
 * Displays a preview of parsed CSV data with validation errors highlighted.
 * Shows first N rows (default 10) with status indicators.
 */

'use client';

import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { CSVPreviewTableProps, CSVValidationError } from '@/types/csv';

const DEFAULT_MAX_ROWS = 10;

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (value instanceof Date) {
    return value.toLocaleDateString();
  }
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  return String(value);
}

interface RowStatusProps {
  valid: boolean;
  errors: CSVValidationError[];
}

function RowStatus({ valid, errors }: RowStatusProps) {
  if (valid) {
    return (
      <div className="flex items-center gap-1 text-emerald-400">
        <CheckCircle className="w-4 h-4" />
        <span className="text-xs">Valid</span>
      </div>
    );
  }

  return (
    <div className="group relative">
      <div className="flex items-center gap-1 text-rose-400 cursor-help">
        <XCircle className="w-4 h-4" />
        <span className="text-xs">{errors.length} error{errors.length > 1 ? 's' : ''}</span>
      </div>
      {/* Tooltip with errors */}
      <div className="absolute left-0 top-full mt-1 z-10 hidden group-hover:block">
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl max-w-xs">
          <ul className="text-xs space-y-1">
            {errors.map((error) => (
              <li key={`${error.row}-${error.field}`} className="text-rose-400">
                <span className="text-slate-400">{error.field}:</span> {error.message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function CSVPreviewTable({ headers, rows, maxRows = DEFAULT_MAX_ROWS }: CSVPreviewTableProps) {
  const displayRows = rows.slice(0, maxRows);
  const hasMore = rows.length > maxRows;
  const validCount = rows.filter((r) => r.valid).length;
  const invalidCount = rows.filter((r) => !r.valid).length;

  // Limit columns for display
  const displayHeaders = headers.slice(0, 8);
  const hasMoreColumns = headers.length > 8;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300">{validCount} valid</span>
        </div>
        {invalidCount > 0 && (
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-400" />
            <span className="text-slate-300">{invalidCount} with errors</span>
          </div>
        )}
        {hasMore && (
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">
              Showing first {maxRows} of {rows.length} rows
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-20">
                Row
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-24">
                Status
              </th>
              {displayHeaders.map((header) => (
                <th
                  key={header}
                  className="px-3 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
              {hasMoreColumns && (
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500">
                  +{headers.length - 8} more
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-slate-900/50 divide-y divide-slate-700/50">
            {displayRows.map((row) => (
              <tr
                key={row.rowNumber}
                className={`${
                  row.valid
                    ? 'hover:bg-slate-800/50'
                    : 'bg-rose-500/5 hover:bg-rose-500/10'
                }`}
              >
                <td className="px-3 py-2 text-sm text-slate-500">
                  {row.rowNumber}
                </td>
                <td className="px-3 py-2">
                  <RowStatus valid={row.valid} errors={row.errors} />
                </td>
                {displayHeaders.map((header) => {
                  const value = row.data[header];
                  const hasError = row.errors.some((e) => e.field === header);

                  return (
                    <td
                      key={header}
                      className={`px-3 py-2 text-sm ${
                        hasError
                          ? 'text-rose-400 font-medium'
                          : 'text-slate-300'
                      }`}
                    >
                      <span className="max-w-[150px] truncate inline-block">
                        {formatValue(value)}
                      </span>
                    </td>
                  );
                })}
                {hasMoreColumns && (
                  <td className="px-3 py-2 text-slate-500 text-sm">...</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {hasMore && (
        <p className="text-sm text-slate-500 text-center">
          {rows.length - maxRows} more rows not shown in preview
        </p>
      )}
    </div>
  );
}

export default CSVPreviewTable;
