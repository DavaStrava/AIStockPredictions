'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, BarChart3 } from 'lucide-react';

interface MarketIndex {
  symbol: string;          // Display symbol (e.g., "NASDAQ", "S&P 500")
  tickerSymbol: string;    // Original ticker symbol (e.g., "^IXIC", "^GSPC")
  name: string;
  price: number;
  change: number;
  changePercent: number;
  isOpen: boolean;
  marketStatus: string;
  isExtendedHours: boolean;
  isFuturesTime: boolean;
  isShowingFutures: boolean;
  dataSource: string;
  lastUpdate: string;
}

interface MarketIndicesProps {
  onIndexClick: (symbol: string) => void;
}

export default function MarketIndicesSidebar({ onIndexClick }: MarketIndicesProps) {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchMarketIndices();
    const interval = setInterval(fetchMarketIndices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchMarketIndices = async () => {
    try {
      setError(null);
      const response = await fetch('/api/market-indices');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setIndices(data.data);
        if (data.note) {
          console.info('Market Indices:', data.note);
        }
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

  const formatPrice = (price: number | undefined | null) => {
    if (price == null) return '0.00';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatChange = (change: number | undefined | null) => {
    if (change == null) return '+0.00';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${formatPrice(change)}`;
  };

  const formatChangePercent = (changePercent: number | undefined | null) => {
    if (changePercent == null) return '0.00%';
    const sign = changePercent >= 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(2)}%`;
  };

  const getChangeColor = (change: number | undefined | null) => {
    if (change == null) return 'text-gray-600 dark:text-gray-400';
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getChangeBg = (change: number | undefined | null) => {
    if (change == null) return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    if (change > 0) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    if (change < 0) return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Market Indices</h3>
        </div>
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

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Market Indices</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
          <button
            onClick={fetchMarketIndices}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">US Market Indices</h3>
      </div>

      <div className="space-y-4">
        {indices.map((index) => (
          <div
            key={index.symbol}
            onClick={() => {
              /*
                DEBUGGING PATTERN - COMPONENT INTERACTION TRACING
                
                This console.log demonstrates essential debugging practices for React component
                interactions, especially when data flows between components through callbacks.
                
                🔍 WHY DEBUGGING IS CRITICAL IN COMPONENT COMMUNICATION:
                - Props and callbacks create complex data flows between components
                - User interactions trigger cascading effects across multiple components
                - State updates are asynchronous and may not happen immediately
                - Integration bugs often occur at component boundaries
                - Data transformation can happen at different levels of the component tree
                
                📊 STRUCTURED DEBUGGING APPROACH:
                
                1. **DESCRIPTIVE PREFIXES**: "MarketIndicesSidebar -" helps identify the source
                   component when multiple components are logging simultaneously in production
                
                2. **INPUT VALIDATION**: Log the parameter being passed to verify:
                   - The correct data is being passed to the parent component
                   - Data format matches expectations (technical symbol vs display name)
                   - No corruption or transformation occurred during user interaction
                
                3. **INTERACTION CONFIRMATION**: Confirms the click handler executed successfully
                   - Verifies the onClick event fired correctly
                   - Shows which specific index was clicked by the user
                   - Provides audit trail for user actions
                
                🛡️ PRODUCTION DEBUGGING BENEFITS:
                - COMPONENT INTEGRATION: Verify data flows correctly between components
                - USER INTERACTION TRACKING: Trace user actions through the component tree
                - CALLBACK VALIDATION: Ensure parent components receive correct data
                - PROP VERIFICATION: Confirm the right technical symbols are being passed
                
                💡 DEBUGGING WORKFLOW:
                When issues occur with market index selection, developers can:
                1. Check browser console for this log entry
                2. Verify the sidebar is passing the correct technical symbol
                3. Trace the data flow to the parent StockDashboard component
                4. Confirm the MarketIndexAnalysis component receives the right symbol
                5. Identify where in the chain any issues occur
                
                🔧 CONSOLE.LOG BEST PRACTICES DEMONSTRATED:
                - Use consistent prefixes for easy filtering in browser DevTools
                - Log the actual data being passed, not just generic messages
                - Include context about what the log represents
                - Place logs at key interaction points in the user flow
                
                🚀 PRODUCTION CONSIDERATIONS:
                In production builds, consider:
                - Wrapping in development-only conditions: if (process.env.NODE_ENV === 'development')
                - Replacing with proper analytics tracking (Google Analytics, Mixpanel, etc.)
                - Using structured logging libraries for better searchability
                - Removing or minimizing console output to avoid performance impact
                
                📈 COMPONENT ARCHITECTURE CONTEXT:
                This debugging is especially valuable because:
                - The sidebar uses dual symbol architecture (display vs technical symbols)
                - User clicks need to pass technical symbols for accurate API calls
                - The parent component needs to handle the symbol correctly for analysis
                - Integration between UI components and data fetching must work seamlessly
                
                🎯 REAL-WORLD DEBUGGING SCENARIO:
                If a user clicks "S&P 500" but the analysis fails to load, this log helps determine:
                - Did the click handler fire? (This log should appear)
                - What symbol was passed? (Should be "^GSPC", not "S&P 500")
                - Did the parent component receive it? (Check StockDashboard logs)
                - Did the API call use the right symbol? (Check network tab)
                
                This systematic approach makes debugging component interactions much more efficient
                and helps maintain reliable user experiences in complex React applications.
              */
              console.log('MarketIndicesSidebar - Index clicked:', index.tickerSymbol);
              onIndexClick(index.tickerSymbol);
            }}
            className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${getChangeBg(index.change)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                  {index.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {index.symbol}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {index.change >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {formatPrice(index.price)}
              </div>
              <div className={`text-sm font-medium ${getChangeColor(index.change)}`}>
                {formatChange(index.change)} ({formatChangePercent(index.changePercent)})
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              {/* Market status indicator */}
              {index.isFuturesTime ? (
                <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" title="Futures Trading" />
              ) : index.isExtendedHours ? (
                <div className="h-3 w-3 rounded-full bg-orange-500" title="Extended Hours" />
              ) : index.isOpen ? (
                <div className="h-3 w-3 rounded-full bg-green-500" title="Market Open" />
              ) : (
                <Clock className="h-3 w-3 text-gray-400" />
              )}

              {/* Market status text */}
              <span
                className={`text-xs font-medium cursor-help ${
                  index.isFuturesTime
                    ? 'text-blue-600 dark:text-blue-400'
                    : index.isExtendedHours
                      ? 'text-orange-600 dark:text-orange-400'
                      : index.isOpen
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-500 dark:text-gray-400'
                }`}
                title={getMarketSessionExplanation(index.marketStatus)}
              >
                {index.marketStatus}
              </span>

              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {index.lastUpdate}
              </span>

              {/* Additional context for futures/extended hours */}
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