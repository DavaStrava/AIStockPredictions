/**
 * Financial Modeling Prep (FMP) Data Provider
 * 
 * This module implements a data provider for fetching real-time and historical stock market data
 * from the Financial Modeling Prep API. It demonstrates several important software engineering
 * patterns and concepts for building robust external API integrations.
 * 
 * Key Learning Concepts:
 * 1. External API Integration - How to interact with third-party financial data services
 * 2. Data Transformation - Converting external API formats to internal data structures
 * 3. Error Handling - Graceful handling of network failures and API errors
 * 4. TypeScript Interfaces - Defining contracts for external API responses
 * 5. Singleton Pattern - Managing shared instances for efficiency
 * 6. Environment Configuration - Using environment variables for API keys
 * 
 * Financial Data Concepts:
 * - OHLCV Data: Open, High, Low, Close, Volume - the fundamental price data structure
 * - Real-time Quotes: Current market prices and trading statistics
 * - Historical Data: Past price movements for technical analysis
 * - Market Metadata: Company information, exchanges, and trading details
 */

import { PriceData } from '@/lib/technical-analysis/types';

/**
 * FMP Historical Data Interface
 * 
 * This interface defines the structure of historical price data as returned by the
 * Financial Modeling Prep API. It's important to create TypeScript interfaces for
 * external API responses to ensure type safety and catch data structure changes.
 * 
 * Key Fields Explained:
 * - date: Trading date in string format (needs conversion to Date object)
 * - open/high/low/close: Standard OHLC price data for the trading session
 * - adjClose: Adjusted closing price (accounts for splits, dividends)
 * - volume: Number of shares traded during the session
 * - vwap: Volume Weighted Average Price (important for institutional trading)
 * - change/changePercent: Price movement metrics for quick analysis
 * 
 * Design Pattern: Interface Segregation
 * We define separate interfaces for different API responses rather than one large interface.
 * This follows the Interface Segregation Principle - clients shouldn't depend on
 * interfaces they don't use.
 */
interface FMPHistoricalData {
  date: string;                    // Trading date (e.g., "2024-01-15")
  open: number;                    // Opening price of the trading session
  high: number;                    // Highest price reached during the session
  low: number;                     // Lowest price reached during the session
  close: number;                   // Closing price at end of session
  adjClose: number;                // Adjusted close (accounts for corporate actions)
  volume: number;                  // Number of shares traded
  unadjustedVolume: number;        // Volume before adjustments
  change: number;                  // Absolute price change from previous close
  changePercent: number;           // Percentage change from previous close
  vwap: number;                    // Volume Weighted Average Price
  label: string;                   // Human-readable date label
  changeOverTime: number;          // Cumulative change over time period
}

/**
 * FMP Real-time Quote Interface
 * 
 * This interface represents real-time market data for a stock, including current
 * price, trading statistics, and fundamental metrics. Real-time quotes are essential
 * for live trading applications and current market analysis.
 * 
 * Financial Metrics Explained:
 * - marketCap: Total value of all shares (price × shares outstanding)
 * - priceAvg50/200: 50-day and 200-day moving averages (key technical levels)
 * - eps: Earnings Per Share (fundamental valuation metric)
 * - pe: Price-to-Earnings ratio (valuation multiple)
 * - yearHigh/Low: 52-week trading range (important support/resistance levels)
 * 
 * This comprehensive data structure allows for both technical and fundamental analysis
 * within a single API call, making it efficient for multi-dimensional stock analysis.
 */
interface FMPQuote {
  symbol: string;                  // Stock ticker symbol (e.g., "AAPL")
  name: string;                    // Company name (e.g., "Apple Inc.")
  price: number;                   // Current market price
  changesPercentage: number;       // Daily percentage change
  change: number;                  // Daily absolute price change
  dayLow: number;                  // Lowest price of current trading day
  dayHigh: number;                 // Highest price of current trading day
  yearHigh: number;                // 52-week high price
  yearLow: number;                 // 52-week low price
  marketCap: number;               // Market capitalization
  priceAvg50: number;              // 50-day moving average
  priceAvg200: number;             // 200-day moving average
  exchange: string;                // Stock exchange (e.g., "NASDAQ")
  volume: number;                  // Current day's trading volume
  avgVolume: number;               // Average daily volume
  open: number;                    // Opening price of current session
  previousClose: number;           // Previous session's closing price
  eps: number;                     // Earnings per share (trailing 12 months)
  pe: number;                      // Price-to-earnings ratio
  earningsAnnouncement: string;    // Next earnings announcement date
  sharesOutstanding: number;       // Total number of shares issued
  timestamp: number;               // Unix timestamp of quote
}

