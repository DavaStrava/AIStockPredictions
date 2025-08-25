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
  These are the fundamental building blocks of modern React applications.
*/
import { useState, useEffect } from 'react';

/*
  ICON LIBRARY IMPORT:
  Lucide React provides a comprehensive set of SVG icons as React components.
  These specific icons are used for visual feedback and UI enhancement:
  - TrendingUp/TrendingDown: Visual indicators for market direction
  - Clock: Timestamp and market hours indicator
  - BarChart3: Section header icon for market data
*/
import { TrendingUp, TrendingDown, Clock, BarChart3 } from 'lucide-react';

/*
  TYPESCRIPT INTERFACE DEFINITIONS:
  Interfaces define the shape of data structures, providing compile-time type checking
  and better IDE support. This is a key TypeScript pattern for data modeling.
  
  BENEFITS OF INTERFACES:
  1. Type Safety: Prevents runtime errors by catching type mismatches at compile time
  2. IDE Support: Autocomplete, refactoring, and error detection
  3. Self-Documentation: Clearly shows what data structure is expected
  4. Refactoring Safety: Changes to interfaces are caught across the entire codebase
*/

/*
  MARKET INDEX DATA MODEL:
  This interface defines the structure of market index data from our API.
  Each property represents a specific piece of financial information.
  
  DATA TYPES EXPLAINED:
  - string: Text data (symbol names, timestamps)
  - number: Numeric data (prices, percentages)
  - boolean: True/false values (market open/closed status)
  
  BUSINESS DOMAIN MODELING:
  The interface maps directly to financial concepts:
  - symbol: Ticker symbol (e.g., "^GSPC" for S&P 500)
  - name: Human-readable name (e.g., "S&P 500")
  - price: Current index value
  - change: Point change from previous close
  - changePercent: Percentage change from previous close
  - isOpen: Whether the market is currently trading
  - lastUpdate: When this data was last refreshed
*/
interface MarketIndex {
  symbol: string;          // Ticker symbol (e.g., "^GSPC", "^DJI", "^IXIC")
  name: string;            // Display name (e.g., "S&P 500", "Dow Jones")
  price: number;           // Current index value (e.g., 4,500.25)
  change: number;          // Point change from previous close (e.g., +15.30)
  changePercent: number;   // Percentage change (e.g., 0.34 for +0.34%)
  isOpen: boolean;         // Market trading status (true = open, false = closed)
  lastUpdate: string;      // Last refresh timestamp (e.g., "2:30 PM EST")
}

/*
  COMPONENT PROPS INTERFACE:
  Defines what data this component expects to receive from its parent component.
  This follows React's "props down, events up" pattern.
  
  CALLBACK FUNCTION TYPE:
  onIndexClick: (symbol: string) => void
  - Takes a symbol parameter (string type)
  - Returns void (no return value)
  - This is a function that the parent provides to handle click events
  
  REACT COMMUNICATION PATTERN:
  - Parent passes data down via props
  - Child communicates back via callback functions
  - This keeps components decoupled and reusable
*/
interface MarketIndicesProps {
  onIndexClick: (symbol: string) => void;  // Callback function when user clicks an index
}

