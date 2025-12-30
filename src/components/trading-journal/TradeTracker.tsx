'use client';

/**
 * TradeTracker Component
 * Main page component for viewing and managing trades.
 * Integrates TradeLogTable with usePortfolioStats hook.
 */

import { useState } from 'react';
import { TradeLogTable } from './TradeLogTable';
import { TradeEntryModal } from './TradeEntryModal';
import { usePortfolioStats } from './hooks/usePortfolioStats';
import { CreateTradeRequest, TradeFilters } from '@/types/models';

/**
 * Formats a number as currency
 */
function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '-';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats a percentage
 */
function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '-';
  }
  return `${(value * 100).toFixed(1)}%`;
}

export function TradeTracker() {
  const {
    trades,
    stats,
    loading,
    statsLoading,
    error,
    fetchTrades,
    createTrade,
    closeTrade,
  } = usePortfolioStats();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');

  const handleCloseTrade = async (tradeId: string) => {
    // Find the trade to get a reasonable default exit price
    const trade = trades.find(t => t.id === tradeId);
    if (!trade) return;

    // Prompt for exit price (in a real app, this would be in the table component)
    const exitPriceStr = window.prompt('Enter exit price:', trade.entryPrice.toString());
    if (!exitPriceStr) return;

    const exitPrice = parseFloat(exitPriceStr);
    if (isNaN(exitPrice) || exitPrice <= 0) {
      alert('Please enter a valid positive price');
      return;
    }

    try {
      await closeTrade(tradeId, exitPrice);
    } catch (err) {
      console.error('Failed to close trade:', err);
      alert(err instanceof Error ? err.message : 'Failed to close trade');
    }
  };

  const handleCreateTrade = async (data: Omit<CreateTradeRequest, 'userId'>) => {
    await createTrade(data);
    setIsModalOpen(false);
  };

  const handleFilterChange = (status: 'ALL' | 'OPEN' | 'CLOSED') => {
    setFilterStatus(status);
    const filters: TradeFilters = status === 'ALL' ? {} : { status };
    fetchTrades(filters);
  };

  const filteredTrades = filterStatus === 'ALL' 
    ? trades 
    : trades.filter(t => t.status === filterStatus);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Trade Tracker</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track your trades and monitor P&L performance
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + New Trade
        </button>
      </div>

      {/* Portfolio Stats Summary */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Realized P&L</p>
            <p className={`text-xl font-bold ${
              (stats.totalRealizedPnl ?? 0) >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {formatCurrency(stats.totalRealizedPnl)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Unrealized P&L</p>
            <p className={`text-xl font-bold ${
              (stats.totalUnrealizedPnl ?? 0) >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {formatCurrency(stats.totalUnrealizedPnl)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Win Rate</p>
            <p className="text-xl font-bold text-foreground">
              {formatPercent(stats.winRate)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Avg Win</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(stats.avgWin)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Avg Loss</p>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(stats.avgLoss)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Trades</p>
            <p className="text-xl font-bold text-foreground">
              {stats.totalTrades ?? trades.length}
            </p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {(['ALL', 'OPEN', 'CLOSED'] as const).map((status) => (
          <button
            key={status}
            onClick={() => handleFilterChange(status)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              filterStatus === status
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {status === 'ALL' ? 'All Trades' : status === 'OPEN' ? 'Open' : 'Closed'}
            {status === 'OPEN' && ` (${trades.filter(t => t.status === 'OPEN').length})`}
            {status === 'CLOSED' && ` (${trades.filter(t => t.status === 'CLOSED').length})`}
          </button>
        ))}
      </div>

      {/* Trade Log Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <TradeLogTable
          trades={filteredTrades}
          onCloseTrade={handleCloseTrade}
          loading={loading}
        />
      </div>

      {/* Trade Entry Modal */}
      <TradeEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTrade}
      />
    </div>
  );
}

export default TradeTracker;
