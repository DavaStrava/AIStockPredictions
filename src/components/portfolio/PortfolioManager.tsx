'use client';

/**
 * PortfolioManager Component
 *
 * Main container component for the Portfolio Investment Tracker.
 * Integrates all portfolio sub-components:
 * - Portfolio selector and management
 * - Summary statistics
 * - Holdings grid
 * - Transaction management
 * - Allocation tree map
 * - Performance chart
 */

import { useState } from 'react';
import {
  Plus,
  ChevronDown,
  Briefcase,
  RefreshCw,
  LayoutDashboard,
  LineChart,
  PieChart,
  List,
  Trash2,
} from 'lucide-react';
import { usePortfolio } from './hooks/usePortfolio';
import { PortfolioSummaryCard } from './PortfolioSummaryCard';
import { HoldingsDataGrid } from './HoldingsDataGrid';
import { TransactionModal } from './TransactionModal';
import { PortfolioTreeMap } from './PortfolioTreeMap';
import { PerformanceChart } from './PerformanceChart';
import { PortfolioTransactionType } from '@/types/portfolio';

type TabId = 'holdings' | 'transactions' | 'allocation' | 'performance';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { id: 'holdings', label: 'Holdings', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'transactions', label: 'Transactions', icon: <List className="w-4 h-4" /> },
  { id: 'allocation', label: 'Allocation', icon: <PieChart className="w-4 h-4" /> },
  { id: 'performance', label: 'Performance', icon: <LineChart className="w-4 h-4" /> },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function PortfolioManager() {
  const {
    portfolios,
    selectedPortfolio,
    selectedPortfolioId,
    summary,
    holdings,
    transactions,
    allocation,
    history,
    loading,
    error,
    selectPortfolio,
    createPortfolio,
    deletePortfolio,
    addTransaction,
    updateHoldingTarget,
    fetchHistory,
    refreshPortfolioData,
    clearError,
  } = usePortfolio({ autoFetch: true, refreshInterval: 60000 });

  const [activeTab, setActiveTab] = useState<TabId>('holdings');
  const [showPortfolioDropdown, setShowPortfolioDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionType, setTransactionType] = useState<PortfolioTransactionType>('BUY');
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleCreatePortfolio = async () => {
    if (!newPortfolioName.trim()) return;

    try {
      await createPortfolio(newPortfolioName.trim());
      setNewPortfolioName('');
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create portfolio:', err);
    }
  };

  const handleDeletePortfolio = async (id: string) => {
    if (!confirm('Are you sure you want to delete this portfolio? This action cannot be undone.')) {
      return;
    }

    try {
      await deletePortfolio(id);
    } catch (err) {
      console.error('Failed to delete portfolio:', err);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshPortfolioData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const openTransactionModal = (type: PortfolioTransactionType) => {
    setTransactionType(type);
    setShowTransactionModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            {/* Portfolio Selector */}
            <div className="relative">
              <button
                onClick={() => setShowPortfolioDropdown(!showPortfolioDropdown)}
                className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-slate-600/50 transition-colors"
              >
                <Briefcase className="w-5 h-5 text-indigo-400" />
                <span className="text-lg font-semibold text-slate-100">
                  {selectedPortfolio?.name || 'Select Portfolio'}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {showPortfolioDropdown && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50">
                  <div className="p-2">
                    {portfolios.map((portfolio) => (
                      <div
                        key={portfolio.id}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                          portfolio.id === selectedPortfolioId
                            ? 'bg-indigo-600/20 text-indigo-400'
                            : 'hover:bg-slate-700/50 text-slate-300'
                        }`}
                        onClick={() => {
                          selectPortfolio(portfolio.id);
                          setShowPortfolioDropdown(false);
                        }}
                      >
                        <div>
                          <p className="font-medium">{portfolio.name}</p>
                          {portfolio.description && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              {portfolio.description}
                            </p>
                          )}
                        </div>
                        {portfolios.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePortfolio(portfolio.id);
                            }}
                            className="p-1.5 hover:bg-rose-600/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-rose-400" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-700 p-2">
                    <button
                      onClick={() => {
                        setShowPortfolioDropdown(false);
                        setShowCreateModal(true);
                      }}
                      className="w-full flex items-center gap-2 p-3 text-indigo-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create New Portfolio</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-slate-600/50 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-5 h-5 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => openTransactionModal('DEPOSIT')}
              className="px-4 py-2.5 bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 rounded-lg hover:bg-emerald-600/30 transition-colors font-medium"
            >
              + Deposit
            </button>
            <button
              onClick={() => openTransactionModal('BUY')}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-medium"
            >
              + Buy Stock
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-rose-900/30 border border-rose-800 rounded-xl flex items-center justify-between">
            <p className="text-rose-400">{error}</p>
            <button
              onClick={clearError}
              className="text-rose-400 hover:text-rose-300"
            >
              ×
            </button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="mb-8">
          <PortfolioSummaryCard summary={summary} loading={loading} />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 bg-slate-800/30 rounded-xl p-1 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-700/50 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'holdings' && (
            <HoldingsDataGrid
              holdings={holdings}
              loading={loading}
              onUpdateTarget={updateHoldingTarget}
            />
          )}

          {activeTab === 'transactions' && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-100">Transaction History</h3>
                <button
                  onClick={() => openTransactionModal('BUY')}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-500 transition-colors"
                >
                  + Add Transaction
                </button>
              </div>

              {transactions.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-slate-400">No transactions yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/30">
                  {transactions.map((txn) => (
                    <div
                      key={txn.id}
                      className="p-4 hover:bg-slate-700/20 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              txn.transactionType === 'BUY'
                                ? 'bg-emerald-600/20'
                                : txn.transactionType === 'SELL'
                                  ? 'bg-rose-600/20'
                                  : txn.transactionType === 'DEPOSIT'
                                    ? 'bg-indigo-600/20'
                                    : txn.transactionType === 'WITHDRAW'
                                      ? 'bg-amber-600/20'
                                      : 'bg-cyan-600/20'
                            }`}
                          >
                            <span
                              className={`text-sm font-bold ${
                                txn.transactionType === 'BUY'
                                  ? 'text-emerald-400'
                                  : txn.transactionType === 'SELL'
                                    ? 'text-rose-400'
                                    : txn.transactionType === 'DEPOSIT'
                                      ? 'text-indigo-400'
                                      : txn.transactionType === 'WITHDRAW'
                                        ? 'text-amber-400'
                                        : 'text-cyan-400'
                              }`}
                            >
                              {txn.transactionType.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-100">
                              {txn.transactionType}
                              {txn.assetSymbol && ` ${txn.assetSymbol}`}
                            </p>
                            <p className="text-sm text-slate-500">
                              {formatDate(txn.transactionDate)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-semibold ${
                              txn.totalAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {txn.totalAmount >= 0 ? '+' : ''}
                            {formatCurrency(txn.totalAmount)}
                          </p>
                          {txn.quantity && txn.pricePerShare && (
                            <p className="text-sm text-slate-500">
                              {txn.quantity} × {formatCurrency(txn.pricePerShare)}
                            </p>
                          )}
                        </div>
                      </div>
                      {txn.notes && (
                        <p className="mt-2 text-sm text-slate-500 pl-14">{txn.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'allocation' && (
            <PortfolioTreeMap allocation={allocation} loading={loading} />
          )}

          {activeTab === 'performance' && (
            <PerformanceChart
              data={history}
              loading={loading}
              onFetchHistory={async (startDate, endDate) => {
                if (selectedPortfolioId) {
                  await fetchHistory(selectedPortfolioId, startDate, endDate);
                }
              }}
            />
          )}
        </div>

        {/* Create Portfolio Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCreateModal(false)}
            />
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
              <h2 className="text-xl font-bold text-slate-100 mb-4">Create New Portfolio</h2>
              <input
                type="text"
                value={newPortfolioName}
                onChange={(e) => setNewPortfolioName(e.target.value)}
                placeholder="Portfolio Name"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePortfolio}
                  disabled={!newPortfolioName.trim()}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Modal */}
        <TransactionModal
          isOpen={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
          onSubmit={addTransaction}
          defaultType={transactionType}
        />
      </div>

      {/* Click outside to close dropdown */}
      {showPortfolioDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowPortfolioDropdown(false)}
        />
      )}
    </div>
  );
}

export default PortfolioManager;





