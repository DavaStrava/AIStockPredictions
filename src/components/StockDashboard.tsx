/*
  CLIENT-SIDE COMPONENT DIRECTIVE:
  'use client' tells Next.js this component runs in the browser, not on the server.
  This is required because we use React hooks (useState, useEffect) and browser APIs.
*/
'use client';

import { useState } from 'react';
// TYPE IMPORTS: Import TypeScript interfaces for type safety
import { TechnicalSignal } from '@/lib/technical-analysis/types';
import { CreateTradeRequest } from '@/types/models';
// HOOK IMPORTS: Import custom hooks for state management
import { usePredictions } from './dashboard/hooks/usePredictions';
import { useStockAnalysis } from './dashboard/hooks/useStockAnalysis';
import { usePortfolioStats } from './trading-journal/hooks/usePortfolioStats';
// COMPONENT IMPORTS: Import child components using path aliases (@/ = src/)
import SimpleStockChart from './SimpleStockChart';
import AdvancedStockChart from './AdvancedStockChart';
import PerformanceMetrics from './PerformanceMetrics';
import StockSearch from './StockSearch';
import AIInsights from './AIInsights';
import TermsGlossary from './TermsGlossary';
import CollapsibleSection from './CollapsibleSection';
import MarketIndicesSidebar from './MarketIndicesSidebar';
import MarketIndexAnalysis from './MarketIndexAnalysis';
import ResponsiveGrid from './ResponsiveGrid';
import TechnicalIndicatorExplanations from './TechnicalIndicatorExplanations';
import MultiColumnLayout from './MultiColumnLayout';
import ResponsiveContainer from './ResponsiveContainer';
import AdditionalInsightsSidebar from './AdditionalInsightsSidebar';
import { TradeEntryModal } from './trading-journal/TradeEntryModal';
import { inferMarketContext } from '@/lib/technical-analysis/explanations';

