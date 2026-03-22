/**
 * PortfolioCSVImport Component
 *
 * Portfolio-specific CSV import wrapper with dropdown menu.
 * Supports two import types:
 * - Transactions: Creates BUY/SELL transactions from CSV (e.g., Fidelity, Merrill Transactions)
 * - Portfolio Snapshot: Directly imports current holdings (e.g., Merrill Holdings/Portfolio Export)
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, ChevronDown, FileSpreadsheet, Wallet } from 'lucide-react';
import { CSVImportModal } from '@/components/shared/CSVImportModal';
import type { CSVImportType } from '@/types/csv';

interface PortfolioCSVImportProps {
  portfolioId: string;
  onImportSuccess: () => void;
}

export function PortfolioCSVImport({ portfolioId, onImportSuccess }: PortfolioCSVImportProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importType, setImportType] = useState<CSVImportType>('portfolio');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleDropdown = useCallback(() => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  const handleSelectImportType = useCallback((type: CSVImportType) => {
    setImportType(type);
    setIsDropdownOpen(false);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleSuccess = useCallback(() => {
    onImportSuccess();
    setIsModalOpen(false);
  }, [onImportSuccess]);

  const modalTitle = importType === 'holdings'
    ? 'Import Portfolio Snapshot'
    : 'Import Transactions';

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={handleToggleDropdown}
          className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-300 hover:text-slate-100 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Import CSV
          <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="p-1">
              <button
                onClick={() => handleSelectImportType('portfolio')}
                className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-slate-700/50 rounded-md transition-colors group"
              >
                <FileSpreadsheet className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-slate-200 group-hover:text-white">
                    Import Transactions
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Fidelity or Merrill Lynch transaction history
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleSelectImportType('holdings')}
                className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-slate-700/50 rounded-md transition-colors group"
              >
                <Wallet className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-slate-200 group-hover:text-white">
                    Import Portfolio Snapshot
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Current holdings with cost basis &amp; cash balance
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      <CSVImportModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        title={modalTitle}
        importType={importType}
        portfolioId={portfolioId}
      />
    </>
  );
}

export default PortfolioCSVImport;
