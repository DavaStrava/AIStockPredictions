/**
 * StockDashboard Component
 *
 * Main dashboard for displaying either:
 * 1. Portfolio Intelligence Dashboard - when user has portfolios with holdings
 * 2. Stock Predictions Dashboard - traditional prediction cards for stock analysis
 *
 * Automatically detects portfolio presence and shows the appropriate view.
 */
'use client';

import { useState, useEffect } from 'react';
import {
  DashboardHeader,
  PredictionsGrid,
  DetailedAnalysisPanel,
  useTradingModal,
  usePredictions,
  useStockAnalysis,
  PortfolioIntelligenceDashboard,
} from './dashboard';
import MultiColumnLayout from './MultiColumnLayout';
import ResponsiveContainer from './ResponsiveContainer';
import AdditionalInsightsSidebar from './AdditionalInsightsSidebar';
import MarketIndicesSidebar from './MarketIndicesSidebar';
import MarketIndexAnalysis from './MarketIndexAnalysis';
import { TradeEntryModal } from './trading-journal/TradeEntryModal';
import { BarChart3, LineChart, ChevronDown } from 'lucide-react';
import { MarketIndex } from '@/types';

type DashboardView = 'portfolio' | 'predictions';

export default function StockDashboard() {
  // Dashboard view state
  const [view, setView] = useState<DashboardView>('portfolio');
  const [hasPortfolio, setHasPortfolio] = useState<boolean | null>(null);
  const [portfolioSummary, setPortfolioSummary] = useState<{
    dayChange: number;
    dayChangePercent: number;
    name: string;
  } | null>(null);
  const [marketIndices, setMarketIndices] = useState<MarketIndex[]>([]);
  const [showViewDropdown, setShowViewDropdown] = useState(false);

  // Check if user has portfolios on mount
  useEffect(() => {
    const checkPortfolios = async () => {
      try {
        const response = await fetch('/api/portfolios');
        const data = await response.json();

        if (data.success && data.data.portfolios?.length > 0) {
          setHasPortfolio(true);
          // Set view to portfolio if user has portfolios
          setView('portfolio');

          // Fetch portfolio summary for the default portfolio
          const defaultId = data.data.defaultPortfolioId || data.data.portfolios[0]?.id;
          if (defaultId) {
            const summaryResponse = await fetch(`/api/portfolios/${defaultId}/summary`);
            const summaryData = await summaryResponse.json();
            if (summaryData.success) {
              setPortfolioSummary({
                dayChange: summaryData.data.dayChange,
                dayChangePercent: summaryData.data.dayChangePercent,
                name: summaryData.data.portfolioName,
              });
            }
          }
        } else {
          setHasPortfolio(false);
          setView('predictions');
        }
      } catch (error) {
        console.error('Failed to check portfolios:', error);
        setHasPortfolio(false);
        setView('predictions');
      }
    };

    checkPortfolios();
  }, []);

  // Fetch market indices for both views
  useEffect(() => {
    const fetchIndices = async () => {
      try {
        const response = await fetch('/api/market-indices');
        const data = await response.json();
        if (data.success) {
          setMarketIndices(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch market indices:', error);
      }
    };

    fetchIndices();
    const interval = setInterval(fetchIndices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Trade entry modal state management
  const {
    isTradeModalOpen,
    tradeModalSymbol,
    tradeModalPredictionId,
    openTradeModal,
    closeTradeModal,
    handleTradeSubmit,
  } = useTradingModal();

  // Stock analysis hook for detailed analysis
  const {
    selectedStock,
    analysis,
    priceData,
    selectedIndex,
    fetchDetailedAnalysis,
    handleIndexClick,
    closeIndexAnalysis,
    clearAnalysis,
  } = useStockAnalysis();

  // Predictions hook with fetchDetailedAnalysis as the callback
  const {
    predictions,
    loading,
    searchLoading,
    handleStockSearch,
    removeTile: baseRemoveTile,
  } = usePredictions(fetchDetailedAnalysis);

  /**
   * Wrapper for removeTile that also clears analysis if the removed stock was selected.
   */
  const removeTile = (symbolToRemove: string) => {
    baseRemoveTile(symbolToRemove);
    if (selectedStock === symbolToRemove) {
      clearAnalysis();
    }
  };

  // Loading state - only show for initial portfolio check
  if (hasPortfolio === null) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading dashboard...</span>
      </div>
    );
  }

  // Predictions view loading
  if (view === 'predictions' && loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading predictions...</span>
      </div>
    );
  }

  // View toggle component - only show if user has portfolios (can switch between views)
  const ViewToggle = () => {
    if (!hasPortfolio) return null;

    return (
      <div className="relative mb-6">
        <button
          onClick={() => setShowViewDropdown(!showViewDropdown)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:border-slate-600/50 transition-colors"
        >
          {view === 'portfolio' ? (
            <>
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span className="text-slate-200 font-medium">Portfolio Intelligence</span>
            </>
          ) : (
            <>
              <LineChart className="w-4 h-4 text-blue-400" />
              <span className="text-slate-200 font-medium">Stock Predictions</span>
            </>
          )}
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>

        {showViewDropdown && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowViewDropdown(false)}
            />
            <div className="absolute top-full left-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50">
              <div className="p-2">
                <button
                  onClick={() => {
                    setView('portfolio');
                    setShowViewDropdown(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    view === 'portfolio'
                      ? 'bg-indigo-600/20 text-indigo-400'
                      : 'hover:bg-slate-700/50 text-slate-300'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <div className="text-left">
                    <p className="font-medium">Portfolio Intelligence</p>
                    <p className="text-xs text-slate-500">Your holdings & insights</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setView('predictions');
                    setShowViewDropdown(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    view === 'predictions'
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'hover:bg-slate-700/50 text-slate-300'
                  }`}
                >
                  <LineChart className="w-4 h-4" />
                  <div className="text-left">
                    <p className="font-medium">Stock Predictions</p>
                    <p className="text-xs text-slate-500">Technical analysis</p>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // Portfolio Intelligence Dashboard view
  if (view === 'portfolio') {
    return (
      <ResponsiveContainer variant="wide">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ViewToggle />
          <PortfolioIntelligenceDashboard
            marketIndices={marketIndices}
            onIndexClick={handleIndexClick}
            onNavigateToPortfolio={() => {
              // Navigate to portfolio tab via DOM - centralized here
              const portfolioTab = document.querySelector('[data-tab="portfolio"]');
              if (portfolioTab) (portfolioTab as HTMLElement).click();
            }}
          />
        </div>

        {/* Market Index Analysis Modal */}
        {selectedIndex && (
          <MarketIndexAnalysis
            symbol={selectedIndex}
            onClose={closeIndexAnalysis}
          />
        )}
      </ResponsiveContainer>
    );
  }

  // Stock Predictions Dashboard view (original)
  return (
    <ResponsiveContainer variant="wide">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ViewToggle />
      </div>
      <MultiColumnLayout
        leftColumn={
          analysis && selectedStock ? (
            <AdditionalInsightsSidebar
              symbol={selectedStock}
              analysis={analysis}
              priceData={priceData}
            />
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm p-4">
              Select a stock to view additional insights
            </p>
          )
        }
        centerColumn={
          <div className="space-y-8">
            {/* Header with search and quick actions */}
            <DashboardHeader
              onStockSearch={handleStockSearch}
              onQuickSelect={fetchDetailedAnalysis}
              searchLoading={searchLoading}
            />

            {/* Predictions grid */}
            <PredictionsGrid
              predictions={predictions}
              onSelectStock={fetchDetailedAnalysis}
              onRemoveStock={removeTile}
            />

            {/* Detailed analysis panel */}
            {analysis && analysis.summary && selectedStock && priceData.length > 0 && (
              <DetailedAnalysisPanel
                selectedStock={selectedStock}
                analysis={analysis}
                priceData={priceData}
                onClose={clearAnalysis}
                onLogTrade={openTradeModal}
              />
            )}
          </div>
        }
        rightColumn={
          <MarketIndicesSidebar
            onIndexClick={handleIndexClick}
            portfolioDayChange={portfolioSummary?.dayChange}
            portfolioDayChangePercent={portfolioSummary?.dayChangePercent}
            portfolioName={portfolioSummary?.name}
          />
        }
        sidebarWidth="medium"
      />

      {/* Market Index Analysis Modal */}
      {selectedIndex && (
        <MarketIndexAnalysis
          symbol={selectedIndex}
          onClose={closeIndexAnalysis}
        />
      )}

      {/* Trade Entry Modal */}
      <TradeEntryModal
        isOpen={isTradeModalOpen}
        onClose={closeTradeModal}
        onSubmit={handleTradeSubmit}
        prefillSymbol={tradeModalSymbol}
        prefillPredictionId={tradeModalPredictionId}
      />
    </ResponsiveContainer>
  );
}