/*
  STOCK DASHBOARD COMPONENT:
  This component demonstrates advanced UX patterns for data-heavy applications.
  
  KEY UX IMPROVEMENT IMPLEMENTED:
  The component uses a "differential loading" pattern where:
  - Initial page load: Shows full loading spinner (users expect to wait)
  - Individual searches: No loading spinner (feels more responsive)
  - Content builds incrementally without jarring UI changes
  
  This creates a smooth, professional user experience that feels fast and responsive
  while still providing appropriate feedback during longer operations.
*/
export default function StockDashboard() {

  // Trade entry modal state
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [tradeModalSymbol, setTradeModalSymbol] = useState<string | undefined>();
  const [tradeModalPredictionId, setTradeModalPredictionId] = useState<string | undefined>();

  // Use the portfolio stats hook for trade management
  const { createTrade } = usePortfolioStats();

  // Use the stock analysis hook for analysis-related state and operations
  const {
    selectedStock,
    analysis,
    priceData,
    selectedIndex,
    fetchDetailedAnalysis,
    handleIndexClick,
    closeIndexAnalysis,
    clearAnalysis,
  } = useStockAnalysis();

  // Use the predictions hook with fetchDetailedAnalysis as the callback
  const {
    predictions,
    loading,
    searchLoading,
    handleStockSearch,
    removeTile: baseRemoveTile,
  } = usePredictions(fetchDetailedAnalysis);

  /**
   * Wrapper for removeTile that also clears analysis if the removed stock was selected.
   */
  const removeTile = (symbolToRemove: string) => {
    baseRemoveTile(symbolToRemove);
    // Close detailed analysis if it's for the removed stock
    if (selectedStock === symbolToRemove) {
      clearAnalysis();
    }
  };

  /**
   * Opens the trade entry modal with prefilled symbol and prediction ID.
   * Requirements: 9.1, 9.2, 9.3
   */
  const handleLogTrade = (symbol: string, predictionId?: string) => {
    setTradeModalSymbol(symbol);
    setTradeModalPredictionId(predictionId);
    setIsTradeModalOpen(true);
  };

  /**
   * Handles trade submission from the modal.
   */
  const handleTradeSubmit = async (data: Omit<CreateTradeRequest, 'userId'>) => {
    await createTrade(data);
  };

  /**
   * Closes the trade entry modal and clears prefilled data.
   */
  const handleCloseTradeModal = () => {
    setIsTradeModalOpen(false);
    setTradeModalSymbol(undefined);
    setTradeModalPredictionId(undefined);
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
    ADVANCED BACKGROUND STYLING FUNCTION:
    Creates sophisticated visual feedback using gradients, opacity, and hover states.
    This function demonstrates several advanced Tailwind CSS concepts working together.
    
    GRADIENT BACKGROUNDS EXPLAINED:
    - bg-gradient-to-br: Creates a gradient from top-left to bottom-right
    - from-green-100 to-green-200: Light gradient in light mode (subtle depth)
    - dark:from-green-900/30: Dark mode uses darker colors with opacity for contrast
    
    OPACITY SYSTEM:
    - /30 = 30% opacity for base state (subtle but visible)
    - /40 = 40% opacity for hover state (slightly more prominent)
    - This creates layered transparency that works well over dark backgrounds
    
    INTERACTIVE STATES:
    - hover: prefix creates smooth transitions when user hovers over cards
    - Border colors also change on hover for complete visual feedback
    - This provides immediate user feedback that elements are clickable
    
    DESIGN SYSTEM CONSISTENCY:
    - All four states (bullish/bearish/neutral/default) follow the same pattern
    - Color families remain consistent with getDirectionColor function
    - Maintains visual hierarchy while adding sophisticated polish
    
    ACCESSIBILITY CONSIDERATIONS:
    - Gradients provide visual interest without compromising text readability
    - Hover states give clear interaction feedback
    - Color choices work for both light and dark themes
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
    
    WHY THIS PATTERN WORKS WELL WITH THE IMPROVED LOADING LOGIC:
    - Only shows during initial page load (when isNewSearch = false)
    - Individual stock searches bypass this loading screen entirely
    - Creates a clean separation between "app loading" vs "content updating"
    
    BENEFITS:
    1. Cleaner code structure (no nested conditionals in main render)
    2. Better user experience (clear loading feedback for initial load only)
    3. Prevents errors from accessing undefined data during startup
    4. Maintains responsive UI during individual stock searches
    
    LOADING STATE HIERARCHY:
    - Full page loading (this component): Only for initial app load
    - Individual tile loading: Could be added per-tile if needed
    - Background loading: Happens silently for search operations
    
    This creates a layered loading experience that feels natural to users.
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

  /*
    MAIN COMPONENT RENDER RETURN:
    This is the JSX that defines what the component displays.
    
    JSX FUNDAMENTALS:
    - JSX looks like HTML but is actually JavaScript
    - Gets compiled to React.createElement() calls
    - Must return a single parent element (or React Fragment)
    - Can embed JavaScript expressions using curly braces {}
    
    JSX vs HTML DIFFERENCES:
    - className instead of class (class is a reserved word in JavaScript)
    - onClick instead of onclick (camelCase for event handlers)
    - style={{}} uses objects instead of strings
    - Self-closing tags must have /> (like <img /> not <img>)
    
    TAILWIND CSS CLASSES EXPLAINED:
    - space-y-8: Adds 2rem (32px) vertical spacing between child elements
    - This is more maintainable than adding margins to individual elements
    - Tailwind uses a spacing scale: 1=0.25rem, 2=0.5rem, 4=1rem, 8=2rem, etc.
    - Utility-first approach: small, single-purpose classes compose complex designs
  */
  return (
    <ResponsiveContainer variant="wide">
      <MultiColumnLayout
        leftColumn={
          analysis && selectedStock ? (
            <AdditionalInsightsSidebar
              symbol={selectedStock}
              analysis={analysis}
              priceData={priceData}
            />
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm p-4">
              Select a stock to view additional insights
            </p>
          )
        }
        centerColumn={
          <div className="space-y-8">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="hierarchy-critical">Stock Predictions</h2>
            <p className="hierarchy-tertiary mt-1">
              AI-powered technical analysis with real market data
            </p>
          </div>
          
          {/*
            SEARCH COMPONENT INTEGRATION:
            This demonstrates component composition and prop passing patterns.
            
            RESPONSIVE WIDTH:
            - w-full: Full width on mobile (prevents horizontal overflow)
            - sm:w-96: Fixed width (24rem/384px) on tablets+ for better UX
            - relative: Enables absolute positioning for loading indicator
            
            COMPONENT PROPS:
            - onSelectStock: Callback function passed as prop (event handling pattern)
            - Arrow function: (symbol) => handleStockSearch(symbol) creates a closure
            - placeholder: String prop for user guidance
            
            CALLBACK PATTERN:
            When user selects a stock in StockSearch, it calls onSelectStock with the symbol,
            which triggers handleStockSearch to fetch data and update the dashboard.
          */}
          <div className="w-full sm:w-96 relative">
            <StockSearch 
              onSelectStock={(symbol) => handleStockSearch(symbol)}
              placeholder="Search any stock (e.g., Apple, TSLA, Microsoft...)"
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </div>
        
        {/* 
          QUICK ACTIONS SECTION:
          This demonstrates several important React and JavaScript patterns
        */}
        <div className="flex flex-wrap gap-2">
          <span className="text-responsive-label text-gray-600 dark:text-gray-400">Popular:</span>
          {/*
            ARRAY MAPPING PATTERN:
            This is one of the most common patterns in React for rendering lists.
            
            HOW .map() WORKS:
            - Takes an array: ['AAPL', 'GOOGL', 'MSFT', ...]
            - Calls a function for each item: (symbol) => <button>...</button>
            - Returns a new array of JSX elements
            - React renders each element in the array
            
            KEY PROP REQUIREMENT:
            - key={symbol}: React needs unique keys for list items
            - Helps React efficiently update the DOM when the list changes
            - Without keys, React shows warnings and performance suffers
            - Keys should be stable and unique (symbol works here because stock symbols are unique)
            
            ARROW FUNCTION IN onClick:
            - onClick={() => fetchDetailedAnalysis(symbol)}
            - The arrow function prevents immediate execution
            - Without arrow function: onClick={fetchDetailedAnalysis(symbol)} would run immediately
            - With arrow function: Creates a new function that will run when clicked
            
            CLOSURE CONCEPT:
            - The arrow function "closes over" the symbol variable
            - Each button remembers its specific symbol value
            - This is how each button knows which stock to analyze when clicked
          */}
          {['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'AMZN', 'META'].map((symbol) => (
            <button
              key={symbol}
              onClick={() => fetchDetailedAnalysis(symbol)}
              className="px-3 py-1 text-responsive-badge bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {symbol}
            </button>
          ))}
        </div>
      </div>

      {/* 
        RESPONSIVE GRID LAYOUT WITH ENHANCED BREAKPOINTS:
        Using ResponsiveGrid component with progressive column scaling:
        - Mobile (< 768px): 1 column
        - Tablet (768px - 1024px): 2 columns  
        - Desktop (1024px - 1440px): 3 columns
        - Large Desktop (> 1440px): 4 columns
        - Extra Large (> 1536px): 5 columns (auto-generated)
        This provides better space utilization on larger screens.
      */}
      <ResponsiveGrid
        columns={{
          mobile: 1,
          tablet: 2,
          desktop: 3,
          large: 4
        }}
        gap="gap-6"
        minItemWidth="320px"
      >
        {/* 
          ARRAY RENDERING WITH MAP FUNCTION:
          This is React's fundamental pattern for rendering dynamic lists.
          
          HOW MAP WORKS:
          - map() creates a new array by calling a function on each element
          - For each prediction in the array, we return a JSX element
          - React renders all the returned elements as siblings
          
          THE KEY PROP REQUIREMENT:
          - Each element in a list MUST have a unique 'key' prop
          - React uses keys to efficiently update the DOM when the list changes
          - Without keys, React re-renders the entire list on any change
          - With keys, React only updates the specific items that changed
          
          CALLBACK FUNCTION PATTERN:
          - (prediction) => (...) is an arrow function that receives each array item
          - The parameter name 'prediction' is arbitrary - could be 'item', 'stock', etc.
          - The function body returns JSX for that specific prediction
          
          PERFORMANCE CONSIDERATIONS:
          - map() creates a new array, which is fine for UI rendering
          - React's reconciliation algorithm efficiently handles list updates
          - Keys should be stable (don't use array index if list can reorder)
        */}
        {predictions.map((prediction) => (
          <div
            key={prediction.symbol}  // UNIQUE KEY: Required for React's reconciliation
            className={`relative border rounded-lg p-6 cursor-pointer transition-[transform,box-shadow] duration-200 ease-out hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-1 transform ${getDirectionBg(prediction.prediction.direction)}`}
            onClick={() => fetchDetailedAnalysis(prediction.symbol)}  // EVENT HANDLER: Arrow function to pass parameter
          >
            {/* 
              CLOSE BUTTON WITH IMPROVED UX:
              This X button demonstrates several advanced UI/UX patterns:
              
              VISUAL HIERARCHY:
              - opacity-60: Button is subtle by default (60% opacity) to avoid visual clutter
              - hover:opacity-100: Becomes fully visible on hover for clear interaction feedback
              - This creates a "progressive disclosure" pattern where UI elements appear when needed
              
              LAYERED HOVER EFFECTS:
              - hover:bg-black/10: Light overlay on hover (10% black opacity) in light mode
              - dark:hover:bg-white/10: Light overlay on hover (10% white opacity) in dark mode
              - The /10 syntax is Tailwind's opacity modifier (10% = 0.1 alpha)
              - This creates a subtle background highlight without being overwhelming
              
              COLOR TRANSITION SYSTEM:
              - Base state: Neutral gray colors that blend with the design
              - Hover state: Red colors to indicate destructive action (removal)
              - transition-all duration-200: Smooth 200ms transition for all properties
              - This provides clear visual feedback about the button's purpose
              
              ACCESSIBILITY IMPROVEMENTS:
              - title attribute: Provides tooltip text for screen readers and mouse users
              - Adequate size (w-6 h-6 = 24x24px): Meets minimum touch target size guidelines
              - High contrast colors: Ensures visibility for users with visual impairments
              - Clear visual feedback: Hover states help users understand interactivity
              
              EVENT HANDLING PATTERN:
              - e.stopPropagation(): Prevents the click from bubbling up to parent elements
              - This is crucial because the button is inside a clickable card
              - Without this, clicking X would both remove the tile AND open detailed analysis
              - This demonstrates proper event management in nested interactive elements
            */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent tile click when clicking X
                removeTile(prediction.symbol);
              }}
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-all duration-200 z-10 opacity-60 hover:opacity-100"
              title={`Remove ${prediction.symbol}`}
            >
              ✕
            </button>
            
            <div className="flex justify-between items-start mb-4 md:mb-6">
              <div className="space-responsive-compact">
                <h3 className="text-responsive-h4 text-foreground">{prediction.symbol}</h3>
                <p className="text-responsive-price-sm text-foreground">${prediction.currentPrice}</p>
              </div>
              <div className="text-right pr-8"> {/* Add padding to avoid overlap with X button */}
                <span className={`text-responsive-label font-semibold ${getDirectionColor(prediction.prediction.direction)}`}>
                  {prediction.prediction.direction.toUpperCase()}
                </span>
                <p className="text-responsive-caption text-gray-500 mt-1">
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
            <div className="space-responsive-compact mb-4 md:mb-6">
              <div className="flex justify-between text-responsive-body-sm">
                <span className="text-low-contrast">Target:</span>
                <span className="font-semibold text-high-contrast">${prediction.prediction.targetPrice}</span>
              </div>
              <div className="flex justify-between text-responsive-body-sm">
                <span className="text-low-contrast">Timeframe:</span>
                <span className="font-semibold text-high-contrast">{prediction.prediction.timeframe}</span>
              </div>
              <div className="flex justify-between text-responsive-body-sm">
                <span className="text-low-contrast">Volatility:</span>
                {/* 
                  CSS CAPITALIZE: 
                  The 'capitalize' class transforms the first letter to uppercase.
                  This handles cases where API returns "low" but we want "Low".
                */}
                <span className="font-semibold text-high-contrast capitalize">{prediction.riskMetrics.volatility}</span>
              </div>
            </div>

            {/* 
              LOG TRADE BUTTON:
              Allows users to quickly log a trade based on this prediction.
              Requirements: 9.1, 9.2, 9.3
            */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent tile click when clicking Log Trade
                handleLogTrade(prediction.symbol);
              }}
              className="w-full px-3 py-2 text-responsive-body-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              title={`Log a trade for ${prediction.symbol}`}
            >
              Log Trade
            </button>


          </div>
        ))}
      </ResponsiveGrid>

      {/* 
        CONDITIONAL RENDERING WITH MULTIPLE CONDITIONS:
        This section only renders when ALL conditions are true:
        1. analysis exists (not null)
        2. selectedStock has a value (not empty string)
        3. priceData has items (length > 0)
        This prevents showing incomplete analysis UI.
      */}
      {analysis && analysis.summary && selectedStock && priceData.length > 0 && (
        <div className="space-responsive-section">
          <div className="flex justify-between items-center">
            <h3 className="hierarchy-critical">
              Detailed Analysis: {selectedStock}
            </h3>
            {/* 
              CLOSE BUTTON WITH STATE RESET:
              Demonstrates the "reset multiple related states" pattern.
              All analysis-related state is cleared when user closes the section.
              This prevents stale data from showing if user opens different stock.
            */}
            <button
              onClick={clearAnalysis}
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

          {/* Advanced Interactive Charts - Collapsible */}
          <CollapsibleSection
            title="Advanced Chart Analysis"
            subtitle="Interactive charts with 5-year historical data and technical indicators"
            icon="📈"
            defaultExpanded={true}
          >
            <AdvancedStockChart symbol={selectedStock} priceData={priceData} analysis={analysis} />
          </CollapsibleSection>

          {/* Simple Chart Overview - Collapsible */}
          <CollapsibleSection
            title="Quick Price Overview"
            subtitle="Simple price visualization and key metrics"
            icon="📊"
            defaultExpanded={false}
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

          {/* Technical Indicators - Collapsible */}
          <CollapsibleSection
            title="Technical Indicators"
            subtitle="Plain-language explanations with actionable insights"
            icon="📊"
            defaultExpanded={true}
          >
            <TechnicalIndicatorExplanations
              indicators={(() => {
                // Get only the latest signal for each unique indicator
                const latestSignals = new Map<string, TechnicalSignal>();
                analysis.signals.forEach(signal => {
                  const existing = latestSignals.get(signal.indicator);
                  if (!existing || new Date(signal.timestamp) > new Date(existing.timestamp)) {
                    latestSignals.set(signal.indicator, signal);
                  }
                });
                return Array.from(latestSignals.values());
              })()}
              symbol={selectedStock}
              currentPrice={priceData[priceData.length - 1]?.close || 0}
              marketContext={inferMarketContext(
                selectedStock,
                undefined, // sector - could be added later
                undefined, // marketCap - could be added later
                priceData.map(p => ({ close: p.close, date: new Date(p.date) }))
              )}
            />
          </CollapsibleSection>

          {/* Terms & Definitions Glossary */}
          <TermsGlossary />
        </div>
      )}
          </div>
        }
        rightColumn={<MarketIndicesSidebar onIndexClick={handleIndexClick} />}
        sidebarWidth="medium"
      />

      {/* Market Index Analysis Modal */}
      {selectedIndex && (
        <MarketIndexAnalysis
          symbol={selectedIndex}
          onClose={closeIndexAnalysis}
        />
      )}

      {/* Trade Entry Modal */}
      <TradeEntryModal
        isOpen={isTradeModalOpen}
        onClose={handleCloseTradeModal}
        onSubmit={handleTradeSubmit}
        prefillSymbol={tradeModalSymbol}
        prefillPredictionId={tradeModalPredictionId}
      />
    </ResponsiveContainer>
  );
}