/**
 * FMP Data Provider Class
 * 
 * This class implements the Data Provider pattern, which abstracts the complexity of
 * external API interactions behind a clean, consistent interface. This pattern is
 * essential for building maintainable applications that depend on external services.
 * 
 * Design Patterns Demonstrated:
 * 1. **Facade Pattern**: Simplifies complex FMP API interactions into easy-to-use methods
 * 2. **Adapter Pattern**: Converts FMP's data format to our internal PriceData format
 * 3. **Configuration Pattern**: Flexible API key management with fallbacks
 * 4. **Error Handling Pattern**: Consistent error handling across all API methods
 * 
 * Key Benefits:
 * - Encapsulation: All FMP-specific logic is contained within this class
 * - Testability: Easy to mock for unit tests
 * - Maintainability: Changes to FMP API only require updates in one place
 * - Reusability: Can be used across different parts of the application
 * 
 * Security Considerations:
 * - API keys are managed through environment variables
 * - Fallback to demo key prevents application crashes
 * - No sensitive data is logged or exposed
 */
export class FMPDataProvider {
  /** 
   * Private API key for authenticating with FMP
   * 
   * Private fields (using TypeScript's 'private' keyword) ensure that sensitive
   * data like API keys cannot be accessed directly from outside the class.
   * This is an example of the Encapsulation principle in object-oriented programming.
   */
  private apiKey: string;
  
  /** 
   * Base URL for all FMP API endpoints
   * 
   * Storing the base URL as a class property makes it easy to change for testing
   * (e.g., pointing to a mock server) or if FMP changes their API structure.
   * This follows the DRY (Don't Repeat Yourself) principle.
   */
  private baseUrl = 'https://financialmodelingprep.com/api/v3';

  /**
   * Constructor with Flexible API Key Configuration
   * 
   * This constructor demonstrates several important patterns:
   * 
   * 1. **Dependency Injection**: API key can be injected for testing
   * 2. **Environment Configuration**: Falls back to environment variables
   * 3. **Graceful Degradation**: Uses demo key if no key provided
   * 4. **Defensive Programming**: Handles missing configuration gracefully
   * 
   * The parameter is optional (apiKey?: string) which allows the class to be
   * instantiated in multiple ways:
   * - new FMPDataProvider() - uses environment variable
   * - new FMPDataProvider('your-key') - uses provided key
   * 
   * @param apiKey - Optional API key, falls back to environment variable
   */
  constructor(apiKey?: string) {
    // Operator precedence: || (OR) evaluates left to right, using first truthy value
    // This creates a "fallback chain": provided key → environment variable → empty string
    this.apiKey = apiKey || process.env.FMP_API_KEY || '';
    
    // Defensive programming: handle the case where no API key is available
    // Rather than throwing an error (which would crash the application),
    // we provide a warning and use the demo key for basic functionality
    if (!this.apiKey) {
      console.warn('FMP API key not provided. Using demo key with limited requests.');
      this.apiKey = 'demo'; // FMP provides a demo key for testing
    }
  }

