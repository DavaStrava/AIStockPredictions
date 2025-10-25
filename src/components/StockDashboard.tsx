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
import { inferMarketContext } from '@/lib/technical-analysis/explanations';

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
  console.log('StockDashboard - Component loaded');
  /*
    REACT STATE MANAGEMENT WITH TYPESCRIPT:
    useState is React's primary way to add state to functional components.
    
    ANATOMY OF useState:
    const [currentValue, setterFunction] = useState<Type>(initialValue);
    
    DESTRUCTURING ASSIGNMENT:
    - useState returns an array with exactly 2 elements
    - [0]: Current state value
    - [1]: Function to update the state
    - We use array destructuring to assign meaningful names
    
    TYPESCRIPT GENERICS:
    - <PredictionResult[]> tells TypeScript what type this state holds
    - Provides compile-time type checking and IDE autocomplete
    - Prevents bugs by catching type mismatches early
    
    STATE ORGANIZATION STRATEGY:
    This component uses multiple useState calls instead of one large object because:
    1. Each piece of state has different update patterns
    2. React can optimize re-renders when only specific state changes
    3. Code is more readable with descriptive variable names
    4. TypeScript types are simpler and more specific
  */
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);        // Array of stock predictions from API
  const [selectedStock, setSelectedStock] = useState<string>('');               // Currently selected stock symbol for detailed view
  const [analysis, setAnalysis] = useState<TechnicalAnalysisResult | null>(null); // Detailed technical analysis data (null when none selected)
  const [priceData, setPriceData] = useState<PriceData[]>([]);                  // Historical price data for chart visualization
  const [loading, setLoading] = useState(true);                                // Global loading state for initial page load
  const [searchLoading, setSearchLoading] = useState(false);                  // Separate loading state for individual stock searches
  const [customSymbol, setCustomSymbol] = useState('');                        // User input for custom stock symbol search
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null);     // Selected market index for detailed analysis

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
        /*
          INITIAL LOAD BEHAVIOR:
          Called without parameters, so:
          - symbols = undefined (loads default popular stocks)
          - isNewSearch = false (uses replacement behavior, not merge)
          This ensures clean initial state with popular stocks only
        */
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
    2. Default parameter values (isNewSearch = false)
    3. Conditional URL building using ternary operator
    4. Proper error handling with try-catch-finally
    5. State management during async operations
    
    PARAMETER EXPLANATION:
    - symbols?: Optional string of stock symbols to fetch
    - isNewSearch = false: Boolean flag with default value indicating if this is a new search
      The default value means if not provided, it defaults to false (existing behavior)
  */
  const fetchPredictions = async (symbols?: string, isNewSearch = false) => {
    try {
      /*
        IMPROVED LOADING STATE PATTERN:
        This conditional loading patttes a better user experience by distinguishing
        between differf data fetching o
      
      // CONDITIONAL URL BNG SPINNER:
        - Initial page load (isNewSearch = false): Show full loading spinner
          Users expect to wait when first visiting the page
          The entire interface is empty, so a loading state makes sense
        
        WHEN NOT TO SHOW LOADING SPINNER:
        - Individual stock searches (isNewSearch = true): No loading spinner
          Users are adding to existing content, not waiting for everything to load
          Existing stock tiles remain interactive and visible
          New tiles appear smoothly without jarring UI changes
        
        UX BENEFITS:
        1. Perceived Performance: App feels faster for searches
        2. Continuous Interaction: Users can interact with existing tiles during searches
        3. Progressive Enhancement: Content builds up incrementally
        4. Reduced Cognitive Load: No disruptive loading states for minor actions
        
        TECHNICAL IMPLEMENTATION:
        - Uses the isNewSearch parameter to determine loading behavior
        - Default value (false) maintains backward compatibility
        - Loading state is managed at the component level for fine-grained control
      */
      if (!isNewSearch) {
        setLoading(true);
      }
      
      /*
        CONDITIONAL URL BUILDING WITH TERNARY OPERATOR:
        This demonstrates the ternary operator pattern: condition ? valueIfTrue : valueIfFalse
        
        BREAKDOWN:
        - symbols: The condition we're checking (truthy/falsy)
        - ? : The ternary operator (shorthand for if/else)
        - First value: Used if symbols exists and is not empty
        - Second value: Used if symbols is null, undefined, or empty string
        
        TEMPLATE LITERALS:
        - Backticks (`) allow string interpolation with ${variable}
        - This is more readable than string concatenation with +
        - Example: `Hello ${name}` instead of "Hello " + name
        
        API DESIGN PATTERN:
        - Single endpoint handles both specific requests and default data
        - Query parameters (?symbols=...) pass data to the server
        - Default symbols represent popular/trending stocks for initial load
        - This reduces the number of API endpoints needed
      */
      const url = symbols 
        ? `/api/predictions?symbols=${symbols}`
        : '/api/predictions?symbols=AAPL,GOOGL,MSFT,TSLA,NVDA';
      
      /*
        FETCH API WITH ASYNC/AWAIT PATTERN:
        Modern JavaScript way to make HTTP requests, replacing older XMLHttpRequest.
        
        ASYNC/AWAIT EXPLAINED:
        - await pauses function execution until the Promise resolves
        - Makes asynchronous code look and behave like synchronous code
        - Much more readable than .then().catch() chains
        - Can only be used inside functions marked with 'async'
        
        ERROR HANDLING STRATEGY:
        - fetch() only rejects for network errors, not HTTP error status codes
        - We must manually check response.ok (true for status 200-299)
        - Throwing an error here will be caught by the try-catch block
        - This ensures consistent error handling for all failure types
      */
      const response = await fetch(url);
      
      /*
        HTTP STATUS CODE VALIDATION:
        response.ok is a boolean that's true for successful HTTP status codes (200-299).
        Common status codes:
        - 200: OK (success)
        - 404: Not Found
        - 500: Internal Server Error
        - 401: Unauthorized
        
        WHY WE CHECK THIS:
        - fetch() considers the request successful even for 404 or 500 errors
        - Only network failures (no internet, server down) cause fetch() to reject
        - Manual checking ensures we handle all types of failures consistently
      */
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      /*
        JSON PARSING WITH ERROR HANDLING:
        response.json() is also async and can fail if:
        - Response body is not valid JSON
        - Response is empty
        - Server returns HTML error page instead of JSON
        
        AWAIT PATTERN:
        - This is the second await in our function
        - First await gets the response object
        - Second await extracts and parses the JSON body
        - Both operations can fail and will be caught by try-catch
      */
      const data = await response.json();
      
      // API RESPONSE VALIDATION: Check if our API returned success flag
      if (data.success) {
        /*
          CONDITIONAL STATE UPDATE PATTERN:
          This demonstrates two different ways to update state based on user intent:
          1. New search: Merge new data with existing data (additive behavior)
          2. Default load: Replace all data (replacement behavior)
          
          This pattern is common in search interfaces where users expect:
          - Initial load: Show default/popular items
          - Search results: Add searched items to the top, keep others for context
        */
        if (isNewSearch && symbols) {
          /*
            ARRAY MANIPULATION FOR SEARCH RESULTS:
            This code implements a "search and merge" pattern:
            
            Step 1: Get new predictions from API response
            Step 2: Filter existing predictions to remove duplicates
            Step 3: Combine arrays with new items first
            
            DUPLICATE REMOVAL LOGIC:
            - filter() creates a new array with items that pass the test
            - some() returns true if ANY item in the array matches the condition
            - The condition checks if the symbol already exists in new predictions
            - !some() means "keep items that DON'T have matching symbols"
            
            ARRAY SPREAD OPERATOR:
            [...newPredictions, ...existingPredictions] creates a new array by:
            - Spreading all items from newPredictions first (top of list)
            - Then spreading all items from existingPredictions (bottom of list)
            This maintains order: new search results appear at the top
          */
          const newPredictions = data.data;
          const existingPredictions = predictions.filter(p => 
            !newPredictions.some((np: PredictionResult) => np.symbol === p.symbol)
          );
          setPredictions([...newPredictions, ...existingPredictions]);
        } else {
          /*
            DEFAULT BEHAVIOR: Complete replacement
            When not a new search (initial load, refresh, etc.):
            - Replace entire predictions array with API response
            - This is simpler and appropriate for non-search scenarios
            - Maintains existing behavior for backward compatibility
          */
          setPredictions(data.data);
        }
      } else {
        console.error('Predictions API error:', data.error);
        setPredictions([]); // Reset to empty array on error
      }
    } catch (error) {
      // CATCH BLOCK: Handle any errors that occurred during the try block
      console.error('Failed to fetch predictions:', error);
      setPredictions([]); // Ensure UI shows empty state on error
    } finally {
      // FINALLY BLOCK: Only hide loading if it was set (not for individual searches)
      if (!isNewSearch) {
        setLoading(false);
      }
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
    NEW SEARCH HANDLER FUNCTION:
    This function demonstrates the "composite operation" pattern where multiple
    related actions are performed together to create a cohesive user experience.
    
    FUNCTION FLOW:
    1. Fetch predictions for the searched symbol with isNewSearch=true
    2. Immediately open detailed analysis for the same symbol
    
    PARAMETER USAGE EXPLANATION:
    - fetchPredictions(symbol, true): The 'true' parameter indicates this is a new search
      This triggers the "merge" behavior instead of "replace" behavior
      Result: New stock appears at top of list, existing stocks remain visible
    
    LOADING STATE UX IMPROVEMENT:
    The isNewSearch=true parameter also prevents the full-page loading spinner from showing.
    This creates a better user experience because:
    - Initial page load: Shows loading spinner (user expects to wait)
    - Individual searches: No loading spinner (feels more responsive)
    - The new stock tile appears smoothly without jarring UI changes
    - Users can continue interacting with existing tiles while search completes
    
    ASYNC OPERATION SEQUENCING:
    - await ensures fetchPredictions completes before fetchDetailedAnalysis starts
    - This prevents race conditions and ensures data is available for analysis
    - Sequential execution provides predictable user experience
    
    USER EXPERIENCE DESIGN:
    - User searches for a stock → stock appears at top of list (no loading spinner)
    - Detailed analysis opens automatically → immediate insights
    - Previous stocks remain visible → context is preserved
    - This creates a smooth, intuitive search-to-analysis workflow
  */
  const handleStockSearch = async (symbol: string) => {
    try {
      setSearchLoading(true);
      await fetchPredictions(symbol, true);  // Merge new stock with existing predictions
      await fetchDetailedAnalysis(symbol);   // Open detailed analysis immediately
    } catch (error) {
      /*
        ERROR HANDLING IN ASYNC FUNCTIONS:
        This catch block demonstrates proper error handling for composite async operations.
        
        WHY THIS CATCH BLOCK IS IMPORTANT:
        1. GRACEFUL DEGRADATION: If either API call fails, the app doesn't crash
        2. USER FEEDBACK: Errors are logged for debugging without breaking the UI
        3. STATE CONSISTENCY: The finally block ensures loading state is always cleared
        
        WHAT HAPPENS WITHOUT THIS CATCH:
        - Unhandled promise rejections could crash the component
        - Loading spinner might stay visible forever if an error occurs
        - Users would see no feedback when searches fail
        
        ERROR LOGGING STRATEGY:
        - console.error() preserves the full error object with stack trace
        - In production, this could be replaced with error monitoring service
        - The error parameter contains details about what went wrong (network, API, etc.)
        
        COMPOSITE OPERATION ERROR HANDLING:
        Since this function calls two async operations sequentially:
        - If fetchPredictions fails, fetchDetailedAnalysis won't run
        - If fetchDetailedAnalysis fails, the prediction data is still added
        - This provides partial success behavior rather than all-or-nothing
      */
      console.error('Error in handleStockSearch:', error);
    } finally {
      /*
        FINALLY BLOCK GUARANTEE:
        The finally block ALWAYS executes, regardless of success or failure.
        This is crucial for cleanup operations like resetting loading states.
        
        WHY FINALLY IS ESSENTIAL HERE:
        - Ensures loading spinner disappears even if API calls fail
        - Prevents UI from getting stuck in loading state
        - Maintains consistent user experience across all scenarios
        
        EXECUTION ORDER:
        1. try block executes (API calls)
        2. If error occurs, catch block executes
        3. finally block ALWAYS executes last
        4. Loading state is guaranteed to be reset
        
        ALTERNATIVE APPROACHES:
        Without finally, you'd need to call setSearchLoading(false) in both
        the try and catch blocks, leading to code duplication and potential bugs.
      */
      setSearchLoading(false);
    }
  };

  // REMOVE TILE HANDLER: Remove individual stock from predictions
  const removeTile = (symbolToRemove: string) => {
    try {
      setPredictions(predictions.filter(p => p.symbol !== symbolToRemove));
      // Close detailed analysis if it's for the removed stock
      if (selectedStock === symbolToRemove) {
        setAnalysis(null);
        setPriceData([]);
        setSelectedStock('');
      }
    } catch (error) {
      console.error('Error in removeTile:', error);
    }
  };

  /*
    MARKET INDEX CLICK HANDLER - TECHNICAL SYMBOL PROCESSING WITH DEBUGGING
    
    🔧 PARAMETER EXPLANATION:
    The 'indexSymbol' parameter now receives the technical ticker symbol (e.g., "^GSPC")
    rather than the display symbol (e.g., "S&P 500") due to the dual symbol architecture.
    
    🎯 WHY TECHNICAL SYMBOLS ARE PASSED:
    - Chart APIs require exact ticker symbols for accurate data fetching
    - Analysis components need technical symbols for API calls
    - Display formatting is handled within the analysis components
    
    📊 DATA FLOW:
    1. User clicks on market index in sidebar
    2. Sidebar passes technical symbol (e.g., "^GSPC") to this handler
    3. Handler stores technical symbol in selectedIndex state
    4. MarketIndexAnalysis component receives technical symbol
    5. Analysis component uses technical symbol for API calls
    6. Analysis component handles display formatting internally
    
    This ensures accurate data fetching while maintaining clean component separation.
  */
  const handleIndexClick = (indexSymbol: string) => {
    /*
      DEBUGGING PATTERN - COMPONENT INTERACTION TRACING
      
      These console.log statements demonstrate essential debugging practices for
      React component interactions, especially when data flows between components.
      
      🔍 WHY DEBUGGING IS CRITICAL IN COMPONENT COMMUNICATION:
      - Props and callbacks create complex data flows between components
      - State updates are asynchronous and may not happen immediately
      - Component re-renders can cause unexpected behavior
      - User interactions trigger cascading effects across multiple components
      - Integration bugs often occur at component boundaries
      
      📊 STRUCTURED DEBUGGING APPROACH:
      
      1. **DESCRIPTIVE PREFIXES**: "StockDashboard -" helps identify the source
         component when multiple components are logging simultaneously
      
      2. **INPUT VALIDATION**: Log the received parameter to verify:
         - The correct data is being passed from the parent component
         - Data format matches expectations (technical symbol vs display name)
         - No corruption or transformation occurred during prop passing
      
      3. **STATE CHANGE CONFIRMATION**: Log after setState to verify:
         - The state update function was called successfully
         - The correct value is being stored in component state
         - No race conditions or timing issues are occurring
      
      🛡️ PRODUCTION DEBUGGING BENEFITS:
      - COMPONENT INTEGRATION: Verify data flows correctly between components
      - USER INTERACTION TRACKING: Trace user actions through the component tree
      - STATE MANAGEMENT: Confirm state updates happen as expected
      - PROP VALIDATION: Ensure parent components pass correct data
      
      💡 DEBUGGING WORKFLOW:
      When issues occur with market index selection, developers can:
      1. Check browser console for these logs
      2. Verify the sidebar is passing the correct technical symbol
      3. Confirm the dashboard receives and stores the symbol correctly
      4. Trace the data flow to the MarketIndexAnalysis component
      5. Identify where in the chain the issue occurs
      
      🔧 CONSOLE.LOG BEST PRACTICES DEMONSTRATED:
      - Use consistent prefixes for easy filtering in browser DevTools
      - Log both input parameters and resulting state changes
      - Include context about what the log represents
      - Place logs at key decision points in the data flow
      
      🚀 PRODUCTION CONSIDERATIONS:
      In production builds, consider:
      - Wrapping in development-only conditions: if (process.env.NODE_ENV === 'development')
      - Replacing with proper error tracking (Sentry, LogRocket, etc.)
      - Using structured logging libraries for better searchability
      - Removing or minimizing console output to avoid performance impact
      
      📈 COMPONENT ARCHITECTURE CONTEXT:
      This debugging pattern is especially valuable in complex React applications where:
      - Multiple components share state through props and callbacks
      - User interactions trigger state changes across component boundaries
      - Data transformation occurs at different levels of the component tree
      - Integration between different UI sections needs to work seamlessly
      
      The dual symbol architecture (display vs technical symbols) makes this debugging
      even more important because it's easy for components to pass the wrong symbol type,
      leading to API failures or incorrect data display.
    */
    console.log('StockDashboard - Index clicked:', indexSymbol);
    setSelectedIndex(indexSymbol);
    console.log('StockDashboard - selectedIndex set to:', indexSymbol);
  };

  // CLOSE INDEX ANALYSIS HANDLER: Close market index analysis modal
  const closeIndexAnalysis = () => {
    setSelectedIndex(null);
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
    <div className="flex">
      {/* Main Content */}
      <div className="flex-1 space-y-8 pr-6">
      {/* 
        MAIN COMPONENT RENDER:
        This return statement defines the JSX structure that React will render to the DOM.
        
        JSX FUNDAMENTALS:
        - JSX looks like HTML but is actually JavaScript that gets compiled to React.createElement() calls
        - Must return a single parent element (this <div> wraps everything)
        - Curly braces {} embed JavaScript expressions within JSX
        - className is used instead of class (class is a JavaScript reserved word)
        
        TAILWIND CSS UTILITY CLASSES:
        - space-y-8: Adds vertical spacing (2rem/32px) between child elements
        - This is more maintainable than adding individual margins to each child
        - Tailwind uses a spacing scale: 1=0.25rem, 2=0.5rem, 4=1rem, 8=2rem
      */}
      <div className="flex flex-col gap-4">
        {/*
          RESPONSIVE FLEXBOX LAYOUT PATTERN:
          This demonstrates mobile-first responsive design using Tailwind CSS.
          
          BREAKPOINT SYSTEM:
          - Default (no prefix): Mobile-first (all screen sizes)
          - sm: (640px+): Tablets and up
          - This creates layouts that adapt gracefully to different screen sizes
          
          LAYOUT BEHAVIOR:
          - Mobile: flex-col (vertical stack) - prevents cramped horizontal space
          - Tablet+: flex-row (horizontal layout) - utilizes available width
          - items-start/items-center: Controls cross-axis alignment
          - justify-between: Spreads items across the main axis
          - gap-4: Adds consistent spacing (1rem) between flex items
        */}
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

      {/* Market Indices Sidebar */}
      <MarketIndicesSidebar onIndexClick={handleIndexClick} />

      {/* Market Index Analysis Modal */}
      {selectedIndex && (
        <MarketIndexAnalysis
          symbol={selectedIndex}
          onClose={closeIndexAnalysis}
        />
      )}
    </div>
  );
}