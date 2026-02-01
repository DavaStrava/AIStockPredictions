/**
 * ChartHeader Component
 *
 * Displays the chart title with stock symbol and data point count.
 */
'use client';

import { ChartHeaderProps } from '@/types/components';

export function ChartHeader({ symbol, dataPointCount }: ChartHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-lg font-semibold text-foreground">
        {symbol} Technical Analysis Charts
      </h3>
      <div className="text-sm text-gray-500">
        {dataPointCount} data points
      </div>
    </div>
  );
}
