/*
  MARKET INDICES SIDEBAR COMPONENT - EDUCATIONAL OVERVIEW

  This component demonstrates several important React and software engineering concepts:
  
  🏗️ ARCHITECTURAL PATTERNS:
  - Smart Component Pattern: Manages its own state and data fetching
  - Polling Pattern: Automatically refreshes data at regular intervals
  - Error Boundary Pattern: Graceful error handling with user feedback
  - Responsive Design: Mobile-first layout with progressive enhancement
  
  🔧 REACT PATTERNS:
  - useState for state management (data, loading, error states)
  - useEffect for side effects (API calls, timers, cleanup)
  - Conditional rendering based on component state
  - Event handling with callback props
  - Component composition with external icon library
  
  📊 DATA MANAGEMENT CONCEPTS:
  - Real-time data fetching with automatic refresh
  - Loading states and error handling
  - Data formatting and presentation
  - Interactive elements with hover states
  
  🎨 UI/UX PATTERNS:
  - Loading skeletons for better perceived performance
  - Error states with retry functionality
  - Visual feedback for data changes (colors, icons)
  - Accessibility considerations (proper contrast, hover states)
  
  💡 LEARNING OBJECTIVES:
  - Understanding React hooks and their lifecycle
  - Working with external APIs and handling responses
  - Implementing polling for real-time data updates
  - Creating responsive and accessible UI components
  - Managing component state and side effects
  
  CLIENT-SIDE DIRECTIVE:
  'use client' tells Next.js this component runs in the browser, not on the server.
  Required for React hooks, browser APIs, and interactive functionality.
*/
'use client';

/*
  REACT HOOKS IMPORT:
  - useState: Manages component state (data that can change over time)
  - useEffect: Handles side effects (API calls, subscriptions, timers, cleanup)
*/
import { useState, useEffect } from 'react';

/*
  ICON LIBRARY IMPORT:
  Lucide React provides SVG icons as React components.
*/
import { TrendingUp, TrendingDown, Clock, BarChart3 } from 'lucide-react';

/*
  TYPESCRIPT INTERFACE DEFINITIONS:
  Interfaces define the shape of data structures and provide compile-time type checking.
*/

/*
  MARKET INDEX DATA MODEL:
  This interface defines the structure of market index data from our API.
*/
interface MarketIndex {
  symbol: string;           // e.g., "^GSPC", "^DJI", "^IXIC"
  name: string;             // e.g., "S&P 500", "Dow Jones"
  price: number;            // e.g., 4500.25
  change: number;           // e.g., +15.30
  changePercent: number;    // e.g., 0.34 for +0.34%
  isOpen: boolean;          // true = open, false = closed
  marketStatus: string;     // "Market Open", "Pre-Market", "After Hours", "Futures"
  isExtendedHours: boolean; // extended trading hours
  isFuturesTime: boolean;   // futures more relevant

  /*
    Data source flags for UI transparency and logging/analytics.
  */
  isShowingFutures: boolean; // currently displaying futures data
  dataSource: string;        // "futures", "regular", etc.

  lastUpdate: string;        // e.g., "2:30 PM ET"
}

/*
  COMPONENT PROPS INTERFACE:
  Follows React's "props down, events up" pattern.
*/
interface MarketIndicesProps {
  onIndexClick: (symbol: string) => void; // callback on index click
}

