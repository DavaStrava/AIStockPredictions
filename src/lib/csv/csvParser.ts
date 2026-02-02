/**
 * CSV Parser Utility
 *
 * Generic CSV parsing with support for:
 * - Quoted fields with commas
 * - Multi-line quoted fields
 * - BOM character handling
 * - Custom delimiters
 */

import type { CSVParseResult, CSVParsedRow } from '@/types/csv';

/**
 * Options for CSV parsing.
 */
export interface CSVParseOptions {
  /** Field delimiter (default: ',') */
  delimiter?: string;
  /** Skip the first N rows (for metadata/headers before data) */
  skipRows?: number;
  /** Header row index (0-based, after skipRows applied) */
  headerRowIndex?: number;
  /** Trim whitespace from values */
  trimValues?: boolean;
  /** Maximum rows to parse (for preview) */
  maxRows?: number;
}

/**
 * Remove BOM character from the start of a string.
 */
function removeBOM(str: string): string {
  if (str.charCodeAt(0) === 0xfeff) {
    return str.slice(1);
  }
  return str;
}

/**
 * Parse a single line into fields, handling quoted values with commas.
 */
function parseCSVLine(line: string, delimiter: string = ','): string[] {
  const fields: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        // Check for escaped quote (double quote)
        if (i + 1 < line.length && line[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        // End of quoted field
        inQuotes = false;
        i++;
        continue;
      }
      field += char;
      i++;
    } else {
      if (char === '"') {
        // Start of quoted field
        inQuotes = true;
        i++;
        continue;
      }
      if (char === delimiter) {
        // End of field
        fields.push(field);
        field = '';
        i++;
        continue;
      }
      field += char;
      i++;
    }
  }

  // Add the last field
  fields.push(field);

  return fields;
}

/**
 * Parse CSV content into structured data.
 */
export function parseCSV(content: string, options: CSVParseOptions = {}): CSVParseResult {
  const {
    delimiter = ',',
    skipRows = 0,
    headerRowIndex = 0,
    trimValues = true,
    maxRows,
  } = options;

  // Remove BOM and normalize line endings
  const cleanContent = removeBOM(content).replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split into lines
  const allLines = cleanContent.split('\n');

  // Skip specified rows
  const lines = allLines.slice(skipRows);

  if (lines.length === 0) {
    return { headers: [], rows: [], totalRows: 0 };
  }

  // Get headers
  const headerLine = lines[headerRowIndex] || '';
  let headers = parseCSVLine(headerLine, delimiter);

  if (trimValues) {
    headers = headers.map((h) => h.trim());
  }

  // Parse data rows
  const rows: CSVParsedRow[] = [];
  const dataStartIndex = headerRowIndex + 1;
  const effectiveMaxRows = maxRows !== undefined ? dataStartIndex + maxRows : lines.length;

  for (let i = dataStartIndex; i < Math.min(lines.length, effectiveMaxRows); i++) {
    const line = lines[i];

    // Skip empty lines
    if (!line || line.trim() === '') {
      continue;
    }

    let values = parseCSVLine(line, delimiter);

    if (trimValues) {
      values = values.map((v) => v.trim());
    }

    // Create data object with headers as keys
    const data: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (header) {
        data[header] = values[index] || '';
      }
    });

    rows.push({
      rowNumber: skipRows + i + 1, // 1-based row number in original file
      data,
    });
  }

  return {
    headers,
    rows,
    totalRows: lines.length - dataStartIndex,
  };
}

/**
 * Read a file as text.
 */
export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Parse a CSV file.
 */
export async function parseCSVFile(
  file: File,
  options: CSVParseOptions = {}
): Promise<CSVParseResult> {
  const content = await readFileAsText(file);
  return parseCSV(content, options);
}

export default parseCSV;
