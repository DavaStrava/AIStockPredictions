'use client';

/**
 * TransactionModal Component
 *
 * Modal form for entering portfolio transactions:
 * - BUY / SELL: Stock purchases and sales
 * - DEPOSIT / WITHDRAW: Cash movements
 * - DIVIDEND: Dividend income
 */

import { useState, useEffect } from 'react';
import { X, DollarSign, Hash, Calendar, FileText } from 'lucide-react';
import { PortfolioTransactionType, CreateTransactionRequest } from '@/types/portfolio';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: Omit<CreateTransactionRequest, 'portfolioId'>) => Promise<void>;
  defaultType?: PortfolioTransactionType;
}

const TRANSACTION_TYPES: { value: PortfolioTransactionType; label: string; description: string }[] = [
  { value: 'BUY', label: 'Buy', description: 'Purchase shares' },
  { value: 'SELL', label: 'Sell', description: 'Sell shares' },
  { value: 'DEPOSIT', label: 'Deposit', description: 'Add cash' },
  { value: 'WITHDRAW', label: 'Withdraw', description: 'Remove cash' },
  { value: 'DIVIDEND', label: 'Dividend', description: 'Dividend income' },
];

export function TransactionModal({
  isOpen,
  onClose,
  onSubmit,
  defaultType = 'BUY',
}: TransactionModalProps) {
  const [transactionType, setTransactionType] = useState<PortfolioTransactionType>(defaultType);
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [pricePerShare, setPricePerShare] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [fees, setFees] = useState('');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTransactionType(defaultType);
      setSymbol('');
      setQuantity('');
      setPricePerShare('');
      setTotalAmount('');
      setFees('');
      setTransactionDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setError(null);
    }
  }, [isOpen, defaultType]);

  // Auto-calculate total amount for BUY/SELL
  useEffect(() => {
    if ((transactionType === 'BUY' || transactionType === 'SELL') && quantity && pricePerShare) {
      const qty = parseFloat(quantity);
      const price = parseFloat(pricePerShare);
      if (!isNaN(qty) && !isNaN(price)) {
        setTotalAmount((qty * price).toFixed(2));
      }
    }
  }, [transactionType, quantity, pricePerShare]);

  const requiresSymbol =
    transactionType === 'BUY' || transactionType === 'SELL' || transactionType === 'DIVIDEND';
  const requiresQuantity = transactionType === 'BUY' || transactionType === 'SELL';
  const requiresPrice = transactionType === 'BUY' || transactionType === 'SELL';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const transaction: Omit<CreateTransactionRequest, 'portfolioId'> = {
        transactionType,
        totalAmount: parseFloat(totalAmount),
        transactionDate: new Date(transactionDate),
        notes: notes || undefined,
        fees: fees ? parseFloat(fees) : undefined,
      };

      if (requiresSymbol) {
        transaction.assetSymbol = symbol.toUpperCase();
      }

      if (requiresQuantity) {
        transaction.quantity = parseFloat(quantity);
      }

      if (requiresPrice) {
        transaction.pricePerShare = parseFloat(pricePerShare);
      }

      await onSubmit(transaction);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-slate-100">Add Transaction</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Transaction Type Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-3">
              Transaction Type
            </label>
            <div className="grid grid-cols-5 gap-2">
              {TRANSACTION_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setTransactionType(type.value)}
                  className={`p-3 rounded-lg text-center transition-all ${
                    transactionType === type.value
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Symbol Input (for BUY/SELL/DIVIDEND) */}
          {requiresSymbol && (
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Symbol
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g., AAPL"
                required
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Quantity and Price (for BUY/SELL) */}
          {requiresQuantity && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  <Hash className="w-4 h-4 inline mr-1" />
                  Quantity
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  required
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Price per Share
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={pricePerShare}
                  onChange={(e) => setPricePerShare(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Total Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Total Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="0.00"
              required
              readOnly={requiresQuantity && !!quantity && !!pricePerShare}
              className={`w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                requiresQuantity && quantity && pricePerShare ? 'opacity-75' : ''
              }`}
            />
          </div>

          {/* Fees and Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Fees (optional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={fees}
                onChange={(e) => setFees(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date
              </label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this transaction..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-rose-900/30 border border-rose-800 rounded-lg">
              <p className="text-rose-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TransactionModal;

