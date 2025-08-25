/**
 * MARKET INDICES API ROUTE - EDUCATIONAL OVERVIEW
 * 
 * This API route demonstrates several important software engineering patterns:
 * 
 * 🏗️ ARCHITECTURAL PATTERNS:
 * - FALLBACK PATTERN: Graceful degradation when external APIs fail
 * - NESTED TRY-CATCH: Multi-level error handling for different failure scenarios
 * - DATA TRANSFORMATION: Converting external API format to internal format
 * - TIMEZONE HANDLING: Working with market hours across time zones
 * 
 * 🛡️ RESILIENCE PATTERNS:
 * - GRACEFUL DEGRADATION: App continues working even when external API fails
 * - MOCK DATA GENERATION: Realistic fallback data for development and demos
 * - ERROR ISOLATION: API failures don't crash the entire application
 * - DEFENSIVE PROGRAMMING: Validate data before processing
 * 
 * 💡 LEARNING OBJECTIVES:
 * - Understanding nested error handling strategies
 * - Working with external APIs and handling failures
 * - Date/time manipulation and timezone conversions
 * - Data transformation and mapping patterns
 * - Building resilient systems that handle real-world failures
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * MARKET INDICES CONFIGURATION - STATIC DATA PATTERN
 * 
 * This constant demonstrates the "configuration as data" pattern where we define
 * business logic (which indices to track) as structured data rather than code.
 * 
 * 🎯 DESIGN BENEFITS:
 * - MAINTAINABILITY: Easy to add/remove indices without code changes
 * - CONSISTENCY: Single source of truth for index information
 * - TYPE SAFETY: TypeScript can infer the structure and catch errors
 * - READABILITY: Clear, self-documenting data structure
 * 
 * 📊 DATA STRUCTURE EXPLANATION:
 * - symbol: The actual ticker symbol used by Financial Modeling Prep API (e.g., '^GSPC')
 * - name: Full human-readable name for display (e.g., 'S&P 500')
 * - displaySymbol: Short name for UI display (e.g., 'S&P 500')
 * 
 * 💡 WHY SEPARATE SYMBOL AND DISPLAY SYMBOL:
 * - APIs often use technical symbols (^GSPC) that aren't user-friendly
 * - Display symbols (S&P 500) are more recognizable to users
 * - This mapping allows us to use correct API symbols while showing friendly names
 * 
 * 🔧 ARRAY OF OBJECTS PATTERN:
 * This structure makes it easy to:
 * - Loop through indices with map(), forEach(), etc.
 * - Find specific indices with find(), filter(), etc.
 * - Extract specific properties with map(item => item.symbol)
 * - Add new indices by simply adding objects to the array
 */
const MARKET_INDICES = [
  { symbol: '^IXIC', name: 'NASDAQ Composite', displaySymbol: 'NASDAQ' },
  { symbol: '^GSPC', name: 'S&P 500', displaySymbol: 'S&P 500' },
  { symbol: '^DJI', name: 'Dow Jones Industrial Average', displaySymbol: 'DOW' },
  { symbol: '^RUT', name: 'Russell 2000', displaySymbol: 'RUSSELL' }
];

/**
 * NEXT.JS API ROUTE HANDLER - GET METHOD
 * 
 * This function demonstrates the Next.js App Router API pattern for handling HTTP requests.
 * 
 * 🔧 NEXT.JS API ROUTE CONCEPTS:
 * - NAMED EXPORTS: export async function GET() creates a GET endpoint
 * - FILE-BASED ROUTING: This file's location determines the URL (/api/market-indices)
 * - REQUEST/RESPONSE OBJECTS: NextRequest and NextResponse provide type-safe HTTP handling
 * - ASYNC BY DEFAULT: All API routes should be async for non-blocking operations
 * 
 * 🛡️ ERROR HANDLING STRATEGY:
 * This function uses a "nested try-catch" pattern:
 * - OUTER TRY-CATCH: Handles configuration errors and unexpected failures
 * - INNER TRY-CATCH: Handles external API failures with fallback behavior
 * This allows different error scenarios to be handled appropriately
 */