  /**
   * Fetch Historical Price Data for Technical Analysis
   * 
   * This method demonstrates several critical patterns for external API integration:
   * 
   * 1. **Async/Await Pattern**: Modern JavaScript for handling asynchronous operations
   * 2. **Error Handling**: Comprehensive error checking at multiple levels
   * 3. **Data Transformation**: Converting external format to internal structure
   * 4. **Type Safety**: Using TypeScript unions for parameter validation
   * 5. **Data Validation**: Ensuring API responses match expected format
   * 
   * Financial Data Processing:
   * - Fetches complete historical dataset from FMP
   * - Converts string dates to JavaScript Date objects
   * - Sorts data chronologically (required for technical analysis)
   * - Filters to requested time period for efficiency
   * 
   * Error Handling Strategy:
   * - Network errors (fetch failures)
   * - HTTP errors (4xx, 5xx status codes)
   * - API errors (FMP-specific error responses)
   * - Data format errors (unexpected response structure)
   * 
   * @param symbol - Stock ticker symbol (e.g., 'AAPL', 'GOOGL')
   * @param period - Time period for data (uses TypeScript union type for validation)
   * @returns Promise resolving to array of standardized price data
   * 
   * @example
   * ```typescript
   * const provider = new FMPDataProvider();
   * const data = await provider.getHistoricalData('AAPL', '1year');
   * console.log(`Fetched ${data.length} days of AAPL data`);
   * ```
   */
  async getHistoricalData(
    symbol: string, 
    period: '1day' | '5day' | '1month' | '3month' | '6month' | '1year' | '5year' = '1year'
  ): Promise<PriceData[]> {
    try {
      // Construct API URL with query parameters
      // Template literals (backticks) provide clean string interpolation
      const url = `${this.baseUrl}/historical-price-full/${symbol}?apikey=${this.apiKey}`;
      
      // Fetch API: Modern browser/Node.js method for HTTP requests
      // Returns a Promise that resolves to a Response object
      const response = await fetch(url);
      
      // Check HTTP status code before processing response
      // response.ok is true for status codes 200-299
      if (!response.ok) {
        throw new Error(`FMP API error: ${response.status} ${response.statusText}`);
      }
      
      // Parse JSON response - this can also throw if response isn't valid JSON
      const data = await response.json();
      
      // FMP-specific error handling: API returns errors in response body
      // Even with 200 status, the API might return an error object
      if (data.Error) {
        throw new Error(`FMP API error: ${data.Error}`);
      }
      
      // Validate response structure before processing
      // Defensive programming: never assume external APIs return expected format
      if (!data.historical || !Array.isArray(data.historical)) {
        throw new Error('Invalid response format from FMP API');
      }
      
      // Data Transformation: Convert FMP format to our internal PriceData format
      // This is an example of the Adapter pattern - adapting external format to internal needs
      const priceData: PriceData[] = data.historical
        .map((item: FMPHistoricalData) => ({
          // Convert string date to Date object for consistent handling
          date: new Date(item.date),
          
          /*
            🎓 ADVANCED FINANCIAL DATA PROCESSING: PROPORTIONAL PRICE ADJUSTMENT
            
            This code demonstrates a sophisticated approach to handling adjusted stock prices
            that goes beyond simply using adjusted close prices. It proportionally adjusts
            ALL price points (Open, High, Low, Close) to maintain accurate relationships.
            
            📊 THE PROBLEM WITH MIXED ADJUSTED/RAW DATA:
            
            Many financial APIs (including FMP) provide:
            - Raw OHLC prices (what actually traded that day)
            - Adjusted close price (accounts for splits/dividends)
            
            But using raw OHLC with adjusted close creates inconsistencies:
            
            Example: Stock splits 2-for-1
            Raw data:     Open: $100, High: $105, Low: $98, Close: $102
            Mixed data:   Open: $100, High: $105, Low: $98, Close: $51 (adjusted)
            ❌ Problem:   Close price is lower than Low price! (Impossible scenario)
            
            🔧 THE SOLUTION: PROPORTIONAL ADJUSTMENT
            
            We calculate an adjustment factor and apply it to ALL prices:
            
            Adjustment Factor = adjClose / rawClose
            
            If a stock splits 2-for-1:
            - Raw close: $102, Adjusted close: $51
            - Adjustment factor: $51 / $102 = 0.5
            - Apply 0.5 to all prices: Open: $50, High: $52.50, Low: $49, Close: $51
            ✅ Result: All prices maintain proper relationships
            
            🧮 MATHEMATICAL BREAKDOWN:
            
            The formula: adjustedPrice = (rawPrice × adjClose) / rawClose
            
            This can be rewritten as: adjustedPrice = rawPrice × adjustmentFactor
            Where adjustmentFactor = adjClose / rawClose
            
            Why this works:
            1. Preserves proportional relationships between OHLC prices
            2. Accounts for all corporate actions (splits, dividends, spin-offs)
            3. Creates mathematically consistent price data
            4. Matches what professional trading platforms display
            
            📈 REAL-WORLD EXAMPLE: Apple 4-for-1 Split (August 2020)
            
            Before split (raw data):
            Open: $425.00, High: $430.00, Low: $420.00, Close: $428.00
            
            After split (what we'd get with mixed data):
            Open: $425.00, High: $430.00, Low: $420.00, Close: $107.00 ❌ WRONG!
            
            With proportional adjustment (factor = 107/428 = 0.25):
            Open: $106.25, High: $107.50, Low: $105.00, Close: $107.00 ✅ CORRECT!
            
            🛡️ DEFENSIVE PROGRAMMING: DIVISION BY ZERO PROTECTION
            
            The condition `item.close !== 0` prevents division by zero errors:
            - If raw close is 0 (data error), use raw prices unchanged
            - This prevents crashes while maintaining data integrity
            - Graceful degradation: partial data is better than no data
            
            🏭 INDUSTRY ALIGNMENT:
            
            This approach matches how major financial platforms handle data:
            - TradingView: Uses proportionally adjusted OHLC data
            - Bloomberg Terminal: Adjusts all prices consistently
            - Yahoo Finance: Provides adjusted OHLC in their API
            - Google Finance: Shows adjusted prices in charts
            
            🔍 TECHNICAL ANALYSIS BENEFITS:
            
            Proportional adjustment ensures technical indicators work correctly:
            ✅ Candlestick patterns remain valid across corporate actions
            ✅ Support/resistance levels maintain their significance
            ✅ Moving averages don't show false breakouts after splits
            ✅ Volume analysis remains accurate (volume isn't adjusted)
            ✅ Price channels and trend lines stay relevant
            
            💡 KEY LEARNING CONCEPTS:
            
            1. **Data Consistency**: All related data points must be adjusted together
            2. **Mathematical Relationships**: Preserve proportional relationships in data
            3. **Domain Knowledge**: Financial expertise directly impacts code decisions
            4. **Defensive Programming**: Handle edge cases (division by zero)
            5. **Industry Standards**: Align with established practices for compatibility
            
            This implementation demonstrates how deep domain knowledge (finance) combined
            with solid programming practices (error handling, mathematical precision)
            creates robust, professional-grade financial software.
          */
          
          // Calculate adjustment factor for consistent OHLC data
          // This ensures all prices are adjusted proportionally for splits/dividends
          // Adjustment factor = adjClose / close (handles corporate actions)
          open: item.close !== 0 ? (item.open * item.adjClose) / item.close : item.open,
          high: item.close !== 0 ? (item.high * item.adjClose) / item.close : item.high,
          low: item.close !== 0 ? (item.low * item.adjClose) / item.close : item.low,
          close: item.adjClose, // Use adjusted close - matches Google Finance and other platforms
          volume: item.volume,
          
          // Note: This proportional adjustment ensures price accuracy and consistency with major financial platforms
          // All OHLC prices maintain their mathematical relationships while accounting for corporate actions
        }))
        // Sort chronologically (oldest to newest) - required for technical indicators
        // getTime() converts Date to milliseconds for numeric comparison
        .sort((a: PriceData, b: PriceData) => a.date.getTime() - b.date.getTime());
      
      // Apply time period filter to reduce data size and improve performance
      const filteredData = this.filterByPeriod(priceData, period);
      
      // Debug logging for data accuracy verification (only in development)
      if (process.env.NODE_ENV === 'development' && filteredData.length > 0) {
        const latestData = filteredData[filteredData.length - 1];
        console.log(`[FMP] ${symbol} latest price: $${latestData.close.toFixed(2)} on ${latestData.date.toLocaleDateString()}`);
      }
      
      return filteredData;
      
    } catch (error) {
      // Comprehensive error logging for debugging
      // Include symbol in error message for easier troubleshooting
      console.error(`Failed to fetch historical data for ${symbol}:`, error);
      
      // Re-throw error to allow calling code to handle it appropriately
      // This follows the "fail fast" principle - don't hide errors
      throw error;
    }
  }

