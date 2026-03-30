'use client';

/**
 * PortfolioIntelligenceDashboard Component
 *
 * Main dashboard view that displays portfolio-centric insights including:
 * - Portfolio summary statistics
 * - Top movers (gainers/losers)
 * - Performance chart with S&P 500 benchmark
 * - Sector allocation
 * - AI-powered insights
 * - Holdings preview
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDown, RefreshCw, Briefcase, Plus } from 'lucide-react';
import { usePortfolio } from '@/components/portfolio/hooks/usePortfolio';
import { PortfolioSummaryCard } from '@/components/portfolio/PortfolioSummaryCard';
import { TopMoversCard } from './TopMoversCard';
import { CompactPerformanceChart } from './CompactPerformanceChart';
import { PortfolioHoldingsPreview } from './PortfolioHoldingsPreview';
import { CompactAllocationView } from './CompactAllocationView';
import { PortfolioInsightsCard } from './PortfolioInsightsCard';
import { MarketIndex } from '@/types';

interface PortfolioIntelligenceDashboardProps {
  /** Market indices data for comparison */
  marketIndices?: MarketIndex[];
  /** Callback when an index is clicked */
  onIndexClick?: (symbol: string) => void;
  /** Callback to navigate to portfolio tab */
  onNavigateToPortfolio?: () => void;
}

export function PortfolioIntelligenceDashboard({
  marketIndices = [],
  onIndexClick,
  onNavigateToPortfolio,
}: PortfolioIntelligenceDashboardProps) {
  const {
    portfolios,
    selectedPortfolio,
    selectedPortfolioId,
    summary,
    holdings,
    allocation,
    history,
    loading,
    error,
    selectPortfolio,
    fetchHistory,
    refreshPortfolioData,
    clearError,
  } = usePortfolio({ autoFetch: true, refreshInterval: 60000 });

  const [showPortfolioDropdown, setShowPortfolioDropdown] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Track which portfolio's history has been loaded
  const historyLoadedForRef = useRef<string | null>(null);

  // Lazy-load 90-day history when portfolio is selected
  useEffect(() => {
    if (selectedPortfolioId && historyLoadedForRef.current !== selectedPortfolioId) {
      historyLoadedForRef.current = selectedPortfolioId;
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      fetchHistory(selectedPortfolioId, startDate, endDate);
    }
  }, [selectedPortfolioId, fetchHistory]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPortfolioDropdown(false);
      }
    };

    if (showPortfolioDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPortfolioDropdown]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshPortfolioData();
      // Also refresh history
      if (selectedPortfolioId) {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        await fetchHistory(selectedPortfolioId, startDate, endDate);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshPortfolioData, selectedPortfolioId, fetchHistory]);

  // Get top movers from holdings
  const topMovers = {
    gainers: [...holdings]
      .filter(h => h.dayChangePercent > 0)
      .sort((a, b) => b.dayChangePercent - a.dayChangePercent)
      .slice(0, 5),
    losers: [...holdings]
      .filter(h => h.dayChangePercent < 0)
      .sort((a, b) => a.dayChangePercent - b.dayChangePercent)
      .slice(0, 5),
  };

  // No portfolio selected - show empty state
  if (!selectedPortfolioId && !loading && portfolios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 text-center max-w-md">
          <Briefcase className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-100 mb-2">
            No Portfolio Found
          </h2>
          <p className="text-slate-400 mb-6">
            Create your first portfolio to start tracking your investments and get personalized insights.
          </p>
          {onNavigateToPortfolio && (
            <button
              onClick={onNavigateToPortfolio}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Portfolio
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-100">Portfolio Intelligence</h1>

          {/* Portfolio Selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowPortfolioDropdown(!showPortfolioDropdown)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:border-slate-600/50 transition-colors text-sm"
            >
              <Briefcase className="w-4 h-4 text-indigo-400" />
              <span className="text-slate-200 font-medium">
                {selectedPortfolio?.name || 'Select Portfolio'}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {showPortfolioDropdown && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50">
                <div className="p-2">
                  {portfolios.map((portfolio) => (
                    <button
                      key={portfolio.id}
                      onClick={() => {
                        selectPortfolio(portfolio.id);
                        setShowPortfolioDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                        portfolio.id === selectedPortfolioId
                          ? 'bg-indigo-600/20 text-indigo-400'
                          : 'hover:bg-slate-700/50 text-slate-300'
                      }`}
                    >
                      <span className="font-medium">{portfolio.name}</span>
                      {portfolio.isDefault && (
                        <span className="text-xs text-slate-500">Default</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:border-slate-600/50 transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          <span className="text-slate-300 text-sm">Refresh</span>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-rose-900/30 border border-rose-800 rounded-xl flex items-center justify-between">
          <p className="text-rose-400">{error}</p>
          <button
            onClick={clearError}
            className="text-rose-400 hover:text-rose-300 text-xl"
          >
            ×
          </button>
        </div>
      )}

      {/* Portfolio Summary Cards */}
      <PortfolioSummaryCard summary={summary} loading={loading} />

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <CompactPerformanceChart
          data={history}
          loading={loading}
        />

        {/* Top Movers */}
        <TopMoversCard
          gainers={topMovers.gainers}
          losers={topMovers.losers}
          loading={loading}
        />
      </div>

      {/* Secondary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Allocation */}
        <CompactAllocationView
          allocation={allocation}
          loading={loading}
        />

        {/* AI Insights */}
        {selectedPortfolioId && (
          <PortfolioInsightsCard
            portfolioId={selectedPortfolioId}
            summary={summary}
            holdings={holdings}
            allocation={allocation}
            marketIndices={marketIndices}
          />
        )}
      </div>

      {/* Holdings Preview */}
      <PortfolioHoldingsPreview
        holdings={holdings}
        loading={loading}
        onViewAllClick={onNavigateToPortfolio}
      />
    </div>
  );
}

export default PortfolioIntelligenceDashboard;
