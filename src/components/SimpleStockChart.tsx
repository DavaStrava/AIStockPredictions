/**
 * SimpleStockChart Component - A Clean Financial Data Visualization
 * 
 * This component demonstrates several important React and financial analysis concepts:
 * 
 * 1. CLIENT-SIDE RENDERING: The 'use client' directive tells Next.js this component
 *    needs to run in the browser because it uses interactive features and calculations
 *    that require JavaScript execution on the client side.
 * 
 * 2. FINANCIAL DATA VISUALIZATION: Creates a clean, informative display of stock
 *    price data without heavy charting libraries, focusing on key metrics and trends.
 * 
 * 3. RESPONSIVE DESIGN: Uses Tailwind CSS classes to create layouts that work
 *    on both desktop and mobile devices with grid systems and responsive breakpoints.
 * 
 * 4. CONDITIONAL RENDERING: Shows different content based on data availability
 *    and analysis results, demonstrating React's declarative UI patterns.
 * 
 * 5. DATA TRANSFORMATION: Converts raw financial data into visual representations
 *    like progress bars, color-coded indicators, and formatted statistics.
 */
'use client';

import { PriceData, TechnicalAnalysisResult } from '@/lib/technical-analysis/types';
import Term from './Term';

/**
 * TYPESCRIPT INTERFACE: Props Definition
 * 
 * This interface defines the "contract" for what data this component expects.
 * It's a key TypeScript pattern that provides:
 * - Type safety at compile time
 * - Self-documenting code (you can see what the component needs)
 * - IDE autocomplete and error detection
 * - Clear API boundaries between components
 * 
 * Props Pattern Explanation:
 * - symbol: Stock ticker (e.g., "AAPL", "GOOGL") for display purposes
 * - priceData: Array of historical price data (OHLCV format)
 * - analysis?: Optional technical analysis results (? means optional)
 */
interface SimpleStockChartProps {
  symbol: string;                           // Stock ticker symbol for display
  priceData: PriceData[];                  // Historical price data array
  analysis?: TechnicalAnalysisResult;      // Optional technical analysis results
}

/**
 * MAIN COMPONENT FUNCTION
 * 
 * React Functional Component Pattern:
 * - Uses modern function syntax instead of class components
 * - Destructures props in the parameter list for cleaner code
 * - Returns JSX (JavaScript XML) that describes the UI structure
 * 
 * Parameter Destructuring:
 * - { symbol, priceData, analysis } extracts these properties from the props object
 * - This is cleaner than writing props.symbol, props.priceData, etc.
 * - TypeScript ensures the destructured properties match the interface
 */
