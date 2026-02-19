/**
 * Script to reconcile Merrill Lynch holdings and transactions.
 * Calculates initial holdings and prepares data for import.
 *
 * Usage: npx tsx scripts/reconcile-portfolio.ts <transactions.csv> <holdings.csv> [output.json]
 *
 * Arguments:
 *   transactions.csv  - Path to Merrill Lynch transaction history CSV
 *   holdings.csv      - Path to Merrill Lynch current holdings CSV
 *   output.json       - Optional path for output (default: ./portfolio-import-data.json)
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import fs from 'fs';
import { parseCSV } from '../src/lib/csv/csvParser';
import { detectCSVFormat } from '../src/lib/csv/formatDetector';
import { mapMerrillTransactionRows } from '../src/lib/csv/merrillTransactionsMapper';

interface Holding {
  symbol: string;
  description: string;
  quantity: number;
  costBasis: number;
  currentPrice: number;
  marketValue: number;
  unrealizedGainLoss: number;
  unrealizedGainLossPercent: number;
}

interface ManualTransaction {
  symbol: string;
  transactionType: 'BUY' | 'SELL';
  quantity: number;
  pricePerShare: number;
  totalAmount: number;
  transactionDate: Date;
  fees: number;
  notes: string;
}

/**
 * Parse a CSV line handling quoted fields with commas inside.
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        fields.push(field.trim());
        field = '';
      } else {
        field += char;
      }
    }
  }
  fields.push(field.trim());
  return fields;
}

function parseHoldingsCSV(content: string): { holdings: Holding[]; cashBalance: number; totalValue: number } {
  const lines = content.split('\n');
  const holdings: Holding[] = [];
  let cashBalance = 0;
  let totalValue = 0;

  // Parse total value from line 8
  const valueLine = lines[7] || '';
  const valueMatch = valueLine.match(/\$([0-9,]+\.\d+)/);
  if (valueMatch) {
    totalValue = parseFloat(valueMatch[1].replace(/,/g, ''));
  }

  // Parse holdings starting from line 12 (index 11)
  for (let i = 11; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Parse CSV line properly handling quoted commas
    const fields = parseCSVLine(line);

    const symbol = fields[0]?.trim();

    // Handle Balances section
    if (symbol === 'Balances') continue;

    // Handle Money accounts
    if (symbol === 'Money accounts') {
      const valueStr = fields[6] || '';
      const value = parseFloat(valueStr.replace(/[$,]/g, '')) || 0;
      cashBalance += value;
      continue;
    }

    // Handle Cash balance
    if (symbol === 'Cash balance') {
      const valueStr = fields[6] || '';
      cashBalance += parseFloat(valueStr.replace(/[$,]/g, '')) || 0;
      continue;
    }

    // Skip pending activity and total
    if (symbol === 'Pending activity' || symbol === 'Total' || !symbol) continue;

    // Parse holding
    const quantity = parseFloat(fields[2]?.replace(/,/g, '') || '0');
    const costBasis = parseFloat(fields[4]?.replace(/[$,]/g, '') || '0');
    const currentPrice = parseFloat(fields[5]?.replace(/[$,]/g, '') || '0');
    const marketValue = parseFloat(fields[6]?.replace(/[$,]/g, '') || '0');

    // Parse unrealized gain/loss
    const glField = fields[8] || '';
    const glMatch = glField.match(/([+-]?\$?[0-9,]+\.?\d*)/);
    const unrealizedGL = glMatch ? parseFloat(glMatch[1].replace(/[$,+]/g, '')) : 0;
    const glPctMatch = glField.match(/([+-]?\d+\.?\d*)%/);
    const unrealizedGLPct = glPctMatch ? parseFloat(glPctMatch[1]) : 0;

    if (quantity > 0) {
      holdings.push({
        symbol,
        description: fields[1] || '',
        quantity,
        costBasis,
        currentPrice,
        marketValue,
        unrealizedGainLoss: unrealizedGL,
        unrealizedGainLossPercent: unrealizedGLPct,
      });
    }
  }

  return { holdings, cashBalance, totalValue };
}

/**
 * Resolve a file path, handling ~ for home directory
 */
function resolvePath(inputPath: string): string {
  if (inputPath.startsWith('~')) {
    return inputPath.replace('~', process.env.HOME || '');
  }
  return resolve(process.cwd(), inputPath);
}

/**
 * Read a file with proper error handling
 */
function readFileWithErrorHandling(filePath: string, description: string): string {
  const resolved = resolvePath(filePath);
  try {
    return fs.readFileSync(resolved, 'utf-8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error(`Error: ${description} file not found: ${resolved}`);
    } else {
      console.error(`Error reading ${description}:`, error);
    }
    process.exit(1);
  }
}

