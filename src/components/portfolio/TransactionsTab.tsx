'use client';

/**
 * TransactionsTab Component
 *
 * Unified transactions view with filtering capabilities.
 * Supports all transaction types including BUY, SELL, DIVIDEND, DIVIDEND_REINVESTMENT, INTEREST, DEPOSIT, WITHDRAW.
 */

import { useState, useMemo } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Percent,
  Edit2,
  Filter,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  CreditCard,
} from 'lucide-react';
import { PortfolioTransaction, PortfolioTransactionType } from '@/types/portfolio';
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/formatters';
import { TransactionEditModal } from './TransactionEditModal';

interface TransactionsTabProps {
  transactions: PortfolioTransaction[];
  loading: boolean;
  onAddTransaction: (type: PortfolioTransactionType) => void;
  onEditTransaction?: (txn: PortfolioTransaction, updates: Partial<PortfolioTransaction>) => Promise<void>;
  onDeleteTransaction?: (txnId: string) => Promise<void>;
}

type FilterType = 'ALL' | 'BUYS' | 'SELLS' | 'DIVIDENDS' | 'OTHER';

const FILTER_OPTIONS: { id: FilterType; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'BUYS', label: 'Buys' },
  { id: 'SELLS', label: 'Sells' },
  { id: 'DIVIDENDS', label: 'Dividends' },
  { id: 'OTHER', label: 'Other' },
];

/**
 * Get icon and colors for transaction type
 */
function getTransactionStyle(type: PortfolioTransactionType): {
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  label: string;
} {
  switch (type) {
    case 'BUY':
      return {
        icon: <TrendingUp className="w-4 h-4" />,
        bgColor: 'bg-emerald-600/20',
        textColor: 'text-emerald-400',
        label: 'BUY',
      };
    case 'SELL':
      return {
        icon: <TrendingDown className="w-4 h-4" />,
        bgColor: 'bg-rose-600/20',
        textColor: 'text-rose-400',
        label: 'SELL',
      };
    case 'DIVIDEND':
      return {
        icon: <DollarSign className="w-4 h-4" />,
        bgColor: 'bg-cyan-600/20',
        textColor: 'text-cyan-400',
        label: 'DIV',
      };
    case 'DIVIDEND_REINVESTMENT':
      return {
        icon: <RefreshCw className="w-4 h-4" />,
        bgColor: 'bg-purple-600/20',
        textColor: 'text-purple-400',
        label: 'DRIP',
      };
    case 'INTEREST':
      return {
        icon: <Percent className="w-4 h-4" />,
        bgColor: 'bg-blue-600/20',
        textColor: 'text-blue-400',
        label: 'INT',
      };
    case 'DEPOSIT':
      return {
        icon: <ArrowDownRight className="w-4 h-4" />,
        bgColor: 'bg-indigo-600/20',
        textColor: 'text-indigo-400',
        label: 'DEP',
      };
    case 'WITHDRAW':
      return {
        icon: <ArrowUpRight className="w-4 h-4" />,
        bgColor: 'bg-amber-600/20',
        textColor: 'text-amber-400',
        label: 'WDR',
      };
    default:
      return {
        icon: <CreditCard className="w-4 h-4" />,
        bgColor: 'bg-slate-600/20',
        textColor: 'text-slate-400',
        label: type,
      };
  }
}

/**
 * Filter transactions by filter type
 */
function filterTransactions(transactions: PortfolioTransaction[], filter: FilterType, showReinvestments: boolean): PortfolioTransaction[] {
  let filtered = transactions;

  // Filter by type
  switch (filter) {
    case 'BUYS':
      filtered = filtered.filter(t => t.transactionType === 'BUY');
      break;
    case 'SELLS':
      filtered = filtered.filter(t => t.transactionType === 'SELL');
      break;
    case 'DIVIDENDS':
      filtered = filtered.filter(t =>
        ['DIVIDEND', 'DIVIDEND_REINVESTMENT', 'INTEREST'].includes(t.transactionType)
      );
      break;
    case 'OTHER':
      filtered = filtered.filter(t =>
        ['DEPOSIT', 'WITHDRAW'].includes(t.transactionType)
      );
      break;
    default:
      break;
  }

  // Filter reinvestments if toggle is off
  if (!showReinvestments) {
    filtered = filtered.filter(t => t.transactionType !== 'DIVIDEND_REINVESTMENT');
  }

  return filtered;
}

