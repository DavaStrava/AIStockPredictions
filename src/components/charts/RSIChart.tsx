/**
 * RSIChart Component
 *
 * Relative Strength Index momentum oscillator chart.
 * Features overbought/oversold zones and reference lines.
 *
 * Memoized to prevent re-renders when parent state changes
 * but chart data remains the same.
 */
'use client';

import { memo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  Line,
} from 'recharts';
import { ChartComponentProps } from '@/types/components';

export const RSIChart = memo(function RSIChart({ chartData }: ChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis
          dataKey="date"
          stroke="#6B7280"
          fontSize={12}
        />
        <YAxis
          domain={[0, 100]}
          stroke="#6B7280"
          fontSize={12}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '6px',
            color: '#F9FAFB'
          }}
        />

        {/* RSI overbought/oversold zones */}
        <Area
          type="monotone"
          dataKey={() => 70}
          stroke="transparent"
          fill="#EF4444"
          fillOpacity={0.1}
        />
        <Area
          type="monotone"
          dataKey={() => 30}
          stroke="transparent"
          fill="#10B981"
          fillOpacity={0.1}
        />

        {/* RSI line */}
        <Line
          type="monotone"
          dataKey="rsi"
          stroke="#F59E0B"
          strokeWidth={2}
          dot={false}
          name="RSI"
        />

        {/* Reference lines */}
        <Line
          type="monotone"
          dataKey={() => 70}
          stroke="#EF4444"
          strokeWidth={1}
          strokeDasharray="3 3"
          dot={false}
          name="Overbought (70)"
        />
        <Line
          type="monotone"
          dataKey={() => 30}
          stroke="#10B981"
          strokeWidth={1}
          strokeDasharray="3 3"
          dot={false}
          name="Oversold (30)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
});
