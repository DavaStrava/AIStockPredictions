'use client';

/**
 * TradeEntryModal Component
 * Modal form for creating new trade entries.
 * Supports prefilled symbol and predictionId from prediction cards.
 * 
 * Requirements: 2.2, 2.3, 9.2, 9.3
 */

import { useState, useEffect, useCallback } from 'react';
import { TradeSide, CreateTradeRequest } from '@/types/models';

export interface TradeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<CreateTradeRequest, 'userId'>) => Promise<void>;
  prefillSymbol?: string;
  prefillPredictionId?: string;
}

interface FormErrors {
  symbol?: string;
  side?: string;
  entryPrice?: string;
  quantity?: string;
  fees?: string;
}

export function TradeEntryModal({
  isOpen,
  onClose,
  onSubmit,
  prefillSymbol,
  prefillPredictionId,
}: TradeEntryModalProps) {
  const [symbol, setSymbol] = useState('');
  const [side, setSide] = useState<TradeSide>('LONG');
  const [entryPrice, setEntryPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [fees, setFees] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Reset form when modal opens with prefilled values
  useEffect(() => {
    if (isOpen) {
      setSymbol(prefillSymbol || '');
      setSide('LONG');
      setEntryPrice('');
      setQuantity('');
      setFees('');
      setNotes('');
      setErrors({});
      setSubmitError(null);
    }
  }, [isOpen, prefillSymbol]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Symbol validation
    if (!symbol.trim()) {
      newErrors.symbol = 'Symbol is required';
    } else if (!/^[A-Z]{1,5}$/.test(symbol.trim().toUpperCase())) {
      newErrors.symbol = 'Symbol must be 1-5 uppercase letters';
    }

    // Entry price validation
    const priceNum = parseFloat(entryPrice);
    if (!entryPrice.trim()) {
      newErrors.entryPrice = 'Entry price is required';
    } else if (isNaN(priceNum) || priceNum <= 0) {
      newErrors.entryPrice = 'Entry price must be a positive number';
    }

    // Quantity validation
    const qtyNum = parseFloat(quantity);
    if (!quantity.trim()) {
      newErrors.quantity = 'Quantity is required';
    } else if (isNaN(qtyNum) || qtyNum <= 0) {
      newErrors.quantity = 'Quantity must be a positive number';
    }

    // Fees validation (optional but must be non-negative if provided)
    if (fees.trim()) {
      const feesNum = parseFloat(fees);
      if (isNaN(feesNum) || feesNum < 0) {
        newErrors.fees = 'Fees must be a non-negative number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [symbol, entryPrice, quantity, fees]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const tradeData: Omit<CreateTradeRequest, 'userId'> = {
        symbol: symbol.trim().toUpperCase(),
        side,
        entryPrice: parseFloat(entryPrice),
        quantity: parseFloat(quantity),
        fees: fees.trim() ? parseFloat(fees) : undefined,
        notes: notes.trim() || undefined,
        predictionId: prefillPredictionId || undefined,
      };

      await onSubmit(tradeData);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create trade');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="trade-entry-modal-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2
            id="trade-entry-modal-title"
            className="text-xl font-semibold text-foreground"
          >
            Log New Trade
          </h2>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl leading-none"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {submitError && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-md text-red-700 dark:text-red-300 text-sm">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Symbol */}
          <div>
            <label
              htmlFor="trade-symbol"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Symbol *
            </label>
            <input
              id="trade-symbol"
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="AAPL"
              disabled={submitting}
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-foreground ${
                errors.symbol
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              aria-invalid={!!errors.symbol}
              aria-describedby={errors.symbol ? 'symbol-error' : undefined}
            />
            {errors.symbol && (
              <p id="symbol-error" className="mt-1 text-sm text-red-500 dark:text-red-400">
                {errors.symbol}
              </p>
            )}
          </div>

          {/* Side */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Side *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="side"
                  value="LONG"
                  checked={side === 'LONG'}
                  onChange={() => setSide('LONG')}
                  disabled={submitting}
                  className="mr-2"
                />
                <span className="text-foreground">Long</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="side"
                  value="SHORT"
                  checked={side === 'SHORT'}
                  onChange={() => setSide('SHORT')}
                  disabled={submitting}
                  className="mr-2"
                />
                <span className="text-foreground">Short</span>
              </label>
            </div>
          </div>

          {/* Entry Price */}
          <div>
            <label
              htmlFor="trade-entry-price"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Entry Price *
            </label>
            <input
              id="trade-entry-price"
              type="number"
              step="0.01"
              min="0.01"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              placeholder="150.00"
              disabled={submitting}
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-foreground ${
                errors.entryPrice
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              aria-invalid={!!errors.entryPrice}
              aria-describedby={errors.entryPrice ? 'entry-price-error' : undefined}
            />
            {errors.entryPrice && (
              <p id="entry-price-error" className="mt-1 text-sm text-red-500 dark:text-red-400">
                {errors.entryPrice}
              </p>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label
              htmlFor="trade-quantity"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Quantity *
            </label>
            <input
              id="trade-quantity"
              type="number"
              step="0.01"
              min="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="10"
              disabled={submitting}
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-foreground ${
                errors.quantity
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              aria-invalid={!!errors.quantity}
              aria-describedby={errors.quantity ? 'quantity-error' : undefined}
            />
            {errors.quantity && (
              <p id="quantity-error" className="mt-1 text-sm text-red-500 dark:text-red-400">
                {errors.quantity}
              </p>
            )}
          </div>

          {/* Fees */}
          <div>
            <label
              htmlFor="trade-fees"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Fees
            </label>
            <input
              id="trade-fees"
              type="number"
              step="0.01"
              min="0"
              value={fees}
              onChange={(e) => setFees(e.target.value)}
              placeholder="0.00"
              disabled={submitting}
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-foreground ${
                errors.fees
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              aria-invalid={!!errors.fees}
              aria-describedby={errors.fees ? 'fees-error' : undefined}
            />
            {errors.fees && (
              <p id="fees-error" className="mt-1 text-sm text-red-500 dark:text-red-400">
                {errors.fees}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="trade-notes"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Notes
            </label>
            <textarea
              id="trade-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this trade..."
              rows={3}
              disabled={submitting}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-foreground resize-none"
            />
          </div>

          {/* Prediction Link Info */}
          {prefillPredictionId && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This trade will be linked to the prediction for tracking.
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {submitting ? 'Creating...' : 'Create Trade'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-foreground rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TradeEntryModal;
