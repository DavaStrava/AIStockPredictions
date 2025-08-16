/**
 * Stock Search API Route - Next.js App Router API Endpoint
 * 
 * This file demonstrates several important web development concepts:
 * 
 * 1. NEXT.JS APP ROUTER API ROUTES: The new way to create API endpoints in Next.js 13+
 *    - File-based routing: /api/search/route.ts creates GET /api/search endpoint
 *    - Named exports (GET, POST, etc.) define HTTP methods
 *    - Replaces the older pages/api approach with more flexibility
 * 
 * 2. TYPESCRIPT INTEGRATION: Full type safety for request/response handling
 *    - NextRequest/NextResponse provide typed interfaces
 *    - Compile-time error checking prevents runtime issues
 *    - Better IDE support with autocomplete and error detection
 * 
 * 3. ERROR HANDLING PATTERNS: Comprehensive error management for production APIs
 *    - Try-catch blocks prevent unhandled exceptions
 *    - Different error types get appropriate HTTP status codes
 *    - User-friendly error messages vs detailed logging
 * 
 * 4. DATA VALIDATION: Input sanitization and validation best practices
 *    - Query parameter validation prevents malformed requests
 *    - Trimming whitespace handles user input inconsistencies
 *    - Default values provide fallbacks for optional parameters
 * 
 * 5. EXTERNAL API INTEGRATION: Calling third-party services safely
 *    - Abstraction layer (FMP provider) isolates external dependencies
 *    - Error handling for network failures and API rate limits
 *    - Data transformation to match internal API contracts
 */

// Import Next.js types for request/response handling
// NextRequest: Extends standard Request with Next.js-specific features
// NextResponse: Provides utilities for creating properly formatted responses
import { NextRequest, NextResponse } from 'next/server';

// Import our Financial Modeling Prep (FMP) data provider
// Uses path alias (@/) which maps to src/ directory (configured in tsconfig.json)
// This abstraction allows us to swap data providers without changing API logic
import { getFMPProvider } from '@/lib/data-providers/fmp';

/**
 * GET Handler for Stock Search API Endpoint
 * 
 * HTTP Method Handlers in Next.js App Router:
 * - Export functions named after HTTP methods (GET, POST, PUT, DELETE, etc.)
 * - Each function receives NextRequest and returns NextResponse
 * - Automatic routing based on file location (/api/search/route.ts → GET /api/search)
 * 
 * This endpoint allows users to search for stocks by symbol or company name.
 * It integrates with external financial data APIs and returns formatted results.
 * 
 * @param request - NextRequest object containing URL, headers, and query parameters
 * @returns NextResponse with JSON data or error information
 * 
 * @example
 * GET /api/search?q=AAPL&limit=5
 * Returns: { success: true, data: [...stocks], metadata: {...} }
 */
