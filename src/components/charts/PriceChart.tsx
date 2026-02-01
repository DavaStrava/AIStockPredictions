/**
 * PriceChart Component
 *
 * Displays stock price movement with moving averages.
 * Features high/low range areas and SMA overlays.
 */
'use client';

import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Area,
  Line,
} from 'recharts';
import { ChartComponentProps } from '@/types/components';

export function PriceChart({ chartData, formatPrice }: ChartComponentProps) {
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
          tickFormatter={formatPrice}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '6px',
            color: '#F9FAFB'
          }}
          formatter={(value: number, name: string) => [
            name === 'volume' ? `${value}` : formatPrice(value),
            name
          ]}
        />
        <Legend />

        {/* High/Low range areas */}
        <Area
          type="monotone"
          dataKey="high"
          stroke="#10B981"
          fill="transparent"
          strokeWidth={1}
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="low"
          stroke="#EF4444"
          fill="transparent"
          strokeWidth={1}
          dot={false}
        />

        {/* Main price line */}
        <Line
          type="monotone"
          dataKey="close"
          stroke="#3B82F6"
          strokeWidth={2}
          dot={false}
          name="Close Price"
        />

        {/* Moving averages */}
        <Line
          type="monotone"
          dataKey="sma20"
          stroke="#F59E0B"
          strokeWidth={1}
          dot={false}
          name="SMA 20"
          strokeDasharray="5 5"
        />
        <Line
          type="monotone"
          dataKey="sma50"
          stroke="#8B5CF6"
          strokeWidth={1}
          dot={false}
          name="SMA 50"
          strokeDasharray="5 5"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
