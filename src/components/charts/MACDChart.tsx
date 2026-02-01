/**
 * MACDChart Component
 *
 * Moving Average Convergence Divergence indicator chart.
 * Shows MACD line, signal line, and histogram.
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
  Bar,
  Line,
} from 'recharts';
import { ChartComponentProps } from '@/types/components';

export function MACDChart({ chartData }: ChartComponentProps) {
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
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '6px',
            color: '#F9FAFB'
          }}
        />
        <Legend />

        {/* MACD Histogram */}
        <Bar
          dataKey="macdHistogram"
          fill="#6366F1"
          opacity={0.6}
          name="MACD Histogram"
        />

        {/* MACD Lines */}
        <Line
          type="monotone"
          dataKey="macd"
          stroke="#3B82F6"
          strokeWidth={2}
          dot={false}
          name="MACD"
        />
        <Line
          type="monotone"
          dataKey="macdSignal"
          stroke="#EF4444"
          strokeWidth={2}
          dot={false}
          name="Signal"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
