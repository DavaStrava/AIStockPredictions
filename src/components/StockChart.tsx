/**
 * StockChart Component - Interactive Technical Analysis Visualization
 * 
 * This component demonstrates several important React and data visualization concepts:
 * 
 * 1. CLIENT-SIDE RENDERING: The 'use client' directive tells Next.js this component
 *    needs to run in the browser (not server-side) because it uses interactive features
 *    like state management and event handlers.
 * 
 * 2. CHARTING LIBRARY INTEGRATION: Uses Recharts, a popular React charting library
 *    that provides composable chart components. Recharts is built specifically for React
 *    and follows React patterns (components, props, etc.).
 * 
 * 3. FINANCIAL DATA VISUALIZATION: Displays multiple types of financial charts
 *    commonly used in technical analysis - price charts, volume, RSI, MACD, etc.
 * 
 * 4. STATE MANAGEMENT: Uses React's useState hook to manage which chart type
 *    is currently active, demonstrating controlled components pattern.
 * 
 * 5. DATA TRANSFORMATION: Converts raw financial data into chart-friendly format,
 *    showing how to prepare data for visualization libraries.
 */
'use client';

import { useState } from 'react';
import {
  LineChart,        // Simple line chart for trends
  Line,            // Individual line series within charts
  XAxis,           // Horizontal axis (typically time/dates)
  YAxis,           // Vertical axis (typically prices/values)
  CartesianGrid,   // Background grid lines for easier reading
  Tooltip,         // Interactive hover information
  Legend,          // Chart legend explaining what each line represents
  ResponsiveContainer, // Makes charts responsive to container size
  ComposedChart,   // Allows combining different chart types (lines + bars)
  Bar,             // Bar chart elements (used for volume, histograms)
  Area,            // Filled area charts (used for zones, bands)
  AreaChart,       // Chart type specifically for area visualizations
} from 'recharts';
import { format } from 'date-fns'; // Library for formatting dates in a readable way
import { PriceData, TechnicalAnalysisResult } from '@/lib/technical-analysis/types';

/**
 * TYPESCRIPT INTERFACES: Define the "contract" for what data this component expects
 * 
 * Props Interface Pattern:
 * - Clearly defines what data the component needs to function
 * - Makes the component self-documenting and type-safe
 * - Helps catch errors at compile time rather than runtime
 */
interface StockChartProps {
  symbol: string;                           // Stock ticker symbol (e.g., "AAPL", "GOOGL")
  priceData: PriceData[];                  // Array of historical price data (OHLCV format)
  analysis?: TechnicalAnalysisResult;      // Optional technical analysis results (indicators, signals)
}

/**
 * UNION TYPES: Restricts values to specific strings, preventing typos and invalid states
 * 
 * This pattern is better than using plain strings because:
 * - TypeScript will catch typos at compile time
 * - IDE provides autocomplete for valid values
 * - Makes the code more maintainable and self-documenting
 */
type ChartType = 'price' | 'volume' | 'rsi' | 'macd' | 'bollinger';

