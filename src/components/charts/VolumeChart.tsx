/**
 * VolumeChart Component
 *
 * Shows trading volume with price overlay on dual axes.
 *
 * Memoized to prevent re-renders when parent state changes
 * but chart data remains the same.
 */
'use client';

import { memo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Line,
} from 'recharts';
import { ChartComponentProps } from '@/types/components';

export const VolumeChart = memo(function VolumeChart({ chartData, formatPrice, formatVolume }: ChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis
          dataKey="date"
          stroke="#6B7280"
          fontSize={12}
        />
        <YAxis
          stroke="#6B7280"
          fontSize={12}
          tickFormatter={formatVolume}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '6px',
            color: '#F9FAFB'
          }}
          formatter={(value: number) => [formatVolume(value), 'Volume']}
        />
        <Bar
          dataKey="volume"
          fill="#6366F1"
          opacity={0.7}
          name="Volume"
        />
        <Line
          type="monotone"
          dataKey="close"
          stroke="#3B82F6"
          strokeWidth={1}
          dot={false}
          name="Price"
          yAxisId="price"
        />
        <YAxis
          yAxisId="price"
          orientation="right"
          stroke="#6B7280"
          fontSize={12}
          tickFormatter={formatPrice}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
});