  /**
   * Get Real-time Quote for Current Market Analysis
   * 
   * This method fetches current market data for a single stock, providing real-time
   * price information essential for live trading applications and current analysis.
   * 
   * Key Concepts Demonstrated:
   * 1. **Single Responsibility**: Method has one clear purpose - get current quote
   * 2. **Consistent Error Handling**: Same pattern as historical data method
   * 3. **Array Handling**: FMP returns quotes as arrays even for single symbols
   * 4. **Type Safety**: Returns strongly-typed FMPQuote interface
   * 
   * Real-time Data Considerations:
   * - Market hours: Data freshness depends on market status
   * - Rate limits: Real-time APIs often have stricter rate limiting
   * - Caching: Consider caching quotes for short periods to reduce API calls
   * - Latency: Network delays can affect "real-time" accuracy
   * 
   * @param symbol - Stock ticker symbol to get quote for
   * @returns Promise resolving to current market quote data
   * 
   * @example
   * ```typescript
   * const quote = await provider.getQuote('AAPL');
   * console.log(`AAPL: $${quote.price} (${quote.changesPercentage}%)`);
   * ```
   */
  async getQuote(symbol: string): Promise<FMPQuote> {
    try {
      const url = `${this.baseUrl}/quote/${symbol}?apikey=${this.apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`FMP API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.Error) {
        throw new Error(`FMP API error: ${data.Error}`);
      }
      
      // FMP returns quotes as arrays even for single symbols
      // This is a common API design pattern for consistency between single and batch requests
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No quote data found');
      }
      
