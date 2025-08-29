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
 * 🔧 DUAL SYMBOL ARCHITECTURE:
 * - DISPLAY SYMBOLS: User-friendly names for UI components (e.g., "S&P 500", "NASDAQ")
 * - TECHNICAL SYMBOLS: API-compatible ticker symbols (e.g., "^GSPC", "^IXIC")
 * - SEPARATION OF CONCERNS: UI uses display symbols, APIs use technical symbols
 * - SINGLE RESPONSE: Both symbol types provided in same API response
 * 
 * 💡 LEARNING OBJECTIVES:
 * - Understanding nested error handling strategies
 * - Working with external APIs and handling failures
 * - Date/time manipulation and timezone conversions
 * - Data transformation and mapping patterns
 * - Building resilient systems that handle real-world failures
 * - Implementing dual data formats for different use cases
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * MARKET INDICES CONFIGURATION - STREAMLINED DATA STRUCTURE
 * 
 * This constant demonstrates the "configuration as data" pattern where we define
 * business logic (which indices to track) as structured data rather than code.
 * 
 * 🔄 RECENT API MIGRATION - FUTURES SYMBOL FORMAT CHANGE:
 * The futures symbols have been updated from Yahoo Finance format to Financial Modeling Prep (FMP) format.
 * This change demonstrates how configuration-driven architecture makes API migrations manageable.
 * 
 * 📊 FUTURES SYMBOL FORMAT EVOLUTION:
 * - BEFORE: Yahoo Finance format (NQ=F, ES=F, YM=F, RTY=F)
 * - AFTER: FMP format (NQUSD, ESUSD, YMUSD, RTYUSD)
 * 
 * 🔧 WHY THE FORMAT CHANGED:
 * - API CONSISTENCY: Using single data provider (FMP) for both regular and futures data
 * - RELIABILITY: FMP provides more consistent futures data availability
 * - SIMPLIFICATION: Reduces complexity of managing multiple API endpoints
 * - COST OPTIMIZATION: Consolidating to one paid API service instead of mixing free/paid
 * 
 * 🎯 DESIGN BENEFITS:
 * - MAINTAINABILITY: Easy to add/remove indices without code changes
 * - CONSISTENCY: Single source of truth for index information
 * - TYPE SAFETY: TypeScript can infer the structure and catch errors
 * - READABILITY: Clear, concise data structure without excessive documentation
 * - EXTENSIBILITY: New properties can be added without breaking existing code
 * - API FLEXIBILITY: Symbol format changes only require updating this configuration
 * 
 * 📊 STREAMLINED DATA STRUCTURE EXPLANATION:
 * Each market index object contains four essential properties:
 * 
 * - symbol: The actual ticker symbol used by Financial Modeling Prep API for regular market data
 *   Examples: '^GSPC' (S&P 500), '^IXIC' (NASDAQ), '^DJI' (Dow Jones)
 *   The '^' prefix indicates these are index symbols, not individual stocks
 * 
 * - name: Human-readable name for display in the user interface
 *   Examples: 'S&P 500', 'NASDAQ', 'Dow Jones'
 *   These are the names users recognize and expect to see
 * 
 * - displaySymbol: Short name optimized for UI display in limited space
 *   Examples: 'S&P 500', 'NASDAQ', 'DOW', 'RUSSELL'
 *   Used in mobile layouts, charts, and compact displays
 * 
 * - futuresSymbol: Corresponding futures contract symbol for 24/7 price discovery
 *   Examples: 'ESUSD' (S&P 500 E-mini), 'NQUSD' (NASDAQ 100 E-mini)
 *   The 'USD' suffix indicates USD-denominated futures contracts in FMP format
 * 
 * 💡 WHY SEPARATE SYMBOL AND DISPLAY NAMES:
 * - APIs often use technical symbols (^GSPC) that aren't user-friendly
 * - Display names (S&P 500) are more recognizable to users
 * - This mapping allows us to use correct API symbols while showing friendly names
 * - Enables internationalization (different display names for different languages)
 * 
 * 🔮 FUTURES SYMBOLS EXPLAINED - FMP API FORMAT:
 * Futures contracts are financial derivatives that trade nearly 24/7, providing
 * price discovery when stock markets are closed. The new FMP format uses different naming:
 * 
 * - NQUSD: NASDAQ 100 E-mini futures (tracks NASDAQ Composite movement)
 *   Contract size: $20 per point, trades on CME Globex
 *   FMP Format: Replaces Yahoo's NQ=F with NQUSD (USD-denominated)
 * 
 * - ESUSD: S&P 500 E-mini futures (tracks S&P 500 movement)
 *   Contract size: $50 per point, most liquid futures contract globally
 *   FMP Format: Replaces Yahoo's ES=F with ESUSD (USD-denominated)
 * 
 * - YMUSD: Dow Jones E-mini futures (tracks Dow Jones movement)
 *   Contract size: $5 per point, popular with retail traders
 *   FMP Format: Replaces Yahoo's YM=F with YMUSD (USD-denominated)
 * 
 * - RTYUSD: Russell 2000 E-mini futures (tracks Russell 2000 movement)
 *   Contract size: $50 per point, represents small-cap stocks
 *   FMP Format: Replaces Yahoo's RTY=F with RTYUSD (USD-denominated)
 * 
 * 🔄 SYMBOL FORMAT MIGRATION BENEFITS:
 * - UNIFIED API: All data (regular + futures) comes from single provider (FMP)
 * - CONSISTENCY: Same authentication, rate limits, and data quality standards
 * - RELIABILITY: Professional-grade API with better uptime guarantees
 * - SUPPORT: Dedicated customer support for troubleshooting data issues
 * 
 * 🕐 WHY FUTURES MATTER FOR MARKET ANALYSIS:
 * - EXTENDED HOURS: Trade when stock markets are closed (evenings, weekends)
 * - PRICE DISCOVERY: Indicate market sentiment and opening direction
 * - GLOBAL INFLUENCE: React to international news and events overnight
 * - LIQUIDITY: Provide continuous price information for analysis
 * - HEDGING: Allow institutional investors to manage risk 24/7
 * 
 * 🔧 ARRAY OF OBJECTS PATTERN:
 * This structure makes it easy to:
 * - Loop through indices: MARKET_INDICES.map(index => index.name)
 * - Find specific indices: MARKET_INDICES.find(index => index.symbol === '^GSPC')
 * - Extract symbols for API calls: MARKET_INDICES.map(index => index.symbol).join(',')
 * - Add new indices by simply adding objects to the array
 * - Access futures data conditionally: index.futuresSymbol
 * 
 * 📈 PRACTICAL APPLICATION:
 * This structure enables the application to:
 * 1. Show regular market data during trading hours (9:30 AM - 4:00 PM ET)
 * 2. Switch to futures data when markets are closed (evenings, weekends)
 * 3. Provide continuous market insights 24/7
 * 4. Give users context about after-hours market movements
 * 5. Display appropriate names based on UI context (mobile vs desktop)
 * 
 * 🏗️ CLEAN CODE PRINCIPLES DEMONSTRATED:
 * - CONCISENESS: Essential information without excessive documentation
 * - CLARITY: Each property has a clear, single purpose
 * - CONSISTENCY: All objects follow the same structure
 * - COMPLETENESS: Contains all data needed for the application
 * 
 * 💡 LEARNING TAKEAWAY:
 * Good configuration design balances completeness with simplicity.
 * This structure provides all necessary functionality while remaining
 * easy to read, understand, and maintain. The key is including just
 * enough information to support current and anticipated future needs
 * without over-engineering the solution.
 */
