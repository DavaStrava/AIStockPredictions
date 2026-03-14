'use client';

/**
 * PositionsPanel Component
 *
 * Display open positions with current market prices and unrealized P&L.
 * Includes sell functionality for closing positions.
 */

import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  X,
  AlertCircle,
} from 'lucide-react';
import { OpenPositionSummary } from '@/types/portfolio';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/formatters';

interface PositionsPanelProps {
  positions: OpenPositionSummary[];
  loading: boolean;
  onSellPosition?: (symbol: string, quantity: number, pricePerShare: number) => Promise<void>;
}

interface SellModalState {
  position: OpenPositionSummary;
  quantity: string;
  pricePerShare: string;
}

export function PositionsPanel({
  positions,
  loading,
  onSellPosition,
}: PositionsPanelProps) {
  const [sellModal, setSellModal] = useState<SellModalState | null>(null);
  const [isSelling, setIsSelling] = useState(false);
  const [sellError, setSellError] = useState<string | null>(null);

  // Calculate totals
  const totalCostBasis = positions.reduce((sum, p) => sum + p.totalCostBasis, 0);
  const totalMarketValue = positions.reduce((sum, p) => sum + (p.marketValue || 0), 0);
  const totalUnrealizedPnl = positions.reduce((sum, p) => sum + (p.unrealizedPnl || 0), 0);
  const totalUnrealizedPnlPercent = totalCostBasis > 0
    ? (totalUnrealizedPnl / totalCostBasis) * 100
    : 0;

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellModal || !onSellPosition) return;

    const quantity = parseFloat(sellModal.quantity);
    const price = parseFloat(sellModal.pricePerShare);

    if (isNaN(quantity) || quantity <= 0) {
      setSellError('Please enter a valid quantity');
      return;
    }
    if (quantity > sellModal.position.totalShares) {
      setSellError(`Cannot sell more than ${sellModal.position.totalShares} shares`);
      return;
    }
    if (isNaN(price) || price <= 0) {
      setSellError('Please enter a valid price');
      return;
    }

    setIsSelling(true);
    setSellError(null);

    try {
      await onSellPosition(sellModal.position.symbol, quantity, price);
      setSellModal(null);
    } catch (error) {
      setSellError(error instanceof Error ? error.message : 'Failed to sell position');
    } finally {
      setIsSelling(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-700 rounded w-1/4" />
          <div className="h-16 bg-slate-700 rounded" />
          <div className="h-16 bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8 text-center">
        <DollarSign className="w-12 h-12 mx-auto text-slate-600 mb-3" />
        <p className="text-slate-400">No open positions</p>
        <p className="text-sm text-slate-500 mt-1">Buy some stocks to see them here</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
        {/* Header with totals */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-slate-100">Open Positions</h3>
            <span className="text-sm text-slate-500">{positions.length} positions</span>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Total Cost</p>
              <p className="text-lg font-semibold text-slate-100">
                {formatCurrency(totalCostBasis)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Market Value</p>
              <p className="text-lg font-semibold text-slate-100">
                {formatCurrency(totalMarketValue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Unrealized P&L</p>
              <p
                className={`text-lg font-semibold ${
                  totalUnrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {totalUnrealizedPnl >= 0 ? '+' : ''}
                {formatCurrency(totalUnrealizedPnl)}
                <span className="text-sm ml-1">
                  ({totalUnrealizedPnlPercent >= 0 ? '+' : ''}
                  {formatPercent(totalUnrealizedPnlPercent)})
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Positions list */}
        <div className="divide-y divide-slate-700/30">
          {positions.map((position) => {
            const pnlPercent = position.unrealizedPnlPercent || 0;
            const isProfit = (position.unrealizedPnl || 0) >= 0;

            return (
              <div
                key={position.symbol}
                className="p-4 hover:bg-slate-700/20 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* P&L indicator */}
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isProfit ? 'bg-emerald-600/20' : 'bg-rose-600/20'
                      }`}
                    >
                      {isProfit ? (
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-rose-400" />
                      )}
                    </div>

                    {/* Position info */}
                    <div>
                      <p className="font-semibold text-slate-100">{position.symbol}</p>
                      <p className="text-sm text-slate-500">
                        {formatNumber(position.totalShares)} shares @ {formatCurrency(position.averageCostBasis)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Current price and value */}
                    <div className="text-right">
                      {position.currentPrice && (
                        <p className="text-sm text-slate-400">
                          Current: {formatCurrency(position.currentPrice)}
                        </p>
                      )}
                      <p className="font-semibold text-slate-100">
                        {formatCurrency(position.marketValue || position.totalCostBasis)}
                      </p>
                    </div>

                    {/* Unrealized P&L */}
                    <div className="text-right min-w-[100px]">
                      <p
                        className={`font-semibold ${
                          isProfit ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isProfit ? '+' : ''}
                        {formatCurrency(position.unrealizedPnl || 0)}
                      </p>
                      <p
                        className={`text-sm ${
                          isProfit ? 'text-emerald-400/70' : 'text-rose-400/70'
                        }`}
                      >
                        {pnlPercent >= 0 ? '+' : ''}
                        {formatPercent(pnlPercent)}
                      </p>
                    </div>

                    {/* Sell button */}
                    {onSellPosition && (
                      <button
                        onClick={() =>
                          setSellModal({
                            position,
                            quantity: position.totalShares.toString(),
                            pricePerShare: position.currentPrice?.toString() || '',
                          })
                        }
                        className="px-3 py-1.5 bg-rose-600/20 text-rose-400 border border-rose-600/30 rounded-lg hover:bg-rose-600/30 transition-colors text-sm font-medium"
                      >
                        Sell
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sell Modal */}
      {sellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSellModal(null)}
          />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-xl font-bold text-slate-100">
                Sell {sellModal.position.symbol}
              </h2>
              <button
                onClick={() => setSellModal(null)}
                className="p-2 text-slate-400 hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSell} className="p-4 space-y-4">
              {/* Position info */}
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Available Shares</span>
                  <span className="text-slate-100">
                    {formatNumber(sellModal.position.totalShares)}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-slate-400">Avg Cost</span>
                  <span className="text-slate-100">
                    {formatCurrency(sellModal.position.averageCostBasis)}
                  </span>
                </div>
                {sellModal.position.currentPrice && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-slate-400">Current Price</span>
                    <span className="text-slate-100">
                      {formatCurrency(sellModal.position.currentPrice)}
                    </span>
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Quantity to Sell
                </label>
                <input
                  type="number"
                  step="0.00000001"
                  min="0"
                  max={sellModal.position.totalShares}
                  value={sellModal.quantity}
                  onChange={(e) =>
                    setSellModal((prev) =>
                      prev ? { ...prev, quantity: e.target.value } : null
                    )
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() =>
                    setSellModal((prev) =>
                      prev
                        ? { ...prev, quantity: prev.position.totalShares.toString() }
                        : null
                    )
                  }
                  className="text-sm text-indigo-400 hover:text-indigo-300 mt-1"
                >
                  Sell All
                </button>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Sell Price
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={sellModal.pricePerShare}
                  onChange={(e) =>
                    setSellModal((prev) =>
                      prev ? { ...prev, pricePerShare: e.target.value } : null
                    )
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Error */}
              {sellError && (
                <div className="flex items-center gap-2 text-rose-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {sellError}
                </div>
              )}

              {/* Estimated proceeds */}
              {sellModal.quantity && sellModal.pricePerShare && (
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Estimated Proceeds</span>
                    <span className="text-emerald-400 font-semibold">
                      {formatCurrency(
                        parseFloat(sellModal.quantity) *
                          parseFloat(sellModal.pricePerShare)
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSellModal(null)}
                  className="flex-1 px-4 py-2.5 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSelling}
                  className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-lg hover:bg-rose-500 transition-colors disabled:opacity-50"
                >
                  {isSelling ? 'Selling...' : 'Confirm Sell'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default PositionsPanel;