export default function SimpleStockChart({ symbol, priceData, analysis }: SimpleStockChartProps) {
  /**
   * EARLY RETURN PATTERN - Error Handling and Edge Cases
   * 
   * This is a common React pattern called "early return" or "guard clause":
   * - Check for invalid/empty data first
   * - Return a fallback UI immediately if data is missing
   * - Prevents errors in the main component logic
   * - Provides better user experience with meaningful error messages
   * 
   * Benefits:
   * - Reduces nesting in the main component logic
   * - Makes error states explicit and testable
   * - Follows the "fail fast" principle
   */
  if (priceData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No price data available for {symbol}
      </div>
    );
  }

  /**
   * FINANCIAL CALCULATIONS - Price Analysis
   * 
   * These calculations demonstrate several important programming and financial concepts:
   * 
   * 1. ARRAY INDEXING: priceData[priceData.length - 1] gets the last element
   *    - Arrays are zero-indexed, so length - 1 gives us the last item
   *    - This is the most recent price data point
   * 
   * 2. TERNARY OPERATOR: condition ? valueIfTrue : valueIfFalse
   *    - Concise way to handle conditional logic
   *    - Prevents errors when there's only one data point
   * 
   * 3. FINANCIAL METRICS:
   *    - Price Change: Absolute difference between current and previous price
   *    - Percentage Change: (New - Old) / Old × 100 (standard financial formula)
   *    - These are fundamental metrics traders use to assess performance
   */
  const currentPrice = priceData[priceData.length - 1].close;
  const previousPrice = priceData.length > 1 ? priceData[priceData.length - 2].close : currentPrice;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = (priceChange / previousPrice) * 100;

  /**
   * ARRAY METHODS AND SPREAD OPERATOR - Data Analysis
   * 
   * Advanced JavaScript patterns for data processing:
   * 
   * 1. SPREAD OPERATOR (...): Expands array elements as individual arguments
   *    - Math.min(...array) is equivalent to Math.min(item1, item2, item3, ...)
   *    - More elegant than using reduce() or loops for min/max operations
   * 
   * 2. ARRAY.MAP(): Transforms each element in the array
   *    - priceData.map(d => d.low) extracts just the 'low' field from each price record
   *    - Creates a new array of just the low prices for analysis
   * 
   * 3. FINANCIAL RANGE CALCULATION:
   *    - Min/Max prices help establish the trading range
   *    - Price range is used for relative positioning and visualization
   */
  const minPrice = Math.min(...priceData.map(d => d.low));
  const maxPrice = Math.max(...priceData.map(d => d.high));
  const priceRange = maxPrice - minPrice;

  /**
   * MAIN COMPONENT RENDER - JSX Structure
   * 
   * This return statement demonstrates several key React and web development concepts:
   * 
   * 1. JSX (JavaScript XML): HTML-like syntax that gets compiled to JavaScript
   *    - Allows mixing HTML structure with JavaScript expressions
   *    - Expressions in {} are evaluated as JavaScript
   * 
   * 2. TAILWIND CSS CLASSES: Utility-first CSS framework
   *    - bg-white/dark:bg-gray-800: Background colors with dark mode support
   *    - rounded-lg: Rounded corners for modern UI design
   *    - flex, justify-between: Flexbox layout for responsive positioning
   *    - mb-6, p-6: Margin bottom and padding using consistent spacing scale
   * 
   * 3. CONDITIONAL STYLING: Dynamic CSS classes based on data
   *    - Template literals with ternary operators for conditional classes
   *    - Green for positive price changes, red for negative (financial convention)
   */
  return (
    <div>
      {/* HEADER SECTION - Price Display with Change Indicators */}
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-lg font-semibold text-foreground">
          Current Price & Performance
        </h4>
        <div className="text-right">
          {/* 
            CURRENT PRICE DISPLAY
            - toFixed(2) ensures exactly 2 decimal places for currency formatting
            - Large, bold text draws attention to the most important metric
          */}
          <div className="text-2xl font-bold text-foreground">
            ${currentPrice.toFixed(2)}
          </div>
          {/* 
            PRICE CHANGE INDICATOR
            - Conditional styling: green for gains, red for losses
            - Template literal with ternary operator for + sign on positive changes
            - Shows both absolute change ($) and percentage change (%)
          */}
          <div className={`text-sm ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* 
        PRICE RANGE VISUALIZATION - Custom Progress Bar
        
        This section demonstrates several advanced web development concepts:
        
        1. CUSTOM DATA VISUALIZATION: Creating charts without heavy libraries
           - Uses CSS positioning and width calculations
           - More lightweight than Chart.js or D3 for simple visualizations
        
        2. MATHEMATICAL CALCULATIONS FOR UI:
           - Percentage calculation: (current - min) / (max - min) * 100
           - This positions the current price within the historical range
           - Essential for creating proportional visual representations
        
        3. CSS POSITIONING TECHNIQUES:
           - relative/absolute positioning for layered elements
           - transform: translate for precise positioning adjustments
           - Dynamic inline styles calculated from JavaScript data
      */}
      <div className="mb-6">
        {/* Range Labels - Shows the boundaries of the price range */}
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>52W Low: ${minPrice.toFixed(2)}</span>
          <span>52W High: ${maxPrice.toFixed(2)}</span>
        </div>
        
        {/* 
          PROGRESS BAR CONTAINER
          - relative positioning allows child elements to be positioned absolutely within it
          - h-4: Fixed height for consistent appearance
          - rounded-full: Creates pill-shaped progress bar (modern UI pattern)
        */}
        <div className="relative h-4 bg-gray-200 dark:bg-gray-600 rounded-full">
          {/* 
            PROGRESS BAR FILL
            - absolute positioning allows precise control over width and position
            - width calculated as percentage of price range
            - Represents how far the current price is from the minimum
          */}
          <div 
            className="absolute h-4 bg-blue-500 rounded-full"
            style={{
              left: '0%',
              width: `${((currentPrice - minPrice) / priceRange) * 100}%`
            }}
          />
          {/* 
            CURRENT PRICE INDICATOR
            - Small circle that marks exact current price position
            - transform: -translate-x-1.5 centers the circle on the position
            - top-0.5: Slight vertical adjustment for visual alignment
          */}
          <div 
            className="absolute w-3 h-3 bg-blue-700 rounded-full transform -translate-x-1.5 top-0.5"
            style={{
              left: `${((currentPrice - minPrice) / priceRange) * 100}%`
            }}
          />
        </div>
        <div className="text-center text-xs text-gray-500 mt-1">
          Current position in 52-week range
        </div>
      </div>

      {/* 
        OHLCV STATISTICS GRID - Key Financial Metrics Display
        
        This section demonstrates important concepts in both web development and finance:
        
        1. RESPONSIVE GRID LAYOUT:
           - grid-cols-2: 2 columns on mobile devices
           - md:grid-cols-4: 4 columns on medium screens and larger
           - gap-4: Consistent spacing between grid items
           - This pattern ensures readability on all device sizes
        
        2. OHLCV DATA EXPLANATION:
           - Open: Price at market opening (9:30 AM ET for US stocks)
           - High: Highest price during the trading session
           - Low: Lowest price during the trading session
           - Close: Final price at market close (4:00 PM ET for US stocks)
           - Volume: Number of shares traded (key liquidity indicator)
        
        3. DATA FORMATTING PATTERNS:
           - Currency formatting with $ and 2 decimal places
           - Volume formatting in millions (M) for readability
           - Consistent typography hierarchy (label + value)
      */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* 
          OPENING PRICE
          - The price at which the stock started trading for the day
          - Important for gap analysis (difference from previous close)
        */}
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">Open</div>
          <div className="font-semibold text-foreground">
            ${priceData[priceData.length - 1].open.toFixed(2)}
          </div>
        </div>
        
        {/* 
          DAILY HIGH
          - Highest price reached during the trading session
          - Indicates buying pressure and resistance levels
        */}
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">High</div>
          <div className="font-semibold text-foreground">
            ${priceData[priceData.length - 1].high.toFixed(2)}
          </div>
        </div>
        
        {/* 
          DAILY LOW
          - Lowest price reached during the trading session
          - Indicates selling pressure and support levels
        */}
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">Low</div>
          <div className="font-semibold text-foreground">
            ${priceData[priceData.length - 1].low.toFixed(2)}
          </div>
        </div>
        
        {/* 
          TRADING VOLUME
          - Number of shares traded during the session
          - Divided by 1,000,000 and formatted with 'M' suffix for readability
          - High volume often confirms price movements
        */}
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">Volume</div>
          <div className="font-semibold text-foreground">
            {(priceData[priceData.length - 1].volume / 1000000).toFixed(1)}M
          </div>
        </div>
      </div>

      {/* 
        TECHNICAL INDICATORS SECTION - Conditional Rendering
        
        This section demonstrates several advanced React and financial analysis concepts:
        
        1. CONDITIONAL RENDERING WITH &&:
           - {analysis && (...)} only renders if analysis exists
           - Short-circuit evaluation: if analysis is falsy, nothing renders
           - Prevents errors when optional data isn't available
        
        2. NESTED CONDITIONAL RENDERING:
           - Each indicator checks if data exists before rendering
           - Graceful degradation: missing indicators don't break the UI
           - Real-world applications often have incomplete data
        
        3. TECHNICAL INDICATORS EXPLAINED:
           - RSI (Relative Strength Index): Momentum oscillator (0-100 scale)
           - MACD (Moving Average Convergence Divergence): Trend-following indicator
           - Bollinger %B: Position within Bollinger Bands (volatility indicator)
        
        4. FINANCIAL INTERPRETATION LOGIC:
           - RSI > 70: Overbought (potential sell signal)
           - RSI < 30: Oversold (potential buy signal)
           - MACD Histogram > 0: Bullish momentum
           - Bollinger %B > 0.8: Near upper band (overbought)
      */}
      {analysis && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="font-medium text-foreground mb-3">Technical Indicators</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 
              RSI INDICATOR DISPLAY
              - Checks if RSI data exists and has values
              - Math.round() removes decimal places for cleaner display
              - Conditional text based on traditional RSI interpretation levels
            */}
            {analysis.indicators.rsi && analysis.indicators.rsi.length > 0 && (
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <Term>RSI</Term>
                </div>
                <div className="font-semibold text-foreground">
                  {Math.round(analysis.indicators.rsi[analysis.indicators.rsi.length - 1].value)}
                </div>
                <div className="text-xs text-gray-500">
                  {analysis.indicators.rsi[analysis.indicators.rsi.length - 1].value > 70 ? 'Overbought' :
                   analysis.indicators.rsi[analysis.indicators.rsi.length - 1].value < 30 ? 'Oversold' : 'Neutral'}
                </div>
              </div>
            )}
            
            {/* 
              MACD INDICATOR DISPLAY
              - Shows the MACD line value (difference between fast and slow EMAs)
              - Histogram > 0 indicates MACD is above signal line (bullish)
              - toFixed(2) provides consistent decimal formatting
            */}
            {analysis.indicators.macd && analysis.indicators.macd.length > 0 && (
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <Term>MACD</Term>
                </div>
                <div className="font-semibold text-foreground">
                  {analysis.indicators.macd[analysis.indicators.macd.length - 1].macd.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">
                  {analysis.indicators.macd[analysis.indicators.macd.length - 1].histogram > 0 ? 'Bullish' : 'Bearish'}
                </div>
              </div>
            )}
            
            {/* 
              BOLLINGER BANDS %B DISPLAY
              - %B shows where price sits within the bands (0 = lower band, 1 = upper band)
              - Multiplied by 100 and formatted as percentage for readability
              - Values > 80% suggest price is near upper band (potential resistance)
            */}
            {analysis.indicators.bollingerBands && analysis.indicators.bollingerBands.length > 0 && (
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="text-sm text-gray-600 dark:text-gray-400">Bollinger %B</div>
                <div className="font-semibold text-foreground">
                  {(analysis.indicators.bollingerBands[analysis.indicators.bollingerBands.length - 1].percentB * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">
                  {analysis.indicators.bollingerBands[analysis.indicators.bollingerBands.length - 1].percentB > 0.8 ? 'Overbought' :
                   analysis.indicators.bollingerBands[analysis.indicators.bollingerBands.length - 1].percentB < 0.2 ? 'Oversold' : 'Normal'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Price Trend */}
      <div className="mt-6">
        <h4 className="font-medium text-foreground mb-3">Recent Price Trend (Last 10 Days)</h4>
        <div className="flex items-end space-x-1 h-20">
          {priceData.slice(-10).map((data, index) => {
            const height = ((data.close - minPrice) / priceRange) * 60 + 10;
            const isUp = index === 0 || data.close >= priceData[priceData.length - 10 + index - 1]?.close;
            
            return (
              <div
                key={index}
                className={`flex-1 rounded-t ${isUp ? 'bg-green-500' : 'bg-red-500'} opacity-70 hover:opacity-100 transition-opacity`}
                style={{ height: `${height}px` }}
                title={`${data.date.toLocaleDateString()}: $${data.close.toFixed(2)}`}
              />
            );
          })}
        </div>
        <div className="text-xs text-gray-500 text-center mt-2">
          Hover over bars to see daily prices
        </div>
      </div>
    </div>
  );
}

/**
 * EDUCATIONAL SUMMARY: Key Concepts Demonstrated in SimpleStockChart
 * 
 * This component serves as an excellent example of several important programming concepts:
 * 
 * 1. REACT PATTERNS:
 *    - Functional components with TypeScript interfaces
 *    - Conditional rendering with logical operators
 *    - Props destructuring and optional properties
 *    - Early returns for error handling
 *    - Dynamic styling with calculated values
 * 
 * 2. JAVASCRIPT/TYPESCRIPT TECHNIQUES:
 *    - Array methods (map, slice, spread operator)
 *    - Mathematical calculations for data visualization
 *    - Template literals and ternary operators
 *    - Type safety with interfaces and optional chaining
 * 
 * 3. FINANCIAL CONCEPTS:
 *    - OHLCV data structure and interpretation
 *    - Technical indicators (RSI, MACD, Bollinger Bands)
 *    - Price change calculations and percentage formatting
 *    - Visual representation of financial data
 * 
 * 4. WEB DEVELOPMENT:
 *    - Responsive design with Tailwind CSS
 *    - CSS Grid and Flexbox layouts
 *    - Dark mode support with CSS variables
 *    - Interactive elements with hover states
 *    - Custom data visualization without heavy libraries
 * 
 * 5. USER EXPERIENCE:
 *    - Progressive enhancement (works without analysis data)
 *    - Meaningful error states and loading indicators
 *    - Consistent visual hierarchy and typography
 *    - Mobile-responsive design patterns
 * 
 * This component demonstrates how to build clean, maintainable, and educational
 * code that combines multiple domains of knowledge effectively.
 */