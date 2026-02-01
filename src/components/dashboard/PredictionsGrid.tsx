/**
 * PredictionsGrid Component
 *
 * Displays a responsive grid of prediction cards.
 */
'use client';

import { PredictionsGridProps } from '@/types/components';
import ResponsiveGrid from '../ResponsiveGrid';
import { PredictionCard } from './PredictionCard';

export function PredictionsGrid({
  predictions,
  onSelectStock,
  onRemoveStock,
  onLogTrade,
}: PredictionsGridProps) {
  return (
    <ResponsiveGrid
      columns={{
        mobile: 1,
        tablet: 2,
        desktop: 3,
        large: 4
      }}
      gap="gap-6"
      minItemWidth="320px"
    >
      {predictions.map((prediction) => (
        <PredictionCard
          key={prediction.symbol}
          prediction={prediction}
          onSelect={onSelectStock}
          onRemove={onRemoveStock}
          onLogTrade={onLogTrade}
        />
      ))}
    </ResponsiveGrid>
  );
}
