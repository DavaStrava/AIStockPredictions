/*
  CLIENT-SIDE COMPONENT DIRECTIVE:
  'use client' tells Next.js this component runs in the browser, not on the server.
  This is required because we use React hooks (useState, useEffect) and browser APIs.
*/
'use client';

import { useState, useEffect } from 'react';
// TYPE IMPORTS: Import TypeScript interfaces for type safety
import { TechnicalAnalysisResult, TechnicalSignal, PriceData } from '@/lib/technical-analysis/types';
// COMPONENT IMPORTS: Import child components using path aliases (@/ = src/)
import SimpleStockChart from './SimpleStockChart';
import PerformanceMetrics from './PerformanceMetrics';
import StockSearch from './StockSearch';
import AIInsights from './AIInsights';
import TermsGlossary from './TermsGlossary';
import CollapsibleSection from './CollapsibleSection';

/*
  TYPESCRIPT INTERFACE DEFINITION:
  Defines the shape of data we expect from our prediction API.
  This provides compile-time type checking and better IDE support.
*/
interface PredictionResult {
  symbol: string;                    // Stock ticker symbol (e.g., "AAPL")
  currentPrice: number;              // Current stock price in USD
  prediction: {
    direction: 'bullish' | 'bearish' | 'neutral';  // UNION TYPES: Only these 3 values allowed
    confidence: number;              // Confidence score (0-1)
    targetPrice: number;             // Predicted future price
    timeframe: string;               // Time horizon for prediction
    reasoning: string[];             // Array of reasons for the prediction
  };
  signals: TechnicalSignal[];        // Array of technical analysis signals
  riskMetrics: {
    volatility: 'low' | 'medium' | 'high';  // Risk level categorization
    support: number;                 // Support price level
    resistance: number;              // Resistance price level
    stopLoss: number;                // Recommended stop-loss price
  };
}

