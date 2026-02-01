/**
 * DashboardHeader Component
 *
 * Header section with title, stock search, and quick action buttons.
 */
'use client';

import { DashboardHeaderProps } from '@/types/components';
import StockSearch from '../StockSearch';

const POPULAR_STOCKS = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'AMZN', 'META'];

export function DashboardHeader({
  onStockSearch,
  onQuickSelect,
  searchLoading,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="hierarchy-critical">Stock Predictions</h2>
          <p className="hierarchy-tertiary mt-1">
            AI-powered technical analysis with real market data
          </p>
        </div>

        {/* Stock search with loading indicator */}
        <div className="w-full sm:w-96 relative">
          <StockSearch
            onSelectStock={onStockSearch}
            placeholder="Search any stock (e.g., Apple, TSLA, Microsoft...)"
          />
          {searchLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      </div>

      {/* Quick action buttons */}
      <div className="flex flex-wrap gap-2">
        <span className="text-responsive-label text-gray-600 dark:text-gray-400">Popular:</span>
        {POPULAR_STOCKS.map((symbol) => (
          <button
            key={symbol}
            onClick={() => onQuickSelect(symbol)}
            className="px-3 py-1 text-responsive-badge bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {symbol}
          </button>
        ))}
      </div>
    </div>
  );
}
