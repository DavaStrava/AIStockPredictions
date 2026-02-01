/**
 * BollingerChart Component
 *
 * Bollinger Bands volatility and mean reversion indicator chart.
 * Shows upper/lower bands, middle line (SMA), and price.
 *
 * Memoized to prevent re-renders when parent state changes
 * but chart data remains the same.
 */
'use client';

import { memo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Area,
  Line,
} from 'recharts';
import { ChartComponentProps } from '@/types/components';

export const BollingerChart = memo(function BollingerChart({ chartData, formatPrice }: ChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis
          dataKey="date"
          stroke="#6B7280"
          fontSize={12}
        />
        <YAxis
          stroke="#6B7280"
          fontSize={12}
          tickFormatter={formatPrice}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '6px',
            color: '#F9FAFB'
          }}
          formatter={(value: number) => [formatPrice(value), 'Price']}
        />
        <Legend />

        {/* Bollinger Bands area */}
        <Area
          type="monotone"
          dataKey="bbUpper"
          stroke="#8B5CF6"
          fill="#8B5CF6"
          fillOpacity={0.1}
          name="Upper Band"
        />
        <Area
          type="monotone"
          dataKey="bbLower"
          stroke="#8B5CF6"
          fill="transparent"
          name="Lower Band"
        />

        {/* Middle line and price */}
        <Line
          type="monotone"
          dataKey="bbMiddle"
          stroke="#F59E0B"
          strokeWidth={1}
          strokeDasharray="3 3"
          dot={false}
          name="Middle (SMA 20)"
        />
        <Line
          type="monotone"
          dataKey="close"
          stroke="#3B82F6"
          strokeWidth={2}
          dot={false}
          name="Close Price"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});
