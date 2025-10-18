'use client';

import { TechnicalSignal } from '@/lib/technical-analysis/types';
import { 
  generateMultipleIndicatorExplanations,
  MarketContext,
  IndicatorExplanation
} from '@/lib/technical-analysis/explanations';

/**
 * Props for TechnicalIndicatorExplanations component
 */
interface TechnicalIndicatorExplanationsProps {
  indicators: TechnicalSignal[];
  symbol: string;
  currentPrice: number;
  marketContext?: MarketContext;
}

/**
 * Individual indicator card component - Compact version
 */
const IndicatorCard = ({ explanation }: { explanation: IndicatorExplanation }) => {
  const getRiskColorClasses = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  return (
    <div 
      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
      data-testid={`explanation-${explanation.indicator.toLowerCase()}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
            {explanation.indicator}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
              {explanation.value.toFixed(2)}
            </span>
            <span 
              className={`px-1.5 py-0.5 rounded text-xs font-medium ${getRiskColorClasses(explanation.riskLevel)}`}
              data-testid={`risk-${explanation.indicator.toLowerCase()}`}
            >
              {explanation.riskLevel}
            </span>
          </div>
        </div>
      </div>
      
      <p 
        className="text-xs text-gray-700 dark:text-gray-300 mb-2 leading-relaxed line-clamp-2"
        data-testid={`explanation-text-${explanation.indicator.toLowerCase()}`}
        title={explanation.explanation}
      >
        {explanation.explanation}
      </p>
      
      <p 
        className="text-xs text-blue-700 dark:text-blue-300 font-medium flex items-start gap-1.5 line-clamp-2"
        data-testid={`insight-${explanation.indicator.toLowerCase()}`}
        title={explanation.actionableInsight}
      >
        <span className="text-sm flex-shrink-0">💡</span>
        <span className="flex-1 min-w-0">{explanation.actionableInsight}</span>
      </p>
    </div>
  );
};

/**
 * TechnicalIndicatorExplanations Component
 * 
 * Displays contextual explanations for technical indicators with:
 * - Plain language explanations tailored to current market conditions
 * - Actionable insights and recommendations
 * - Visual risk level indicators
 * - Support for novice investors learning technical analysis
 */
export default function TechnicalIndicatorExplanations({
  indicators,
  symbol,
  currentPrice,
  marketContext
}: TechnicalIndicatorExplanationsProps) {
  
  /**
   * Generate all explanations using the enhanced explanation generation logic
   */
  const generateExplanations = () => {
    if (!indicators || indicators.length === 0) {
      return { explanations: [], conflicts: [], overallSentiment: 'neutral' as const };
    }

    return generateMultipleIndicatorExplanations(
      indicators,
      symbol,
      currentPrice,
      marketContext
    );
  };

  const { explanations, conflicts, overallSentiment } = generateExplanations();

  const getSentimentColorClasses = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'bearish':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'neutral':
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div data-testid="technical-indicator-explanations" className="space-y-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {symbol} Technical Indicators
        </h3>
        {explanations.length > 0 && (
          <span 
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${getSentimentColorClasses(overallSentiment)}`}
            data-testid="overall-sentiment"
          >
            {overallSentiment}
          </span>
        )}
      </div>

      {/* Display conflicts if any */}
      {conflicts.length > 0 && (
        <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-lg flex-shrink-0">⚠️</span>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 text-sm mb-1">
                Mixed Signals
              </h4>
              {conflicts.map((conflict, index) => (
                <p key={index} className="text-yellow-700 dark:text-yellow-300 text-xs leading-relaxed">
                  {conflict}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {explanations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {explanations.map((explanation, index) => (
            <IndicatorCard key={index} explanation={explanation} />
          ))}
        </div>
      ) : (
        <p 
          data-testid="no-indicators"
          className="text-gray-500 dark:text-gray-400 text-center py-8"
        >
          No technical indicators available
        </p>
      )}
    </div>
  );
}