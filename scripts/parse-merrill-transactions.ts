/**
 * Script to parse Merrill Lynch transaction CSV and preview/analyze the data.
 *
 * Usage: npx tsx scripts/parse-merrill-transactions.ts <path-to-csv>
 */

import fs from 'fs';
import { parseCSV } from '../src/lib/csv/csvParser';
import { detectCSVFormat } from '../src/lib/csv/formatDetector';
import { mapMerrillTransactionRows } from '../src/lib/csv/merrillTransactionsMapper';

async function main() {
  const csvPath = process.argv[2];

  if (!csvPath) {
    console.log('Usage: npx tsx scripts/parse-merrill-transactions.ts <path-to-csv>');
    process.exit(1);
  }

  console.log(`\nParsing: ${csvPath}\n`);

  // Read file
  const content = fs.readFileSync(csvPath, 'utf-8');

  // Detect format
  const format = detectCSVFormat(content);
  console.log('Format detected:', format.format);
  console.log('Header row index:', format.headerRowIndex);
  console.log('Data start index:', format.dataStartIndex);
  console.log('Confidence:', format.confidence);
  console.log('');

  if (format.format !== 'merrill_transactions') {
    console.error('Error: Not a Merrill Lynch transaction file');
    process.exit(1);
  }

  // Parse CSV
  // Headers are at headerRowIndex, data starts at dataStartIndex
  // We need to skip to headerRowIndex and then headers are at index 0 relative to that
  const parsed = parseCSV(content, {
    skipRows: format.headerRowIndex,
    headerRowIndex: 0, // Headers are at the first row after skipping
    // Data starts at (dataStartIndex - headerRowIndex - 1) relative to headers
  });

  console.log('Headers found:', parsed.headers);
  console.log('Total rows:', parsed.rows.length);
  console.log('');

  // Map to transactions
  const { transactions, errors } = mapMerrillTransactionRows(parsed.rows);

  console.log('=== PARSING RESULTS ===');
  console.log(`Successfully parsed: ${transactions.length} transactions`);
  console.log(`Errors/Skipped: ${errors.length}`);
  console.log('');

  // Group by transaction type
  const byType: Record<string, number> = {};
  const byTypeAmount: Record<string, number> = {};

  for (const tx of transactions) {
    byType[tx.transactionType] = (byType[tx.transactionType] || 0) + 1;
    byTypeAmount[tx.transactionType] = (byTypeAmount[tx.transactionType] || 0) + tx.totalAmount;
  }

  console.log('=== TRANSACTION SUMMARY ===');
  for (const [type, count] of Object.entries(byType).sort()) {
    const totalAmount = byTypeAmount[type];
    console.log(`${type}: ${count} transactions, $${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  }
  console.log('');

  // Calculate totals
  const totalDeposits = transactions
    .filter((t) => t.transactionType === 'DEPOSIT')
    .reduce((sum, t) => sum + t.totalAmount, 0);

  const totalWithdrawals = transactions
    .filter((t) => t.transactionType === 'WITHDRAW')
    .reduce((sum, t) => sum + t.totalAmount, 0);

  const totalDividends = transactions
    .filter((t) => t.transactionType === 'DIVIDEND')
    .reduce((sum, t) => sum + t.totalAmount, 0);

  const totalBuys = transactions
    .filter((t) => t.transactionType === 'BUY')
    .reduce((sum, t) => sum + t.totalAmount, 0);

  const totalSells = transactions
    .filter((t) => t.transactionType === 'SELL')
    .reduce((sum, t) => sum + t.totalAmount, 0);

  console.log('=== CASH FLOW ===');
  console.log(`Deposits:    +$${totalDeposits.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log(`Withdrawals: -$${totalWithdrawals.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log(`Dividends:   +$${totalDividends.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log(`Buys:        -$${totalBuys.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log(`Sells:       +$${totalSells.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log('');

  // Net cash position
  const netCash = totalDeposits - totalWithdrawals + totalDividends - totalBuys + totalSells;
  console.log(`Net Cash Position: $${netCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log('');

  // Show sample transactions
  console.log('=== SAMPLE TRANSACTIONS (first 10) ===');
  for (const tx of transactions.slice(0, 10)) {
    console.log(
      `${tx.transactionDate.toISOString().split('T')[0]} | ${tx.transactionType.padEnd(8)} | ${(tx.symbol || '-').padEnd(6)} | ${tx.quantity?.toString().padStart(6) || '     -'} @ $${tx.pricePerShare?.toFixed(2).padStart(8) || '       -'} | $${tx.totalAmount.toFixed(2).padStart(10)}`
    );
  }
  console.log('');

  // Show errors (if any)
  if (errors.length > 0) {
    console.log('=== ERRORS (first 10) ===');
    for (const err of errors.slice(0, 10)) {
      console.log(`Row ${err.row}: ${err.message} (field: ${err.field}, value: ${err.value})`);
    }
    console.log('');
  }

  // Holdings summary (current shares)
  const holdings: Record<string, number> = {};

  for (const tx of transactions) {
    if (tx.symbol && tx.quantity) {
      const qty = tx.transactionType === 'BUY' ? tx.quantity : -tx.quantity;
      holdings[tx.symbol] = (holdings[tx.symbol] || 0) + qty;
    }
  }

  // Filter to non-zero holdings
  const activeHoldings = Object.entries(holdings)
    .filter(([, qty]) => Math.abs(qty) > 0.01)
    .sort((a, b) => a[0].localeCompare(b[0]));

  console.log('=== CALCULATED HOLDINGS ===');
  for (const [symbol, qty] of activeHoldings) {
    console.log(`${symbol.padEnd(6)}: ${qty.toFixed(4)} shares`);
  }
  console.log(`\nTotal holdings: ${activeHoldings.length} positions`);

  // Output for import
  console.log('\n=== READY FOR IMPORT ===');
  console.log(`To import these ${transactions.length} transactions, use the Portfolio CSV Import feature.`);
}

main().catch(console.error);
