'use client';

/**
 * TransactionEditModal Component
 *
 * Modal for editing transaction details including trade motivation/notes.
 */

import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { PortfolioTransaction, TradeSide, TradeStatus } from '@/types/portfolio';

interface TransactionEditModalProps {
  transaction: PortfolioTransaction;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<PortfolioTransaction>) => Promise<void>;
  onDelete?: (txnId: string) => Promise<void>;
  isSaving: boolean;
}

export function TransactionEditModal({
  transaction,
  isOpen,
  onClose,
  onSave,
  onDelete,
  isSaving,
}: TransactionEditModalProps) {
  const [formData, setFormData] = useState({
    transactionDate: formatDateForInput(transaction.transactionDate),
    quantity: transaction.quantity != null ? transaction.quantity.toString() : '',
    pricePerShare: transaction.pricePerShare != null ? transaction.pricePerShare.toString() : '',
    fees: transaction.fees != null ? transaction.fees.toString() : '0',
    notes: transaction.notes || '',
    side: transaction.side || 'LONG',
    tradeStatus: transaction.tradeStatus || 'OPEN',
    exitPrice: transaction.exitPrice != null ? transaction.exitPrice.toString() : '',
    exitDate: transaction.exitDate ? formatDateForInput(transaction.exitDate) : '',
    settlementDate: transaction.settlementDate ? formatDateForInput(transaction.settlementDate) : '',
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isBuySell = transaction.transactionType === 'BUY' || transaction.transactionType === 'SELL';
  const canEditTradeFields = isBuySell;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updates: Partial<PortfolioTransaction> = {};

    // Date
    if (formData.transactionDate) {
      updates.transactionDate = new Date(formData.transactionDate);
    }

    // Quantity and price (for BUY/SELL)
    if (isBuySell) {
      if (formData.quantity) {
        updates.quantity = parseFloat(formData.quantity);
      }
      if (formData.pricePerShare) {
        updates.pricePerShare = parseFloat(formData.pricePerShare);
      }
    }

    // Fees
    if (formData.fees) {
      updates.fees = parseFloat(formData.fees);
    }

    // Notes/motivation
    updates.notes = formData.notes;

    // Trade tracking fields
    if (canEditTradeFields) {
      updates.side = formData.side as TradeSide;
      updates.tradeStatus = formData.tradeStatus as TradeStatus;

      if (formData.exitPrice) {
        updates.exitPrice = parseFloat(formData.exitPrice);
      }
      if (formData.exitDate) {
        updates.exitDate = new Date(formData.exitDate);
      }
    }

    if (formData.settlementDate) {
      updates.settlementDate = new Date(formData.settlementDate);
    }

    await onSave(updates);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(transaction.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-slate-100">
            Edit {transaction.transactionType}
            {transaction.assetSymbol && ` - ${transaction.assetSymbol}`}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Transaction Date */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Transaction Date
            </label>
            <input
              type="datetime-local"
              value={formData.transactionDate}
              onChange={(e) => setFormData(prev => ({ ...prev, transactionDate: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Quantity and Price (for BUY/SELL/DRIP) */}
          {(isBuySell || transaction.transactionType === 'DIVIDEND_REINVESTMENT') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  step="0.00000001"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Price per Share
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={formData.pricePerShare}
                  onChange={(e) => setFormData(prev => ({ ...prev, pricePerShare: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Fees */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Fees
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.fees}
              onChange={(e) => setFormData(prev => ({ ...prev, fees: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Settlement Date */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Settlement Date
            </label>
            <input
              type="date"
              value={formData.settlementDate.split('T')[0]}
              onChange={(e) => setFormData(prev => ({ ...prev, settlementDate: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Trade Tracking (for BUY/SELL) */}
          {canEditTradeFields && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Side
                  </label>
                  <select
                    value={formData.side}
                    onChange={(e) => setFormData(prev => ({ ...prev, side: e.target.value as TradeSide }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="LONG">Long</option>
                    <option value="SHORT">Short</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.tradeStatus}
                    onChange={(e) => setFormData(prev => ({ ...prev, tradeStatus: e.target.value as TradeStatus }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="OPEN">Open</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </div>

              {/* Exit details (for closed trades) */}
              {formData.tradeStatus === 'CLOSED' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Exit Price
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      value={formData.exitPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, exitPrice: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Exit Date
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.exitDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, exitDate: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Notes / Trade Motivation */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {isBuySell ? 'Trade Motivation / Notes' : 'Notes'}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder={isBuySell ? 'Why did you make this trade?' : 'Add notes...'}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Raw description (read-only) */}
          {transaction.rawDescription && (
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">
                Original Description
              </label>
              <p className="text-sm text-slate-500 bg-slate-800/50 p-2 rounded-lg">
                {transaction.rawDescription}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-700">
            {onDelete && !showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-600/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}

            {showDeleteConfirm && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Confirm delete?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3 py-1.5 bg-rose-600 text-white text-sm rounded-lg hover:bg-rose-500 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-slate-200 text-sm"
                >
                  Cancel
                </button>
              </div>
            )}

            {!showDeleteConfirm && (
              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Format date for datetime-local input
 */
function formatDateForInput(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default TransactionEditModal;
