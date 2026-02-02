/**
 * CSVFileUpload Component
 *
 * Drag and drop file upload component for CSV files.
 * Validates file type and size before accepting.
 */

'use client';

import { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle, X } from 'lucide-react';
import type { CSVFileUploadProps } from '@/types/csv';

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB

export function CSVFileUpload({
  onFileSelect,
  loading = false,
  error = null,
  accept = '.csv,text/csv',
  maxSize = DEFAULT_MAX_SIZE,
}: CSVFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file type
      if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
        return 'Please select a CSV file';
      }

      // Check file size
      if (file.size > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
        return `File size exceeds ${maxSizeMB}MB limit`;
      }

      return null;
    },
    [maxSize]
  );

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setLocalError(validationError);
        setSelectedFile(null);
        return;
      }

      setLocalError(null);
      setSelectedFile(file);
      onFileSelect(file);
    },
    [validateFile, onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setLocalError(null);
  }, []);

  const displayError = error || localError;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10'
            : displayError
              ? 'border-rose-500/50 bg-rose-500/5'
              : 'border-slate-600 hover:border-slate-500 bg-slate-800/30'
        }`}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleFileInput}
          disabled={loading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400">Processing file...</p>
          </div>
        ) : selectedFile ? (
          <div className="flex flex-col items-center gap-3">
            <FileText className="w-12 h-12 text-indigo-400" />
            <div className="flex items-center gap-2">
              <p className="text-slate-200 font-medium">{selectedFile.name}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="p-1 hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <p className="text-slate-500 text-sm">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload
              className={`w-12 h-12 ${
                isDragging ? 'text-indigo-400' : 'text-slate-500'
              }`}
            />
            <div>
              <p className="text-slate-200 font-medium">
                Drop your CSV file here or click to browse
              </p>
              <p className="text-slate-500 text-sm mt-1">
                Supports Fidelity, Merrill Lynch, and Trade Tracker formats
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {displayError && (
        <div className="flex items-center gap-2 text-rose-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{displayError}</span>
        </div>
      )}

      {/* Supported formats info */}
      <div className="text-sm text-slate-500">
        <p className="font-medium text-slate-400 mb-2">Supported formats:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Fidelity Transactions (.csv)</li>
          <li>Merrill Lynch Transactions (.csv)</li>
          <li>Merrill Lynch Holdings (.csv)</li>
          <li>Trade Tracker custom format (.csv)</li>
        </ul>
      </div>
    </div>
  );
}

export default CSVFileUpload;
