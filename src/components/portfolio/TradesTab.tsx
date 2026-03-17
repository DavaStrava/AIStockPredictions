/**
 * TradesTab Component
 *
 * Portfolio tab that displays trade history with P&L tracking.
 * Integrates with the unified portfolio_transactions table.
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { TradeWithPnL } from '@/types/models';
import { TradeStats } from '@/types/portfolio';
import { TradeStatsCards } from './TradeStatsCards';
import { TradeLogTable } from '@/components/trading-journal/TradeLogTable';

interface TradesTabProps {
  trades: TradeWithPnL[];
  stats: TradeStats | null;
  loading?: boolean;
  onCloseTrade: (tradeId: string, exitPrice: number, quantity: number) => Promise<void>;
  onEditTrade: (tradeId: string, notes: string) => Promise<void>;
  onDeleteTrades: (tradeIds: string[]) => Promise<void>;
  onRefresh: () => void;
}

type FilterStatus = 'ALL' | 'OPEN' | 'CLOSED';

export function TradesTab({
  trades,
  stats,
  loading = false,
  onCloseTrade,
  onEditTrade,
  onDeleteTrades,
  onRefresh,
}: TradesTabProps) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');

  // Filter trades by status
  const filteredTrades = useMemo(() => {
    if (filterStatus === 'ALL') return trades;
    return trades.filter((t) => t.status === filterStatus);
  }, [trades, filterStatus]);

  // Count trades by status
  const openCount = useMemo(() => trades.filter((t) => t.status === 'OPEN').length, [trades]);
  const closedCount = useMemo(() => trades.filter((t) => t.status === 'CLOSED').length, [trades]);

  const handleCloseTrade = useCallback(
    async (tradeId: string, exitPrice: number, quantity: number) => {
      await onCloseTrade(tradeId, exitPrice, quantity);
      onRefresh();
    },
    [onCloseTrade, onRefresh]
  );

  const handleEditTrade = useCallback(
    async (tradeId: string, notes: string) => {
      await onEditTrade(tradeId, notes);
      onRefresh();
    },
    [onEditTrade, onRefresh]
  );

  const handleDeleteTrades = useCallback(
    async (tradeIds: string[]) => {
      await onDeleteTrades(tradeIds);
      onRefresh();
    },
    [onDeleteTrades, onRefresh]
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <TradeStatsCards stats={stats} loading={loading} />

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-700/50">
        {(['ALL', 'OPEN', 'CLOSED'] as const).map((status) => {
          const count =
            status === 'ALL' ? trades.length : status === 'OPEN' ? openCount : closedCount;

          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                filterStatus === status
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {status === 'ALL' ? 'All Trades' : status === 'OPEN' ? 'Open' : 'Closed'}
              <span className="ml-1 text-slate-500">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Empty State */}
      {!loading && trades.length === 0 && (
        <div className="text-center py-12">
          <div className="text-slate-400 mb-2">No trades found</div>
          <p className="text-sm text-slate-500">
            BUY transactions will appear here when you add them via the Transactions tab or CSV import.
          </p>
        </div>
      )}

      {/* Empty State for filtered results */}
      {!loading && trades.length > 0 && filteredTrades.length === 0 && (
        <div className="text-center py-12">
          <div className="text-slate-400 mb-2">No {filterStatus.toLowerCase()} trades</div>
          <p className="text-sm text-slate-500">
            {filterStatus === 'OPEN'
              ? 'All your positions have been closed.'
              : 'You have no closed positions yet.'}
          </p>
        </div>
      )}

      {/* Trade Log Table */}
      {filteredTrades.length > 0 && (
        <TradeLogTable
          trades={filteredTrades}
          onCloseTrade={handleCloseTrade}
          onDeleteTrades={handleDeleteTrades}
          onEditTrade={handleEditTrade}
          loading={loading}
        />
      )}

      {/* Info Banner */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-slate-300 mb-1">About Trade Tracking</h4>
        <p className="text-sm text-slate-400">
          Trades are automatically created from BUY transactions with{' '}
          <span className="text-slate-300">side</span> and{' '}
          <span className="text-slate-300">trade status</span> fields set.
          When you sell shares, the system uses FIFO matching to close the oldest open positions
          first and calculates your realized P&L.
        </p>
      </div>
    </div>
  );
}

export default TradesTab;
