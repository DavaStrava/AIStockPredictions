'use client';

/**
 * TradeEditModal Component
 * Modal for editing trade notes/motivation for later analysis.
 */

import { useState, useEffect, useCallback } from 'react';
import { TradeWithPnL } from '@/types/models';

/**
 * Maximum length for trade notes
 */
const MAX_NOTES_LENGTH = 5000;

/**
 * Formats a number as currency
 */
function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

/**
 * Formats a date for display
 */
function formatDate(date: Date | null | undefined): string {
  if (!date) return '-';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date instanceof Date ? date : new Date(date));
}

export interface TradeEditModalProps {
  isOpen: boolean;
  trade: TradeWithPnL | null;
  onClose: () => void;
  onSave: (tradeId: string, notes: string) => Promise<void>;
}

export function TradeEditModal({
  isOpen,
  trade,
  onClose,
  onSave,
}: TradeEditModalProps) {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens with trade data
  useEffect(() => {
    if (isOpen && trade) {
      setNotes(trade.notes || '');
      setError(null);
    }
  }, [isOpen, trade]);

  // Handle escape key to close modal
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && !submitting) {
      onClose();
    }
  }, [onClose, submitting]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trade) return;

    setSubmitting(true);
    setError(null);

    try {
      await onSave(trade.id, notes.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save notes');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  if (!isOpen || !trade) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="trade-edit-modal-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2
            id="trade-edit-modal-title"
            className="text-xl font-semibold text-foreground"
          >
            Edit Trade Notes
          </h2>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl leading-none"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {/* Trade Summary */}
        <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Symbol:</span>
              <span className="ml-2 font-medium text-foreground">{trade.symbol}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Side:</span>
              <span className={`ml-2 font-medium ${
                trade.side === 'LONG' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {trade.side}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Entry:</span>
              <span className="ml-2 font-medium text-foreground">{formatCurrency(trade.entryPrice)}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Quantity:</span>
              <span className="ml-2 font-medium text-foreground">{trade.quantity}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Date:</span>
              <span className="ml-2 font-medium text-foreground">{formatDate(trade.entryDate)}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Status:</span>
              <span className={`ml-2 font-medium ${
                trade.status === 'OPEN' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
              }`}>
                {trade.status === 'OPEN' ? 'OPEN' : 'SOLD'}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-md text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Notes/Motivation */}
          <div>
            <label
              htmlFor="trade-notes"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Trade Notes / Motivation
            </label>
            <textarea
              id="trade-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, MAX_NOTES_LENGTH))}
              placeholder="Why did you make this trade? What was your thesis? What did you learn?"
              rows={5}
              maxLength={MAX_NOTES_LENGTH}
              disabled={submitting}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-foreground resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="mt-1 flex justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">
                Record your reasoning for later analysis and learning.
              </span>
              <span className={`${notes.length >= MAX_NOTES_LENGTH ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                {notes.length}/{MAX_NOTES_LENGTH}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {submitting ? 'Saving...' : 'Save Notes'}
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

export default TradeEditModal;
