/**
 * StockChart Component - Interactive Technical Analysis Visualization
 * 
 * Features:
 * - Multiple chart types: Price, Volume, RSI, MACD, Bollinger Bands
 * - Interactive tab navigation
 * - Responsive design with Recharts
 * - Technical indicator overlays
 * 
 * Logic extracted to useStockChartData hook for data transformation and utilities.
 */
'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Area,
  AreaChart,
} from 'recharts';
import { PriceData, TechnicalAnalysisResult } from '@/lib/technical-analysis/types';
import { useStockChartData, StockChartType } from './dashboard/hooks/useStockChartData';

interface StockChartProps {
  symbol: string;
  priceData: PriceData[];
  analysis?: TechnicalAnalysisResult;
}

export default function StockChart({ symbol, priceData, analysis }: StockChartProps) {
  // Use custom hook for data transformation and state management
  const {
    activeChart,
    setActiveChart,
    chartData,
    formatPrice,
    formatVolume,
    chartTabs,
  } = useStockChartData({ priceData, analysis });

  // Price Chart: Shows stock price movement with moving averages
  const renderPriceChart = () => (
    // RESPONSIVE CONTAINER: Makes chart automatically resize with its container
    // This is a JavaScript comment because we're outside JSX elements here.
    // Inside the JSX below, we would use {/* JSX comment syntax */} instead.
    <ResponsiveContainer width="100%" height={400}>
      {/* 
        COMPOSED CHART: Allows combining different chart types (lines, bars, areas)
        
        COMMENT SYNTAX EXPLANATION:
        Notice how we use {/* */} for comments inside JSX elements. This is because
        we're now inside the JSX return statement, so we need JSX comment syntax.
        The curly braces {} tell React this is a JavaScript expression, and /* */
        is the JavaScript multi-line comment syntax.
      */}
      <ComposedChart data={chartData}>
        {/* GRID: Background grid lines for easier reading of values */}
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />

        {/* X-AXIS: Horizontal axis showing dates */}
        <XAxis
          dataKey="date"           // Which field from data to use for labels
          stroke="#6B7280"        // Color of axis line and labels
          fontSize={12}           // Text size for readability
        />

        {/* Y-AXIS: Vertical axis showing prices */}
        <YAxis
          stroke="#6B7280"        // Consistent color scheme
          fontSize={12}           // Consistent text size
          tickFormatter={formatPrice}  // Use our custom price formatter
        />
        {/* TOOLTIP: Interactive hover information */}
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',  // Dark background for better contrast
            border: '1px solid #374151', // Subtle border
            borderRadius: '6px',         // Rounded corners for modern look
            color: '#F9FAFB'            // Light text color
          }}
          formatter={(value: number, name: string) => [
            // CONDITIONAL FORMATTING: Different format for volume vs price data
            name === 'volume' ? formatVolume(value) : formatPrice(value),
            name  // Display name for the data series
          ]}
        />
        {/* LEGEND: Shows what each line/color represents */}
        <Legend />

        {/* 
          CANDLESTICK APPROXIMATION using Area Charts
          
          Traditional candlestick charts show OHLC data as "candles" but Recharts
          doesn't have built-in candlestick support, so we approximate it with areas.
          
          Financial Concept: High/Low Range
          - High line (green): Shows the highest price reached during each period
          - Low line (red): Shows the lowest price reached during each period
          - This gives traders a sense of price volatility and trading range
        */}
        <Area
          type="monotone"          // Smooth line interpolation
          dataKey="high"           // Use 'high' field from our chartData
          stroke="#10B981"         // Green color (traditionally bullish)
          fill="transparent"       // No fill, just the line
          strokeWidth={1}          // Thin line
          dot={false}             // No dots at data points (cleaner look)
        />
        <Area
          type="monotone"          // Smooth line interpolation
          dataKey="low"            // Use 'low' field from our chartData
          stroke="#EF4444"         // Red color (traditionally bearish)
          fill="transparent"       // No fill, just the line
          strokeWidth={1}          // Thin line
          dot={false}             // No dots at data points
        />

        {/* 
          MAIN PRICE LINE: The most important data series
          
          Financial Concept: Closing Price
          - The closing price is the final price at which a stock traded during regular hours
          - It's considered the most important price because it represents the final consensus
          - Technical analysis primarily focuses on closing prices for trend analysis
        */}
        <Line
          type="monotone"          // Smooth line interpolation
          dataKey="close"          // Use closing price from our data
          stroke="#3B82F6"         // Blue color (neutral, primary focus)
          strokeWidth={2}          // Thicker line to emphasize importance
          dot={false}             // No dots for cleaner appearance
          name="Close Price"       // Name for legend and tooltips
        />

        {/* 
          MOVING AVERAGES: Trend-following indicators
          
          Financial Concepts:
          - SMA 20: 20-day Simple Moving Average (short-term trend)
          - SMA 50: 50-day Simple Moving Average (medium-term trend)
          - When price is above MA: Generally bullish (uptrend)
          - When price is below MA: Generally bearish (downtrend)
          - MA crossovers: When shorter MA crosses above/below longer MA (trend change signals)
        */}
        <Line
          type="monotone"          // Smooth line interpolation
          dataKey="sma20"          // 20-day moving average data
          stroke="#F59E0B"         // Orange/amber color
          strokeWidth={1}          // Thinner than main price line
          dot={false}             // No dots
          name="SMA 20"           // Short name for legend
          strokeDasharray="5 5"   // Dashed line to distinguish from price
        />
        <Line
          type="monotone"          // Smooth line interpolation
          dataKey="sma50"          // 50-day moving average data
          stroke="#8B5CF6"         // Purple color
          strokeWidth={1}          // Thinner than main price line
          dot={false}             // No dots
          name="SMA 50"           // Short name for legend
          strokeDasharray="5 5"   // Dashed line pattern
        />
      </ComposedChart>
    </ResponsiveContainer>
  );

  /**
   * VOLUME CHART: Shows trading volume with price overlay
   * 
   * Financial Concept: Volume Analysis
   * - Volume represents the number of shares traded during each period
   * - High volume often confirms price movements (strong conviction)
   * - Low volume may indicate weak or unsustainable price moves
   * - Volume spikes often occur at significant price levels or news events
   * 
   * Chart Design: Dual-axis chart showing both volume (bars) and price (line)
   */
  const renderVolumeChart = () => (
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

  /**
   * RSI CHART: Relative Strength Index momentum oscillator
   * 
   * Financial Concept: RSI (Relative Strength Index)
   * - Momentum oscillator that measures the speed and change of price movements
   * - Scale: 0 to 100
   * - Above 70: Traditionally considered "overbought" (potential sell signal)
   * - Below 30: Traditionally considered "oversold" (potential buy signal)
   * - Around 50: Neutral momentum
   * 
   * Chart Features:
   * - Colored zones to highlight overbought/oversold areas
   * - Reference lines at 70 and 30 levels
   * - Fixed Y-axis domain (0-100) for consistent interpretation
   */
  const renderRSIChart = () => (
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

  /**
   * MACD CHART: Moving Average Convergence Divergence indicator
   * 
   * Financial Concept: MACD (Moving Average Convergence Divergence)
   * - Trend-following momentum indicator
   * - Three components:
   *   1. MACD Line: Fast EMA (12) - Slow EMA (26)
   *   2. Signal Line: 9-period EMA of MACD line
   *   3. Histogram: MACD line - Signal line
   * 
   * Trading Signals:
   * - Bullish: MACD line crosses above signal line
   * - Bearish: MACD line crosses below signal line
   * - Momentum: Histogram shows increasing/decreasing momentum
   * - Zero line: MACD above/below zero indicates overall trend direction
   */
  const renderMACDChart = () => (
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

  /**
   * BOLLINGER BANDS CHART: Volatility and mean reversion indicator
   * 
   * Financial Concept: Bollinger Bands
   * - Volatility indicator consisting of three lines:
   *   1. Upper Band: SMA + (2 × Standard Deviation)
   *   2. Middle Band: 20-period Simple Moving Average
   *   3. Lower Band: SMA - (2 × Standard Deviation)
   * 
   * Trading Concepts:
   * - Bands expand during high volatility periods
   * - Bands contract during low volatility (squeeze)
   * - Price tends to bounce between the bands (mean reversion)
   * - Price touching bands may indicate overbought/oversold conditions
   * - Breakouts through bands with volume may signal trend continuation
   */
  const renderBollingerChart = () => (
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

  // Render the active chart based on selected type
  const renderActiveChart = () => {
    switch (activeChart) {
      case 'price':
        return renderPriceChart();
      case 'volume':
        return renderVolumeChart();
      case 'rsi':
        return renderRSIChart();
      case 'macd':
        return renderMACDChart();
      case 'bollinger':
        return renderBollingerChart();
      default:
        return renderPriceChart();
    }
  };

  /**
   * MAIN COMPONENT RENDER
   * 
   * JSX Structure demonstrates several important React patterns:
   * 1. CONDITIONAL RENDERING: Different content based on state
   * 2. EVENT HANDLING: onClick handlers for user interaction
   * 3. DYNAMIC STYLING: CSS classes that change based on state
   * 4. COMPONENT COMPOSITION: Building complex UI from simple pieces
   * 5. RESPONSIVE DESIGN: Tailwind classes for mobile-first design
   */
  return (
    // CONTAINER: Card-style layout with dark mode support
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* HEADER: Chart title and data summary */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          {symbol} Technical Analysis Charts  {/* Dynamic title with stock symbol */}
        </h3>
        <div className="text-sm text-gray-500">
          {priceData.length} data points      {/* Show how much data we have */}
        </div>
      </div>

      {/* Tab navigation for chart type selection */}
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        {chartTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveChart(tab.id)}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeChart === tab.id
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dynamic chart rendering based on active selection */}
      <div className="h-[400px]">
        {renderActiveChart()}
      </div>

      {/* 
        CONTEXTUAL HELP SYSTEM
        
        UX Pattern: Context-sensitive help text
        - Shows different explanations based on which chart is active
        - Helps users understand what they're looking at
        - Educational component that teaches financial concepts
        - Conditional rendering based on activeChart state
      */}
      <div className="mt-4 text-xs text-gray-500 space-y-1">
        {activeChart === 'price' && (
          <p>Blue line: Close price | Orange dashed: 20-day SMA | Purple dashed: 50-day SMA</p>
        )}
        {activeChart === 'rsi' && (
          <p>RSI above 70 (red zone) indicates overbought, below 30 (green zone) indicates oversold</p>
        )}
        {activeChart === 'macd' && (
          <p>MACD crossover above signal line suggests bullish momentum, below suggests bearish</p>
        )}
        {activeChart === 'bollinger' && (
          <p>Price touching upper band may indicate overbought, touching lower band may indicate oversold</p>
        )}
      </div>
    </div>
  );
}