export async function GET(request: NextRequest) {
  // TRY-CATCH PATTERN: Essential for API endpoints to prevent crashes
  // Any unhandled error would return a 500 status and crash the function
  // This pattern ensures graceful error handling and proper HTTP responses
  try {
    // QUERY PARAMETER EXTRACTION: Getting data from URL search parameters
    // new URL(request.url) parses the full request URL
    // searchParams provides a clean interface to access ?key=value parameters
    const { searchParams } = new URL(request.url);
    
    // Extract search query parameter (e.g., ?q=AAPL)
    // .get() returns string | null, so we handle the null case below
    const query = searchParams.get('q');
    
    // Extract limit parameter with default fallback
    // parseInt() converts string to number, || '10' provides default if null/undefined
    // This pattern ensures we always have a valid number for the limit
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // INPUT VALIDATION: Critical for API security and reliability
    // Check if query exists and isn't just whitespace
    // .trim() removes leading/trailing spaces, .length checks for empty string
    if (!query || query.trim().length < 1) {
      // EARLY RETURN PATTERN: Exit immediately on invalid input
      // Return 400 Bad Request with descriptive error message
      // This prevents processing invalid requests and provides clear feedback
      return NextResponse.json(
        {
          success: false,                    // Consistent error response format
          error: 'Search query is required', // User-friendly error message
        },
        { status: 400 }                     // HTTP 400 = Bad Request (client error)
      );
    }
    
    // DEPENDENCY INJECTION PATTERN: Get configured data provider instance
    // getFMPProvider() returns a configured instance with API keys, base URLs, etc.
    // This abstraction allows easy testing (mock providers) and provider switching
    const fmpProvider = getFMPProvider();
    
    // EXTERNAL API CALL: Fetch stock search results from Financial Modeling Prep
    // await keyword pauses execution until the Promise resolves
    // .trim() ensures clean input to external API (removes extra whitespace)
    // This is an async operation that could take several seconds
    const searchResults = await fmpProvider.searchStocks(query.trim(), limit);
    
    // DATA TRANSFORMATION PIPELINE: Convert external API format to our internal format
    // This two-step process (filter → map) demonstrates functional programming patterns
    
    // STEP 1: FILTER - Remove unwanted results based on business rules
    // We only want stocks from major US exchanges (NASDAQ, NYSE, AMEX)
    // .filter() creates a new array with only items that pass the test function
    const formattedResults = searchResults
      .filter(result => 
        // Check if exchange information exists (defensive programming)
        result.exchangeShortName && 
        // Only include major US stock exchanges
        // .toUpperCase() handles case variations in API responses
        ['NASDAQ', 'NYSE', 'AMEX'].includes(result.exchangeShortName.toUpperCase())
      )
      // STEP 2: MAP - Transform each result to match our API contract
      // .map() creates a new array by transforming each element
      // This ensures consistent response format regardless of external API changes
      .map(result => ({
        symbol: result.symbol,                    // Stock ticker (e.g., "AAPL")
        name: result.name,                        // Company name (e.g., "Apple Inc.")
        exchange: result.exchangeShortName,       // Exchange (e.g., "NASDAQ")
        currency: result.currency,                // Trading currency (e.g., "USD")
        type: 'stock'                            // Static field for frontend filtering
      }));
    
    // SUCCESS RESPONSE: Return formatted data with metadata
    // Consistent response structure makes frontend integration easier
    return NextResponse.json({
      success: true,                              // Indicates successful operation
      data: formattedResults,                     // The actual search results
      metadata: {                                 // Additional context information
        query: query.trim(),                      // Echo back the search query
        resultsCount: formattedResults.length,   // Number of results returned
        timestamp: new Date().toISOString(),     // When the search was performed
      },
    });
    
  } catch (error) {
    // ERROR HANDLING BLOCK: Manages all types of errors that could occur
    
    // LOGGING: Record error details for debugging and monitoring
    // console.error() writes to server logs (CloudWatch in AWS Lambda)
    // Essential for troubleshooting production issues
    console.error('Search API error:', error);
    
    // ERROR CLASSIFICATION: Different errors need different responses
    // Initialize with generic defaults, then customize based on error type
    let errorMessage = 'Failed to search stocks';
    let statusCode = 500;  // HTTP 500 = Internal Server Error (default)
    
    // TYPE GUARD: Check if error is an Error instance (has .message property)
    // JavaScript can throw any type, so we need to check before accessing properties
    if (error instanceof Error) {
      // SPECIFIC ERROR HANDLING: Customize response based on error content
      if (error.message.includes('FMP API error')) {
        // External API failure - return 503 Service Unavailable
        errorMessage = 'Search service temporarily unavailable. Please try again later.';
        statusCode = 503;  // HTTP 503 = Service Unavailable (temporary)
      } else {
        // Other Error instances - use their message
        errorMessage = error.message;
      }
    }
    
    // ERROR RESPONSE: Return structured error information
    // Consistent error format helps frontend handle different error types
    return NextResponse.json(
      {
        success: false,                           // Indicates operation failed
        error: errorMessage,                      // User-friendly error message
        details: error instanceof Error ? error.message : 'Unknown error', // Technical details for debugging
      },
      { status: statusCode }                     // Appropriate HTTP status code
    );
  }
}

/**
 * EDUCATIONAL SUMMARY: Key Concepts Demonstrated in This API Route
 * 
 * This API endpoint showcases several important web development patterns:
 * 
 * 1. NEXT.JS APP ROUTER PATTERNS:
 *    - File-based API routing with named HTTP method exports
 *    - TypeScript integration with NextRequest/NextResponse
 *    - Modern replacement for pages/api directory structure
 * 
 * 2. API DESIGN BEST PRACTICES:
 *    - Consistent response format (success/error with metadata)
 *    - Proper HTTP status codes for different scenarios
 *    - Input validation and sanitization
 *    - Comprehensive error handling with user-friendly messages
 * 
 * 3. FUNCTIONAL PROGRAMMING CONCEPTS:
 *    - Array methods (filter, map) for data transformation
 *    - Pure functions that don't modify input data
 *    - Immutable data transformations
 * 
 * 4. EXTERNAL API INTEGRATION:
 *    - Abstraction layer for third-party services
 *    - Error handling for network failures
 *    - Data format normalization
 * 
 * 5. PRODUCTION-READY PATTERNS:
 *    - Comprehensive error logging
 *    - Graceful degradation on failures
 *    - Type safety throughout the request/response cycle
 *    - Security considerations (input validation)
 * 
 * This endpoint serves as a foundation for building robust, scalable APIs
 * that can handle real-world usage patterns and edge cases.
 */