/*
  MARKET INDICES SIDEBAR COMPONENT:
  This component demonstrates the "Smart Component" pattern where the component:
  - Manages its own state
  - Handles data fetching and updates
  - Processes and formats data for display
  - Renders UI based on current state
  
  COMPONENT ARCHITECTURE:
  - Receives callback props from parent for communication
  - Maintains internal state for data, loading, and error conditions
  - Implements polling for real-time data updates
  - Provides rich visual feedback for different states
*/
export default function MarketIndicesSidebar({ onIndexClick }: MarketIndicesProps) {
  /*
    REACT STATE MANAGEMENT WITH TYPESCRIPT:
    Each useState call manages a specific piece of component state.
    
    STATE ORGANIZATION STRATEGY:
    This component uses multiple useState calls instead of one large object because:
    1. Each piece of state has different update patterns
    2. React can optimize re-renders when only specific state changes
    3. Code is more readable with descriptive variable names
    4. TypeScript types are simpler and more specific
    5. Easier to debug (you can see exactly which state changed)
    
    ANATOMY OF useState:
    const [currentValue, setterFunction] = useState<Type>(initialValue);
    - currentValue: The current state value
    - setterFunction: Function to update the state
    - <Type>: TypeScript generic for type safety
    - initialValue: Starting value when component first renders
  */
  
  /*
    INDICES STATE:
    Stores the array of market index data fetched from the API.
    
    TYPE ANNOTATION: <MarketIndex[]>
    - MarketIndex[]: Array of MarketIndex objects
    - []: Empty array as initial value (no data loaded yet)
    - TypeScript ensures only valid MarketIndex objects can be added
  */
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  
  /*
    LOADING STATE:
    Boolean flag to track whether data is currently being fetched.
    
    INITIAL VALUE: true
    - Component starts in loading state
    - Shows loading UI immediately when component mounts
    - Prevents showing empty state before data loads
    
    UX PATTERN: Loading states provide user feedback during async operations
  */
  const [loading, setLoading] = useState(true);
  
  /*
    ERROR STATE:
    Stores error messages when API calls fail.
    
    TYPE ANNOTATION: <string | null>
    - string: Error message text when something goes wrong
    - null: No error (normal state)
    - Union type allows for both possibilities
    
    INITIAL VALUE: null (no error initially)
    
    ERROR HANDLING PATTERN: Separate error state allows for graceful error UI
  */
  const [error, setError] = useState<string | null>(null);

  /*
    COMPONENT LIFECYCLE WITH useEffect:
    This hook manages side effects when the component mounts and unmounts.
    
    useEffect ANATOMY:
    useEffect(() => {
      // Side effect code here
      return () => {
        // Cleanup code here
      };
    }, [dependencies]);
    
    DEPENDENCY ARRAY EXPLANATION:
    - []: Empty array means this effect runs only once when component mounts
    - [variable]: Effect runs when 'variable' changes
    - No array: Effect runs after every render (usually not desired)
    
    POLLING PATTERN IMPLEMENTATION:
    This demonstrates the "polling" pattern for real-time data updates:
    1. Fetch data immediately when component mounts
    2. Set up a timer to fetch data repeatedly
    3. Clean up the timer when component unmounts
    
    TIMER CALCULATION:
    5 * 60 * 1000 = 300,000 milliseconds = 5 minutes
    - 5: Number of minutes
    - 60: Seconds per minute
    - 1000: Milliseconds per second
    
    WHY 5 MINUTES?
    - Market data doesn't change every second
    - Reduces API calls and server load
    - Balances freshness with performance
    - Appropriate for index-level data (vs individual stocks)
  */
  useEffect(() => {
    /*
      IMMEDIATE DATA FETCH:
      Call fetchMarketIndices() immediately when component mounts.
      This ensures users see data as soon as possible.
    */
    fetchMarketIndices();
    
    /*
      POLLING SETUP:
      setInterval() creates a timer that calls fetchMarketIndices every 5 minutes.
      
      INTERVAL PATTERN:
      - setInterval returns an interval ID
      - We store this ID to clear the interval later
      - This prevents memory leaks and unnecessary API calls
      
      REAL-TIME DATA STRATEGY:
      - Market indices change throughout the trading day
      - Automatic updates keep the UI current without user action
      - 5-minute intervals balance freshness with performance
    */
    const interval = setInterval(fetchMarketIndices, 5 * 60 * 1000);
    
    /*
      CLEANUP FUNCTION:
      The return statement provides a cleanup function that runs when:
      1. Component unmounts (user navigates away)
      2. Dependencies change (not applicable here with empty array)
      
      MEMORY LEAK PREVENTION:
      - clearInterval() stops the timer
      - Prevents the timer from continuing after component is destroyed
      - Essential for preventing memory leaks in React applications
      
      CLEANUP PATTERN:
      Always clean up side effects (timers, subscriptions, event listeners)
      to prevent memory leaks and unexpected behavior.
    */
    return () => clearInterval(interval);
  }, []); // Empty dependency array = run once on mount, cleanup on unmount

  /*
    ASYNC DATA FETCHING FUNCTION:
    This function demonstrates modern JavaScript patterns for API communication.
    
    ASYNC/AWAIT PATTERN:
    - async: Marks function as asynchronous (can use await inside)
    - await: Pauses execution until Promise resolves
    - Makes asynchronous code look and behave like synchronous code
    - Much more readable than .then().catch() chains
    
    ERROR HANDLING STRATEGY:
    Uses try-catch-finally pattern for comprehensive error management:
    - try: Normal execution path
    - catch: Handle any errors that occur
    - finally: Code that always runs (cleanup, state updates)
  */
  const fetchMarketIndices = async () => {
    try {
      /*
        ERROR STATE RESET:
        Clear any previous error before attempting new request.
        This ensures error UI disappears when retrying after a failure.
        
        UX PATTERN: Always reset error state before retry attempts
      */
      setError(null);
      
      /*
        FETCH API CALL:
        Modern way to make HTTP requests in JavaScript.
        
        ENDPOINT EXPLANATION:
        '/api/market-indices' is a relative URL that Next.js will resolve to:
        - Development: http://localhost:3000/api/market-indices
        - Production: https://yourdomain.com/api/market-indices
        
        FETCH CHARACTERISTICS:
        - Returns a Promise that resolves to Response object
        - Only rejects for network errors (no internet, server down)
        - HTTP error status codes (404, 500) are considered "successful" responses
        - We must manually check response.ok for actual success
      */
      const response = await fetch('/api/market-indices');
      
      /*
        HTTP STATUS VALIDATION:
        response.ok is true for status codes 200-299 (success range).
        
        WHY THIS CHECK IS NECESSARY:
        - fetch() considers 404, 500, etc. as "successful" requests
        - Only network failures cause fetch() to reject
        - Manual checking ensures we handle all failure types consistently
        
        COMMON HTTP STATUS CODES:
        - 200: OK (success)
        - 404: Not Found (endpoint doesn't exist)
        - 500: Internal Server Error (server-side error)
        - 429: Too Many Requests (rate limiting)
      */
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      /*
        JSON PARSING:
        response.json() is also async and can fail if:
        - Response body is not valid JSON
        - Response is empty
        - Server returns HTML error page instead of JSON
        
        AWAIT PATTERN:
        This is the second await in our function:
        1. First await: Get the response object
        2. Second await: Extract and parse the JSON body
      */
      const data = await response.json();
      
      /*
        API RESPONSE VALIDATION:
        Our API returns a standardized format with a 'success' flag.
        This allows us to distinguish between:
        - HTTP success with application error (success: false)
        - HTTP success with valid data (success: true)
        
        DEFENSIVE PROGRAMMING:
        Always validate API responses before using the data.
        Don't assume the API will always return what you expect.
      */
      if (data.success) {
        /*
          STATE UPDATE ON SUCCESS:
          Update the indices state with the fetched data.
          This will trigger a re-render with the new data.
          
          REACT STATE UPDATE PATTERN:
          - State updates are asynchronous
          - Component will re-render with new data
          - UI will automatically reflect the updated state
        */
        setIndices(data.data);
        // Show a subtle notification if using demo data
        if (data.note) {
          console.info('Market Indices:', data.note);
        }
      } else {
        /*
          APPLICATION ERROR HANDLING:
          Even if HTTP request succeeds, the API might return an error.
          This handles business logic errors from the server.
          
          ERROR MESSAGE FALLBACK:
          data.error || 'Failed to fetch market indices'
          - Use server error message if available
          - Fall back to generic message if server doesn't provide one
        */
        throw new Error(data.error || 'Failed to fetch market indices');
      }
    } catch (error) {
      /*
        CATCH BLOCK: Handle any errors from the try block
        This includes:
        - Network errors (no internet, server down)
        - HTTP errors (404, 500, etc.)
        - JSON parsing errors (invalid response format)
        - Application errors (success: false from API)
        
        ERROR LOGGING:
        console.error() logs the full error object for debugging.
        In production, this might be replaced with error monitoring service.
        
        USER-FRIENDLY ERROR STATE:
        Set a simple, user-friendly error message for the UI.
        Don't expose technical details to end users.
      */
      console.error('Failed to fetch market indices:', error);
      setError('Failed to load market data');
    } finally {
      /*
        FINALLY BLOCK: Always executes regardless of success or failure
        
        LOADING STATE CLEANUP:
        Always set loading to false, whether request succeeded or failed.
        This ensures the loading spinner disappears and UI shows final state.
        
        FINALLY GUARANTEES:
        - Executes after try block (on success)
        - Executes after catch block (on error)
        - Always executes, making it perfect for cleanup operations
        
        WITHOUT FINALLY:
        You'd need setLoading(false) in both try and catch blocks,
        leading to code duplication and potential bugs.
      */
      setLoading(false);
    }
  };

  /*
    DATA FORMATTING UTILITY FUNCTIONS:
    These functions demonstrate the "pure function" pattern - they take input,
    transform it, and return output without side effects.
    
    BENEFITS OF UTILITY FUNCTIONS:
    1. Reusability: Same formatting logic used in multiple places
    2. Consistency: All prices formatted the same way
    3. Maintainability: Change formatting in one place
    4. Testability: Easy to unit test pure functions
    5. Readability: Descriptive function names make code self-documenting
  */

  /*
    INTERNATIONALIZATION (i18n) PRICE FORMATTING:
    Uses the browser's built-in Intl.NumberFormat API for locale-aware formatting.
    
    INTL.NUMBERFORMAT EXPLAINED:
    - 'en-US': Locale identifier (English, United States)
    - minimumFractionDigits: Always show at least 2 decimal places
    - maximumFractionDigits: Never show more than 2 decimal places
    
    FORMATTING EXAMPLES:
    - 4500 → "4,500.00"
    - 4500.1 → "4,500.10"
    - 4500.123 → "4,500.12" (rounded)
    
    WHY USE INTL.NUMBERFORMAT:
    - Handles locale-specific formatting automatically
    - Adds thousands separators (commas)
    - Consistent decimal places
    - Better than manual string manipulation
    - Respects user's locale preferences
  */
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,    // Always show 2 decimal places (4500 → 4500.00)
      maximumFractionDigits: 2,    // Never show more than 2 decimals (4500.123 → 4500.12)
    }).format(price);
  };

  /*
    CHANGE FORMATTING WITH SIGN INDICATOR:
    Formats price changes with explicit positive/negative signs.
    
    TERNARY OPERATOR PATTERN:
    condition ? valueIfTrue : valueIfFalse
    
    SIGN LOGIC:
    - change >= 0: Show '+' for positive or zero values
    - change < 0: Show nothing (negative sign is automatic)
    
    TEMPLATE LITERAL COMPOSITION:
    `${sign}${formatPrice(change)}`
    - Combines sign with formatted price
    - Example: "+15.30" or "-8.75"
    
    FUNCTION COMPOSITION:
    This function reuses formatPrice() for consistent number formatting.
    This is the DRY principle: Don't Repeat Yourself.
  */
  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';    // Add '+' for positive, nothing for negative
    return `${sign}${formatPrice(change)}`;  // Combine sign with formatted price
  };

  /*
    PERCENTAGE FORMATTING:
    Formats percentage changes with sign and % symbol.
    
    TOFIXED() METHOD:
    - Rounds to specified decimal places
    - Returns a string (not a number)
    - Example: 0.3456.toFixed(2) → "0.35"
    
    PERCENTAGE DISPLAY PATTERN:
    - Always show 2 decimal places for precision
    - Include explicit + sign for positive values
    - Add % symbol for clarity
    
    EXAMPLES:
    - 0.34 → "+0.34%"
    - -1.25 → "-1.25%"
    - 0 → "+0.00%"
  */
  const formatChangePercent = (changePercent: number) => {
    const sign = changePercent >= 0 ? '+' : '';           // Explicit positive sign
    return `${sign}${changePercent.toFixed(2)}%`;         // Format with 2 decimals + %
  };

  /*
    DYNAMIC STYLING UTILITY FUNCTIONS:
    These functions map business logic (market changes) to visual styling (colors).
    This is the "function as data mapper" pattern.
    
    BENEFITS OF STYLING FUNCTIONS:
    1. Consistency: Same color logic used throughout component
    2. Maintainability: Change colors in one place
    3. Readability: Descriptive function names vs inline conditionals
    4. Reusability: Can be extracted to shared utilities
    5. Type Safety: TypeScript ensures valid return values
  */

  /*
    TEXT COLOR MAPPING FUNCTION:
    Maps market change values to appropriate text colors.
    
    TAILWIND CSS COLOR SYSTEM:
    - Numbers represent color intensity: 50 (lightest) to 950 (darkest)
    - 600: Strong color for light backgrounds
    - 400: Softer color for dark backgrounds
    - Pattern: "text-color-600 dark:text-color-400" ensures good contrast
    
    FINANCIAL COLOR CONVENTIONS:
    - Green: Positive changes (gains, bullish)
    - Red: Negative changes (losses, bearish)
    - Gray: Neutral or no change
    
    ACCESSIBILITY CONSIDERATIONS:
    - High contrast ratios for readability
    - Color differences are significant enough for color-blind users
    - Semantic color choices that match user expectations
    
    CONDITIONAL LOGIC FLOW:
    1. Check if change > 0 (positive) → Green
    2. Check if change < 0 (negative) → Red  
    3. Default case (change === 0) → Gray
  */
  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';   // Positive: Green text
    if (change < 0) return 'text-red-600 dark:text-red-400';       // Negative: Red text
    return 'text-gray-600 dark:text-gray-400';                     // Neutral: Gray text
  };

  /*
    BACKGROUND STYLING FUNCTION:
    Creates sophisticated visual feedback using backgrounds and borders.
    
    ADVANCED TAILWIND PATTERNS:
    - bg-green-50: Very light background color for subtle emphasis
    - dark:bg-green-900/20: Dark mode with opacity (20% transparency)
    - border-green-200: Complementary border color
    - Multiple class combinations for rich visual design
    
    OPACITY NOTATION:
    - /20 = 20% opacity
    - Allows layering colors over dark backgrounds
    - Creates subtle visual hierarchy without overwhelming content
    
    DESIGN SYSTEM CONSISTENCY:
    - All three states (positive/negative/neutral) follow same pattern
    - Color families remain consistent (green family, red family, gray family)
    - Light and dark mode variants ensure accessibility
    
    VISUAL HIERARCHY:
    - Background provides subtle context
    - Border adds definition and structure
    - Colors reinforce the semantic meaning of the data
  */
  const getChangeBg = (change: number) => {
    if (change > 0) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';     // Positive: Light green background
    if (change < 0) return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';             // Negative: Light red background  
    return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';                         // Neutral: Light gray background
  };

  /*
    LOADING STATE COMPONENT:
    This demonstrates the "early return pattern" for conditional rendering.
    Instead of nested conditionals in the main render, we handle special states first.
    
    EARLY RETURN BENEFITS:
    1. Cleaner code structure (no deeply nested conditionals)
    2. Clear separation of concerns (loading vs normal state)
    3. Easier to reason about component behavior
    4. Prevents errors from accessing undefined data
    
    LOADING UI PATTERNS:
    This implements a "skeleton screen" pattern that:
    - Shows the same layout as the final content
    - Uses placeholder elements that animate
    - Provides immediate visual feedback
    - Reduces perceived loading time
  */
  if (loading) {
    return (
      /*
        CONSISTENT LAYOUT STRUCTURE:
        The loading state uses the same container styling as the final component.
        This prevents layout shifts when data loads.
        
        TAILWIND LAYOUT CLASSES:
        - w-80: Fixed width (20rem/320px) for sidebar
        - bg-white dark:bg-gray-900: Background with dark mode support
        - border-l: Left border to separate from main content
        - p-6: Padding (1.5rem/24px) on all sides
      */
      <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 p-6">
        {/*
          HEADER SECTION:
          Shows the same header as the final component to maintain visual consistency.
          
          FLEXBOX LAYOUT:
          - flex: Creates flex container
          - items-center: Vertically centers icon and text
          - gap-2: Adds space between icon and text
          - mb-6: Margin bottom for spacing from content
        */}
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Market Indices</h3>
        </div>
        
        {/*
          SKELETON CONTENT:
          Creates placeholder elements that mimic the final content structure.
          
          SPACE-Y UTILITY:
          space-y-4 adds vertical spacing (1rem) between child elements.
          This is more maintainable than adding margins to individual elements.
        */}
        <div className="space-y-4">
          {/*
            ARRAY GENERATION FOR SKELETONS:
            [1, 2, 3, 4].map() creates 4 skeleton items.
            
            WHY THIS PATTERN:
            - Shows expected number of items
            - Creates realistic loading experience
            - Array.map() is the React way to render lists
            - Key prop (i) required for React's reconciliation
            
            ALTERNATIVE APPROACHES:
            - Array.from({length: 4}, (_, i) => i) for dynamic counts
            - Hard-coded JSX for fixed counts
            - This approach balances simplicity and flexibility
          */}
          {[1, 2, 3, 4].map((i) => (
            /*
              INDIVIDUAL SKELETON ITEM:
              Each skeleton represents one market index card.
              
              ANIMATE-PULSE:
              Tailwind utility that creates a subtle pulsing animation.
              This indicates to users that content is loading.
              
              KEY PROP:
              React requires unique keys for list items.
              Using the array index (i) is acceptable for static lists.
            */
            <div key={i} className="animate-pulse">
              {/*
                SKELETON ELEMENTS:
                Each div represents a different piece of content:
                - h-4: Height of 1rem (16px) for text lines
                - h-6: Height of 1.5rem (24px) for larger text
                - bg-gray-200/700: Background color with dark mode
                - rounded: Rounded corners to match final content
                - w-2/3: Width of 66.67% for varied line lengths
                - mb-*: Margin bottom for spacing between elements
                
                REALISTIC PROPORTIONS:
                The skeleton mimics the actual content structure:
                - First line: Index name (full width)
                - Second line: Price (full width, taller)
                - Third line: Change percentage (partial width)
              */}
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
    ERROR STATE COMPONENT:
    This demonstrates graceful error handling with user recovery options.
    
    ERROR HANDLING UX PRINCIPLES:
    1. Show clear, user-friendly error messages
    2. Maintain consistent layout (no jarring changes)
    3. Provide recovery actions (retry button)
    4. Use appropriate visual styling (red for errors)
    5. Keep the interface functional despite failures
    
    GRACEFUL DEGRADATION:
    The component continues to function even when data loading fails.
    Users can retry the operation without refreshing the entire page.
  */
  if (error) {
    return (
      /*
        CONSISTENT CONTAINER:
        Uses the same container styling as loading and success states.
        This prevents layout shifts and maintains visual consistency.
      */
      <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 p-6">
        {/*
          PERSISTENT HEADER:
          Shows the same header in all states for consistency.
          Users always know what section they're looking at.
        */}
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Market Indices</h3>
        </div>
        
        {/*
          ERROR MESSAGE SECTION:
          Centered layout draws attention to the error state.
          
          LAYOUT CLASSES:
          - text-center: Centers all text content
          - py-8: Vertical padding (2rem top/bottom) for visual breathing room
        */}
        <div className="text-center py-8">
          {/*
            ERROR MESSAGE DISPLAY:
            Shows the actual error message from the error state.
            
            STYLING CHOICES:
            - text-red-600/400: Red color indicates error (semantic color)
            - mb-2: Margin bottom to separate from retry button
            - {error}: Dynamic content from component state
            
            ACCESSIBILITY:
            Red color with sufficient contrast for readability.
            Clear, descriptive error messages help users understand what happened.
          */}
          <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
          
          {/*
            RETRY BUTTON:
            Provides user agency to recover from the error.
            
            EVENT HANDLING:
            onClick={fetchMarketIndices} calls the same function used for initial load.
            This creates a consistent retry mechanism.
            
            BUTTON STYLING:
            - text-sm: Smaller text size (secondary action)
            - text-blue-600/400: Blue color indicates interactive element
            - hover:underline: Visual feedback on hover
            
            UX PATTERN:
            Simple text button for secondary actions (vs primary button styling).
            Underline on hover indicates clickability without being overwhelming.
            
            ACCESSIBILITY:
            - Semantic button element for screen readers
            - Clear action text ("Try again")
            - Keyboard accessible (can be focused and activated)
          */}
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

  /*
    MAIN COMPONENT RENDER:
    This is the primary UI that displays when data is successfully loaded.
    
    COMPONENT STATE FLOW:
    1. Component mounts → loading state (skeleton UI)
    2. Data fetches successfully → this main render
    3. Data fetch fails → error state (with retry option)
    4. Data updates via polling → this render updates automatically
    
    RENDER OPTIMIZATION:
    React only re-renders when state changes (indices, loading, error).
    The polling mechanism automatically triggers re-renders with fresh data.
  */
  return (
    /*
      MAIN CONTAINER:
      Fixed-width sidebar with scrollable content.
      
      LAYOUT CLASSES EXPLAINED:
      - w-80: Fixed width (20rem/320px) - consistent sidebar width
      - bg-white dark:bg-gray-900: Background with dark mode support
      - border-l: Left border to visually separate from main content
      - border-gray-200 dark:border-gray-700: Border color with dark mode
      - p-6: Padding (1.5rem/24px) on all sides for content breathing room
      - overflow-y-auto: Vertical scrolling if content exceeds container height
      
      RESPONSIVE DESIGN:
      Fixed width works well for desktop sidebar layouts.
      For mobile, this would typically be full-width or use responsive classes.
      
      ACCESSIBILITY:
      - Semantic container structure
      - Proper color contrast in both light and dark modes
      - Scrollable content doesn't hide information
    */
    <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
      {/*
        SECTION HEADER:
        Consistent header across all component states.
        
        FLEXBOX LAYOUT:
        - flex: Creates horizontal flex container
        - items-center: Vertically centers icon and text
        - gap-2: Adds consistent spacing (0.5rem) between elements
        - mb-6: Margin bottom (1.5rem) to separate from content
        
        ICON + TEXT PATTERN:
        Common UI pattern that combines visual and textual information.
        Icon provides quick visual recognition, text provides clarity.
      */}
      <div className="flex items-center gap-2 mb-6">
        {/*
          SECTION ICON:
          BarChart3 from Lucide React provides semantic meaning.
          
          ICON STYLING:
          - h-5 w-5: Size (1.25rem/20px) - appropriate for header
          - text-blue-600: Blue color for brand consistency
          
          SEMANTIC MEANING:
          Chart icon immediately communicates this section contains data/analytics.
        */}
        <BarChart3 className="h-5 w-5 text-blue-600" />
        
        {/*
          SECTION TITLE:
          Clear, descriptive heading for the content section.
          
          TYPOGRAPHY CLASSES:
          - text-lg: Large text size (1.125rem/18px)
          - font-semibold: Semi-bold weight for emphasis
          - text-gray-900 dark:text-white: High contrast text with dark mode
          
          CONTENT SPECIFICITY:
          "US Market Indices" is more specific than just "Market Indices".
          Helps users understand the scope of the data.
        */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">US Market Indices</h3>
      </div>

      {/*
        INDICES LIST CONTAINER:
        Container for all market index cards with consistent spacing.
        
        SPACE-Y UTILITY:
        space-y-4 adds vertical spacing (1rem) between child elements.
        This is more maintainable than adding margins to individual cards.
        
        LAYOUT PATTERN:
        Vertical stack of cards is a common pattern for data lists.
        Each card represents one market index with its data.
      */}
      <div className="space-y-4">
        {/*
          DYNAMIC LIST RENDERING:
          Uses Array.map() to render one card per market index.
          
          ARRAY.MAP() PATTERN:
          - Takes each index object from the indices array
          - Returns JSX for that index
          - React renders all returned JSX elements
          - Key prop required for React's reconciliation algorithm
          
          WHY MAP() OVER FOR LOOPS:
          - Functional programming approach
          - Returns new array (immutable)
          - More concise than imperative loops
          - Standard React pattern for lists
        */}
        {indices.map((index) => (
          /*
            INDIVIDUAL INDEX CARD COMPONENT:
            This creates an interactive card for each market index that demonstrates
            several important React and UI/UX patterns.
            
            🔑 KEY PROP EXPLANATION:
            - key={index.symbol}: React requires unique keys for list items
            - Uses symbol (e.g., "^GSPC", "^DJI") as the unique identifier
            - Helps React efficiently update the DOM when data changes
            - Without keys, React would re-render entire list on changes
            
            📱 EVENT HANDLING PATTERN:
            - onClick={() => onIndexClick(index.symbol)}: Arrow function prevents immediate execution
            - Passes specific symbol to parent component via callback prop
            - Parent component decides what action to take (open modal, navigate, etc.)
            - This follows React's "props down, events up" communication pattern
            
            🎨 DYNAMIC STYLING WITH TEMPLATE LITERALS:
            - className uses backticks (`) for string interpolation
            - Combines static classes with dynamic classes from getChangeBg()
            - ${getChangeBg(index.change)} injects color based on market performance
            - Result: Cards are green (up), red (down), or gray (unchanged)
            
            ✨ MICRO-INTERACTIONS & ACCESSIBILITY:
            - cursor-pointer: Shows hand cursor indicating clickable element
            - transition-all duration-200: Smooth 200ms animations for all property changes
            - hover:shadow-md: Adds drop shadow on hover for depth perception
            - hover:scale-[1.02]: Subtle 2% scale increase creates "lifting" effect
            - These micro-interactions provide immediate visual feedback
            
            🏗️ TAILWIND CSS UTILITY CLASSES BREAKDOWN:
            - p-4: Padding of 1rem (16px) on all sides
            - rounded-lg: Large border radius for modern, friendly appearance
            - border: Adds border (color determined by getChangeBg function)
            - The combination creates a card-like appearance with clear boundaries
            
            💡 UX DESIGN PRINCIPLES DEMONSTRATED:
            - AFFORDANCE: Visual cues (cursor, hover effects) indicate interactivity
            - FEEDBACK: Immediate response to user actions (hover, click)
            - CONSISTENCY: All cards follow the same interaction patterns
            - ACCESSIBILITY: Clear visual hierarchy and interaction states
          */
          <div
            key={index.symbol}
            onClick={() => onIndexClick(index.symbol)}
            className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${getChangeBg(index.change)}`}
          >
            {/*
              CARD HEADER SECTION:
              Top section of each index card with name, symbol, and trend icon.
              
              FLEXBOX LAYOUT:
              - flex: Creates horizontal flex container
              - items-start: Aligns items to top (in case of text wrapping)
              - justify-between: Spreads content to opposite ends
              - mb-2: Margin bottom to separate from price section
              
              LAYOUT STRATEGY:
              Left side: Index name and symbol (main identification)
              Right side: Trend icon (quick visual indicator)
            */}
            <div className="flex items-start justify-between mb-2">
              {/*
                INDEX IDENTIFICATION:
                Left side content with name and symbol.
                
                INFORMATION HIERARCHY:
                - Name: Primary identifier (larger, bold)
                - Symbol: Secondary identifier (smaller, muted)
              */}
              <div>
                {/*
                  INDEX NAME:
                  Primary display name for the market index.
                  
                  TYPOGRAPHY CLASSES:
                  - font-semibold: Semi-bold weight for emphasis
                  - text-gray-900 dark:text-white: High contrast with dark mode
                  - text-sm: Small text size (0.875rem/14px) for compact display
                  
                  DYNAMIC CONTENT:
                  {index.name} displays the human-readable name like "S&P 500" or "Dow Jones"
                */}
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                  {index.name}
                </h4>
                
                {/*
                  INDEX SYMBOL:
                  Technical symbol used in financial systems.
                  
                  TYPOGRAPHY CLASSES:
                  - text-xs: Extra small text (0.75rem/12px) - secondary information
                  - text-gray-500 dark:text-gray-400: Muted color for less emphasis
                  
                  EXAMPLES:
                  - ^GSPC (S&P 500)
                  - ^DJI (Dow Jones Industrial Average)
                  - ^IXIC (NASDAQ Composite)
                */}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {index.symbol}
                </p>
              </div>
              
              {/*
                TREND INDICATOR:
                Visual icon showing market direction.
                
                FLEXBOX ALIGNMENT:
                - flex: Creates flex container for icon
                - items-center: Centers icon vertically
                - gap-1: Small gap (0.25rem) if multiple icons (future expansion)
                
                CONDITIONAL RENDERING:
                Uses ternary operator to show different icons based on change value.
                This is the React way to conditionally render elements.
              */}
              <div className="flex items-center gap-1">
                {/*
                  CONDITIONAL ICON RENDERING:
                  Shows different icons and colors based on market performance.
                  
                  TERNARY OPERATOR PATTERN:
                  condition ? elementIfTrue : elementIfFalse
                  
                  BUSINESS LOGIC:
                  - index.change >= 0: Positive or no change → TrendingUp (green)
                  - index.change < 0: Negative change → TrendingDown (red)
                  
                  ICON STYLING:
                  - h-4 w-4: Size (1rem/16px) - appropriate for card context
                  - Semantic colors: Green for up, red for down
                  - Dark mode variants for accessibility
                  
                  ACCESSIBILITY:
                  Icons provide visual reinforcement of the numeric data.
                  Color and direction both convey the same information.
                */}
                {index.change >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>

            {/*
              PRICE DATA SECTION:
              Main financial data display with current price and change information.
              
              VERTICAL SPACING:
              space-y-1 adds small vertical spacing (0.25rem) between price elements.
              Keeps related information grouped while maintaining readability.
              
              INFORMATION HIERARCHY:
              1. Current price (largest, most prominent)
              2. Change amount and percentage (smaller, color-coded)
            */}
            <div className="space-y-1">
              {/*
                CURRENT PRICE DISPLAY:
                Most prominent piece of information on each card.
                
                TYPOGRAPHY HIERARCHY:
                - text-lg: Large text size (1.125rem/18px) for prominence
                - font-bold: Bold weight to draw attention
                - text-gray-900 dark:text-white: Maximum contrast for readability
                
                FORMATTED PRICE:
                formatPrice(index.price) applies consistent number formatting:
                - Adds thousands separators (commas)
                - Shows exactly 2 decimal places
                - Example: 4500.25 → "4,500.25"
                
                BUSINESS CONTEXT:
                This is the current value of the market index, the most important
                piece of information for investors tracking market performance.
              */}
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {formatPrice(index.price)}
              </div>
              
              {/*
                CHANGE INFORMATION:
                Shows both absolute and percentage change from previous close.
                
                DYNAMIC STYLING:
                className uses template literal to combine:
                - Static classes: text-sm font-medium (size and weight)
                - Dynamic classes: getChangeColor(index.change) (semantic colors)
                
                DUAL FORMAT DISPLAY:
                Shows both formats for comprehensive information:
                - formatChange(index.change): "+15.30" or "-8.75"
                - formatChangePercent(index.changePercent): "+0.34%" or "-0.19%"
                
                PARENTHESES CONVENTION:
                Financial industry standard to show percentage in parentheses.
                Example: "+15.30 (+0.34%)" or "-8.75 (-0.19%)"
                
                COLOR CODING:
                getChangeColor() applies semantic colors:
                - Green: Positive changes (market gains)
                - Red: Negative changes (market losses)
                - Gray: No change (rare but possible)
                
                ACCESSIBILITY:
                Color reinforces the numeric information but doesn't replace it.
                Users can understand the data even without color perception.
              */}
              <div className={`text-sm font-medium ${getChangeColor(index.change)}`}>
                {formatChange(index.change)} ({formatChangePercent(index.changePercent)})
              </div>
            </div>

            {/*
              METADATA FOOTER:
              Bottom section with market status and last update time.
              
              VISUAL SEPARATION:
              - mt-3: Margin top (0.75rem) to separate from price data
              - pt-2: Padding top (0.5rem) for breathing room above border
              - border-t: Top border to visually separate metadata
              - border-gray-200 dark:border-gray-700: Subtle border with dark mode
              
              FLEXBOX LAYOUT:
              - flex: Horizontal layout for icon and text
              - items-center: Vertically centers icon with text
              - gap-2: Consistent spacing (0.5rem) between icon and text
              
              DESIGN PATTERN:
              Footer metadata is common in card layouts to provide context
              without overwhelming the primary content.
            */}
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              {/*
                TIMESTAMP ICON:
                Clock icon provides visual context for time-related information.
                
                ICON SIZING:
                - h-3 w-3: Small size (0.75rem/12px) appropriate for metadata
                - text-gray-400: Muted color for secondary information
                
                SEMANTIC MEANING:
                Clock icon immediately communicates time-related information
                without requiring users to read the text first.
              */}
              <Clock className="h-3 w-3 text-gray-400" />
              
              {/*
                STATUS AND TIMESTAMP:
                Combined market status and last update information.
                
                TYPOGRAPHY:
                - text-xs: Extra small text (0.75rem/12px) for metadata
                - text-gray-500 dark:text-gray-400: Muted color for secondary info
                
                CONDITIONAL CONTENT:
                {index.isOpen ? 'Market Open' : 'After Hours'}
                - Ternary operator for conditional text
                - Shows current market trading status
                - Helps users understand data freshness context
                
                SEPARATOR PATTERN:
                • (bullet) character separates related pieces of information.
                Common pattern in metadata display.
                
                DYNAMIC TIMESTAMP:
                {index.lastUpdate} shows when this data was last refreshed.
                Important for users to understand data currency.
                
                BUSINESS CONTEXT:
                - Market hours affect data freshness
                - After-hours data may be less current
                - Users need to know when data was last updated
              */}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {index.isOpen ? 'Market Open' : 'After Hours'} • {index.lastUpdate}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/*
        COMPONENT FOOTER:
        Global information about data refresh behavior.
        
        VISUAL SEPARATION:
        - mt-6: Large margin top (1.5rem) to separate from content
        - pt-4: Padding top (1rem) for breathing room above border
        - border-t: Top border to visually separate footer
        - border-gray-200 dark:border-gray-700: Subtle border with dark mode
        
        LAYOUT PATTERN:
        Footer information is separated from main content but remains
        part of the same component for contextual relevance.
      */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        {/*
          DATA REFRESH NOTICE:
          Informs users about automatic data updates.
          
          TYPOGRAPHY AND LAYOUT:
          - text-xs: Extra small text (0.75rem/12px) for fine print
          - text-gray-500 dark:text-gray-400: Muted color for secondary info
          - text-center: Centers the text within the container
          
          USER COMMUNICATION:
          This notice helps users understand:
          1. Data is automatically refreshed (they don't need to manually refresh)
          2. Refresh frequency (every 5 minutes)
          3. Context dependency (only during market hours)
          
          TRANSPARENCY PRINCIPLE:
          Being transparent about data refresh behavior builds user trust
          and helps them understand when they're seeing current vs stale data.
          
          BUSINESS CONTEXT:
          - Market data is expensive to fetch continuously
          - 5-minute intervals balance freshness with cost
          - Outside market hours, data changes less frequently
          - Users benefit from knowing the refresh schedule
        */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Data refreshes every 5 minutes during market hours
        </p>
      </div>
    </div>
  );
}