      // Return the first (and only) quote from the array
      return data[0];
      
    } catch (error) {
      console.error(`Failed to fetch quote for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get Quotes for Multiple Symbols (Batch Processing)
   * 
   * This method demonstrates the Batch Processing pattern, which is crucial for
   * performance optimization when dealing with external APIs. Instead of making
   * multiple individual API calls, we combine requests into a single batch.
   * 
   * Performance Benefits:
   * 1. **Reduced Network Overhead**: One request instead of N requests
   * 2. **Lower Latency**: Single round-trip to server
   * 3. **Rate Limit Efficiency**: Uses fewer API quota units
   * 4. **Improved User Experience**: Faster data loading
   * 
   * Implementation Patterns:
   * - Array.join() to create comma-separated string (FMP's expected format)
   * - Same error handling pattern for consistency
   * - Returns array directly (no need to extract single item)
   * 
   * Trade-offs to Consider:
   * - Larger payload size (more data transferred)
   * - All-or-nothing failure (if one symbol fails, whole request fails)
   * - Potential timeout issues with very large batches
   * 
   * @param symbols - Array of stock ticker symbols to fetch quotes for
   * @returns Promise resolving to array of quote data for all symbols
   * 
   * @example
   * ```typescript
   * const quotes = await provider.getMultipleQuotes(['AAPL', 'GOOGL', 'MSFT']);
   * quotes.forEach(quote => {
   *   console.log(`${quote.symbol}: $${quote.price}`);
   * });
   * ```
   */
  async getMultipleQuotes(symbols: string[]): Promise<FMPQuote[]> {
    try {
      // Convert array to comma-separated string (FMP's expected format)
      // Array.join() is more efficient than string concatenation in loops
      const symbolsString = symbols.join(',');
      const url = `${this.baseUrl}/quote/${symbolsString}?apikey=${this.apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`FMP API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.Error) {
        throw new Error(`FMP API error: ${data.Error}`);
      }
      
      // For multiple quotes, FMP returns array directly
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format from FMP API');
      }
      
      return data;
      
    } catch (error) {
      // Include all symbols in error message for debugging
      // Array.join() creates readable comma-separated list
      console.error(`Failed to fetch quotes for symbols: ${symbols.join(', ')}:`, error);
      throw error;
    }
  }

  /**
   * Search for Stocks by Company Name or Symbol
   * 
   * This method implements a search functionality that allows users to find stocks
   * by typing partial company names or symbols. It demonstrates several important
   * concepts for building user-friendly search interfaces.
   * 
   * Key Concepts:
   * 1. **URL Encoding**: Properly encoding user input for safe URL construction
   * 2. **Default Parameters**: Providing sensible defaults for optional parameters
   * 3. **Inline Type Definition**: Defining return type structure directly in method signature
   * 4. **Defensive Programming**: Handling unexpected response formats gracefully
   * 
   * URL Encoding Importance:
   * - encodeURIComponent() handles special characters in search queries
   * - Prevents URL injection attacks and malformed requests
   * - Essential for user input that becomes part of URLs
   * - Examples: "AT&T" becomes "AT%26T", "Coca-Cola" becomes "Coca-Cola"
   * 
   * Search UX Considerations:
   * - Limit parameter prevents overwhelming results
   * - Fast response times for real-time search suggestions
   * - Returns empty array instead of error for no results (better UX)
   * - Includes exchange information for disambiguation
   * 
   * @param query - Search term (company name, symbol, or partial match)
   * @param limit - Maximum number of results to return (default: 10)
   * @returns Promise resolving to array of matching stock information
   * 
   * @example
   * ```typescript
   * // Search for Apple-related stocks
   * const results = await provider.searchStocks('Apple', 5);
   * results.forEach(stock => {
   *   console.log(`${stock.symbol}: ${stock.name} (${stock.exchangeShortName})`);
   * });
   * ```
   */
  async searchStocks(query: string, limit: number = 10): Promise<Array<{
    symbol: string;              // Stock ticker symbol
    name: string;                // Full company name
    currency: string;            // Trading currency (USD, EUR, etc.)
    stockExchange: string;       // Full exchange name
    exchangeShortName: string;   // Exchange abbreviation (NYSE, NASDAQ, etc.)
  }>> {
    try {
      // Construct search URL with properly encoded query parameter
      // encodeURIComponent() ensures special characters are safely encoded
      const url = `${this.baseUrl}/search?query=${encodeURIComponent(query)}&limit=${limit}&apikey=${this.apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`FMP API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.Error) {
        throw new Error(`FMP API error: ${data.Error}`);
      }
      
      // Return empty array for no results instead of throwing error
      // This provides better user experience for search functionality
      return Array.isArray(data) ? data : [];
      
    } catch (error) {
      console.error(`Failed to search stocks with query: ${query}:`, error);
      throw error;
    }
  }

  /**
   * Get Comprehensive Company Profile Information
   * 
   * This method fetches detailed company information beyond just price data,
   * providing fundamental analysis data and corporate details. It demonstrates
   * how to handle complex data structures with many optional fields.
   * 
   * Key Learning Concepts:
   * 1. **Complex Type Definitions**: Large interfaces with many properties
   * 2. **Fundamental Analysis Data**: Non-price company information
   * 3. **Corporate Identifiers**: Various ID systems (CIK, ISIN, CUSIP)
   * 4. **Boolean Flags**: Classification properties for different security types
   * 
   * Financial Identifiers Explained:
   * - CIK: Central Index Key (SEC identifier for regulatory filings)
   * - ISIN: International Securities Identification Number (global standard)
   * - CUSIP: Committee on Uniform Securities Identification Procedures (North America)
   * - These IDs help uniquely identify securities across different systems
   * 
   * Company Classification Flags:
   * - isEtf: Exchange-Traded Fund (not individual company stock)
   * - isAdr: American Depositary Receipt (foreign company trading in US)
   * - isFund: Mutual fund or similar investment vehicle
   * - isActivelyTrading: Currently available for trading
   * 
   * Use Cases:
   * - Company research and due diligence
   * - Fundamental analysis screening
   * - Portfolio diversification analysis
   * - Regulatory compliance and reporting
   * 
   * @param symbol - Stock ticker symbol to get company profile for
   * @returns Promise resolving to comprehensive company information
   * 
   * @example
   * ```typescript
   * const profile = await provider.getCompanyProfile('AAPL');
   * console.log(`${profile.companyName} - ${profile.industry}`);
   * console.log(`CEO: ${profile.ceo}, Employees: ${profile.fullTimeEmployees}`);
   * console.log(`Website: ${profile.website}`);
   * ```
   */
  async getCompanyProfile(symbol: string): Promise<{
    // Basic Company Information
    symbol: string;                    // Stock ticker symbol
    companyName: string;               // Official company name
    currency: string;                  // Primary trading currency
    
    // Financial System Identifiers
    cik: string;                       // SEC Central Index Key
    isin: string;                      // International Securities ID
    cusip: string;                     // CUSIP identifier
    
    // Exchange Information
    exchange: string;                  // Full exchange name
    exchangeShortName: string;         // Exchange abbreviation
    
    // Business Classification
    industry: string;                  // Specific industry classification
    sector: string;                    // Broad sector category
    
    // Corporate Information
    website: string;                   // Company website URL
    description: string;               // Business description
    ceo: string;                       // Chief Executive Officer name
    fullTimeEmployees: string;         // Number of employees
    
    // Contact Information
    phone: string;                     // Corporate phone number
    address: string;                   // Street address
    city: string;                      // City location
    state: string;                     // State/province
    zip: string;                       // Postal code
    country: string;                   // Country of incorporation
    
    // Valuation Metrics
    dcfDiff: number;                   // Discounted Cash Flow difference
    dcf: number;                       // DCF valuation estimate
    
    // Visual and Metadata
    image: string;                     // Company logo URL
    ipoDate: string;                   // Initial Public Offering date
    defaultImage: boolean;             // Whether using default logo
    
    // Security Type Classifications
    isEtf: boolean;                    // Is Exchange-Traded Fund
    isActivelyTrading: boolean;        // Currently trading status
    isAdr: boolean;                    // Is American Depositary Receipt
    isFund: boolean;                   // Is mutual fund or similar
  }> {
    try {
      const url = `${this.baseUrl}/profile/${symbol}?apikey=${this.apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`FMP API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.Error) {
        throw new Error(`FMP API error: ${data.Error}`);
      }
      
      // FMP returns company profiles as arrays (consistent with other endpoints)
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No company profile found');
      }
      
      // Return the first (and typically only) profile from the array
      return data[0];
      
    } catch (error) {
      console.error(`Failed to fetch company profile for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Filter Price Data by Time Period
   * 
   * This private utility method demonstrates several important programming concepts:
   * 
   * 1. **Private Methods**: Internal helper functions that shouldn't be called externally
   * 2. **Date Arithmetic**: Working with JavaScript Date objects and timestamps
   * 3. **Switch Statements**: Clean way to handle multiple discrete options
   * 4. **Array Filtering**: Functional programming approach to data selection
   * 5. **Performance Optimization**: Reducing data size for faster processing
   * 
   * Date Calculation Approach:
   * - Uses milliseconds since epoch (getTime()) for precise calculations
   * - Multiplies by constants: 24 hours × 60 minutes × 60 seconds × 1000 milliseconds
   * - Creates new Date objects to avoid mutating the original
   * 
   * Why Filter Data:
   * - Reduces memory usage for large datasets
   * - Improves chart rendering performance
   * - Focuses analysis on relevant time periods
   * - Reduces network transfer for cached data
   * 
   * @param data - Complete array of price data to filter
   * @param period - Time period string (validated by TypeScript union type)
   * @returns Filtered array containing only data within the specified period
   * 
   * @private This method is internal to the class and shouldn't be called externally
   */
  private filterByPeriod(data: PriceData[], period: string): PriceData[] {
    const now = new Date();
    let startDate: Date;
    
    // Switch statement provides clean, readable logic for multiple discrete options
    // Each case calculates the start date by subtracting milliseconds from current time
    switch (period) {
      case '1day':
        // 1 day = 24 hours × 60 minutes × 60 seconds × 1000 milliseconds
        startDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
        break;
      case '5day':
        startDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
        break;
      case '1month':
        // Approximate month as 30 days (good enough for filtering)
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3month':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '6month':
        startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case '1year':
        // Approximate year as 365 days (ignoring leap years for simplicity)
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case '5year':
        startDate = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        // Return original data if period is not recognized
        // This is defensive programming - handle unexpected inputs gracefully
        return data;
    }
    
    // Array.filter() creates new array with items that pass the test function
    // Functional programming approach: no mutation, clear intent
    // Comparison: item.date >= startDate includes the start date boundary
    return data.filter(item => item.date >= startDate);
  }

  /**
   * Validate API Key by Making Test Request
   * 
   * This method demonstrates the Health Check pattern, which is essential for
   * robust applications that depend on external services. It provides a way to
   * verify that the API integration is working correctly.
   * 
   * Design Patterns:
   * 1. **Health Check Pattern**: Verify external service availability
   * 2. **Fail Fast Pattern**: Detect configuration issues early
   * 3. **Boolean Return Pattern**: Simple success/failure indication
   * 4. **Exception Handling**: Convert exceptions to boolean results
   * 
   * Implementation Strategy:
   * - Uses a well-known, stable symbol (AAPL) for testing
   * - Leverages existing getQuote() method for consistency
   * - Catches all errors and returns false (no error propagation)
   * - Returns true only if the request succeeds completely
   * 
   * Use Cases:
   * - Application startup validation
   * - Configuration testing in development
   * - Monitoring and alerting systems
   * - User feedback for invalid API keys
   * 
   * @returns Promise resolving to true if API key is valid, false otherwise
   * 
   * @example
   * ```typescript
   * const provider = new FMPDataProvider('test-key');
   * const isValid = await provider.validateApiKey();
   * if (!isValid) {
   *   console.error('Invalid FMP API key - please check configuration');
   * }
   * ```
   */
  async validateApiKey(): Promise<boolean> {
    try {
      // Make a test request using a well-known, stable symbol
      // AAPL is chosen because it's always available and unlikely to be delisted
      await this.getQuote('AAPL');
      
      // If we reach this point, the API call succeeded
      return true;
      
    } catch (error) {
      // Any error (network, authentication, API limits) indicates invalid/unusable key
      // We don't log the error here since this might be called frequently for monitoring
      return false;
    }
  }
}

/**
 * Singleton Pattern Implementation
 * 
 * The Singleton pattern ensures that only one instance of the FMPDataProvider
 * exists throughout the application lifecycle. This is particularly important
 * for data providers because:
 * 
 * Benefits of Singleton for Data Providers:
 * 1. **Resource Efficiency**: Avoids creating multiple HTTP clients
 * 2. **Configuration Consistency**: Single source of API key configuration
 * 3. **Connection Pooling**: Reuses underlying network connections
 * 4. **Memory Optimization**: Reduces object creation overhead
 * 5. **Rate Limit Management**: Centralizes API call tracking
 * 
 * Implementation Details:
 * - Module-level variable stores the single instance
 * - Lazy initialization: instance created only when first requested
 * - Thread-safe in JavaScript (single-threaded event loop)
 * - Factory function provides clean access interface
 * 
 * Alternative Patterns:
 * - Dependency Injection: Better for testing but more complex setup
 * - Service Locator: More flexible but harder to track dependencies
 * - Module Exports: Simpler but less control over instantiation
 * 
 * Trade-offs:
 * - Pro: Simple, efficient, consistent configuration
 * - Con: Harder to test (global state), less flexible for different configs
 */

// Module-level variable to store the singleton instance
// null initially, will be populated on first access
let fmpInstance: FMPDataProvider | null = null;

/**
 * Factory Function for Singleton Access
 * 
 * This function implements the lazy initialization pattern within the singleton.
 * The instance is only created when first requested, which:
 * - Avoids unnecessary object creation if the provider is never used
 * - Ensures environment variables are available when instance is created
 * - Provides a clean, consistent interface for getting the provider
 * 
 * @returns The singleton FMPDataProvider instance
 * 
 * @example
 * ```typescript
 * // Anywhere in the application:
 * const provider = getFMPProvider();
 * const quote = await provider.getQuote('AAPL');
 * 
 * // Later calls return the same instance:
 * const sameProvider = getFMPProvider();
 * console.log(provider === sameProvider); // true
 * ```
 */
export function getFMPProvider(): FMPDataProvider {
  // Lazy initialization: create instance only if it doesn't exist
  if (!fmpInstance) {
    fmpInstance = new FMPDataProvider();
  }
  return fmpInstance;
}

/**
 * Type Exports for External Use
 * 
 * TypeScript's 'export type' syntax allows other modules to import and use
 * the FMPQuote interface for type checking without importing the actual
 * implementation. This provides:
 * 
 * 1. **Type Safety**: Other modules can type their variables correctly
 * 2. **IntelliSense**: IDEs can provide autocomplete for quote properties
 * 3. **Documentation**: Interface serves as contract documentation
 * 4. **Compile-time Checking**: Catches type mismatches before runtime
 * 
 * Usage in other files:
 * ```typescript
 * import type { FMPQuote } from '@/lib/data-providers/fmp';
 * 
 * function processQuote(quote: FMPQuote) {
 *   console.log(`${quote.symbol}: $${quote.price}`);
 * }
 * ```
 */
export type { FMPQuote };