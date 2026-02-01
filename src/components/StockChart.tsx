/**
 * StockChart Component - Interactive Technical Analysis Visualization
 *
 * Refactored to use extracted chart components for better maintainability.
 * Features:
 * - Multiple chart types: Price, Volume, RSI, MACD, Bollinger Bands
 * - Interactive tab navigation
 * - Responsive design with Recharts
 */
'use client';

import { PriceData, TechnicalAnalysisResult } from '@/lib/technical-analysis/types';
import { useStockChartData } from './dashboard/hooks/useStockChartData';
import {
  ChartHeader,
  ChartTabNavigation,
  PriceChart,
  VolumeChart,
  RSIChart,
  MACDChart,
  BollingerChart,
  ChartHelpText,
} from './charts';

interface StockChartProps {
  symbol: string;
  priceData: PriceData[];
  analysis?: TechnicalAnalysisResult;
}

export default function StockChart({ symbol, priceData, analysis }: StockChartProps) {
  const {
    activeChart,
    setActiveChart,
    chartData,
    formatPrice,
    formatVolume,
    chartTabs,
  } = useStockChartData({ priceData, analysis });

  const chartProps = { chartData, formatPrice, formatVolume };

  const renderActiveChart = () => {
    switch (activeChart) {
      case 'price':
        return <PriceChart {...chartProps} />;
      case 'volume':
        return <VolumeChart {...chartProps} />;
      case 'rsi':
        return <RSIChart {...chartProps} />;
      case 'macd':
        return <MACDChart {...chartProps} />;
      case 'bollinger':
        return <BollingerChart {...chartProps} />;
      default:
        return <PriceChart {...chartProps} />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <ChartHeader symbol={symbol} dataPointCount={priceData.length} />

      <ChartTabNavigation
        tabs={chartTabs}
        activeTab={activeChart}
        onTabChange={setActiveChart}
      />

      <div className="h-[400px]">
        {renderActiveChart()}
      </div>

      <ChartHelpText activeChart={activeChart} />
    </div>
  );
}