export default function StockChart({ symbol, priceData, analysis }: StockChartProps) {
  /**
   * STATE MANAGEMENT with React Hooks
   * 
   * useState Hook Pattern:
   * - Manages component's internal state (which chart is currently displayed)
   * - Returns [currentValue, setterFunction] array (destructured here)
   * - Type parameter <ChartType> ensures only valid chart types can be set
   * - Initial state is 'price' - shows price chart by default
   * 
   * This is the "controlled component" pattern - the component controls its own state
   */
  const [activeChart, setActiveChart] = useState<ChartType>('price');

  /**
   * DATA TRANSFORMATION for Chart Libraries
   * 
   * Problem: Raw financial data isn't in the format that Recharts expects
   * Solution: Transform the data into a chart-friendly structure
   * 
   * Key Concepts:
   * 1. ARRAY.MAP(): Creates a new array by transforming each element
   * 2. DATA ALIGNMENT: Matches technical indicators with corresponding price data by index
   * 3. DATE FORMATTING: Converts Date objects to readable strings for chart labels
   * 4. OPTIONAL CHAINING (?.): Safely accesses properties that might not exist
   * 
   * REACT PATTERN: Data Processing in Components
   * This transformation happens every time the component re-renders. In a production
   * app, you might want to memoize this with useMemo() to avoid recalculating
   * the same data on every render, especially with large datasets.
   * 
   * Example: const chartData = useMemo(() => priceData.map(...), [priceData, analysis]);
   */
  const chartData = priceData.map((data, index) => {
    // OPTIONAL CHAINING (?.) - Safely access nested properties that might not exist
    // If analysis is undefined, or indicators is undefined, or rsi is undefined, 
    // the expression returns undefined instead of throwing an error
    const rsi = analysis?.indicators.rsi?.[index];
    const macd = analysis?.indicators.macd?.[index];
    const bb = analysis?.indicators.bollingerBands?.[index];

    // ARRAY.FIND() - Search for specific moving averages by period and date
    // This demonstrates how to match data points across different arrays
    // getTime() converts Date objects to timestamps for accurate comparison
    const sma20 = analysis?.indicators.sma?.find(sma => sma.period === 20 && sma.date.getTime() === data.date.getTime());
    const sma50 = analysis?.indicators.sma?.find(sma => sma.period === 50 && sma.date.getTime() === data.date.getTime());

    /**
     * OBJECT CREATION for Chart Data
     * 
     * Creates a unified data object that Recharts can use to render all chart types.
     * Each object represents one time period (usually one day) with all available data.
     * 
     * Key Patterns:
     * - CONSISTENT NAMING: Property names match what we'll reference in chart components
     * - DATE FORMATTING: Human-readable dates for chart labels using date-fns library
     * - OPTIONAL VALUES: Use optional chaining to handle missing indicator data gracefully
     * - FLAT STRUCTURE: All data at the same level makes it easy for charts to access
     */
    return {
      // FORMATTED DATE: 'MMM dd' creates labels like "Jan 15", "Feb 03"
      date: format(data.date, 'MMM dd'),
      fullDate: data.date,              // Keep original date for tooltips/calculations

      // OHLCV DATA: Core price and volume information
      open: data.open,                  // Opening price
      high: data.high,                  // Highest price of the period
      low: data.low,                    // Lowest price of the period
      close: data.close,                // Closing price (most important for analysis)
      volume: data.volume,              // Number of shares traded

      // TECHNICAL INDICATORS: Extract values from analysis results
      rsi: rsi?.value,                  // RSI oscillator value (0-100)
      macd: macd?.macd,                 // MACD line value
      macdSignal: macd?.signal,         // MACD signal line value
      macdHistogram: macd?.histogram,   // MACD histogram (difference between MACD and signal)

      // BOLLINGER BANDS: Volatility indicator with three lines
      bbUpper: bb?.upper,               // Upper band (price + 2 standard deviations)
      bbMiddle: bb?.middle,             // Middle band (simple moving average)
      bbLower: bb?.lower,               // Lower band (price - 2 standard deviations)

      // MOVING AVERAGES: Trend-following indicators
      sma20: sma20?.value,              // 20-period simple moving average
      sma50: sma50?.value,              // 50-period simple moving average
    };
  });

  /**
   * UTILITY FUNCTIONS for Data Formatting
   * 
   * These functions demonstrate the "pure function" pattern:
   * - Take input, return output, no side effects
   * - Reusable across different parts of the component
   * - Make the code more readable and maintainable
   */

  // FORMAT PRICE: Always show 2 decimal places with dollar sign for consistency
  // Example: 123.456 becomes "$123.46"
  const formatPrice = (value: number) => `$${value.toFixed(2)}`;
  // FORMAT VOLUME: Convert large numbers to readable format with suffixes
  // This is a common pattern in financial applications for displaying large numbers
  // Example: 1,500,000 becomes "1.5M", 2,500 becomes "2.5K"
  const formatVolume = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;  // Millions
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;        // Thousands
    return value.toString();                                           // Less than 1000, show as-is
  };

  /**
   * CHART RENDERING FUNCTIONS
   * 
   * These functions demonstrate several important React patterns:
   * 1. COMPONENT COMPOSITION: Building complex UIs from smaller, reusable pieces
   * 2. DECLARATIVE RENDERING: Describing what the UI should look like, not how to build it
   * 3. PROPS CONFIGURATION: Using props to customize component behavior
   * 4. RESPONSIVE DESIGN: Charts automatically adapt to container size
   */

  /**
   * PRICE CHART: Shows stock price movement with moving averages
   * 
   * Uses ComposedChart to combine multiple chart types:
   * - Area charts for high/low ranges
   * - Line charts for closing prices and moving averages
   * 
   * Key Financial Concepts:
   * - OHLC Data: Open, High, Low, Close prices for each time period
   * - Moving Averages: Trend-following indicators that smooth price action
   * - Support/Resistance: High/low areas where price tends to bounce
   * 
   * IMPORTANT SYNTAX NOTE: 
   * This function returns JSX, so we use JavaScript comments (//) outside JSX elements
   * and JSX comments ({/* */}) inside JSX elements. The comment below demonstrates
   * the correct syntax for commenting outside of JSX.
   */
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

  /**
   * CHART CONFIGURATION: Array of available chart types
   * 
   * This demonstrates the "configuration-driven UI" pattern:
   * - Each chart type is defined as an object with id, label, and component
   * - Makes it easy to add/remove chart types without changing the UI logic
   * - Separates data (chart definitions) from presentation (tab rendering)
   * - Component references allow dynamic rendering based on user selection
   */
  const chartTabs = [
    { id: 'price', label: 'Price & MA', component: renderPriceChart },      // Main price chart with moving averages
    { id: 'volume', label: 'Volume', component: renderVolumeChart },        // Volume analysis with price overlay
    { id: 'rsi', label: 'RSI', component: renderRSIChart },                // RSI momentum oscillator
    { id: 'macd', label: 'MACD', component: renderMACDChart },             // MACD trend-following indicator
    { id: 'bollinger', label: 'Bollinger Bands', component: renderBollingerChart }, // Bollinger Bands volatility indicator
  ];

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

      {/* 
        TAB NAVIGATION SYSTEM
        
        React Patterns Demonstrated:
        1. ARRAY.MAP(): Render multiple similar elements from data
        2. KEY PROP: React needs unique keys for efficient re-rendering
        3. EVENT HANDLERS: onClick functions to handle user interaction
        4. CONDITIONAL STYLING: Different styles based on active state
        5. TYPE ASSERTION: 'as ChartType' ensures type safety
        
        UX Patterns:
        - Visual feedback for active tab (different colors/shadow)
        - Hover states for better interactivity
        - Consistent spacing and typography
        
        STATE MANAGEMENT PATTERN:
        This demonstrates the "controlled component" pattern where:
        - Component state (activeChart) controls which tab is active
        - User interactions (clicks) update the state via setActiveChart
        - State changes trigger re-renders with updated UI
        - This creates a predictable, unidirectional data flow
      */}
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        {chartTabs.map((tab) => (
          <button
            key={tab.id}                    // Unique key for React's reconciliation algorithm
            onClick={() => setActiveChart(tab.id as ChartType)}  // Arrow function to update state
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeChart === tab.id
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'  // Active tab styles
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white' // Inactive tab styles
              }`}
          >
            {tab.label}                     // Display the human-readable label
          </button>
        ))}
      </div>

      {/* 
        DYNAMIC CHART RENDERING
        
        Advanced React Pattern: Dynamic Component Rendering
        - ARRAY.FIND(): Locate the chart configuration for the active tab
        - OPTIONAL CHAINING (?.): Safely call component function if found
        - FUNCTION INVOCATION: component() calls the render function
        - FIXED HEIGHT: Ensures consistent layout regardless of chart type
        
        This pattern allows us to render different chart types without
        a large switch statement or multiple conditional renders.
        
        ALTERNATIVE APPROACHES:
        1. Switch statement: switch(activeChart) { case 'price': return renderPriceChart(); ... }
        2. Object lookup: const charts = { price: renderPriceChart, ... }; charts[activeChart]()
        3. Conditional rendering: {activeChart === 'price' && renderPriceChart()}
        
        The current approach is more scalable because adding new chart types
        only requires updating the chartTabs array, not the rendering logic.
      */}
      <div className="h-[400px]">
        {chartTabs.find(tab => tab.id === activeChart)?.component()}
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

/**
 * EDUCATIONAL SUMMARY: Key Concepts Demonstrated in StockChart Component
 * 
 * This component serves as an excellent example of several important programming concepts:
 * 
 * 1. REACT PATTERNS:
 *    - Functional components with hooks (useState)
 *    - Props interface design and TypeScript integration
 *    - Conditional rendering and dynamic styling
 *    - Event handling and state management
 *    - Component composition and reusability
 * 
 * 2. DATA VISUALIZATION:
 *    - Chart library integration (Recharts)
 *    - Data transformation for visualization
 *    - Multiple chart types and responsive design
 *    - Interactive elements (tooltips, legends)
 *    - Color coding and visual hierarchy
 * 
 * 3. FINANCIAL CONCEPTS:
 *    - OHLCV data structure (Open, High, Low, Close, Volume)
 *    - Technical indicators (RSI, MACD, Bollinger Bands, Moving Averages)
 *    - Chart reading and interpretation
 *    - Trading signals and market analysis
 * 
 * 4. USER EXPERIENCE:
 *    - Tab-based navigation for different chart types
 *    - Context-sensitive help text
 *    - Responsive design for different screen sizes
 *    - Dark mode support
 *    - Consistent visual design language
 * 
 * 5. SOFTWARE ENGINEERING:
 *    - Separation of concerns (data, presentation, logic)
 *    - Configuration-driven UI design
 *    - Pure functions for data formatting
 *    - Type safety with TypeScript
 *    - Maintainable and extensible code structure
 * 
 * This component demonstrates how to build complex, interactive data visualizations
 * while maintaining clean, readable, and maintainable code. It's an excellent
 * example of combining financial domain knowledge with modern web development practices.
 */