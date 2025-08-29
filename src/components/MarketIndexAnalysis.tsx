'use client';

/*
  MODULE LOADING DEBUGGING PATTERN - EDUCATIONAL OVERVIEW
  
  This console.log statement demonstrates an essential debugging technique for React applications,
  particularly useful when troubleshooting component loading and module resolution issues.
  
  🔍 WHY MODULE LOADING LOGS ARE VALUABLE:
  
  1. **COMPONENT LIFECYCLE VERIFICATION**:
     - Confirms the component file is being loaded by the JavaScript engine
     - Helps identify if import/export issues are preventing component registration
     - Useful when components aren't rendering and you need to verify they're being found
  
  2. **BUILD SYSTEM DEBUGGING**:
     - Next.js uses complex bundling with Turbopack/Webpack
     - Module loading logs help verify files are included in the bundle
     - Can identify tree-shaking issues where components are unexpectedly excluded
  
  3. **DEVELOPMENT WORKFLOW BENEFITS**:
     - Immediate feedback when files are processed during development
     - Helps track hot-reload behavior and file watching
     - Useful for debugging dynamic imports and code splitting
  
  🎯 WHEN TO USE MODULE LOADING LOGS:
  
  - **Component Not Rendering**: When a component should appear but doesn't
  - **Import/Export Issues**: When getting "module not found" or similar errors
  - **Build Problems**: When components work in development but fail in production
  - **Dynamic Loading**: When using React.lazy() or dynamic imports
  - **Hot Reload Issues**: When changes aren't reflecting during development
  
  📊 CONSOLE OUTPUT PATTERN:
  
  The format "ComponentName - Module loaded" provides:
  - COMPONENT IDENTIFICATION: Clear indication of which component is loading
  - CONSISTENT NAMING: Easy to search/filter in browser DevTools console
  - TIMING INFORMATION: Shows the order in which modules are processed
  - DEBUGGING CONTEXT: Helps trace execution flow through the application
  
  🔧 PLACEMENT STRATEGY:
  
  This log is placed immediately after 'use client' because:
  - EARLY EXECUTION: Runs as soon as the module is evaluated
  - BEFORE IMPORTS: Executes before any import statements that might fail
  - CLIENT-SIDE ONLY: Only runs in browser context (not during SSR)
  - MINIMAL OVERHEAD: Simple string log with minimal performance impact
  
  💡 PRODUCTION CONSIDERATIONS:
  
  In production applications, consider:
  - Wrapping in development-only conditions: if (process.env.NODE_ENV === 'development')
  - Using proper logging libraries (Winston, Pino) for structured logging
  - Implementing log levels (debug, info, warn, error) for better control
  - Removing or minimizing console output to reduce bundle size and improve performance
  
  🚀 ADVANCED DEBUGGING TECHNIQUES:
  
  This basic pattern can be extended with:
  - Performance timing: console.time('ComponentName loading')
  - Environment information: console.log('ComponentName - Environment:', process.env.NODE_ENV)
  - Bundle analysis: console.log('ComponentName - Bundle chunk:', __webpack_require__.cache)
  - Memory usage: console.log('ComponentName - Memory:', performance.memory)
  
  🎨 REAL-WORLD DEBUGGING SCENARIOS:
  
  1. **Component Not Found**: If this log doesn't appear, the file isn't being imported
  2. **Multiple Loads**: If this log appears multiple times, there might be circular dependencies
  3. **Load Order Issues**: Compare timestamps to understand component loading sequence
  4. **Hot Reload Problems**: Missing logs during development indicate file watching issues
  
  📈 INTEGRATION WITH DEVELOPMENT TOOLS:
  
  This logging pattern works well with:
  - Browser DevTools Console (filter by "MarketIndexAnalysis")
  - React Developer Tools (component tree inspection)
  - Next.js development server logs (build and compilation info)
  - VS Code debugging (breakpoints and variable inspection)
  
  🔄 COMPONENT LIFECYCLE CONTEXT:
  
  This log occurs during the MODULE EVALUATION phase, which happens:
  1. BEFORE component function definition
  2. BEFORE React hooks setup
  3. BEFORE component mounting/rendering
  4. DURING initial JavaScript parsing and execution
  
  Understanding this timing helps debug issues that occur at different lifecycle stages.
  
  ⚡ PERFORMANCE IMPACT:
  
  Module loading logs have minimal performance impact because:
  - They execute only once per module (not per component instance)
  - Simple string operations are very fast
  - Browser console APIs are optimized for development use
  - No complex object serialization or network requests involved
  
  This makes them safe to use during development without significantly affecting app performance.
*/
console.log('MarketIndexAnalysis - Module loaded');

