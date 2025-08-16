'use client';

import { useState, useRef, useEffect } from 'react';
import { getTermDefinition, TermDefinition } from '@/lib/knowledge/definitions';

interface TermProps {
  children: string;
  term?: string; // Optional override for the term to look up
  className?: string;
}

export default function Term({ children, term, className = '' }: TermProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [definition, setDefinition] = useState<TermDefinition | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<HTMLSpanElement>(null);

  const lookupTerm = term || children;

  useEffect(() => {
    const def = getTermDefinition(lookupTerm);
    setDefinition(def);
  }, [lookupTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node) &&
          termRef.current && !termRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTooltip]);

  if (!definition) {
    // If no definition found, render as normal text
    return <span className={className}>{children}</span>;
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical': return 'border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300';
      case 'portfolio': return 'border-green-200 dark:border-green-800 text-green-700 dark:text-green-300';
      case 'fundamental': return 'border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300';
      default: return 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <span className="relative inline-block">
      <span
        ref={termRef}
        className={`
          cursor-help underline decoration-dotted decoration-2 underline-offset-2
          ${getCategoryColor(definition.category)}
          hover:bg-opacity-10 hover:bg-current rounded px-1 py-0.5 transition-colors
          ${className}
        `}
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setTimeout(() => setShowTooltip(false), 300)}
      >
        {children}
      </span>

      {showTooltip && (
        <div
          ref={tooltipRef}
          className="absolute z-50 w-80 p-4 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            top: '100%'
          }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{definition.icon}</span>
              <h4 className="font-semibold text-foreground text-sm">{definition.term}</h4>
            </div>
            <span className={`
              px-2 py-1 text-xs rounded-full font-medium
              ${definition.category === 'technical' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                definition.category === 'portfolio' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                definition.category === 'fundamental' ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' :
                'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'}
            `}>
              {definition.category}
            </span>
          </div>

          {/* Short Definition */}
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
            {definition.shortDefinition}
          </p>

          {/* Interpretation */}
          <div className="mb-3">
            <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Interpretation:</h5>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              {definition.interpretation}
            </p>
          </div>

          {/* Example */}
          <div className="mb-3">
            <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Example:</h5>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed italic">
              {definition.example}
            </p>
          </div>

          {/* Related Terms */}
          {definition.relatedTerms.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Related:</h5>
              <div className="flex flex-wrap gap-1">
                {definition.relatedTerms.slice(0, 3).map((relatedTerm) => (
                  <span
                    key={relatedTerm}
                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                  >
                    {relatedTerm}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Click for more indicator */}
          <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-500 text-center">
              Click term for detailed explanation
            </p>
          </div>
        </div>
      )}
    </span>
  );
}

// Convenience component for common terms
export const RSI = ({ children = 'RSI' }: { children?: string }) => (
  <Term term="RSI">{children}</Term>
);

export const MACD = ({ children = 'MACD' }: { children?: string }) => (
  <Term term="MACD">{children}</Term>
);

export const BollingerBands = ({ children = 'Bollinger Bands' }: { children?: string }) => (
  <Term term="Bollinger Bands">{children}</Term>
);

export const Beta = ({ children = 'Beta' }: { children?: string }) => (
  <Term term="Beta">{children}</Term>
);

export const Alpha = ({ children = 'Alpha' }: { children?: string }) => (
  <Term term="Alpha">{children}</Term>
);

export const SharpeRatio = ({ children = 'Sharpe Ratio' }: { children?: string }) => (
  <Term term="Sharpe Ratio">{children}</Term>
);