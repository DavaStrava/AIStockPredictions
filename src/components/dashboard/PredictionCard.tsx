/**
 * PredictionCard Component
 *
 * Displays a single stock prediction with direction indicator,
 * key metrics, and action buttons.
 */
'use client';

import { PredictionCardProps } from '@/types/components';
import { usePredictionStyles } from './hooks/usePredictionStyles';

export function PredictionCard({
  prediction,
  onSelect,
  onRemove,
  onLogTrade,
}: PredictionCardProps) {
  const { getDirectionColor, getDirectionBg } = usePredictionStyles();

  return (
    <div
      className={`relative border rounded-lg p-6 cursor-pointer transition-[transform,box-shadow] duration-200 ease-out hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-1 transform ${getDirectionBg(prediction.prediction.direction)}`}
      onClick={() => onSelect(prediction.symbol)}
    >
      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(prediction.symbol);
        }}
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-all duration-200 z-10 opacity-60 hover:opacity-100"
        title={`Remove ${prediction.symbol}`}
      >
        ✕
      </button>

      {/* Header with symbol and direction */}
      <div className="flex justify-between items-start mb-4 md:mb-6">
        <div className="space-responsive-compact">
          <h3 className="text-responsive-h4 text-foreground">{prediction.symbol}</h3>
          <p className="text-responsive-price-sm text-foreground">${prediction.currentPrice}</p>
        </div>
        <div className="text-right pr-8">
          <span className={`text-responsive-label font-semibold ${getDirectionColor(prediction.prediction.direction)}`}>
            {prediction.prediction.direction.toUpperCase()}
          </span>
          <p className="text-responsive-caption text-gray-500 mt-1">
            {Math.round(prediction.prediction.confidence * 100)}% confidence
          </p>
        </div>
      </div>

      {/* Key metrics */}
      <div className="space-responsive-compact mb-4 md:mb-6">
        <div className="flex justify-between text-responsive-body-sm">
          <span className="text-low-contrast">Target:</span>
          <span className="font-semibold text-high-contrast">${prediction.prediction.targetPrice}</span>
        </div>
        <div className="flex justify-between text-responsive-body-sm">
          <span className="text-low-contrast">Timeframe:</span>
          <span className="font-semibold text-high-contrast">{prediction.prediction.timeframe}</span>
        </div>
        <div className="flex justify-between text-responsive-body-sm">
          <span className="text-low-contrast">Volatility:</span>
          <span className="font-semibold text-high-contrast capitalize">{prediction.riskMetrics.volatility}</span>
        </div>
      </div>

      {/* Log Trade button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onLogTrade(prediction.symbol);
        }}
        className="w-full px-3 py-2 text-responsive-body-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        title={`Log a trade for ${prediction.symbol}`}
      >
        Log Trade
      </button>
    </div>
  );
}