import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, BarChart3, Clock, AlertCircle, Newspaper } from 'lucide-react';
import AdvancedStockChart from './AdvancedStockChart';
import { PriceData } from '@/lib/technical-analysis/types';

interface MarketIndexAnalysisProps {
  symbol: string;
  onClose: () => void;
}

interface IndexAnalysisData {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  technicalAnalysis: {
    rsi: number;
    macd: {
      macd: number;
      signal: number;
      histogram: number;
    };
    movingAverages: {
      sma20: number;
      sma50: number;
      sma200: number;
    };
    support: number;
    resistance: number;
    trend: 'bullish' | 'bearish' | 'neutral';
  };
  aiSummary: string;
  marketNews: Array<{
    title: string;
    summary: string;
    publishedAt: string;
    source: string;
    sentiment: 'positive' | 'negative' | 'neutral';
  }>;
  priceData: PriceData[];
}

export default function MarketIndexAnalysis({ symbol, onClose }: MarketIndexAnalysisProps) {
  console.log('MarketIndexAnalysis - Component mounted with symbol:', symbol);
  
  const [data, setData] = useState<IndexAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('MarketIndexAnalysis - useEffect triggered for symbol:', symbol);
    fetchIndexAnalysis();
  }, [symbol]);

  const fetchIndexAnalysis = async () => {
    console.log('MarketIndexAnalysis - fetchIndexAnalysis called for symbol:', symbol);
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/market-index-analysis?symbol=${encodeURIComponent(symbol)}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      /**
       * DEBUGGING PATTERN - API RESPONSE VALIDATION
       * 
       * These console.log statements demonstrate essential debugging practices for
       * React components that integrate with external APIs.
       * 
       * 🔍 WHY DEBUGGING IS CRITICAL IN API INTEGRATION:
       * - External APIs can return unexpected data structures
       * - Network issues may cause partial or corrupted responses
       * - Component state updates depend on specific response formats
       * - Chart rendering requires exact data structures to function properly
       * - Users expect reliable financial data for investment decisions
       * 
       * 📊 STRUCTURED DEBUGGING APPROACH:
       * 
       * 1. **DESCRIPTIVE PREFIXES**: "Market Index Analysis -" helps identify the source
       *    component when multiple components are logging simultaneously in production
       * 
       * 2. **FULL RESPONSE LOGGING**: Log the complete result object to inspect:
       *    - Overall response structure and nested properties
       *    - Data types and formats returned by the API
       *    - Any unexpected fields or missing expected fields
       *    - Error messages or status codes embedded in the response
       * 
       * 3. **SPECIFIC FLAG VALIDATION**: Log result.success separately to verify:
       *    - The API's success/failure indication is working correctly
       *    - Boolean logic in conditional statements will behave as expected
       *    - The response follows the expected { success: boolean, data?: any, error?: string } pattern
       * 
       * 🛡️ PRODUCTION DEBUGGING BENEFITS:
       * - EARLY DETECTION: Spot API contract changes before they break the UI
       * - DATA VALIDATION: Verify response structure matches TypeScript interfaces
       * - NETWORK MONITORING: Track API reliability and response consistency
       * - USER EXPERIENCE: Prevent blank charts or error screens from bad data
       * 
       * 💡 DEBUGGING WORKFLOW:
       * When issues occur, developers can:
       * 1. Check browser console for these logs
       * 2. Verify API is returning expected data structure
       * 3. Confirm success flag is boolean true/false as expected
       * 4. Trace data flow from API → component state → chart rendering
       * 
       * 🔧 CONSOLE.LOG BEST PRACTICES DEMONSTRATED:
       * - Use consistent prefixes for easy filtering in browser DevTools
       * - Log both the full object and specific critical fields
       * - Place logs immediately after data transformation points
       * - Include context about what the log represents
       * 
       * 🚀 PRODUCTION CONSIDERATIONS:
       * In production builds, consider:
       * - Wrapping in development-only conditions: if (process.env.NODE_ENV === 'development')
       * - Replacing with proper error tracking (Sentry, LogRocket, etc.)
       * - Using structured logging libraries for better searchability
       * - Removing or minimizing console output to avoid performance impact
       * 
       * This debugging pattern is especially valuable when integrating with financial APIs
       * where data accuracy is critical and response formats may change over time.
       */
      console.log('Market Index Analysis - Full API response:', result);
      console.log('Market Index Analysis - Success flag:', result.success);

      if (result.success) {
        /*
          DEBUGGING AND DEVELOPMENT LOGGING PATTERN:
          
          These console.log statements demonstrate important debugging practices for React applications:
          
          🔍 WHY LOGGING IS ESSENTIAL IN REACT:
          - React components re-render frequently, making it hard to track data flow
          - API responses can be complex nested objects that are difficult to inspect
          - State updates happen asynchronously, so timing issues can occur
          - Network requests may succeed but return unexpected data structures
          
          📊 STRUCTURED LOGGING APPROACH:
          1. DESCRIPTIVE PREFIXES: "Market Index Analysis -" helps identify the source component
             when multiple components are logging simultaneously
          2. DATA INSPECTION: Log the entire result.data object to see its complete structure
          3. SPECIFIC METRICS: Log priceData length to verify data availability for charts
          
          🛡️ DEFENSIVE PROGRAMMING WITH OPTIONAL CHAINING:
          result.data.priceData?.length || 0 demonstrates several important concepts:
          
          - OPTIONAL CHAINING (?.): Safely accesses priceData even if it doesn't exist
          - LOGICAL OR (||): Provides fallback value (0) if length is undefined
          - NULL SAFETY: Prevents "Cannot read property 'length' of undefined" errors
          
          🎯 PRACTICAL DEBUGGING BENEFITS:
          - Verify API response structure matches TypeScript interfaces
          - Confirm data is being received before component tries to render it
          - Identify when API returns success=true but with empty/missing data
          - Track data flow from API → component state → child components (charts)
          
          💡 PRODUCTION CONSIDERATIONS:
          In production builds, these logs should be:
          - Removed or wrapped in development-only conditions: if (process.env.NODE_ENV === 'development')
          - Replaced with proper error tracking (Sentry, LogRocket, etc.)
          - Used sparingly to avoid console spam and potential performance impact
          
          🔧 ALTERNATIVE DEBUGGING APPROACHES:
          - React DevTools for component state inspection
          - Network tab in browser DevTools for API response analysis
          - Breakpoints in browser debugger for step-through debugging
          - Custom error boundaries for catching and logging React errors
          
          This logging pattern is especially valuable when integrating with external APIs
          where the data structure might change or when debugging chart rendering issues
          that depend on specific data formats.
        */
        console.log('Market Index Analysis - Received data:', result.data);
        console.log('Market Index Analysis - Price data length:', result.data.priceData?.length || 0);
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch index analysis');
      }
    } catch (error) {
      console.error('Market Index Analysis - Error occurred:', error);
      console.error('Market Index Analysis - Error type:', typeof error);
      setError(error instanceof Error ? error.message : 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${formatPrice(change)}`;
  };

  const formatChangePercent = (changePercent: number) => {
    const sign = changePercent >= 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(2)}%`;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'bullish': return 'text-green-600 dark:text-green-400';
      case 'bearish': return 'text-red-600 dark:text-red-400';
      case 'neutral': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'negative': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'neutral': return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {symbol} Analysis
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Error</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchIndexAnalysis}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.name} ({data.symbol})
            </h2>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatPrice(data.currentPrice)}
              </span>
              <div className={`flex items-center gap-1 ${getChangeColor(data.change)}`}>
                {data.change >= 0 ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )}
                <span className="font-semibold">
                  {formatChange(data.change)} ({formatChangePercent(data.changePercent)})
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-2">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Price Chart & Technical Analysis
              </h3>
              {data.priceData && data.priceData.length > 0 && (
                <AdvancedStockChart
                  priceData={data.priceData}
                  symbol={data.symbol}
                />
              )}
            </div>
          </div>

          {/* Technical Indicators */}
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Technical Indicators
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">RSI (14)</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {data.technicalAnalysis.rsi.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">MACD</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {data.technicalAnalysis.macd.macd.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">SMA 20</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatPrice(data.technicalAnalysis.movingAverages.sma20)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">SMA 50</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatPrice(data.technicalAnalysis.movingAverages.sma50)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">SMA 200</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatPrice(data.technicalAnalysis.movingAverages.sma200)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Support</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatPrice(data.technicalAnalysis.support)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Resistance</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatPrice(data.technicalAnalysis.resistance)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Trend</span>
                  <span className={`font-medium capitalize ${getTrendColor(data.technicalAnalysis.trend)}`}>
                    {data.technicalAnalysis.trend}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            AI Market Summary
          </h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {data.aiSummary}
          </p>
        </div>

        {/* Market News */}
        {data.marketNews && data.marketNews.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              Market News & Impact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.marketNews.map((news, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
                      {news.title}
                    </h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSentimentColor(news.sentiment)}`}>
                      {news.sentiment}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                    {news.summary}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{news.source}</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{news.publishedAt}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}