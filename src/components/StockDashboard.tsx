/**
 * StockDashboard Component
 *
 * Main dashboard for displaying stock predictions and detailed analysis.
 * Refactored to use extracted components and hooks for better maintainability.
 */
'use client';

import {
  DashboardHeader,
  PredictionsGrid,
  DetailedAnalysisPanel,
  useTradingModal,
  usePredictions,
  useStockAnalysis,
} from './dashboard';
import MultiColumnLayout from './MultiColumnLayout';
import ResponsiveContainer from './ResponsiveContainer';
import AdditionalInsightsSidebar from './AdditionalInsightsSidebar';
import MarketIndicesSidebar from './MarketIndicesSidebar';
import MarketIndexAnalysis from './MarketIndexAnalysis';
import { TradeEntryModal } from './trading-journal/TradeEntryModal';

export default function StockDashboard() {
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

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading predictions...</span>
      </div>
    );
  }

  return (
    <ResponsiveContainer variant="wide">
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
              onLogTrade={openTradeModal}
            />

            {/* Detailed analysis panel */}
            {analysis && analysis.summary && selectedStock && priceData.length > 0 && (
              <DetailedAnalysisPanel
                selectedStock={selectedStock}
                analysis={analysis}
                priceData={priceData}
                onClose={clearAnalysis}
              />
            )}
          </div>
        }
        rightColumn={<MarketIndicesSidebar onIndexClick={handleIndexClick} />}
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
