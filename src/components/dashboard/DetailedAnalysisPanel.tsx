/**
 * DetailedAnalysisPanel Component
 *
 * Displays comprehensive stock analysis with multiple collapsible sections
 * containing charts, metrics, and AI insights.
 */
'use client';

import { DetailedAnalysisPanelProps } from '@/types/components';
import { useIndicatorFiltering } from './hooks/useIndicatorFiltering';
import { inferMarketContext } from '@/lib/technical-analysis/explanations';
import AdvancedStockChart from '../AdvancedStockChart';
import PerformanceMetrics from '../PerformanceMetrics';
import AIInsights from '../AIInsights';
import CollapsibleSection from '../CollapsibleSection';
import TechnicalIndicatorExplanations from '../TechnicalIndicatorExplanations';

export function DetailedAnalysisPanel({
  selectedStock,
  analysis,
  priceData,
  onClose,
  onLogTrade,
}: DetailedAnalysisPanelProps) {
  const { getLatestSignals } = useIndicatorFiltering();

  return (
    <div className="space-responsive-section">
      {/* Header with close button */}
      <div className="flex justify-between items-center">
        <h3 className="hierarchy-critical">
          Detailed Analysis: {selectedStock}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-lg"
        >
          ✕
        </button>
      </div>

      {/* Performance Metrics */}
      <CollapsibleSection
        title="Performance Metrics"
        subtitle="Risk analysis, volatility, and key performance indicators"
        icon="📊"
        defaultExpanded={true}
      >
        <PerformanceMetrics symbol={selectedStock} priceData={priceData} />
      </CollapsibleSection>

      {/* Advanced Interactive Charts */}
      <CollapsibleSection
        title="Advanced Chart Analysis"
        subtitle="Interactive charts with 5-year historical data and technical indicators"
        icon="📈"
        defaultExpanded={true}
      >
        <AdvancedStockChart symbol={selectedStock} priceData={priceData} analysis={analysis} />
      </CollapsibleSection>

      {/* AI-Powered Insights */}
      <CollapsibleSection
        title="AI-Powered Insights"
        subtitle="Technical, portfolio, and sentiment analysis powered by AI"
        icon="🤖"
        defaultExpanded={false}
      >
        <AIInsights symbol={selectedStock} analysis={analysis} />
      </CollapsibleSection>

      {/* Technical Indicators */}
      <CollapsibleSection
        title="Technical Indicators"
        subtitle="Plain-language explanations with actionable insights"
        icon="📊"
        defaultExpanded={true}
      >
        <TechnicalIndicatorExplanations
          indicators={getLatestSignals(analysis.signals)}
          symbol={selectedStock}
          currentPrice={priceData[priceData.length - 1]?.close || 0}
          marketContext={inferMarketContext(
            selectedStock,
            undefined,
            undefined,
            priceData.map(p => ({ close: p.close, date: new Date(p.date) }))
          )}
        />
      </CollapsibleSection>

      {/* Log Trade Action Button */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => onLogTrade(selectedStock)}
          className="w-full px-4 py-3 text-responsive-body font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          title={`Log a trade for ${selectedStock}`}
        >
          <span>📝</span>
          Log Trade for {selectedStock}
        </button>
      </div>
    </div>
  );
}