export default function StockDashboard() {
  /*
    REACT STATE MANAGEMENT:
    useState hooks manage component state. Each piece of state has:
    1. Current value (e.g., predictions)
    2. Setter function (e.g., setPredictions)
    3. Initial value (e.g., [])
  */
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);        // List of stock predictions
  const [selectedStock, setSelectedStock] = useState<string>('');               // Currently selected stock symbol
  const [analysis, setAnalysis] = useState<TechnicalAnalysisResult | null>(null); // Detailed analysis data
  const [priceData, setPriceData] = useState<PriceData[]>([]);                  // Historical price data for charts
  const [loading, setLoading] = useState(true);                                // Loading state for UI feedback
  const [customSymbol, setCustomSymbol] = useState('');                        // User input for custom stock search

  /*
    COMPONENT LIFECYCLE WITH useEffect:
    This hook runs side effects when the component mounts.
    Empty dependency array [] means it only runs once on mount.
  */
  useEffect(() => {
    /*
      CLEANUP PATTERN FOR ASYNC OPERATIONS:
      isMounted prevents state updates if component unmounts before async operation completes.
      This prevents memory leaks and "Can't perform a React state update on an unmounted component" warnings.
    */
    let isMounted = true;
    
    const loadPredictions = async () => {
      // Only update state if component is still mounted
      if (isMounted) {
        await fetchPredictions();
      }
    };
    
    loadPredictions();
    
    // CLEANUP FUNCTION: Runs when component unmounts
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array = run once on mount

  /*
    ASYNC FUNCTION WITH ERROR HANDLING:
    This function demonstrates several important patterns:
    1. Optional parameters with TypeScript (symbols?: string)
    2. Conditional URL building using ternary operator
    3. Proper error handling with try-catch-finally
    4. State management during async operations
  */
  const fetchPredictions = async (symbols?: string) => {
    try {
      // LOADING STATE PATTERN: Show loading indicator during async operations
      setLoading(true);
      
      // CONDITIONAL URL BUILDING: Use provided symbols or default to popular stocks
      const url = symbols 
        ? `/api/predictions?symbols=${symbols}`
        : '/api/predictions?symbols=AAPL,GOOGL,MSFT,TSLA,NVDA';
      
      // FETCH API: Modern way to make HTTP requests in JavaScript
      const response = await fetch(url);
      
      // HTTP ERROR HANDLING: Check if response is successful (status 200-299)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // JSON PARSING: Convert response body from JSON string to JavaScript object
      const data = await response.json();
      
      // API RESPONSE VALIDATION: Check if our API returned success flag
      if (data.success) {
        setPredictions(data.data);
      } else {
        console.error('Predictions API error:', data.error);
        setPredictions([]); // Reset to empty array on error
      }
    } catch (error) {
      // CATCH BLOCK: Handle any errors that occurred during the try block
      console.error('Failed to fetch predictions:', error);
      setPredictions([]); // Ensure UI shows empty state on error
    } finally {
      // FINALLY BLOCK: Always runs regardless of success or failure
      setLoading(false); // Always hide loading indicator
    }
  };

  /*
    DETAILED ANALYSIS FETCHER:
    This function demonstrates advanced data processing patterns:
    1. Template literals for dynamic URL construction
    2. Data transformation with Array.map()
    3. Type safety with Array.isArray() validation
    4. Multiple state updates in sequence
  */
  const fetchDetailedAnalysis = async (symbol: string) => {
    try {
      // TEMPLATE LITERALS: Use backticks for string interpolation
      const response = await fetch(`/api/analysis?symbol=${symbol}&period=1year`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // MULTIPLE STATE UPDATES: Update related state variables together
        setAnalysis(data.data);
        setSelectedStock(symbol);
        
        // DATA VALIDATION AND TRANSFORMATION:
        // Always validate data structure before processing
        if (data.priceData && Array.isArray(data.priceData)) {
          /*
            ARRAY TRANSFORMATION PATTERN:
            map() creates a new array by transforming each element.
            Here we convert date strings to Date objects for chart compatibility.
            The spread operator (...item) copies all existing properties,
            then we override the date property with a Date object.
          */
          const processedPriceData = data.priceData.map((item: any) => ({
            ...item,                    // Spread operator: copy all existing properties
            date: new Date(item.date),  // Override: convert string to Date object
          }));
          setPriceData(processedPriceData);
        }
      } else {
        console.error('Analysis failed:', data.error);
        // RESET STATE ON ERROR: Clear related data to prevent stale UI
        setAnalysis(null);
        setPriceData([]);
      }
    } catch (error) {
      console.error('Failed to fetch analysis:', error);
      setAnalysis(null);
      setPriceData([]);
    }
  };



  /*
    UTILITY FUNCTIONS FOR DYNAMIC STYLING:
    These functions demonstrate the "function as data mapper" pattern.
    Instead of inline conditionals in JSX, we extract logic into reusable functions.
    This improves readability and makes styling consistent across the component.
  */
  
  /*
    COLOR MAPPING FUNCTION:
    Maps business logic (bullish/bearish/neutral) to UI styling (colors).
    Uses Tailwind CSS classes with dark mode variants for accessibility.
    
    ACCESSIBILITY IMPROVEMENT:
    The color values were updated from 600/400 to 700/300 to improve contrast ratios.
    This ensures better readability for users with visual impairments and meets
    WCAG (Web Content Accessibility Guidelines) standards.
    
    TAILWIND COLOR SYSTEM:
    - Numbers represent color intensity: 50 (lightest) to 950 (darkest)
    - 700 provides strong contrast on light backgrounds
    - 300 provides good contrast on dark backgrounds
    - The pattern "text-color-700 dark:text-color-300" ensures proper contrast in both themes
    
    BUSINESS LOGIC MAPPING:
    - 'bullish' → Green (positive market sentiment, buy signal)
    - 'bearish' → Red (negative market sentiment, sell signal)  
    - 'neutral' → Yellow (mixed signals, hold/wait)
    - default → Gray (unknown/error state)
  */
  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'bullish': return 'text-green-700 dark:text-green-300';  // Stronger green for better visibility
      case 'bearish': return 'text-red-700 dark:text-red-300';      // Stronger red for better visibility
      case 'neutral': return 'text-yellow-700 dark:text-yellow-300'; // Yellow for neutral state
      default: return 'text-gray-600 dark:text-gray-400';           // Gray for unknown/error states
    }
  };

  /*
    BACKGROUND STYLING FUNCTION:
    Similar to color mapping but for background colors and borders.
    Notice the opacity modifiers (/20) for subtle background effects.
    This creates visual hierarchy without overwhelming the content.
  */
  const getDirectionBg = (direction: string) => {
    switch (direction) {
      case 'bullish': return 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 border-green-300 dark:border-green-600 hover:from-green-200 hover:to-green-300 dark:hover:from-green-800/40 dark:hover:to-green-700/40 hover:border-green-400 dark:hover:border-green-500';
      case 'bearish': return 'bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 border-red-300 dark:border-red-600 hover:from-red-200 hover:to-red-300 dark:hover:from-red-800/40 dark:hover:to-red-700/40 hover:border-red-400 dark:hover:border-red-500';
      case 'neutral': return 'bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 border-yellow-300 dark:border-yellow-600 hover:from-yellow-200 hover:to-yellow-300 dark:hover:from-yellow-800/40 dark:hover:to-yellow-700/40 hover:border-yellow-400 dark:hover:border-yellow-500';
      default: return 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900/30 dark:to-gray-800/30 border-gray-300 dark:border-gray-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-800/40 dark:hover:to-gray-700/40 hover:border-gray-400 dark:hover:border-gray-500';
    }
  };

  /*
    EARLY RETURN PATTERN FOR LOADING STATE:
    This pattern prevents rendering the main UI while data is loading.
    Benefits:
    1. Cleaner code structure (no nested conditionals)
    2. Better user experience (clear loading feedback)
    3. Prevents errors from accessing undefined data
  */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        {/* 
          CSS ANIMATION WITH TAILWIND:
          animate-spin creates a rotating animation
          rounded-full makes a perfect circle
          border-b-2 creates a partial border for the spinner effect
        */}
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading predictions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with smart search */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Stock Predictions</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              AI-powered technical analysis with real market data
            </p>
          </div>
          
          <div className="w-full sm:w-96">
            <StockSearch 
              onSelectStock={(symbol) => fetchDetailedAnalysis(symbol)}
              placeholder="Search any stock (e.g., Apple, TSLA, Microsoft...)"
            />
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Popular:</span>
          {['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'AMZN', 'META'].map((symbol) => (
            <button
              key={symbol}
              onClick={() => fetchDetailedAnalysis(symbol)}
              className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {symbol}
            </button>
          ))}
        </div>
      </div>

      {/* 
        RESPONSIVE GRID LAYOUT:
        CSS Grid with responsive breakpoints:
        - grid-cols-1: 1 column on mobile (default)
        - md:grid-cols-2: 2 columns on medium screens (768px+)
        - lg:grid-cols-3: 3 columns on large screens (1024px+)
        This creates a fluid layout that adapts to screen size.
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 
          ARRAY RENDERING WITH MAP:
          React's standard pattern for rendering lists.
          Each item needs a unique 'key' prop for efficient re-rendering.
          The callback function receives each prediction object.
        */}
        {predictions.map((prediction) => (
          <div
            key={prediction.symbol}  // UNIQUE KEY: Required for React's reconciliation
            className={`border rounded-lg p-6 cursor-pointer transition-all duration-300 ease-in-out hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-2 hover:scale-105 transform ${getDirectionBg(prediction.prediction.direction)}`}
            onClick={() => fetchDetailedAnalysis(prediction.symbol)}  // EVENT HANDLER: Arrow function to pass parameter
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{prediction.symbol}</h3>
                <p className="text-2xl font-bold text-foreground">${prediction.currentPrice}</p>
              </div>
              <div className="text-right">
                <span className={`text-sm font-medium ${getDirectionColor(prediction.prediction.direction)}`}>
                  {prediction.prediction.direction.toUpperCase()}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round(prediction.prediction.confidence * 100)}% confidence
                </p>
              </div>
            </div>

            {/* 
              KEY-VALUE DISPLAY PATTERN:
              Common UI pattern for displaying structured data.
              Uses flexbox with justify-between to align labels left and values right.
              Consistent spacing with space-y-2 (0.5rem between items).
            */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Target:</span>
                <span className="font-medium text-foreground">${prediction.prediction.targetPrice}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Timeframe:</span>
                <span className="font-medium text-foreground">{prediction.prediction.timeframe}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Volatility:</span>
                {/* 
                  CSS CAPITALIZE: 
                  The 'capitalize' class transforms the first letter to uppercase.
                  This handles cases where API returns "low" but we want "Low".
                */}
                <span className="font-medium text-foreground capitalize">{prediction.riskMetrics.volatility}</span>
              </div>
            </div>


          </div>
        ))}
      </div>

      {/* 
        CONDITIONAL RENDERING WITH MULTIPLE CONDITIONS:
        This section only renders when ALL conditions are true:
        1. analysis exists (not null)
        2. selectedStock has a value (not empty string)
        3. priceData has items (length > 0)
        This prevents showing incomplete analysis UI.
      */}
      {analysis && selectedStock && priceData.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-foreground">
              Detailed Analysis: {selectedStock}
            </h3>
            {/* 
              CLOSE BUTTON WITH STATE RESET:
              Demonstrates the "reset multiple related states" pattern.
              All analysis-related state is cleared when user closes the section.
              This prevents stale data from showing if user opens different stock.
            */}
            <button
              onClick={() => {
                setAnalysis(null);      // Clear analysis data
                setPriceData([]);       // Clear chart data
                setSelectedStock('');   // Clear selection
              }}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-lg"
            >
              ✕
            </button>
          </div>

          {/* 
            COMPONENT COMPOSITION PATTERN:
            CollapsibleSection is a wrapper component that provides:
            1. Consistent styling and behavior
            2. Expand/collapse functionality
            3. Visual hierarchy with icons and subtitles
            
            The child component (PerformanceMetrics) focuses only on its data display logic.
            This separation of concerns makes components more reusable and maintainable.
          */}
          <CollapsibleSection
            title="Performance Metrics"
            subtitle="Risk analysis, volatility, and key performance indicators"
            icon="📊"                    // Emoji icons for visual appeal
            defaultExpanded={true}       // Start expanded for important content
          >
            {/* 
              PROP PASSING PATTERN:
              Pass only the data that child component needs.
              This keeps components loosely coupled and easier to test.
            */}
            <PerformanceMetrics symbol={selectedStock} priceData={priceData} />
          </CollapsibleSection>

          {/* Interactive Charts - Collapsible */}
          <CollapsibleSection
            title="Price Analysis & Charts"
            subtitle="Technical indicators and price visualization"
            icon="📈"
            defaultExpanded={true}
          >
            <SimpleStockChart symbol={selectedStock} priceData={priceData} analysis={analysis} />
          </CollapsibleSection>

          {/* AI-Powered Insights - Collapsible */}
          <CollapsibleSection
            title="AI-Powered Insights"
            subtitle="Technical, portfolio, and sentiment analysis powered by AI"
            icon="🤖"
            defaultExpanded={false}
          >
            <AIInsights symbol={selectedStock} analysis={analysis} />
          </CollapsibleSection>

          {/* Technical Indicators Interpretation - Collapsible */}
          <CollapsibleSection
            title="Technical Indicators Interpretation"
            subtitle="Matter-of-fact analysis of current technical indicators"
            icon="📋"
            defaultExpanded={true}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h4 className="font-semibold text-foreground mb-4">Current Technical Status</h4>
              <div className="space-y-4">
                {/* RSI Interpretation */}
                {analysis.indicators.rsi && analysis.indicators.rsi.length > 0 && (
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-foreground">RSI (14-period)</span>
                      <span className="text-sm font-mono text-foreground">
                        {Math.round(analysis.indicators.rsi[analysis.indicators.rsi.length - 1].value)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {(() => {
                        const rsi = analysis.indicators.rsi[analysis.indicators.rsi.length - 1].value;
                        if (rsi > 70) return "RSI indicates overbought conditions. Price has risen rapidly and may be due for a pullback.";
                        if (rsi < 30) return "RSI indicates oversold conditions. Price has declined rapidly and may be due for a bounce.";
                        if (rsi > 50) return "RSI is above midline, indicating upward momentum is currently stronger than downward momentum.";
                        return "RSI is below midline, indicating downward momentum is currently stronger than upward momentum.";
                      })()}
                    </p>
                  </div>
                )}

                {/* MACD Interpretation */}
                {analysis.indicators.macd && analysis.indicators.macd.length > 0 && (
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-foreground">MACD</span>
                      <span className="text-sm font-mono text-foreground">
                        {analysis.indicators.macd[analysis.indicators.macd.length - 1].macd.toFixed(3)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {(() => {
                        const latest = analysis.indicators.macd[analysis.indicators.macd.length - 1];
                        const macd = latest.macd;
                        const signal = latest.signal;
                        const histogram = latest.histogram;
                        
                        if (macd > signal && histogram > 0) {
                          return "MACD line is above signal line with positive histogram, indicating bullish momentum.";
                        } else if (macd < signal && histogram < 0) {
                          return "MACD line is below signal line with negative histogram, indicating bearish momentum.";
                        } else if (macd > signal) {
                          return "MACD line is above signal line but histogram is declining, momentum may be weakening.";
                        } else {
                          return "MACD line is below signal line but histogram is improving, momentum may be strengthening.";
                        }
                      })()}
                    </p>
                  </div>
                )}

                {/* Bollinger Bands Interpretation */}
                {analysis.indicators.bollingerBands && analysis.indicators.bollingerBands.length > 0 && (
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-foreground">Bollinger Bands %B</span>
                      <span className="text-sm font-mono text-foreground">
                        {(analysis.indicators.bollingerBands[analysis.indicators.bollingerBands.length - 1].percentB * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {(() => {
                        const percentB = analysis.indicators.bollingerBands[analysis.indicators.bollingerBands.length - 1].percentB;
                        if (percentB > 1) return "Price is above the upper Bollinger Band, indicating potential overbought conditions.";
                        if (percentB < 0) return "Price is below the lower Bollinger Band, indicating potential oversold conditions.";
                        if (percentB > 0.8) return "Price is near the upper Bollinger Band, approaching overbought territory.";
                        if (percentB < 0.2) return "Price is near the lower Bollinger Band, approaching oversold territory.";
                        return "Price is within normal Bollinger Band range, indicating balanced volatility conditions.";
                      })()}
                    </p>
                  </div>
                )}

                {/* Moving Averages Interpretation */}
                {analysis.indicators.sma && analysis.indicators.sma.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-foreground">Moving Averages</span>
                      <div className="text-sm font-mono text-foreground space-x-2">
                        <span>SMA20: ${analysis.indicators.sma.find(s => s.period === 20)?.value.toFixed(2) || 'N/A'}</span>
                        <span>SMA50: ${analysis.indicators.sma.find(s => s.period === 50)?.value.toFixed(2) || 'N/A'}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {(() => {
                        const sma20 = analysis.indicators.sma.find(s => s.period === 20)?.value;
                        const sma50 = analysis.indicators.sma.find(s => s.period === 50)?.value;
                        const currentPrice = priceData[priceData.length - 1]?.close;
                        
                        if (!sma20 || !sma50 || !currentPrice) return "Moving average analysis requires more data points.";
                        
                        if (sma20 > sma50 && currentPrice > sma20) {
                          return "Price is above both short and long-term moving averages, with short-term above long-term, indicating upward trend.";
                        } else if (sma20 < sma50 && currentPrice < sma20) {
                          return "Price is below both short and long-term moving averages, with short-term below long-term, indicating downward trend.";
                        } else if (currentPrice > sma20 && sma20 < sma50) {
                          return "Price is above short-term average but short-term is below long-term, indicating mixed signals.";
                        } else {
                          return "Price is below short-term average, indicating near-term weakness regardless of longer-term trend.";
                        }
                      })()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleSection>

          {/* Analysis Summary Grid - Collapsible */}
          <CollapsibleSection
            title="Technical Analysis Summary"
            subtitle="Market summary and detailed technical indicators"
            icon="🔍"
            defaultExpanded={true}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Market Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h4 className="font-semibold text-foreground mb-4">Market Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Overall Sentiment:</span>
                  <span className={`font-medium ${getDirectionColor(analysis.summary.overall)}`}>
                    {analysis.summary.overall.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Strength:</span>
                  <span className="font-medium text-foreground">
                    {Math.round(analysis.summary.strength * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
                  <span className="font-medium text-foreground">
                    {Math.round(analysis.summary.confidence * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Trend Direction:</span>
                  <span className="font-medium text-foreground capitalize">
                    {analysis.summary.trendDirection}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Momentum:</span>
                  <span className="font-medium text-foreground capitalize">
                    {analysis.summary.momentum}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Volatility:</span>
                  <span className="font-medium text-foreground capitalize">
                    {analysis.summary.volatility}
                  </span>
                </div>
              </div>
            </div>

            {/* Technical Indicators */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h4 className="font-semibold text-foreground mb-4">Technical Indicators</h4>
              <div className="space-y-3">
                {/* 
                  SAFE DATA ACCESS PATTERN:
                  Always check if data exists AND has content before accessing.
                  This prevents runtime errors if API returns incomplete data.
                */}
                {analysis.indicators.rsi && analysis.indicators.rsi.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">RSI (14):</span>
                    <span className="font-medium text-foreground">
                      {/* 
                        ARRAY ACCESS WITH MATH OPERATIONS:
                        [array.length - 1] gets the last element (most recent data).
                        Math.round() converts decimal to integer for cleaner display.
                        This pattern is common when working with time-series data.
                      */}
                      {Math.round(analysis.indicators.rsi[analysis.indicators.rsi.length - 1].value)}
                    </span>
                  </div>
                )}
                {analysis.indicators.macd && analysis.indicators.macd.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">MACD:</span>
                    <span className="font-medium text-foreground">
                      {analysis.indicators.macd[analysis.indicators.macd.length - 1].macd.toFixed(2)}
                    </span>
                  </div>
                )}
                {analysis.indicators.bollingerBands && analysis.indicators.bollingerBands.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">BB %B:</span>
                    <span className="font-medium text-foreground">
                      {(analysis.indicators.bollingerBands[analysis.indicators.bollingerBands.length - 1].percentB * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
                {analysis.indicators.sma && analysis.indicators.sma.length > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">SMA 20:</span>
                      <span className="font-medium text-foreground">
                        {/* 
                          COMPLEX DATA LOOKUP WITH FALLBACK:
                          1. find() searches array for object with period === 20
                          2. ?. (optional chaining) safely accesses value property
                          3. toFixed(2) formats number to 2 decimal places
                          4. || 'N/A' provides fallback if data not found
                          This pattern handles missing or incomplete data gracefully.
                        */}
                        ${analysis.indicators.sma.find(s => s.period === 20)?.value.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">SMA 50:</span>
                      <span className="font-medium text-foreground">
                        ${analysis.indicators.sma.find(s => s.period === 50)?.value.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
            </div>
          </CollapsibleSection>

          {/* Trading Signals - Collapsible */}
          <CollapsibleSection
            title="Trading Signals"
            subtitle={`${analysis.signals.length} signals generated from technical analysis`}
            icon="⚡"
            defaultExpanded={false}
            badge={analysis.signals.length}
          >
            <div>
            <h4 className="font-semibold text-foreground mb-4">Trading Signals</h4>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {analysis.signals.map((signal, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-foreground">{signal.indicator}</span>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        signal.signal === 'buy' 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : signal.signal === 'sell'
                          ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                          : 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
                      }`}>
                        {signal.signal.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {signal.description}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm font-medium text-foreground">
                      {Math.round(signal.strength * 100)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      strength
                    </div>
                  </div>
                </div>
              ))}
              {analysis.signals.length === 0 && (
                <p className="text-gray-500 text-center py-4">No trading signals generated</p>
              )}
            </div>
            </div>
          </CollapsibleSection>

          {/* Terms & Definitions Glossary */}
          <TermsGlossary />
        </div>
      )}
    </div>
  );
}