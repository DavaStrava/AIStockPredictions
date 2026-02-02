/**
 * TradeCSVImport Component
 *
 * Trade Tracker-specific CSV import wrapper.
 * Provides the import button and manages the modal state.
 */

'use client';

import { useState, useCallback } from 'react';
import { Upload } from 'lucide-react';
import { CSVImportModal } from '@/components/shared/CSVImportModal';

interface TradeCSVImportProps {
  onImportSuccess: () => void;
}

export function TradeCSVImport({ onImportSuccess }: TradeCSVImportProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleSuccess = useCallback(() => {
    onImportSuccess();
    setIsModalOpen(false);
  }, [onImportSuccess]);

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-300 hover:text-slate-100 transition-colors"
      >
        <Upload className="w-4 h-4" />
        Import CSV
      </button>

      <CSVImportModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        title="Import Trades"
        importType="trade"
      />
    </>
  );
}

export default TradeCSVImport;