const MARKET_INDICES = [
  { 
    symbol: '^IXIC',                    // NASDAQ Composite Index - Yahoo Finance API symbol
    name: 'NASDAQ',                     // User-friendly name for display
    displaySymbol: 'NASDAQ',            // Compact name for UI components
    futuresSymbol: 'NQUSD'              // NASDAQ 100 E-mini futures - FMP API format
    /*
     * 🔄 FUTURES SYMBOL MIGRATION EXAMPLE:
     * This demonstrates how configuration changes can migrate API formats:
     * - OLD FORMAT: 'NQ=F' (Yahoo Finance convention)
     * - NEW FORMAT: 'NQUSD' (Financial Modeling Prep convention)
     * 
     * 💡 CONFIGURATION-DRIVEN BENEFITS:
     * - SINGLE POINT OF CHANGE: Update symbol here, entire app uses new format
     * - NO CODE CHANGES: Business logic remains unchanged, only data source changes
     * - TYPE SAFETY: TypeScript ensures all references use correct symbol format
     * - EASY ROLLBACK: Can revert to old format by changing this single value
     */
    /*
     * NASDAQ COMPOSITE INDEX DETAILS:
     * - Tracks over 3,000 stocks listed on the NASDAQ exchange
     * - Technology-heavy index (Apple, Microsoft, Amazon, Google)
     * - Market cap weighted (larger companies have more influence)
     * - Futures contract NQUSD provides after-hours price discovery
     */
  },
  { 
    symbol: '^GSPC',                    // S&P 500 Index - most watched US market benchmark
    name: 'S&P 500',                    // Standard & Poor's 500 - widely recognized name
    displaySymbol: 'S&P 500',           // Full name fits well in most UI contexts
    futuresSymbol: 'ESUSD'              // S&P 500 E-mini futures - FMP API format
    /*
     * 📊 MOST IMPORTANT INDEX - S&P 500:
     * This is the most widely followed stock market index globally.
     * The futures symbol change from 'ES=F' to 'ESUSD' represents:
     * - MIGRATION TO PROFESSIONAL API: FMP provides institutional-grade data
     * - CONSISTENT NAMING: All futures now follow XXXUSD pattern
     * - BETTER RELIABILITY: Reduced dependency on free APIs with rate limits
     */
    /*
     * S&P 500 INDEX DETAILS:
     * - Tracks 500 largest US companies by market capitalization
     * - Considered the best representation of the US stock market
     * - Used as benchmark for most investment funds and portfolios
     * - ESUSD futures are the most actively traded contracts in the world
     */
  },
  { 
    symbol: '^DJI',                     // Dow Jones Industrial Average - oldest US market index
    name: 'Dow Jones',                  // Simplified from "Dow Jones Industrial Average"
    displaySymbol: 'DOW',               // Very compact for mobile and small displays
    futuresSymbol: 'YMUSD'              // Dow Jones E-mini futures - FMP API format
    /*
     * DOW JONES INDUSTRIAL AVERAGE DETAILS:
     * - Tracks 30 large, established US companies (blue chips)
     * - Price-weighted index (higher stock prices have more influence)
     * - Oldest continuously calculated stock index (since 1896)
     * - YMUSD futures provide smaller contract size for retail traders
     */
  },
  { 
    symbol: '^RUT',                     // Russell 2000 Index - small-cap stock benchmark
    name: 'Russell 2000',               // Well-known name in financial circles
    displaySymbol: 'RUSSELL',           // Shortened for UI space constraints
    futuresSymbol: 'RTYUSD'             // Russell 2000 E-mini futures - FMP API format
    /*
     * RUSSELL 2000 INDEX DETAILS:
     * - Tracks 2,000 smallest companies in the Russell 3000 index
     * - Represents small-cap stocks (typically $300M - $2B market cap)
     * - Important indicator of domestic US economic health
     * - RTYUSD futures allow 24/7 trading of small-cap exposure
     */
  }
];