export async function GET(request: NextRequest) {
  try {
    /**
     * ENVIRONMENT VARIABLE ACCESS - CONFIGURATION PATTERN
     * 
     * This demonstrates secure configuration management using environment variables.
     * 
     * 🔐 SECURITY BENEFITS:
     * - API keys are not stored in source code (prevents accidental exposure)
     * - Different environments (dev/staging/prod) can use different keys
     * - Keys can be rotated without code changes
     * - Follows 12-factor app methodology for configuration
     * 
     * 🎯 DEFENSIVE PROGRAMMING:
     * The immediate check for apiKey prevents wasted work if misconfigured.
     * This is called a "guard clause" - fail fast if prerequisites aren't met.
     */
    const apiKey = process.env.FMP_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'FMP API key not configured'
      }, { status: 500 });
    }

    /**
     * MARKET HOURS CALCULATION - TIMEZONE HANDLING PATTERN
     * 
     * This section demonstrates working with dates, timezones, and business logic.
     * 
     * 🕐 TIMEZONE COMPLEXITY:
     * - Users can be anywhere in the world
     * - US stock markets operate on Eastern Time
     * - We need to determine if markets are currently open
     * - JavaScript Date objects are timezone-aware but tricky to work with
     * 
     * 🔧 TECHNICAL IMPLEMENTATION:
     * 1. new Date() gets current time in user's timezone
     * 2. toLocaleString() converts to specific timezone (America/New_York)
     * 3. new Date() parses the converted string back to a Date object
     * 4. getHours() and getDay() extract the time components we need
     * 
     * 📅 BUSINESS LOGIC:
     * - day >= 1 && day <= 5: Monday through Friday (weekdays only)
     * - hour >= 9 && hour < 16: 9:00 AM to 4:00 PM Eastern Time
     * - This is a simplified version (doesn't account for holidays or exact 9:30 AM open)
     * 
     * 💡 WHY THIS MATTERS:
     * - Users want to know if the data is "live" or from the last close
     * - Different UI behavior might be appropriate for open vs closed markets
     * - This information helps users understand data freshness
     */
    // Check if markets are currently open (simplified - US Eastern Time)
    const now = new Date();
    const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const hour = easternTime.getHours();
    const day = easternTime.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Market is open Monday-Friday, 9:30 AM - 4:00 PM ET
    const isMarketOpen = day >= 1 && day <= 5 && hour >= 9 && hour < 16;

    /**
     * INNER TRY-CATCH BLOCK - FALLBACK PATTERN IMPLEMENTATION
     * 
     * This inner try-catch demonstrates the "fallback pattern" - a resilience strategy
     * where the system continues working even when external dependencies fail.
     * 
     * 🎯 RESILIENCE STRATEGY:
     * - TRY: Attempt to get real data from external API
     * - CATCH: If that fails, generate realistic mock data
     * - RESULT: User experience is maintained regardless of API status
     * 
     * 💡 WHY NESTED TRY-CATCH:
     * - OUTER CATCH: Handles configuration errors, unexpected failures
     * - INNER CATCH: Handles expected API failures with graceful fallback
     * - This separation allows different error types to be handled differently
     * 
     * 🏗️ PRODUCTION BENEFITS:
     * - App remains functional during API outages
     * - Development can continue without external API access
     * - Demos work reliably even with network issues
     * - Users get immediate feedback instead of error messages
     */
    try {
      /**
       * EXTERNAL API INTEGRATION - HTTP CLIENT PATTERN
       * 
       * This section demonstrates best practices for calling external APIs.
       * 
       * 🔧 URL CONSTRUCTION PATTERN:
       * 1. Extract symbols from configuration using map()
       * 2. Join multiple symbols with commas for batch API call
       * 3. Use template literals for clean URL construction
       * 4. Include API key as query parameter
       * 
       * ARRAY.MAP() EXPLANATION:
       * - map() transforms each array element and returns a new array
       * - MARKET_INDICES.map(index => index.symbol) extracts just the symbol field
       * - Result: ['^IXIC', '^GSPC', '^DJI', '^RUT']
       * 
       * ARRAY.JOIN() EXPLANATION:
       * - join(',') combines array elements into a single string
       * - Result: '^IXIC,^GSPC,^DJI,^RUT'
       * - This format is what the FMP API expects for batch requests
       * 
       * 💡 BATCH API BENEFITS:
       * - Single HTTP request instead of 4 separate requests
       * - Reduced latency and network overhead
       * - Lower API rate limit usage
       * - Atomic operation (all succeed or all fail together)
       */
      // Fetch current quotes for all indices
      const symbols = MARKET_INDICES.map(index => index.symbol).join(',');
      const quotesUrl = `https://financialmodelingprep.com/api/v3/quote/${symbols}?apikey=${apiKey}`;
      
      /**
       * HTTP REQUEST WITH ERROR HANDLING
       * 
       * This demonstrates proper HTTP client patterns for external API calls.
       * 
       * 🛡️ ERROR HANDLING LAYERS:
       * 1. Network errors: fetch() will throw for network failures
       * 2. HTTP errors: response.ok checks for 4xx/5xx status codes
       * 3. Data validation: Ensure response format matches expectations
       * 
       * 🔧 FETCH API CHARACTERISTICS:
       * - Only rejects for network errors (no internet, DNS failure, etc.)
       * - HTTP error status codes (404, 500) are considered "successful" responses
       * - We must manually check response.ok for actual success
       * - This is different from libraries like axios that reject on HTTP errors
       */
      const quotesResponse = await fetch(quotesUrl);
      
      if (!quotesResponse.ok) {
        throw new Error(`FMP API error: ${quotesResponse.status}`);
      }
      
      const quotesData = await quotesResponse.json();
      
      /**
       * DATA VALIDATION PATTERN
       * 
       * Always validate external API responses before processing.
       * 
       * 🎯 WHY VALIDATION IS CRITICAL:
       * - External APIs can change their response format
       * - Network issues can cause partial/corrupted responses
       * - API errors might return HTML instead of JSON
       * - Validation prevents runtime errors in data processing
       * 
       * 🔧 ARRAY.ISARRAY() CHECK:
       * - FMP API should return an array of quote objects
       * - If it returns an object, string, or null, our map() call below would fail
       * - This check prevents "Cannot read property 'map' of undefined" errors
       */
      if (!Array.isArray(quotesData)) {
        throw new Error('Invalid response format from FMP API');
      }

      /**
       * DATA TRANSFORMATION PIPELINE - MAP AND FIND PATTERN
       * 
       * This section demonstrates advanced array processing patterns for transforming
       * external API data into our internal format.
       * 
       * 🔄 TRANSFORMATION PIPELINE:
       * 1. Raw API data (external format) → map() → Processed data (internal format)
       * 2. Each quote object gets enhanced with additional information
       * 3. External symbols get mapped to user-friendly display names
       * 4. Missing data gets filled with sensible defaults
       * 
       * 🔧 ARRAY.MAP() PATTERN:
       * - Creates a new array by transforming each element
       * - Original quotesData remains unchanged (immutable pattern)
       * - Each quote becomes a processed index object
       * 
       * 🔍 ARRAY.FIND() PATTERN:
       * - Searches through MARKET_INDICES to find matching configuration
       * - Returns the first object where the condition is true
       * - Returns undefined if no match is found
       * - Used here to map API symbols to our display configuration
       */
      // Process the data
      const processedIndices = quotesData.map((quote: any) => {
        /**
         * DATA LOOKUP PATTERN - FIND WITH PREDICATE
         * 
         * This line demonstrates how to correlate data between two sources:
         * - quotesData: Live data from external API
         * - MARKET_INDICES: Our configuration/metadata
         * 
         * 🔍 FIND() METHOD BREAKDOWN:
         * - Searches through MARKET_INDICES array
         * - Tests each index with the condition: index.symbol === quote.symbol
         * - Returns the first matching index object, or undefined if none match
         * 
         * 💡 WHY THIS LOOKUP IS NEEDED:
         * - API returns technical symbols (^GSPC) 
         * - We want user-friendly names (S&P 500)
         * - Our configuration maps between these formats
         * - This allows us to control how data is displayed to users
         */
        const indexInfo = MARKET_INDICES.find(index => index.symbol === quote.symbol);
        
        /**
         * OBJECT CONSTRUCTION WITH FALLBACKS - DEFENSIVE PROGRAMMING
         * 
         * This return statement demonstrates several important patterns:
         * 
         * 🛡️ OPTIONAL CHAINING (?.) PATTERN:
         * - indexInfo?.displaySymbol safely accesses displaySymbol even if indexInfo is undefined
         * - Prevents "Cannot read property 'displaySymbol' of undefined" errors
         * - Returns undefined if indexInfo is null/undefined, otherwise returns the property
         * 
         * 🔄 LOGICAL OR (||) FALLBACK PATTERN:
         * - indexInfo?.displaySymbol || quote.symbol uses quote.symbol if the first part is falsy
         * - Provides sensible defaults when our configuration is incomplete
         * - Ensures the API always returns valid data even with missing configuration
         * 
         * 📊 DATA ENRICHMENT PATTERN:
         * - Takes raw API data (quote.price, quote.change)
         * - Adds computed fields (isMarketOpen, lastUpdate)
         * - Adds metadata from our configuration (displaySymbol, name)
         * - Results in richer, more useful data for the frontend
         * 
         * 🕐 TIMESTAMP FORMATTING:
         * - toLocaleTimeString() formats time for human readability
         * - timeZone: 'America/New_York' ensures consistent Eastern Time display
         * - hour/minute: '2-digit' ensures consistent formatting (09:30 not 9:30)
         * - timeZoneName: 'short' adds timezone abbreviation (EST/EDT)
         */
        return {
          symbol: indexInfo?.displaySymbol || quote.symbol,
          name: indexInfo?.name || quote.name,
          price: quote.price || 0,
          change: quote.change || 0,
          changePercent: quote.changesPercentage || 0,
          isOpen: isMarketOpen,
          lastUpdate: new Date().toLocaleTimeString('en-US', {
            timeZone: 'America/New_York',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
          })
        };
      });

      /**
       * SUCCESSFUL RESPONSE PATTERN - STANDARDIZED API RESPONSE
       * 
       * This demonstrates a consistent API response format that makes frontend
       * development easier and more predictable.
       * 
       * 🎯 RESPONSE STRUCTURE BENEFITS:
       * - success: Boolean flag for easy success/failure checking
       * - data: The actual payload (array of processed indices)
       * - timestamp: When this data was generated (useful for caching/debugging)
       * 
       * 📡 NEXT.JS RESPONSE PATTERN:
       * - NextResponse.json() automatically sets Content-Type: application/json
       * - Serializes JavaScript objects to JSON strings
       * - Returns proper HTTP response with status 200 (default)
       * 
       * 💡 WHY WRAP DATA IN SUCCESS OBJECT:
       * - Consistent format across all API endpoints
       * - Easy to add metadata (timestamp, pagination, etc.)
       * - Frontend can always check response.success before processing data
       * - Allows for partial success scenarios in more complex APIs
       */
      return NextResponse.json({
        success: true,
        data: processedIndices,
        timestamp: new Date().toISOString()
      });

    } catch (apiError) {
      /**
       * FALLBACK PATTERN IMPLEMENTATION - GRACEFUL DEGRADATION
       * 
       * This catch block demonstrates one of the most important patterns in
       * production software: graceful degradation when external dependencies fail.
       * 
       * 🎯 GRACEFUL DEGRADATION PRINCIPLES:
       * - CONTINUE OPERATION: App keeps working even when external API fails
       * - USER TRANSPARENCY: Inform users they're seeing demo data
       * - REALISTIC FALLBACK: Mock data should be believable and useful
       * - LOGGING: Record the failure for debugging without breaking user experience
       * 
       * 🔧 CONSOLE.WARN() VS CONSOLE.ERROR():
       * - warn() indicates a problem that's handled gracefully
       * - error() would indicate an unrecoverable failure
       * - This distinction helps with log monitoring and alerting
       * 
       * 💡 WHEN TO USE FALLBACK PATTERNS:
       * - External API outages or rate limiting
       * - Network connectivity issues
       * - Development environments without API access
       * - Demo environments that need to work reliably
       */
      console.warn('FMP API failed, using mock data:', apiError);
      
      /**
       * MOCK DATA GENERATION - REALISTIC SIMULATION PATTERN
       * 
       * This section demonstrates how to generate realistic mock data that
       * maintains the user experience when real data isn't available.
       * 
       * 🎯 MOCK DATA DESIGN PRINCIPLES:
       * - REALISTIC VALUES: Use approximate real-world values for believability
       * - DYNAMIC VARIATION: Add randomness so data changes between requests
       * - CONSISTENT STRUCTURE: Match the exact format of real API responses
       * - BUSINESS LOGIC: Apply the same processing as real data
       * 
       * 🔢 MATHEMATICAL PATTERNS USED:
       * 
       * ARRAY INDEXING FOR BASE VALUES:
       * - [15000, 4500, 35000, 2000][i] uses array index to get different base prices
       * - i comes from map((index, i) => ...) - the second parameter is the array index
       * - This ensures NASDAQ gets ~15000, S&P 500 gets ~4500, etc.
       * - Approximates real market index levels for believability
       * 
       * RANDOM PERCENTAGE CALCULATION:
       * - Math.random() returns 0.0 to 1.0
       * - Math.random() - 0.5 returns -0.5 to 0.5 (centered around 0)
       * - (Math.random() - 0.5) * 4 returns -2.0 to 2.0
       * - This simulates realistic daily market movements (-2% to +2%)
       * 
       * PERCENTAGE TO DOLLAR CONVERSION:
       * - change = (basePrice * changePercent) / 100
       * - If basePrice is 4500 and changePercent is 1.5, change = 67.5
       * - This converts percentage change to actual dollar change
       * 
       * PRECISION ROUNDING:
       * - Math.round(value * 100) / 100 rounds to 2 decimal places
       * - Multiply by 100: 4567.123 → 456712.3
       * - Round: 456712.3 → 456712
       * - Divide by 100: 456712 → 4567.12
       * - This ensures prices look realistic (no excessive decimal places)
       */
      // Fallback to mock data when API fails
      const mockIndices = MARKET_INDICES.map((index, i) => {
        // Generate realistic mock data
        const basePrice = [15000, 4500, 35000, 2000][i]; // Approximate real values
        const changePercent = (Math.random() - 0.5) * 4; // Random change between -2% and +2%
        const change = (basePrice * changePercent) / 100;
        const currentPrice = basePrice + change;
        
        /**
         * MOCK DATA OBJECT CONSTRUCTION
         * 
         * This object construction demonstrates several important patterns:
         * 
         * 🔄 CONSISTENT DATA STRUCTURE:
         * - Uses the same field names as the real API processing above
         * - Frontend code doesn't need to know if data is real or mock
         * - Maintains type safety and predictable behavior
         * 
         * 📊 REALISTIC DATA SIMULATION:
         * - Uses our configuration data (index.displaySymbol, index.name)
         * - Applies the same mathematical rounding as real data
         * - Includes the same timestamp formatting
         * - Maintains the same business logic (isMarketOpen)
         * 
         * 💡 WHY THIS APPROACH WORKS:
         * - Frontend components work identically with real or mock data
         * - Development can continue without external API dependencies
         * - Demos are reliable and don't depend on network conditions
         * - Testing can use predictable mock data scenarios
         */
        return {
          symbol: index.displaySymbol,
          name: index.name,
          price: Math.round(currentPrice * 100) / 100,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round(changePercent * 100) / 100,
          isOpen: isMarketOpen,
          lastUpdate: new Date().toLocaleTimeString('en-US', {
            timeZone: 'America/New_York',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
          })
        };
      });

      /**
       * FALLBACK RESPONSE WITH USER NOTIFICATION
       * 
       * This response demonstrates transparent fallback behavior.
       * 
       * 🎯 TRANSPARENCY PRINCIPLES:
       * - success: true - The request succeeded (we provided data)
       * - data: mockIndices - Same format as real data
       * - note: Informs user about the fallback situation
       * - timestamp: Same metadata as successful responses
       * 
       * 💡 WHY success: true FOR FALLBACK:
       * - From the user's perspective, they got the data they requested
       * - The frontend can display the data normally
       * - The 'note' field allows for optional user notification
       * - This prevents error states when the fallback is working correctly
       * 
       * 🔧 OPTIONAL USER NOTIFICATION:
       * - Frontend can check for the 'note' field and display a banner
       * - Users understand why data might look different
       * - Maintains trust by being transparent about data sources
       * - Allows for different UI treatment of demo vs live data
       */
      return NextResponse.json({
        success: true,
        data: mockIndices,
        timestamp: new Date().toISOString(),
        note: 'Using demo data - API temporarily unavailable'
      });
    }

  } catch (error) {
    /**
     * OUTER CATCH BLOCK - UNRECOVERABLE ERROR HANDLING
     * 
     * This catch block handles errors that couldn't be gracefully recovered from,
     * such as configuration issues or unexpected system failures.
     * 
     * 🚨 WHEN THIS CATCH EXECUTES:
     * - Missing API key (configuration error)
     * - Unexpected JavaScript errors (programming bugs)
     * - System-level failures (out of memory, etc.)
     * - Any error not caught by the inner try-catch
     * 
     * 🔧 ERROR LOGGING STRATEGY:
     * - console.error() for unrecoverable failures (vs console.warn() for handled failures)
     * - Logs the full error object with stack trace for debugging
     * - In production, this might integrate with error monitoring services
     * 
     * 📡 ERROR RESPONSE PATTERN:
     * - success: false clearly indicates failure to the frontend
     * - error: Provides a user-friendly error message
     * - status: 500 indicates server error (vs 4xx for client errors)
     * 
     * 🛡️ DEFENSIVE ERROR MESSAGE HANDLING:
     * - error instanceof Error checks if error is a proper Error object
     * - error.message extracts the human-readable message
     * - Fallback string handles cases where error isn't a standard Error object
     * - This prevents "undefined" or "[object Object]" in error messages
     * 
     * 💡 ERROR HANDLING HIERARCHY:
     * 1. Inner try-catch: Handle expected failures gracefully (API outages)
     * 2. Outer try-catch: Handle unexpected failures with clear error messages
     * 3. This creates a comprehensive error handling strategy that covers all scenarios
     */
    console.error('Market indices API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch market indices'
    }, { status: 500 });
  }
}