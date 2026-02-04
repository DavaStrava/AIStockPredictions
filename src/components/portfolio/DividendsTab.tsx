'use client';

import { useMemo } from 'react';
import { DollarSign, Percent, Calendar } from 'lucide-react';
import { HoldingWithMarketData, PortfolioTransaction } from '@/types/portfolio';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface DividendsTabProps {
  holdings: HoldingWithMarketData[];
  transactions: PortfolioTransaction[];
  loading?: boolean;
}

export function DividendsTab({ holdings, transactions, loading }: DividendsTabProps) {
  const dividendHoldings = useMemo(
    () =>
      holdings
        .filter((h) => h.dividendYield > 0)
        .sort((a, b) => b.estimatedAnnualIncome - a.estimatedAnnualIncome),
    [holdings]
  );

  const annualIncome = useMemo(
    () => holdings.reduce((sum, h) => sum + h.estimatedAnnualIncome, 0),
    [holdings]
  );

  const monthlyIncome = annualIncome / 12;

  const totalMarketValue = useMemo(
    () => holdings.reduce((sum, h) => sum + h.marketValue, 0),
    [holdings]
  );

  const weightedAvgYield = totalMarketValue > 0 ? (annualIncome / totalMarketValue) * 100 : 0;

  const dividendTransactions = useMemo(
    () =>
      transactions
        .filter((t) => t.transactionType === 'DIVIDEND')
        .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()),
    [transactions]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
              <div className="animate-pulse">
                <div className="h-4 w-20 bg-slate-700 rounded mb-3" />
                <div className="h-7 w-32 bg-slate-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm font-medium">Annual Income</span>
            <DollarSign className="w-5 h-5 text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(annualIncome)}</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm font-medium">Weighted Avg Yield</span>
            <Percent className="w-5 h-5 text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{weightedAvgYield.toFixed(2)}%</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm font-medium">Monthly Income</span>
            <Calendar className="w-5 h-5 text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{formatCurrency(monthlyIncome)}</p>
        </div>
      </div>

      {/* Holdings Dividend Table */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="text-lg font-semibold text-slate-100">Dividend-Paying Holdings</h3>
        </div>

        {dividendHoldings.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-400">No dividend-paying holdings in this portfolio</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Symbol</th>
                  <th className="text-right text-sm font-medium text-slate-400 px-4 py-3">Yield</th>
                  <th className="text-right text-sm font-medium text-slate-400 px-4 py-3">Annual Income</th>
                  <th className="text-right text-sm font-medium text-slate-400 px-4 py-3">Market Value</th>
                  <th className="text-right text-sm font-medium text-slate-400 px-4 py-3">Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {dividendHoldings.map((h) => (
                  <tr key={h.symbol} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-100">{h.symbol}</span>
                      {h.companyName && (
                        <span className="text-xs text-slate-500 ml-2">{h.companyName}</span>
                      )}
                    </td>
                    <td className="text-right px-4 py-3 text-emerald-400 font-medium">
                      {h.dividendYield.toFixed(2)}%
                    </td>
                    <td className="text-right px-4 py-3 text-slate-100">
                      {formatCurrency(h.estimatedAnnualIncome)}
                    </td>
                    <td className="text-right px-4 py-3 text-slate-300">
                      {formatCurrency(h.marketValue)}
                    </td>
                    <td className="text-right px-4 py-3 text-slate-400">
                      {h.portfolioWeight.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dividend History */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="text-lg font-semibold text-slate-100">Dividend History</h3>
        </div>

        {dividendTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-400">No dividend transactions recorded</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/30">
            {dividendTransactions.map((txn) => (
              <div key={txn.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-600/20 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-100">{txn.assetSymbol}</p>
                      <p className="text-sm text-slate-500">{formatDate(txn.transactionDate)}</p>
                    </div>
                  </div>
                  <p className="font-semibold text-emerald-400">
                    +{formatCurrency(txn.totalAmount)}
                  </p>
                </div>
                {txn.notes && (
                  <p className="mt-2 text-sm text-slate-500 pl-11">{txn.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DividendsTab;