/**
 * 🔄 API MIGRATION AND CONFIGURATION MANAGEMENT PRINCIPLES
 * 
 * The recent futures symbol format changes (NQ=F → NQUSD, ES=F → ESUSD, etc.) 
 * demonstrate several important software engineering principles and best practices:
 * 
 * 🚀 API MIGRATION STRATEGY - CONFIGURATION-DRIVEN APPROACH:
 * This change showcases how well-designed configuration makes API migrations manageable:
 * 
 * 1. 📍 CENTRALIZED CONFIGURATION:
 *    - All API symbols defined in one place (this MARKET_INDICES array)
 *    - No scattered hardcoded symbols throughout the codebase
 *    - Single source of truth for all market data endpoints
 * 
 * 2. 🔧 ZERO-DOWNTIME MIGRATION:
 *    - Change symbols in configuration → entire app uses new API format
 *    - No business logic changes required
 *    - Can test new format in development before production deployment
 * 
 * 3. 🛡️ RISK MITIGATION:
 *    - Easy rollback: revert configuration if new API has issues
 *    - Gradual migration possible: could migrate one symbol at a time
 *    - Type safety ensures all code uses correct symbol format
 * 
 * 4. 💰 COST OPTIMIZATION:
 *    - Consolidating from multiple APIs (Yahoo + FMP) to single provider (FMP)
 *    - Reduces complexity of managing different rate limits and authentication
 *    - Professional API provides better reliability and support
 * 
 * 🎯 REAL-WORLD API MIGRATION CHALLENGES THIS SOLVES:
 * - SYMBOL FORMAT DIFFERENCES: Yahoo uses 'ES=F', FMP uses 'ESUSD'
 * - AUTHENTICATION METHODS: Free APIs vs paid APIs with API keys
 * - RATE LIMITING: Different providers have different usage restrictions
 * - DATA QUALITY: Professional APIs often provide more accurate/timely data
 * - RELIABILITY: Paid services typically offer better uptime guarantees
 * 
 * The recent changes to the MARKET_INDICES configuration also demonstrate several
 * important software engineering principles and best practices:
 * 
 * 1. 📝 DOCUMENTATION BALANCE:
 *    - BEFORE: Extensive inline documentation that could overwhelm the code
 *    - AFTER: Focused comments that explain the essential concepts
 *    - PRINCIPLE: Documentation should enhance understanding, not obscure the code
 *    - BENEFIT: Easier to read and maintain while preserving educational value
 * 
 * 2. 🎯 CLARITY OVER VERBOSITY:
 *    - SIMPLIFIED NAMES: "Dow Jones Industrial Average" → "Dow Jones"
 *    - FOCUSED COMMENTS: Essential information without excessive detail
 *    - CONSISTENT STRUCTURE: All objects follow the same commenting pattern
 *    - RESULT: Code that's easier to scan and understand at a glance
 * 
 * 3. 🏗️ CONFIGURATION-DRIVEN ARCHITECTURE BENEFITS:
 *    - SINGLE SOURCE OF TRUTH: All market index metadata lives in one place
 *    - EASY MAINTENANCE: Adding new indices requires only adding objects to the array
 *    - TYPE SAFETY: TypeScript infers the structure and catches usage errors
 *    - SCALABILITY: Can support hundreds of indices without architectural changes
 * 
 * 4. 🔧 PRACTICAL IMPLEMENTATION PATTERNS:
 *    This structure enables common programming operations:
 *    ```typescript
 *    // Extract all symbols for API calls
 *    const symbols = MARKET_INDICES.map(index => index.symbol).join(',');
 *    
 *    // Find specific index by symbol
 *    const sp500 = MARKET_INDICES.find(index => index.symbol === '^GSPC');
 *    
 *    // Get display names for UI
 *    const names = MARKET_INDICES.map(index => index.name);
 *    
 *    // Conditional symbol selection (regular vs futures)
 *    const activeSymbol = usefutures ? index.futuresSymbol : index.symbol;
 *    ```
 * 
 * 5. 💡 BUSINESS DOMAIN INTEGRATION:
 *    - FINANCIAL CONCEPTS: Each index represents different market segments
 *    - TRADING HOURS: Futures symbols enable 24/7 price discovery
 *    - USER EXPERIENCE: Display names optimize for different UI contexts
 *    - TECHNICAL REQUIREMENTS: API symbols ensure correct data retrieval
 * 
 * 6. 🚀 EVOLUTIONARY DESIGN PRINCIPLES:
 *    - BACKWARD COMPATIBILITY: Existing code continues to work unchanged
 *    - FORWARD COMPATIBILITY: New features can utilize the enhanced structure
 *    - ADDITIVE CHANGES: New properties added without removing existing ones
 *    - GRACEFUL DEGRADATION: System works even if some properties are missing
 * 
 * 🎯 KEY LEARNING TAKEAWAYS:
 * 
 * - **Clean Code**: Simplicity and clarity are more valuable than comprehensive documentation
 * - **Maintainability**: Well-structured data is easier to modify and extend
 * - **Type Safety**: TypeScript helps catch errors when configurations change
 * - **Business Alignment**: Technical structure should reflect business requirements
 * - **Evolution**: Good design accommodates future needs without breaking existing functionality
 * 
 * 💡 REAL-WORLD APPLICATIONS:
 * This pattern is commonly used in production systems for:
 * - API endpoint configurations and service discovery
 * - Feature flags and A/B testing parameters
 * - Internationalization and localization data
 * - Business rules and validation criteria
 * - Database connection strings and environment settings
 * 
 * 🔄 HOW THIS FUTURES SYMBOL CHANGE AFFECTS THE APPLICATION:
 * 
 * 1. 📊 DATA FETCHING LOGIC:
 *    - When markets are closed, app automatically switches to futures data
 *    - Uses futuresSymbol from this configuration to fetch NQUSD instead of NQ=F
 *    - All downstream components receive data in same format regardless of source
 * 
 * 2. 🎨 USER INTERFACE:
 *    - UI components show "Futures Data" indicators when using futures symbols
 *    - Charts and displays work identically with new symbol format
 *    - No user-facing changes despite backend API migration
 * 
 * 3. 🔍 LOGGING AND DEBUGGING:
 *    - API calls now use ESUSD, NQUSD, etc. in request URLs
 *    - Error messages and logs reference new symbol format
 *    - Easier to trace issues with consistent API provider
 * 
 * 4. 💾 DATA STORAGE:
 *    - Database records may store symbol references for caching
 *    - New format ensures consistency between cached and live data
 *    - Historical data remains valid with proper symbol mapping
 * 
 * The key insight is that configuration should be data-driven rather than
 * code-driven, enabling changes without deployments and making the system
 * more flexible and maintainable over time. This futures symbol migration
 * perfectly demonstrates how good architecture pays dividends during inevitable
 * API changes and service migrations.
 */

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
     * ENHANCED MARKET HOURS CALCULATION - COMPREHENSIVE TRADING SESSION DETECTION
     * 
     * This section demonstrates advanced timezone handling and financial market business logic.
     * The code has been enhanced from a simple "open/closed" check to a comprehensive
     * trading session detection system that recognizes all major market periods.
     * 
     * 🕐 TIMEZONE COMPLEXITY EXPLAINED:
     * - Users can be anywhere in the world (Tokyo, London, California, etc.)
     * - US stock markets operate on Eastern Time (EST/EDT with daylight saving)
     * - We need to determine exact market status regardless of user's location
     * - JavaScript Date objects are timezone-aware but require careful handling
     * 
     * 🔧 TECHNICAL IMPLEMENTATION BREAKDOWN:
     * 1. new Date() gets current time in user's local timezone
     * 2. toLocaleString() converts to specific timezone (America/New_York)
     * 3. new Date() parses the converted string back to a Date object in Eastern Time
     * 4. getHours(), getMinutes(), getDay() extract the time components we need
     * 
     * 📅 ENHANCED BUSINESS LOGIC - REAL MARKET TRADING SESSIONS:
     * This upgrade recognizes the actual complexity of modern stock trading:
     * - Regular Hours: 9:30 AM - 4:00 PM ET (main trading session)
     * - Pre-Market: 4:00 AM - 9:30 AM ET (institutional and retail extended trading)
     * - After-Hours: 4:00 PM - 8:00 PM ET (earnings reactions, news-driven trading)
     * - Futures: Weekends and late nights (futures markets for indices)
     * - Market Closed: All other times when no trading occurs
     * 
     * 💡 WHY THIS ENHANCED APPROACH MATTERS:
     * - ACCURACY: Users get precise information about what type of trading is happening
     * - CONTEXT: Different trading sessions have different characteristics and liquidity
     * - USER EXPERIENCE: More informative status helps users understand data relevance
     * - PROFESSIONAL GRADE: Matches the sophistication of real trading platforms
     * 
     * 🎯 REAL-WORLD APPLICATIONS:
     * - Pre-market data might be less reliable due to lower volume
     * - After-hours trading often reacts to earnings announcements
     * - Weekend futures can indicate Monday opening direction
     * - Regular hours provide the most liquid and reliable price discovery
     */
    
    // STEP 1: GET CURRENT TIME IN EASTERN TIMEZONE
    // This is the foundation of all market timing calculations
    const now = new Date();                                                    // Current time in user's local timezone
    const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"})); // Convert to Eastern Time
    
    // STEP 2: EXTRACT TIME COMPONENTS FOR CALCULATIONS
    const hour = easternTime.getHours();                                       // 0-23 hour format
    const minute = easternTime.getMinutes();                                   // 0-59 minutes
    const day = easternTime.getDay();                                          // 0=Sunday, 1=Monday, ..., 6=Saturday
    
    /**
     * TIME FORMAT CONVERSION - HHMM INTEGER PATTERN
     * 
     * This demonstrates a clever technique for time comparison using integers instead of
     * separate hour/minute comparisons. This pattern is commonly used in financial systems.
     * 
     * 🔢 MATHEMATICAL BREAKDOWN:
     * - hour * 100: Shifts hour to hundreds place (9 becomes 900, 14 becomes 1400)
     * - + minute: Adds minutes to ones/tens place (30 becomes 30, 5 becomes 5)
     * - Result: 9:30 AM becomes 930, 2:15 PM (14:15) becomes 1415
     * 
     * 🎯 WHY THIS APPROACH IS SUPERIOR:
     * - SINGLE COMPARISON: 930 <= currentTime < 1600 vs (hour >= 9 && minute >= 30) && (hour < 16)
     * - EDGE CASE HANDLING: Automatically handles 9:29 vs 9:30 correctly
     * - READABILITY: Time ranges become simple integer comparisons
     * - PERFORMANCE: Integer comparison is faster than multiple boolean operations
     * 
     * 📊 EXAMPLES:
     * - 4:00 AM → 4 * 100 + 0 = 400
     * - 9:30 AM → 9 * 100 + 30 = 930
     * - 4:00 PM (16:00) → 16 * 100 + 0 = 1600
     * - 8:00 PM (20:00) → 20 * 100 + 0 = 2000
     */
    const currentTime = hour * 100 + minute;                                   // Convert to HHMM format for easier comparison
    
    // STEP 3: DEFINE TRADING SESSION BOUNDARIES
    // These boolean flags create a clear, readable way to check different market conditions
    
    /**
     * WEEKDAY DETECTION - BUSINESS DAY LOGIC
     * 
     * JavaScript's getDay() method returns:
     * 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
     * 
     * BUSINESS LOGIC:
     * - day >= 1: Monday or later (excludes Sunday = 0)
     * - day <= 5: Friday or earlier (excludes Saturday = 6)
     * - Combined: Monday through Friday (traditional business days)
     * 
     * NOTE: This doesn't account for market holidays (Memorial Day, Christmas, etc.)
     * In a production system, you'd integrate with a market calendar API.
     */
    const isWeekday = day >= 1 && day <= 5;                                    // Monday through Friday
    
    /**
     * REGULAR TRADING HOURS - MAIN MARKET SESSION
     * 
     * The core trading session when most volume and price discovery occurs.
     * 
     * TIME BOUNDARIES:
     * - 930 = 9:30 AM ET (market open bell)
     * - 1600 = 4:00 PM ET (market close bell)
     * - Uses >= 930 to include 9:30:00 exactly
     * - Uses < 1600 to exclude 4:00:00 exactly (market closes at 4:00 PM sharp)
     * 
     * FINANCIAL SIGNIFICANCE:
     * - Highest liquidity and tightest bid-ask spreads
     * - Most reliable price discovery
     * - All market participants active (retail, institutional, algorithmic)
     * - Official closing prices set during this session
     */
    const isRegularHours = currentTime >= 930 && currentTime < 1600;           // 9:30 AM - 4:00 PM ET
    
    /**
     * MARKET OPEN STATUS - BOOLEAN LOGIC COMBINATION
     * 
     * Demonstrates the AND operator (&&) for combining conditions.
     * Both conditions must be true for the market to be considered "open":
     * 1. Must be a weekday (Monday-Friday)
     * 2. Must be during regular trading hours (9:30 AM - 4:00 PM ET)
     * 
     * TRUTH TABLE:
     * - Weekday=true, RegularHours=true → Market Open ✓
     * - Weekday=true, RegularHours=false → Market Closed (wrong time)
     * - Weekday=false, RegularHours=true → Market Closed (weekend)
     * - Weekday=false, RegularHours=false → Market Closed (weekend + wrong time)
     */
    const isMarketOpen = isWeekday && isRegularHours;                          // Main trading session active
    
    /**
     * PRE-MARKET TRADING SESSION
     * 
     * Extended trading session before regular market hours.
     * 
     * TIME BOUNDARIES:
     * - 400 = 4:00 AM ET (pre-market session begins)
     * - 930 = 9:30 AM ET (regular market opens, pre-market ends)
     * 
     * FINANCIAL CHARACTERISTICS:
     * - Lower volume than regular hours
     * - Wider bid-ask spreads
     * - More volatile price movements
     * - Primarily institutional and sophisticated retail traders
     * - Often reacts to overnight news, earnings, or international markets
     * 
     * BUSINESS LOGIC:
     * - Must be a weekday (no pre-market on weekends)
     * - Must be between 4:00 AM and 9:30 AM Eastern
     */
    const isPreMarket = isWeekday && currentTime >= 400 && currentTime < 930;  // 4:00 AM - 9:30 AM ET on weekdays
    
    /**
     * AFTER-HOURS TRADING SESSION
     * 
     * Extended trading session after regular market hours.
     * 
     * TIME BOUNDARIES:
     * - 1600 = 4:00 PM ET (regular market closes, after-hours begins)
     * - 2000 = 8:00 PM ET (after-hours session ends)
     * 
     * FINANCIAL CHARACTERISTICS:
     * - Lower volume than regular hours but higher than pre-market
     * - Often driven by earnings announcements (typically released after 4 PM)
     * - News reactions and analyst upgrades/downgrades
     * - Retail and institutional participation
     * - Can set tone for next day's opening
     * 
     * BUSINESS LOGIC:
     * - Must be a weekday (no after-hours on weekends)
     * - Must be between 4:00 PM and 8:00 PM Eastern
     */
    const isAfterHours = isWeekday && currentTime >= 1600 && currentTime < 2000; // 4:00 PM - 8:00 PM ET on weekdays
    
    /**
     * EXTENDED HOURS TRADING - COMPOSITE SESSION
     * 
     * Combines pre-market and after-hours into a single "extended hours" concept.
     * 
     * LOGICAL OR OPERATOR (||):
     * - Returns true if EITHER condition is true
     * - isPreMarket OR isAfterHours = extended hours trading active
     * 
     * USE CASES:
     * - UI indicators for "extended hours" vs "regular hours"
     * - Different data refresh rates for extended vs regular sessions
     * - Warning messages about lower liquidity during extended hours
     * - Broker-specific features that apply to all extended trading
     */
    const isExtendedHours = isPreMarket || isAfterHours;                       // Pre-market + After-hours combined
    
    /**
     * FUTURES TRADING TIME - COMPLEX BOOLEAN LOGIC
     * 
     * Identifies when futures markets are the primary source of price discovery.
     * This demonstrates advanced boolean logic with multiple conditions.
     * 
     * CONDITION BREAKDOWN:
     * 1. !isWeekday: NOT a weekday (weekends when stock markets are closed)
     * 2. OR (isWeekday && (currentTime < 400 || currentTime >= 2000))
     *    - IS a weekday AND
     *    - (before 4:00 AM OR after 8:00 PM)
     * 
     * FINANCIAL LOGIC:
     * - Weekends: Stock markets closed, but futures trade almost 24/7
     * - Late nights (8 PM - 4 AM): Stock markets closed, futures active
     * - Early mornings (before 4 AM): Stock markets closed, futures active
     * 
     * FUTURES MARKET CHARACTERISTICS:
     * - E-mini S&P 500 futures trade nearly 24 hours
     * - Provide price discovery when stock markets are closed
     * - Often indicate opening direction for stock markets
     * - React to international news and events
     * 
     * PARENTHESES IMPORTANCE:
     * Without proper parentheses, the logic would be:
     * !isWeekday || isWeekday && currentTime < 400 || currentTime >= 2000
     * Which would be interpreted as:
     * (!isWeekday || isWeekday && currentTime < 400) || currentTime >= 2000
     * This would incorrectly include weekday evenings after 8 PM as futures time
     * even when it should be regular market closed time.
     */
    const isFuturesTime = !isWeekday || (isWeekday && (currentTime < 400 || currentTime >= 2000)); // Weekend or late night
    
    /**
     * MARKET STATUS DETERMINATION - PRIORITY-BASED LOGIC
     * 
     * This function demonstrates the "priority cascade" pattern where conditions
     * are checked in order of specificity, with the most specific conditions first.
     * 
     * 🎯 PRIORITY ORDER EXPLANATION:
     * 1. Market Open (highest priority) - active main trading session
     * 2. Pre-Market - extended trading before regular hours
     * 3. After Hours - extended trading after regular hours
     * 4. Futures - when only futures markets are active
     * 5. Market Closed (default) - no trading activity
     * 
     * 🔧 WHY ORDER MATTERS:
     * - If multiple conditions could be true, we want the most specific one
     * - Early return pattern: first match wins, subsequent checks are skipped
     * - This prevents conflicts and ensures consistent status reporting
     * 
     * 💡 FUNCTION INSIDE FUNCTION PATTERN:
     * - Encapsulates the logic for determining market status
     * - Makes the main code more readable by hiding implementation details
     * - Could be extracted to a separate utility function if used elsewhere
     * - Demonstrates functional programming concepts within procedural code
     * 
     * 📊 RETURN VALUES:
     * Each return value is a user-friendly string that can be displayed in the UI:
     * - "Market Open" - green indicator, live data expected
     * - "Pre-Market" - yellow indicator, limited liquidity warning
     * - "After Hours" - orange indicator, earnings reaction context
     * - "Futures" - blue indicator, international market influence
     * - "Market Closed" - gray indicator, stale data expected
     */
    const getMarketStatus = () => {
      if (isMarketOpen) return 'Market Open';                                  // Priority 1: Main trading session
      if (isPreMarket) return 'Pre-Market';                                    // Priority 2: Early extended hours
      if (isAfterHours) return 'After Hours';                                  // Priority 3: Late extended hours
      if (isFuturesTime) return 'Futures';                                     // Priority 4: Futures-only time
      return 'Market Closed';                                                  // Default: No trading activity
    };
    
    /**
     * EXECUTE STATUS DETERMINATION
     * 
     * Calls the function to get the current market status string.
     * This value will be used throughout the rest of the API response
     * to provide context about data freshness and trading activity.
     * 
     * USAGE EXAMPLES:
     * - UI status indicators (colored badges showing current market state)
     * - Data refresh rate decisions (faster updates during market hours)
     * - User notifications (warnings about extended hours trading risks)
     * - Logging and analytics (track API usage patterns by market session)
     */
    const marketStatus = getMarketStatus();

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
       * ENHANCED SYMBOL SELECTION - FUTURES VS REGULAR MARKET DATA
       * 
       * This section demonstrates dynamic symbol selection based on market status.
       * When markets are closed, we fetch futures data instead of stale closing prices.
       * 
       * 🔧 DYNAMIC SYMBOL SELECTION PATTERN:
       * 1. Check if we should use futures data (markets closed or futures time)
       * 2. Extract appropriate symbols from configuration using conditional logic
       * 3. Join symbols for batch API call
       * 4. Use template literals for clean URL construction
       * 
       * 🎯 BUSINESS LOGIC:
       * - During market hours: Use regular index symbols (^GSPC, ^IXIC, etc.)
       * - During futures time: Use futures symbols (ES=F, NQ=F, etc.)
       * - This provides live price discovery when stock markets are closed
       * 
       * 💡 WHY FUTURES DATA MATTERS:
       * - Futures trade nearly 24/7, providing continuous price discovery
       * - Shows market sentiment when stock markets are closed
       * - Indicates likely opening direction for next trading session
       * - Reacts to overnight news and international market movements
       */
      
      /**
       * FUTURES DATA SELECTION LOGIC - COMPLEX BOOLEAN EXPRESSION
       * 
       * This boolean expression determines when to fetch futures data instead of
       * regular market index data. It demonstrates advanced logical reasoning
       * that mirrors real-world financial market operations.
       * 
       * 🔧 BOOLEAN LOGIC BREAKDOWN:
       * shouldUseFutures = isFuturesTime || (!isMarketOpen && !isExtendedHours)
       * 
       * CONDITION 1: isFuturesTime
       * - True during weekends and late nights (8 PM - 4 AM ET on weekdays)
       * - When only futures markets are actively trading
       * 
       * CONDITION 2: (!isMarketOpen && !isExtendedHours)
       * - !isMarketOpen: Stock markets are not in regular session
       * - !isExtendedHours: Not in pre-market or after-hours trading
       * - Combined: Markets are completely closed (no stock trading at all)
       * 
       * 🎯 LOGICAL OR (||) OPERATOR:
       * Returns true if EITHER condition is true:
       * - Use futures if it's futures time (weekends, late nights)
       * - OR use futures if markets are completely closed
       * - This ensures we always provide live price discovery when possible
       * 
       * 📊 PRACTICAL SCENARIOS:
       * 
       * SCENARIO 1 - Saturday afternoon:
       * - isFuturesTime = true (weekend)
       * - isMarketOpen = false, isExtendedHours = false
       * - Result: shouldUseFutures = true || true = TRUE ✓
       * 
       * SCENARIO 2 - Tuesday 10:00 AM (market open):
       * - isFuturesTime = false (weekday, regular hours)
       * - isMarketOpen = true, isExtendedHours = false
       * - Result: shouldUseFutures = false || false = FALSE ✓
       * 
       * SCENARIO 3 - Tuesday 6:00 PM (after-hours):
       * - isFuturesTime = false (weekday, not late night yet)
       * - isMarketOpen = false, isExtendedHours = true
       * - Result: shouldUseFutures = false || false = FALSE ✓
       * - Uses regular symbols because extended hours still provide stock data
       * 
       * SCENARIO 4 - Tuesday 11:00 PM (late night):
       * - isFuturesTime = true (late night on weekday)
       * - isMarketOpen = false, isExtendedHours = false
       * - Result: shouldUseFutures = true || true = TRUE ✓
       * 
       * 💡 WHY THIS LOGIC IS SOPHISTICATED:
       * - Prioritizes the most liquid and relevant market data
       * - Handles edge cases like extended hours vs complete market closure
       * - Provides seamless user experience across all time periods
       * - Mirrors how professional trading platforms operate
       * 
       * 🏭 PRODUCTION CONSIDERATIONS:
       * This logic ensures the API always returns meaningful, current market data
       * rather than stale closing prices, improving the user experience and
       * providing more actionable market insights.
       */
      // Determine which symbols to fetch based on market status
      const shouldUseFutures = isFuturesTime || (!isMarketOpen && !isExtendedHours);
      
      /**
       * CONDITIONAL SYMBOL MAPPING - ADVANCED ARRAY TRANSFORMATION
       * 
       * This demonstrates a sophisticated array transformation pattern that adapts
       * data selection based on runtime conditions (market status).
       * 
       * 🔧 BREAKDOWN OF THE TRANSFORMATION:
       * 1. MARKET_INDICES.map() - Transform each index configuration object
       * 2. Ternary operator (? :) - Choose symbol based on market conditions
       * 3. .join(',') - Combine selected symbols into API-ready format
       * 
       * 📊 CONDITIONAL LOGIC EXPLANATION:
       * shouldUseFutures ? index.futuresSymbol : index.symbol
       * 
       * IF shouldUseFutures is true:
       * - Use index.futuresSymbol (e.g., "ES=F" for S&P 500 futures)
       * - Provides live price discovery when stock markets are closed
       * 
       * IF shouldUseFutures is false:
       * - Use index.symbol (e.g., "^GSPC" for S&P 500 index)
       * - Standard market data during regular trading hours
       * 
       * 🎯 BUSINESS VALUE:
       * This pattern ensures users always get the most relevant market data:
       * - During market hours: Real-time index prices
       * - After hours/weekends: Forward-looking futures prices
       * - Seamless transition without user intervention
       * 
       * 💡 ARRAY TRANSFORMATION PATTERN:
       * This is a common functional programming pattern where:
       * - Input: Array of configuration objects
       * - Transform: Apply business logic to each element
       * - Output: Array of selected values based on conditions
       * - Final step: Convert to API format with join()
       * 
       * EXAMPLE TRANSFORMATION:
       * Input: [{ symbol: '^GSPC', futuresSymbol: 'ES=F' }, ...]
       * During market hours: ['^GSPC', '^IXIC', '^DJI', '^RUT']
       * After hours: ['ES=F', 'NQ=F', 'YM=F', 'RTY=F']
       * Final result: "ES=F,NQ=F,YM=F,RTY=F" (ready for API call)
       */
      const symbols = MARKET_INDICES.map(index => 
        shouldUseFutures ? index.futuresSymbol : index.symbol
      ).join(',');
      
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
      /**
       * DEBUGGING PATTERN - DATA INSPECTION AND TROUBLESHOOTING
       * 
       * This section demonstrates essential debugging techniques for API integration
       * and data mapping issues. When external APIs don't behave as expected, these
       * logging patterns help identify the root cause quickly.
       * 
       * 🔍 DEBUGGING STRATEGY EXPLAINED:
       * When working with external APIs, data mismatches are common. This code uses
       * structured logging to compare what we expect vs what we actually receive.
       * 
       * 🎯 COMMON API INTEGRATION PROBLEMS THIS HELPS SOLVE:
       * - Symbol format differences (^GSPC vs GSPC vs .GSPC)
       * - Unexpected data structure changes from the API provider
       * - Missing data for certain symbols
       * - Case sensitivity issues (AAPL vs aapl)
       * - Extra fields or missing fields in API responses
       * 
       * 💡 LEARNING CONCEPTS DEMONSTRATED:
       * - Structured logging for debugging
       * - Data transformation and inspection
       * - Array.map() for data extraction
       * - Console.log() best practices for production debugging
       * - Defensive programming patterns
       */

      // DEBUG LOG 1: INSPECT RECEIVED API DATA
      /**
       * ARRAY.MAP() FOR DATA EXTRACTION - DEBUGGING PATTERN
       * 
       * This demonstrates using Array.map() not for transformation, but for inspection.
       * We extract only the relevant fields (symbol, name) to reduce log noise.
       * 
       * 🔧 WHY EXTRACT SPECIFIC FIELDS:
       * - API responses often contain 20+ fields we don't need
       * - Logging everything creates noise and makes debugging harder
       * - Focusing on key fields (symbol, name) shows the essential information
       * - Easier to spot patterns and mismatches in clean, focused logs
       * 
       * 📊 WHAT THIS LOG REVEALS:
       * - Exact symbol format returned by the API (^GSPC, GSPC, etc.)
       * - Whether all requested symbols are present in the response
       * - If the API returns unexpected additional symbols
       * - Name formatting and any special characters
       * 
       * 🎯 DEBUGGING WORKFLOW:
       * 1. Check this log to see what the API actually returned
       * 2. Compare with our configuration (next log)
       * 3. Identify mismatches in symbol format or missing data
       * 4. Adjust our configuration or API request accordingly
       */
      console.log('Market Indices - All received quotes:', quotesData.map((q: any) => ({
        symbol: q.symbol,        // What symbol format did the API return?
        name: q.name            // What name does the API provide?
      })));
      
      // DEBUG LOG 2: INSPECT OUR CONFIGURATION
      /**
       * CONFIGURATION INSPECTION - COMPARE EXPECTED VS ACTUAL
       * 
       * This log shows our internal configuration so we can compare it side-by-side
       * with the API response above. This is crucial for identifying mapping issues.
       * 
       * 🔍 WHAT THIS LOG REVEALS:
       * - Our expected symbol format (what we're requesting)
       * - Our futures symbol mapping (for after-hours data)
       * - Our display names (what users see in the UI)
       * 
       * 🎯 COMMON ISSUES THIS HELPS IDENTIFY:
       * - Symbol format mismatches: We request "^GSPC" but API returns "GSPC"
       * - Missing symbols: We request 4 indices but only get 3 back
       * - Incorrect futures mapping: ES=F vs ESM23 (contract month differences)
       * - Name inconsistencies: "S&P 500" vs "S&P 500 Index"
       * 
       * 💡 SIDE-BY-SIDE COMPARISON TECHNIQUE:
       * By logging both datasets in the same format, you can easily compare:
       * 
       * EXPECTED (our config):     ACTUAL (API response):
       * symbol: "^GSPC"           symbol: "GSPC"          ← Mismatch found!
       * name: "S&P 500"           name: "S&P 500 Index"   ← Name difference
       * 
       * This makes it obvious where the mapping is failing.
       */
      console.log('Market Indices - Our configuration:', MARKET_INDICES.map(idx => ({
        symbol: idx.symbol,           // What we're requesting from the API
        futuresSymbol: idx.futuresSymbol,  // Our futures contract mapping
        name: idx.name               // Our display name for the UI
      })));

      /**
       * 🚀 PRODUCTION DEBUGGING BEST PRACTICES DEMONSTRATED:
       * 
       * 1. **STRUCTURED LOGGING**: Use objects instead of strings for better parsing
       *    ✅ Good: console.log('Data:', { symbol: 'AAPL', price: 150 })
       *    ❌ Bad: console.log('Symbol: AAPL, Price: 150')
       * 
       * 2. **FOCUSED EXTRACTION**: Only log the fields you need to debug
       *    ✅ Good: .map(q => ({ symbol: q.symbol, name: q.name }))
       *    ❌ Bad: console.log(entireApiResponse) // Too much noise
       * 
       * 3. **DESCRIPTIVE PREFIXES**: Use consistent prefixes for easy filtering
       *    ✅ Good: 'Market Indices - All received quotes:'
       *    ❌ Bad: 'Data:' or 'Debug:'
       * 
       * 4. **COMPARATIVE LOGGING**: Log both expected and actual data together
       *    This makes it easy to spot differences and identify root causes
       * 
       * 5. **TEMPORARY DEBUGGING**: These logs should be removed once the issue is resolved
       *    They're diagnostic tools, not permanent monitoring
       * 
       * 🔧 HOW TO USE THESE LOGS:
       * 1. Reproduce the issue (API call not working as expected)
       * 2. Check browser console or server logs for these debug messages
       * 3. Compare the two log outputs to identify mismatches
       * 4. Adjust configuration or API request based on findings
       * 5. Remove debug logs once issue is resolved
       * 
       * 💡 LEARNING TAKEAWAY:
       * When APIs don't work as expected, the problem is usually in the details:
       * symbol formats, field names, data structure differences. Structured
       * logging like this helps you quickly identify and fix these issues.
       */

      // Process the data
      const processedIndices = quotesData.map((quote: any) => {
        /**
         * ENHANCED DATA LOOKUP PATTERN - FUTURES-AWARE SYMBOL MATCHING
         * 
         * This enhanced lookup handles both regular market symbols and futures symbols.
         * We need to match the quote symbol against either the regular symbol or futures symbol
         * depending on what type of data we fetched.
         * 
         * 🔍 DUAL SYMBOL MATCHING LOGIC:
         * - First try to match against regular symbol (index.symbol === quote.symbol)
         * - If no match, try to match against futures symbol (index.futuresSymbol === quote.symbol)
         * - This handles both market hours (regular symbols) and futures time (futures symbols)
         * 
         * 💡 WHY DUAL MATCHING IS NEEDED:
         * - During market hours: API returns ^GSPC, we match against index.symbol
         * - During futures time: API returns ES=F, we match against index.futuresSymbol
         * - Same configuration object works for both scenarios
         * - Maintains consistent display names regardless of data source
         */
        const indexInfo = MARKET_INDICES.find(index => 
          index.symbol === quote.symbol || index.futuresSymbol === quote.symbol
        );
        
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
        /**
         * ENHANCED DATA OBJECT WITH FUTURES AWARENESS
         * 
         * This enhanced return object includes information about whether we're
         * displaying futures data or regular market data, providing context to users.
         */
        const isShowingFutures = shouldUseFutures && quote.symbol.includes('=F');
        
        /*
          DEBUG LOGGING - EDUCATIONAL PATTERN FOR TROUBLESHOOTING
          
          This console.log demonstrates a crucial debugging technique for data transformation.
          When working with external APIs and complex fallback logic, logging the decision
          process helps developers understand what's happening at runtime.
          
          🔍 LOGGING STRATEGY BREAKDOWN:
          - quoteSymbol: Shows what symbol the API returned (e.g., "^GSPC" or "ES=F")
          - quoteName: Shows the raw name from the API (e.g., "S&P 500" or "E-mini S&P 500 Futures")
          - hasIndexInfo: Boolean flag showing if we found matching configuration
          - finalName: Shows the actual name that will be displayed to users
          
          💡 WHY THIS LOGGING IS VALUABLE:
          1. DEBUGGING: Helps identify when fallback logic is triggered
          2. VALIDATION: Confirms our configuration matching is working correctly
          3. MONITORING: Can detect when APIs change their response format
          4. LEARNING: Shows the decision process for educational purposes
          
          🎯 PRODUCTION CONSIDERATIONS:
          In production, you might want to:
          - Use a proper logging library (Winston, Pino) instead of console.log
          - Add log levels (debug, info, warn, error) for better filtering
          - Include request IDs for tracing across multiple API calls
          - Consider performance impact of logging in high-traffic scenarios
          
          🔧 BOOLEAN CONVERSION PATTERN:
          !!indexInfo converts any value to a strict boolean:
          - !! is the "double NOT" operator
          - First !: Converts to boolean and inverts (object becomes false, null becomes true)
          - Second !: Inverts again (object becomes true, null becomes false)
          - Result: Clean true/false instead of truthy/falsy values
          
          EXAMPLES:
          - !!{name: "S&P 500"} → true (object exists)
          - !!null → false (no matching configuration)
          - !!undefined → false (no matching configuration)
        */
        console.log('Market Indices - Processing quote:', {
          quoteSymbol: quote.symbol,
          quoteName: quote.name,
          hasIndexInfo: !!indexInfo,
          finalName: indexInfo ? indexInfo.name : quote.name,
          // Additional context for the simplified fallback pattern
          fallbackStrategy: indexInfo ? 'using_configured_name' : 'using_api_name'
        });
        
        /*
          DATA TRANSFORMATION WITH ENHANCED FALLBACK PATTERN
          
          This return object demonstrates advanced fallback strategies for handling
          inconsistent or missing data from external APIs. Each property uses the
          logical OR operator (||) to provide graceful degradation.
          
          🔧 ENHANCED FALLBACK PATTERN EXPLANATION:
          The logical OR operator (||) evaluates from left to right and returns
          the first "truthy" value it encounters. This creates a priority chain
          where we prefer certain data sources over others.
          
          💡 RECENT SIMPLIFICATION - FROM TRIPLE TO SIMPLE CONDITIONAL:
          The 'name' property was simplified from a complex triple fallback to a simple conditional:
          
          BEFORE: indexInfo?.name || indexInfo?.displaySymbol || quote.name
          AFTER:  indexInfo ? indexInfo.name : quote.name
          
          🎯 RATIONALE FOR SIMPLIFICATION:
          The middle fallback (indexInfo?.displaySymbol) was removed because:
          1. Our MARKET_INDICES configuration always includes both name and displaySymbol
          2. displaySymbol is meant for UI space constraints, not as a name fallback
          3. The triple fallback created unnecessary complexity for this use case
          4. Simple conditional is more readable and maintainable
          
          CURRENT SIMPLIFIED FALLBACK STRATEGY:
          1. indexInfo.name (PREFERRED)
             - Our curated, user-friendly names from MARKET_INDICES config
             - Examples: "S&P 500", "NASDAQ", "Dow Jones", "Russell 2000"
             - Used when we have matching configuration for the symbol
             - Ensures consistent branding and user-friendly display names
          
          2. quote.name (FALLBACK)
             - Raw name from the external API (Financial Modeling Prep or Yahoo Finance)
             - Examples: "S&P 500", "NASDAQ Composite", "E-mini S&P 500 Futures"
             - Used when the symbol is not in our MARKET_INDICES configuration
             - Provides graceful degradation for unknown or new symbols
          
          🎯 WHY THIS SIMPLIFIED APPROACH WORKS BETTER:
          
          DESIGN PRINCIPLE:
          Since we control the MARKET_INDICES configuration and always include both
          name and displaySymbol for each index, the complex triple fallback was
          unnecessary. The simple conditional is more predictable and maintainable.
          
          EXAMPLE SCENARIOS WITH SIMPLIFIED LOGIC:
          
          Scenario A - Configured Index (Regular Hours):
          - indexInfo exists: { name: "S&P 500", symbol: "^GSPC", ... }
          - quote.name = "S&P 500" (from API)
          - Condition: indexInfo ? true
          - Result: "S&P 500" (uses indexInfo.name)
          
          Scenario B - Configured Index (Futures Hours):
          - indexInfo exists: { name: "S&P 500", futuresSymbol: "ES=F", ... }
          - quote.name = "E-mini S&P 500 Futures" (from futures API)
          - Condition: indexInfo ? true
          - Result: "S&P 500" (uses indexInfo.name, NOT the futures contract name)
          
          Scenario C - Unknown Symbol:
          - indexInfo = null (symbol not in MARKET_INDICES configuration)
          - quote.name = "Some Other Index" (from API)
          - Condition: indexInfo ? false
          - Result: "Some Other Index" (uses quote.name as fallback)
          
          🎓 KEY LEARNING POINTS FROM THIS CODE EVOLUTION:
          
          1. SIMPLICITY OVER COMPLEXITY:
             - Start with defensive programming (triple fallback)
             - Simplify as requirements become clearer
             - Remove unnecessary complexity when it doesn't add value
          
          2. CONFIGURATION-DRIVEN DESIGN:
             - Well-structured configuration reduces the need for complex fallbacks
             - If you control the data structure, you can make stronger assumptions
             - Consistent configuration enables simpler, more predictable code
          
          3. CONDITIONAL VS LOGICAL OR PATTERNS:
             - Logical OR (||): Good for same-type fallbacks (string || string)
             - Ternary (?:): Better for different logic paths (object ? object.prop : fallback)
             - Choose the pattern that best expresses your intent
          
          4. CODE EVOLUTION PRINCIPLES:
             - Code should evolve toward clarity and maintainability
             - Complex defensive code can be simplified as understanding improves
             - Regular refactoring keeps code clean and understandable
             - Document the reasoning behind changes for future developers
          
          🏗️ SOFTWARE ENGINEERING PRINCIPLES DEMONSTRATED:
          
          1. DEFENSIVE PROGRAMMING:
             - Handles missing or inconsistent data gracefully
             - Prevents crashes when external APIs change their response format
             - Provides meaningful fallbacks instead of undefined values
          
          2. PRIORITY-BASED CONFIGURATION:
             - Our curated names take precedence over API names
             - Maintains consistent branding and user experience
             - Allows customization without modifying external data
          
          3. GRACEFUL DEGRADATION:
             - System continues working even with partial configuration
             - Users see reasonable names even when our config is incomplete
             - Better user experience than showing technical symbols or errors
          
          4. MAINTAINABILITY:
             - Easy to update display names by modifying MARKET_INDICES config
             - Changes don't require code modifications, just data updates
             - Clear priority order makes debugging easier
          
          🔍 OPTIONAL CHAINING (?.) EXPLAINED:
          The ?. operator safely accesses properties that might not exist:
          - indexInfo?.name means "if indexInfo exists, access name property"
          - If indexInfo is null/undefined, the entire expression returns undefined
          - This prevents "Cannot read property 'name' of null" errors
          
          🚀 PRODUCTION BENEFITS:
          - RELIABILITY: App works even when external APIs change
          - CONSISTENCY: Users see predictable, branded names
          - FLEXIBILITY: Easy to customize display without code changes
          - ROBUSTNESS: Handles edge cases and missing data gracefully
          
          💡 LEARNING TAKEAWAY:
          When working with external APIs, always implement fallback strategies.
          The triple fallback pattern (preferred || acceptable || lastResort)
          is a powerful technique for building resilient applications that
          handle real-world data inconsistencies gracefully.
        */
        return {
          /*
            SYMBOL FALLBACK PATTERN:
            indexInfo?.displaySymbol || quote.symbol
            - Prefer our curated display symbols (e.g., "S&P 500") over API symbols (e.g., "^GSPC")
            - Ensures user-friendly symbols in the UI instead of technical ticker symbols
          */
          symbol: indexInfo?.displaySymbol || quote.symbol,
          
          /*
            ORIGINAL TICKER SYMBOL - DUAL SYMBOL ARCHITECTURE PATTERN
            
            🔧 PROBLEM THIS SOLVES:
            We need TWO different symbol formats for different purposes:
            1. USER-FRIENDLY SYMBOLS: For display in the UI (e.g., "S&P 500", "NASDAQ")
            2. TECHNICAL SYMBOLS: For API calls and data fetching (e.g., "^GSPC", "^IXIC")
            
            🎯 WHY WE NEED BOTH:
            
            DISPLAY SYMBOLS (stored in 'symbol' field):
            - Human-readable names that users recognize
            - Examples: "S&P 500", "NASDAQ", "DOW", "RUSSELL"
            - Used in UI components, charts titles, and user-facing displays
            - Optimized for readability and space constraints
            
            TICKER SYMBOLS (stored in 'tickerSymbol' field):
            - Technical symbols required by financial APIs
            - Examples: "^GSPC", "^IXIC", "^DJI", "^RUT"
            - Used for data fetching, chart APIs, and backend processing
            - Must match exact format expected by data providers
            
            🔄 DATA FLOW EXAMPLE:
            
            1. CONFIGURATION PHASE:
               - MARKET_INDICES defines: { symbol: '^GSPC', displaySymbol: 'S&P 500' }
               - We store both the technical symbol and user-friendly name
            
            2. API RESPONSE BUILDING:
               - symbol: 'S&P 500' (for UI display)
               - tickerSymbol: '^GSPC' (for chart APIs)
               - Frontend receives both formats in the same response
            
            3. FRONTEND USAGE:
               - UI components use 'symbol' for display: "S&P 500"
               - Chart components use 'tickerSymbol' for data: "^GSPC"
               - No additional mapping or lookups required
            
            🏗️ ARCHITECTURAL BENEFITS:
            
            1. SEPARATION OF CONCERNS:
               - Display logic uses display-optimized symbols
               - Data fetching logic uses API-compatible symbols
               - Each system uses the format it needs without conversion
            
            2. PERFORMANCE OPTIMIZATION:
               - No runtime symbol mapping or lookups required
               - Frontend receives both formats in single API call
               - Reduces complexity in chart components
            
            3. MAINTAINABILITY:
               - Symbol format changes only require config updates
               - No code changes needed when switching data providers
               - Clear distinction between display and technical symbols
            
            4. FLEXIBILITY:
               - Can customize display names without affecting data fetching
               - Easy to support multiple languages for display symbols
               - Technical symbols remain stable regardless of UI changes
            
            🔧 FALLBACK PATTERN EXPLANATION:
            indexInfo?.symbol || quote.symbol
            
            PRIMARY SOURCE (indexInfo?.symbol):
            - Our curated technical symbols from MARKET_INDICES configuration
            - Examples: "^GSPC", "^IXIC", "^DJI", "^RUT"
            - Ensures we use the correct symbols for our supported indices
            
            FALLBACK SOURCE (quote.symbol):
            - Symbol from the external API response
            - Used when we don't have the symbol in our configuration
            - Provides graceful degradation for unknown symbols
            
            📊 REAL-WORLD USE CASES:
            
            SCENARIO 1 - CHART COMPONENT NEEDS DATA:
            ```typescript
            // Chart component receives market index data
            const chartData = await fetch(`/api/chart?symbol=${index.tickerSymbol}`);
            // Uses "^GSPC" for accurate S&P 500 chart data
            ```
            
            SCENARIO 2 - UI COMPONENT SHOWS NAME:
            ```jsx
            // UI component displays user-friendly name
            <h3>{index.symbol}</h3>
            // Shows "S&P 500" instead of "^GSPC"
            ```
            
            SCENARIO 3 - ANALYSIS API CALL:
            ```typescript
            // Technical analysis needs precise symbol
            const analysis = await fetch(`/api/analysis?symbol=${index.tickerSymbol}`);
            // Uses "^GSPC" to get correct S&P 500 analysis data
            ```
            
            🚀 PRODUCTION BENEFITS:
            
            1. USER EXPERIENCE:
               - Users see friendly names like "S&P 500" instead of "^GSPC"
               - Charts and analysis use correct technical symbols
               - No confusion between display and data symbols
            
            2. DEVELOPER EXPERIENCE:
               - Clear separation between display and data concerns
               - No need to remember symbol mappings in components
               - Both formats available in single API response
            
            3. SYSTEM RELIABILITY:
               - Correct symbols ensure accurate data fetching
               - Fallback pattern handles missing configuration gracefully
               - Reduces errors from symbol format mismatches
            
            💡 LEARNING TAKEAWAY:
            When building systems that interface with external APIs, it's common
            to need different data formats for different purposes. The dual symbol
            pattern (display + technical) is a clean way to handle this requirement
            without forcing components to do runtime conversions or lookups.
            
            This pattern is especially important in financial applications where
            symbol accuracy is critical for data integrity, but user experience
            requires human-readable names.
          */
          tickerSymbol: indexInfo?.symbol || quote.symbol,
          
          /*
            ENHANCED NAME FALLBACK PATTERN - SIMPLIFIED CONDITIONAL LOGIC
            
            🔄 CODE CHANGE EXPLANATION:
            BEFORE: indexInfo?.name || indexInfo?.displaySymbol || quote.name (triple fallback)
            AFTER:  indexInfo ? indexInfo.name : quote.name (simple conditional)
            
            🎯 WHY THIS CHANGE WAS MADE:
            The previous triple fallback was overly complex for this use case:
            - indexInfo?.name: Our curated name (e.g., "S&P 500")
            - indexInfo?.displaySymbol: Our display symbol (e.g., "NASDAQ") 
            - quote.name: API name (e.g., "NASDAQ Composite")
            
            The middle fallback (displaySymbol) was redundant because:
            1. If we have indexInfo, we ALWAYS have indexInfo.name configured
            2. displaySymbol is meant for UI display, not as a name fallback
            3. It created confusion between symbol and name concepts
            
            🔧 TERNARY OPERATOR PATTERN:
            condition ? valueIfTrue : valueIfFalse
            
            BREAKDOWN:
            - indexInfo: The condition (truthy if object exists, falsy if null/undefined)
            - indexInfo.name: Value used when indexInfo exists (our curated names)
            - quote.name: Value used when indexInfo doesn't exist (API fallback)
            
            📊 PRACTICAL EXAMPLES:
            
            SCENARIO 1 - REGULAR MARKET HOURS (indexInfo exists):
            - indexInfo = { name: "S&P 500", symbol: "^GSPC", ... }
            - quote.name = "S&P 500" (from API)
            - Result: "S&P 500" (uses indexInfo.name)
            
            SCENARIO 2 - FUTURES HOURS (indexInfo exists):
            - indexInfo = { name: "S&P 500", futuresSymbol: "ES=F", ... }
            - quote.name = "E-mini S&P 500 Futures" (from futures API)
            - Result: "S&P 500" (uses indexInfo.name, NOT the futures contract name)
            
            SCENARIO 3 - UNKNOWN SYMBOL (indexInfo is null):
            - indexInfo = null (symbol not in our MARKET_INDICES config)
            - quote.name = "Some Other Index" (from API)
            - Result: "Some Other Index" (uses quote.name as fallback)
            
            🏗️ SOFTWARE ENGINEERING PRINCIPLES DEMONSTRATED:
            
            1. KISS PRINCIPLE (Keep It Simple, Stupid):
               - Simpler logic is easier to understand and maintain
               - Fewer conditions mean fewer potential bugs
               - More predictable behavior for developers
            
            2. SINGLE RESPONSIBILITY:
               - indexInfo.name: Human-readable names for display
               - indexInfo.displaySymbol: Short symbols for UI space constraints
               - quote.name: API-provided names as fallback
               - Each property has a clear, distinct purpose
            
            3. DEFENSIVE PROGRAMMING:
               - Still handles the case where indexInfo doesn't exist
               - Graceful fallback to API data when our config is incomplete
               - Prevents undefined/null name values that could break UI
            
            🎨 USER EXPERIENCE BENEFITS:
            - CONSISTENCY: Users always see "S&P 500", never "E-mini S&P 500 Futures"
            - CLARITY: Clean, recognizable names instead of technical contract names
            - BRANDING: Our curated names match what users expect to see
            - RELIABILITY: Fallback ensures something is always displayed
            
            💡 BOOLEAN EVALUATION IN JAVASCRIPT:
            Objects are "truthy" in JavaScript, so:
            - indexInfo (when it's an object): truthy → use indexInfo.name
            - indexInfo (when it's null/undefined): falsy → use quote.name
            
            This is more reliable than checking indexInfo?.name because:
            - We control the MARKET_INDICES configuration
            - If indexInfo exists, indexInfo.name is guaranteed to exist
            - No need to check for the property's existence separately
            
            🔄 REFACTORING BENEFITS:
            - READABILITY: Intent is clearer with simple conditional
            - MAINTAINABILITY: Easier to modify or extend the logic
            - PERFORMANCE: One less property access and comparison
            - DEBUGGING: Simpler logic means easier troubleshooting
            
            This change demonstrates how code evolution often moves toward
            simplicity as requirements become clearer and edge cases are
            better understood. The original triple fallback was defensive
            programming, but experience showed the middle case was unnecessary.
          */
          name: indexInfo ? indexInfo.name : quote.name,
          
          /*
            NUMERIC FALLBACK PATTERNS:
            These use || 0 to ensure we always have valid numbers for calculations.
            
            WHY FALLBACK TO 0:
            - Prevents NaN errors in mathematical operations
            - Allows charts and calculations to work even with missing data
            - Better than undefined which would break numeric formatting
            - 0 is a reasonable default for missing financial data (no change = 0)
          */
          price: quote.price || 0,
          change: quote.change || 0,
          changePercent: quote.changesPercentage || 0,
          isOpen: isMarketOpen,
          marketStatus: marketStatus,
          isExtendedHours: isExtendedHours,
          isFuturesTime: isFuturesTime,
          isShowingFutures: isShowingFutures,
          dataSource: isShowingFutures ? 'futures' : 'regular',
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
      const shouldUseFutures = isFuturesTime || (!isMarketOpen && !isExtendedHours);
      
      const mockIndices = MARKET_INDICES.map((index, i) => {
        // Generate realistic mock data
        const basePrice = [15000, 4500, 35000, 2000][i]; // Approximate real values
        const changePercent = (Math.random() - 0.5) * 4; // Random change between -2% and +2%
        const change = (basePrice * changePercent) / 100;
        const currentPrice = basePrice + change;
        
        /**
         * ENHANCED MOCK DATA WITH FUTURES AWARENESS
         * 
         * This enhanced mock data includes the same futures logic as real data,
         * ensuring consistent behavior regardless of data source.
         */
        // Debug logging for mock data
        console.log('Market Indices - Mock data symbol:', index.displaySymbol);
        
        return {
          symbol: index.displaySymbol,
          tickerSymbol: index.symbol,  // Original ticker symbol for chart API
          name: index.name,
          price: Math.round(currentPrice * 100) / 100,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round(changePercent * 100) / 100,
          isOpen: isMarketOpen,
          marketStatus: marketStatus,
          isExtendedHours: isExtendedHours,
          isFuturesTime: isFuturesTime,
          isShowingFutures: shouldUseFutures,
          dataSource: shouldUseFutures ? 'futures' : 'regular',
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