/*
  MARKET INDICES SIDEBAR COMPONENT:
  Smart component: manages its own state, data fetching, and UI states.
*/
export default function MarketIndicesSidebar({ onIndexClick }: MarketIndicesProps) {
  /*
    STATE: indices, loading, error
  */
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /*
    Helper: explain market session for tooltips.
  */
  const getMarketSessionExplanation = (status: string) => {
    switch (status) {
      case 'Market Open':
        return 'Regular trading session (9:30 AM - 4:00 PM ET). Real-time prices with full liquidity.';
      case 'Pre-Market':
        return 'Pre-market trading (4:00 AM - 9:30 AM ET). Limited liquidity, prices may be volatile.';
      case 'After Hours':
        return 'After-hours trading (4:00 PM - 8:00 PM ET). Extended session with reduced volume.';
      case 'Futures':
        return 'Futures contracts trading. Forward-looking prices indicating market sentiment for next session.';
      case 'Market Closed':
        return 'Markets are closed. Showing last available prices from previous session.';
      default:
        return 'Market status information unavailable.';
    }
  };

  /*
    LIFECYCLE: initial fetch + polling (every 5 minutes).
  */
  useEffect(() => {
    fetchMarketIndices();
    const interval = setInterval(fetchMarketIndices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  /*
    DATA FETCH: robust error handling.
  */
  const fetchMarketIndices = async () => {
    try {
      setError(null);
      const response = await fetch('/api/market-indices');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.success) {
        setIndices(data.data);
        if (data.note) console.info('Market Indices:', data.note);
      } else {
        throw new Error(data.error || 'Failed to fetch market indices');
      }
    } catch (error) {
      console.error('Failed to fetch market indices:', error);
      setError('Failed to load market data');
    } finally {
      setLoading(false);
    }
  };

  /*
    FORMATTERS
  */
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${formatPrice(change)}`;
  };

  const formatChangePercent = (changePercent: number) => {
    const sign = changePercent >= 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(2)}%`;
  };

  /*
    STYLE HELPERS
  */
  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getChangeBg = (change: number) => {
    if (change > 0) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    if (change < 0) return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
  };

  /*
    LOADING STATE (skeleton)
  */
  if (loading) {
    return (
      <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 p-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Market Indices</h3>
        </div>

        {/* Skeleton items */}
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /*
    ERROR STATE
  */
  if (error) {
    return (
      <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 p-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Market Indices</h3>
        </div>

        {/* Error message */}
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
          <button onClick={fetchMarketIndices} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  /*
    MAIN RENDER
  */
  return (
    <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">US Market Indices</h3>
      </div>

      {/* Indices list */}
      <div className="space-y-4">
        {indices.map((index) => (
          <div
            key={index.symbol}
            onClick={() => onIndexClick(index.symbol)}
            className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${getChangeBg(index.change)}`}
          >
            {/* Card header */}
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{index.name}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">{index.symbol}</p>
              </div>
              <div className="flex items-center gap-1">
                {index.change >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>

            {/* Price data */}
            <div className="space-y-1">
              <div className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(index.price)}</div>
              <div className={`text-sm font-medium ${getChangeColor(index.change)}`}>
                {formatChange(index.change)} ({formatChangePercent(index.changePercent)})
              </div>
            </div>

            {/* Metadata footer */}
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              {/* Status icon */}
              {index.isFuturesTime ? (
                <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" title="Futures Trading" />
              ) : index.isExtendedHours ? (
                <div className="h-3 w-3 rounded-full bg-orange-500" title="Extended Hours" />
              ) : index.isOpen ? (
                <div className="h-3 w-3 rounded-full bg-green-500" title="Market Open" />
              ) : (
                <Clock className="h-3 w-3 text-gray-400" />
              )}

              {/* Status text */}
              <span
                className={
                  'text-xs font-medium cursor-help ' +
                  (index.isFuturesTime
                    ? 'text-blue-600 dark:text-blue-400'
                    : index.isExtendedHours
                    ? 'text-orange-600 dark:text-orange-400'
                    : index.isOpen
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-500 dark:text-gray-400')
                }
                title={getMarketSessionExplanation(index.marketStatus)}
              >
                {index.marketStatus}
              </span>

              {/* Separator */}
              <span className="text-xs text-gray-400">•</span>

              {/* Timestamp */}
              <span className="text-xs text-gray-500 dark:text-gray-400">{index.lastUpdate}</span>

              {/* Context label (futures/extended) */}
              {(index.isFuturesTime || index.isExtendedHours) && (
                <>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {index.isFuturesTime ? 'Futures Data' : 'Extended Session'}
                  </span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Component footer with legend */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Data refreshes every 5 minutes • Futures shown during off-hours
          </p>
          <div className="flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-gray-500 dark:text-gray-400">Live</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-orange-500"></div>
              <span className="text-gray-500 dark:text-gray-400">Extended</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-gray-500 dark:text-gray-400">Futures</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/*
  COMPONENT ARCHITECTURE SUMMARY - KEY LEARNING TAKEAWAYS:
  - Smart component pattern (state, fetch, UI states)
  - Polling with cleanup
  - Error handling and graceful fallbacks
  - Conditional rendering patterns
  - Consistent, accessible UI with Tailwind
*/