export function TransactionsTab({
  transactions,
  loading,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}: TransactionsTabProps) {
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [showReinvestments, setShowReinvestments] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState<PortfolioTransaction | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, filter, showReinvestments),
    [transactions, filter, showReinvestments]
  );

  const handleEditSave = async (updates: Partial<PortfolioTransaction>) => {
    if (!editingTransaction || !onEditTransaction) return;

    setIsSaving(true);
    try {
      await onEditTransaction(editingTransaction, updates);
      setEditingTransaction(null);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-700 rounded w-1/4" />
          <div className="h-12 bg-slate-700 rounded" />
          <div className="h-12 bg-slate-700 rounded" />
          <div className="h-12 bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header with filters */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-slate-100">Transaction History</h3>
            <span className="text-sm text-slate-500">
              {filteredTransactions.length} of {transactions.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter pills */}
            <div className="flex items-center gap-1 bg-slate-900/50 rounded-lg p-1">
              {FILTER_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setFilter(option.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    filter === option.id
                      ? 'bg-slate-700 text-slate-100'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Show reinvestments toggle */}
            <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showReinvestments}
                onChange={(e) => setShowReinvestments(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
              />
              <span className="hidden sm:inline">Show DRIP</span>
            </label>

            <button
              onClick={() => onAddTransaction('BUY')}
              className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-500 transition-colors"
            >
              + Add
            </button>
          </div>
        </div>
      </div>

      {/* Transaction list */}
      {filteredTransactions.length === 0 ? (
        <div className="p-8 text-center">
          <Filter className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400">
            {transactions.length === 0
              ? 'No transactions yet'
              : 'No transactions match the current filters'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-700/30">
          {filteredTransactions.map((txn) => {
            const style = getTransactionStyle(txn.transactionType);
            const hasPnl = txn.realizedPnl !== null && txn.realizedPnl !== undefined;

            return (
              <div
                key={txn.id}
                className="p-4 hover:bg-slate-700/20 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Type icon */}
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${style.bgColor}`}
                    >
                      <span className={style.textColor}>{style.icon}</span>
                    </div>

                    {/* Transaction info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${style.textColor}`}>
                          {style.label}
                        </span>
                        {txn.assetSymbol && (
                          <span className="font-medium text-slate-100">
                            {txn.assetSymbol}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">
                        {formatDateTime(txn.transactionDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* P&L badge (for sells) */}
                    {hasPnl && (
                      <div
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          txn.realizedPnl! >= 0
                            ? 'bg-emerald-600/20 text-emerald-400'
                            : 'bg-rose-600/20 text-rose-400'
                        }`}
                      >
                        P&L: {formatCurrency(txn.realizedPnl!)}
                      </div>
                    )}

                    {/* Amount and details */}
                    <div className="text-right min-w-[100px]">
                      <p
                        className={`font-semibold ${
                          txn.totalAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {txn.totalAmount >= 0 ? '+' : ''}
                        {formatCurrency(txn.totalAmount)}
                      </p>
                      {txn.quantity !== null && txn.pricePerShare !== null && (
                        <p className="text-sm text-slate-500">
                          {formatNumber(txn.quantity)} @ {formatCurrency(txn.pricePerShare)}
                        </p>
                      )}
                    </div>

                    {/* Edit button */}
                    {onEditTransaction && (
                      <button
                        onClick={() => setEditingTransaction(txn)}
                        className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Notes/motivation */}
                {txn.notes && (
                  <p className="mt-2 text-sm text-slate-500 pl-14 line-clamp-2">
                    {txn.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingTransaction && (
        <TransactionEditModal
          transaction={editingTransaction}
          isOpen={true}
          onClose={() => setEditingTransaction(null)}
          onSave={handleEditSave}
          onDelete={onDeleteTransaction}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

export default TransactionsTab;