async function main() {
  // Parse command line arguments
  const txPath = process.argv[2];
  const holdingsPath = process.argv[3];
  const outputPath = process.argv[4] || './portfolio-import-data.json';

  if (!txPath || !holdingsPath) {
    console.error('Usage: npx tsx scripts/reconcile-portfolio.ts <transactions.csv> <holdings.csv> [output.json]');
    console.error('');
    console.error('Arguments:');
    console.error('  transactions.csv  - Path to Merrill Lynch transaction history CSV');
    console.error('  holdings.csv      - Path to Merrill Lynch current holdings CSV');
    console.error('  output.json       - Optional output path (default: ./portfolio-import-data.json)');
    console.error('');
    console.error('Example:');
    console.error('  npx tsx scripts/reconcile-portfolio.ts ~/Desktop/transactions.csv ~/Desktop/holdings.csv');
    process.exit(1);
  }

  // Check for manual transactions file (optional)
  let manualTransactions: ManualTransaction[] = [];
  const manualTxPath = process.argv[5];
  if (manualTxPath) {
    try {
      const manualContent = readFileWithErrorHandling(manualTxPath, 'Manual transactions');
      manualTransactions = JSON.parse(manualContent);
      console.log(`Loaded ${manualTransactions.length} manual transactions`);
    } catch {
      console.warn('Warning: Could not parse manual transactions file, skipping');
    }
  }

  console.log('\n=== PORTFOLIO RECONCILIATION ===\n');

  // Parse transactions
  console.log('Parsing transactions from:', resolvePath(txPath));
  const txContent = readFileWithErrorHandling(txPath, 'Transactions');
  const txFormat = detectCSVFormat(txContent);
  const txParsed = parseCSV(txContent, {
    skipRows: txFormat.headerRowIndex,
    headerRowIndex: 0,
  });
  const { transactions } = mapMerrillTransactionRows(txParsed.rows);

  // Add manual transactions if any
  const allTransactions = [
    ...transactions,
    ...manualTransactions.map(t => ({
      ...t,
      transactionDate: new Date(t.transactionDate),
    })),
  ];

  console.log(`Parsed ${transactions.length} transactions from CSV`);
  if (manualTransactions.length > 0) {
    console.log(`Added ${manualTransactions.length} manual transactions`);
  }
  console.log(`Total: ${allTransactions.length} transactions\n`);

  // Parse current holdings
  console.log('Parsing holdings from:', resolvePath(holdingsPath));
  const holdingsContent = readFileWithErrorHandling(holdingsPath, 'Holdings');
  const { holdings, cashBalance, totalValue } = parseHoldingsCSV(holdingsContent);

  console.log(`Found ${holdings.length} holdings`);
  console.log(`Cash/Money Market: $${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log(`Total Portfolio Value: $${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`);

  // Calculate net shares from transactions
  const txShares: Record<string, number> = {};
  const txCost: Record<string, number> = {};

  for (const tx of allTransactions) {
    if (tx.symbol && tx.quantity) {
      const qty = tx.transactionType === 'BUY' ? tx.quantity : -tx.quantity;
      txShares[tx.symbol] = (txShares[tx.symbol] || 0) + qty;

      if (tx.transactionType === 'BUY') {
        txCost[tx.symbol] = (txCost[tx.symbol] || 0) + tx.totalAmount;
      }
    }
  }

  // Calculate initial holdings (what existed before transaction history)
  console.log('=== RECONCILIATION ===\n');
  console.log('Symbol     | Current Qty | TX Net | Initial Qty | Status');
  console.log('-'.repeat(65));

  interface InitialHolding {
    symbol: string;
    quantity: number;
    estimatedCostBasis: number;
  }

  const initialHoldings: InitialHolding[] = [];
  let perfectMatch = 0;
  let needsInitial = 0;
  let discrepancy = 0;

  for (const holding of holdings) {
    const txNet = txShares[holding.symbol] || 0;
    const initialQty = holding.quantity - txNet;

    let status = '';
    if (Math.abs(initialQty) < 0.01) {
      status = '✓ Perfect match';
      perfectMatch++;
    } else if (initialQty > 0) {
      status = `↑ Initial: ${initialQty.toFixed(2)} shares`;
      needsInitial++;
      // Estimate cost basis from current data
      const totalCostBasis = holding.costBasis * holding.quantity;
      const txCostForSymbol = txCost[holding.symbol] || 0;
      const initialCostBasis = Math.max(0, totalCostBasis - txCostForSymbol);
      initialHoldings.push({
        symbol: holding.symbol,
        quantity: initialQty,
        estimatedCostBasis: initialQty > 0 ? initialCostBasis / initialQty : 0,
      });
    } else if (initialQty < -0.01) {
      status = `⚠ Discrepancy: ${initialQty.toFixed(2)}`;
      discrepancy++;
    }

    console.log(
      `${holding.symbol.padEnd(10)} | ${holding.quantity.toFixed(2).padStart(11)} | ${txNet.toFixed(2).padStart(6)} | ${initialQty.toFixed(2).padStart(11)} | ${status}`
    );
  }

  // Check for symbols in transactions but not in holdings (fully sold)
  const holdingSymbols = new Set(holdings.map(h => h.symbol));
  for (const [symbol, qty] of Object.entries(txShares)) {
    if (!holdingSymbols.has(symbol) && qty !== 0) {
      console.log(
        `${symbol.padEnd(10)} | ${'0.00'.padStart(11)} | ${qty.toFixed(2).padStart(6)} | ${(-qty).toFixed(2).padStart(11)} | ↓ Fully sold`
      );
      if (qty < 0) {
        // This was a position that was sold - we need initial holdings
        initialHoldings.push({
          symbol,
          quantity: -qty, // The initial quantity is the opposite of what was sold
          estimatedCostBasis: 0, // Unknown
        });
        needsInitial++;
      }
    }
  }

  console.log('-'.repeat(65));
  console.log(`\nSummary: ${perfectMatch} perfect, ${needsInitial} need initial holdings, ${discrepancy} discrepancies\n`);

  // Cash flow analysis
  console.log('=== CASH FLOW ANALYSIS ===\n');

  const deposits = allTransactions.filter(t => t.transactionType === 'DEPOSIT').reduce((s, t) => s + t.totalAmount, 0);
  const withdrawals = allTransactions.filter(t => t.transactionType === 'WITHDRAW').reduce((s, t) => s + t.totalAmount, 0);
  const dividends = allTransactions.filter(t => t.transactionType === 'DIVIDEND').reduce((s, t) => s + t.totalAmount, 0);
  const buys = allTransactions.filter(t => t.transactionType === 'BUY').reduce((s, t) => s + t.totalAmount, 0);
  const sells = allTransactions.filter(t => t.transactionType === 'SELL').reduce((s, t) => s + t.totalAmount, 0);

  console.log(`Deposits:     +$${deposits.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log(`Withdrawals:  -$${withdrawals.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log(`Dividends:    +$${dividends.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log(`Buys:         -$${buys.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log(`Sells:        +$${sells.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);

  const netCashFlow = deposits - withdrawals + dividends - buys + sells;
  console.log(`\nNet Cash Flow: $${netCashFlow.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log(`Current Cash:  $${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);

  const impliedInitialCash = cashBalance - netCashFlow;
  console.log(`Implied Initial Cash: $${impliedInitialCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);

  // ROI Calculation
  console.log('\n=== ROI CALCULATION ===\n');

  const netDeposits = deposits - withdrawals;
  const currentValue = totalValue;

  // For holdings that existed before transactions, we need to estimate their initial value
  const initialHoldingsValue = initialHoldings.reduce((sum, h) => {
    // Use estimated cost basis
    return sum + (h.quantity * h.estimatedCostBasis);
  }, 0);

  console.log(`Current Portfolio Value: $${currentValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log(`Net Deposits (during period): $${netDeposits.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log(`Estimated Initial Holdings Value: $${initialHoldingsValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log(`Implied Initial Cash: $${impliedInitialCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);

  const totalInitialValue = initialHoldingsValue + impliedInitialCash;
  const totalInvested = totalInitialValue + netDeposits;
  const totalReturn = currentValue - totalInvested;
  const totalReturnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

  console.log(`\nTotal Initial Value: $${totalInitialValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log(`Total Invested (Initial + Net Deposits): $${totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log(`Total Return: $${totalReturn.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${totalReturnPercent.toFixed(2)}%)`);

  // Export data for import
  console.log('\n=== READY FOR IMPORT ===\n');
  console.log(`Transactions: ${allTransactions.length}`);
  console.log(`Initial Holdings: ${initialHoldings.length}`);
  console.log(`Current Holdings: ${holdings.length}`);

  // Save transactions to JSON for import
  const exportData = {
    transactions: allTransactions.map(t => ({
      ...t,
      transactionDate: t.transactionDate.toISOString(),
    })),
    initialHoldings,
    currentHoldings: holdings,
    summary: {
      totalValue: currentValue,
      cashBalance,
      netDeposits,
      totalReturn,
      totalReturnPercent,
    },
  };

  const resolvedOutputPath = resolvePath(outputPath);
  fs.writeFileSync(resolvedOutputPath, JSON.stringify(exportData, null, 2));
  console.log(`\nExported to: ${resolvedOutputPath}`);
  console.log(`\nNext step: npx tsx scripts/import-merrill-portfolio.ts ${resolvedOutputPath}`);
}

main().catch(console.error);
