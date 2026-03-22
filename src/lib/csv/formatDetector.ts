/**
 * CSV Format Detector
 *
 * Auto-detects the CSV format by checking distinctive patterns:
 * - Fidelity: Row 3 starts with "Run Date"
 * - Merrill Transactions: Row 1 contains "Exported on:" + date-prefixed data rows
 * - Merrill Holdings: Row 1 contains "COB Date"
 * - Merrill Portfolio: Row 1 contains "Exported on:" + "Unit Cost" header (portfolio snapshot)
 * - Trade Tracker: Row 1 contains "Symbol,Side,EntryPrice"
 */

import type { CSVFormatType, CSVFormatDetectionResult } from '@/types/csv';

/**
 * Remove BOM character from string.
 */
function removeBOM(str: string): string {
  if (str.charCodeAt(0) === 0xfeff) {
    return str.slice(1);
  }
  return str;
}

/**
 * Detect the CSV format from file content.
 */
export function detectCSVFormat(content: string): CSVFormatDetectionResult {
  const cleanContent = removeBOM(content).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = cleanContent.split('\n');

  // Get first few lines for analysis
  const firstLine = lines[0] || '';
  const thirdLine = lines[2] || '';

  // Check for Fidelity format
  // Fidelity has "Run Date" in the header row (row 3, index 2)
  if (thirdLine.includes('Run Date') && thirdLine.includes('Action') && thirdLine.includes('Symbol')) {
    return {
      format: 'fidelity',
      headerRowIndex: 2,
      dataStartIndex: 3,
      confidence: 0.95,
    };
  }

  // Check for Merrill Portfolio Export format (different from Merrill Transactions)
  // First row contains "Exported on:" AND row ~11 has holdings headers with "Unit Cost"
  if (firstLine.includes('Exported on:')) {
    // Check if this is the Portfolio Export format by looking for "Unit Cost" header
    // Portfolio format has headers around row 11 with "Symbol ", "Unit Cost", "Quantity"
    let isPortfolioFormat = false;
    let portfolioHeaderRow = -1;
    let portfolioDataStart = -1;

    for (let i = 8; i < Math.min(15, lines.length); i++) {
      const line = lines[i] || '';
      // Portfolio headers have "Symbol " (with space), "Unit Cost", and "Quantity"
      if (line.includes('Symbol ') && line.includes('Unit Cost') && line.includes('Quantity')) {
        isPortfolioFormat = true;
        portfolioHeaderRow = i;
        portfolioDataStart = i + 1;
        break;
      }
    }

    if (isPortfolioFormat && portfolioHeaderRow >= 0) {
      return {
        format: 'merrill_portfolio',
        headerRowIndex: portfolioHeaderRow,
        dataStartIndex: portfolioDataStart,
        confidence: 0.95,
      };
    }

    // Otherwise, it's the Transactions format
    // Find the actual data start by looking for the first row with a date pattern
    // after the headers. Headers are on row 5 (index 4).
    // Rows 6-8 (indices 5-7) contain empty rows and filter text.
    let dataStart = 8; // Default: row 9 (0-indexed: 8)
    for (let i = 5; i < Math.min(15, lines.length); i++) {
      const line = lines[i] || '';
      // Data rows start with a quoted date like "03/13/2026"
      if (/^"?\d{2}\/\d{2}\/\d{4}"?/.test(line.trim())) {
        dataStart = i;
        break;
      }
    }
    return {
      format: 'merrill_transactions',
      headerRowIndex: 4, // Headers are on row 5 (0-indexed: 4)
      dataStartIndex: dataStart, // Dynamically detected data start
      confidence: 0.95,
    };
  }

  // Check for Merrill Holdings format
  // First row contains "COB Date"
  if (firstLine.includes('COB Date') && firstLine.includes('Symbol') && firstLine.includes('Quantity')) {
    return {
      format: 'merrill_holdings',
      headerRowIndex: 0,
      dataStartIndex: 1,
      confidence: 0.95,
    };
  }

  // Check for Trade Tracker custom format
  // First row contains our specific header pattern
  const normalizedFirst = firstLine.toLowerCase().replace(/\s+/g, '');
  if (
    normalizedFirst.includes('symbol') &&
    normalizedFirst.includes('side') &&
    normalizedFirst.includes('entryprice')
  ) {
    return {
      format: 'trade_tracker',
      headerRowIndex: 0,
      dataStartIndex: 1,
      confidence: 0.9,
    };
  }

  // Check for alternative Fidelity patterns
  // Sometimes Fidelity files start with blank lines or BOM
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    if (lines[i].includes('Run Date') && lines[i].includes('Action')) {
      return {
        format: 'fidelity',
        headerRowIndex: i,
        dataStartIndex: i + 1,
        confidence: 0.85,
      };
    }
  }

  // Unknown format
  return {
    format: 'unknown',
    headerRowIndex: 0,
    dataStartIndex: 1,
    confidence: 0,
  };
}

/**
 * Get human-readable format name.
 */
export function getFormatDisplayName(format: CSVFormatType): string {
  switch (format) {
    case 'fidelity':
      return 'Fidelity Transactions';
    case 'merrill_transactions':
      return 'Merrill Lynch Transactions';
    case 'merrill_holdings':
      return 'Merrill Lynch Holdings';
    case 'merrill_portfolio':
      return 'Merrill Lynch Portfolio Export';
    case 'trade_tracker':
      return 'Trade Tracker';
    default:
      return 'Unknown Format';
  }
}

/**
 * Check if format is compatible with portfolio import.
 */
export function isPortfolioCompatible(format: CSVFormatType): boolean {
  return ['fidelity', 'merrill_transactions', 'merrill_holdings'].includes(format);
}

/**
 * Check if format is compatible with trade tracker import.
 */
export function isTradeCompatible(format: CSVFormatType): boolean {
  return ['trade_tracker', 'merrill_transactions'].includes(format);
}

/**
 * Check if format is compatible with holdings snapshot import.
 */
export function isHoldingsCompatible(format: CSVFormatType): boolean {
  return ['merrill_holdings', 'merrill_portfolio'].includes(format);
}

export default detectCSVFormat;
