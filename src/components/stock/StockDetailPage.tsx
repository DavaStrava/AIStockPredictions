/**
 * StockDetailPage Component
 *
 * Main client component for the stock detail page.
 * Orchestrates all sub-components and handles loading/error states.
 */

'use client';

import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useStockData } from './hooks/useStockData';
import { StockDetailSkeleton } from './StockDetailSkeleton';
import { StockHeader } from './StockHeader';
import { StockChart } from './StockChart';
import { StockMetricsSidebar } from './StockMetricsSidebar';
import type { StockDetailPageProps } from '@/types/stock';

export function StockDetailPage({ symbol }: StockDetailPageProps) {
  const {
    quote,
    priceHistory,
    marketStatus,
    loading,
    error,
    selectedRange,
    setSelectedRange,
  } = useStockData(symbol);

  // Loading state
  if (loading && !quote) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back link */}
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portfolio
          </Link>
          <StockDetailSkeleton />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back link */}
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portfolio
          </Link>

          {/* Error message */}
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-100 mb-2">
              Unable to Load Stock Data
            </h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
              <Link
                href="/portfolio"
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg transition-colors"
              >
                Return to Portfolio
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No data state (shouldn't happen if no error, but safety check)
  if (!quote) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portfolio
          </Link>
          <div className="text-center text-slate-400 py-12">
            No data available for {symbol}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portfolio
        </Link>

        {/* Header */}
        <StockHeader
          symbol={quote.symbol}
          companyName={quote.companyName}
          price={quote.price}
          change={quote.change}
          changePercent={quote.changePercent}
          marketStatus={marketStatus}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section (2/3 width on desktop) */}
          <div className="lg:col-span-2">
            <StockChart
              priceHistory={priceHistory}
              selectedRange={selectedRange}
              onRangeChange={setSelectedRange}
              loading={loading}
            />
          </div>

          {/* Metrics Sidebar (1/3 width on desktop) */}
          <div className="lg:col-span-1">
            <StockMetricsSidebar quote={quote} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default StockDetailPage;
