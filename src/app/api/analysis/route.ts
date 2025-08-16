// Next.js API Route for Technical Analysis with Real Market Data
// This file creates REST API endpoints using Next.js App Router's route handlers
// The file name 'route.ts' in the /api/analysis/ directory creates the endpoint /api/analysis

import { NextRequest, NextResponse } from 'next/server';
import { TechnicalAnalysisEngine } from '@/lib/technical-analysis/engine';
import { PriceData } from '@/lib/technical-analysis/types';
import { getFMPProvider } from '@/lib/data-providers/fmp';

/**
 * GET Handler - Handles HTTP GET requests to /api/analysis
 * 
 * This endpoint provides technical analysis for a stock symbol using real market data
 * from Financial Modeling Prep (FMP) API. This is a significant upgrade from mock data
 * to production-ready real-time market information.
 * 
 * Query Parameters:
 * - symbol: Stock symbol (default: 'AAPL') - e.g., 'GOOGL', 'MSFT', 'TSLA'
 * - period: Time period for historical data (default: '1year') - e.g., '1month', '3months', '1year'
 * 
 * Example: GET /api/analysis?symbol=GOOGL&period=6months
 * 
 * Key Changes from Mock Version:
 * - Real market data instead of generated mock data
 * - External API integration with error handling
 * - Current quote information for additional context
 * - Data source attribution and metadata
 */
export async function GET(request: NextRequest) {
  try {
    // Extract query parameters from the URL using Next.js URL parsing
    // NextRequest provides a clean way to access URL search parameters
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'AAPL'; // Default to Apple stock
    const period = searchParams.get('period') || '1year'; // Default to 1 year of data
    
    // Initialize the Financial Modeling Prep data provider
    // This abstracts the complexity of API calls and data formatting
    const fmpProvider = getFMPProvider();
    
    // Fetch real historical market data from FMP API
    // This replaces the mock data generation with actual market information
    // The data includes OHLCV (Open, High, Low, Close, Volume) for technical analysis
    const priceData = await fmpProvider.getHistoricalData(
      symbol.toUpperCase(), // Normalize symbol to uppercase (market standard)
      period as any // Cast to satisfy TypeScript (period validation happens in provider)
    );
    
    // Validate that we received data from the external API
    // Empty data could indicate invalid symbol, API issues, or no trading history
    if (priceData.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No historical data found for symbol: ${symbol}`,
        },
        { status: 404 } // HTTP 404 Not Found - appropriate for missing data
      );
    }
    
    // Initialize the technical analysis engine with default configuration
    // The engine orchestrates multiple technical indicators (RSI, MACD, Bollinger Bands, etc.)
    const engine = new TechnicalAnalysisEngine();
    
    // Perform comprehensive technical analysis on real market data
    // This calculates all indicators and generates trading signals based on actual price movements
    const analysis = engine.analyze(priceData, symbol.toUpperCase());
    
    // Fetch current market quote for real-time context
    // This provides additional information like current price, market cap, P/E ratio
    // We use a separate try-catch to ensure analysis continues even if quote fails
    let currentQuote = null;
    try {
      currentQuote = await fmpProvider.getQuote(symbol.toUpperCase());
    } catch (error) {
      // Log warning but don't fail the entire request
      // This demonstrates graceful degradation - core functionality works even if extras fail
      console.warn('Failed to fetch current quote:', error);
    }
    
    // Return comprehensive response with analysis results and metadata
    // NextResponse.json() automatically sets Content-Type: application/json
    return NextResponse.json({
      success: true,
      data: analysis, // Complete technical analysis results (indicators, signals, summary)
      priceData: priceData, // Include raw price data for frontend charting
      currentQuote: currentQuote, // Real-time quote information (if available)
      metadata: {
        symbol: symbol.toUpperCase(), // Normalized symbol
        dataPoints: priceData.length, // Number of historical data points analyzed
        period: period, // Time period requested
        dataSource: 'Financial Modeling Prep', // Attribution for data source
        analysisTimestamp: new Date().toISOString(), // When analysis was performed
        dateRange: {
          // Date range of the historical data for frontend display
          from: priceData[0]?.date, // Oldest data point
          to: priceData[priceData.length - 1]?.date, // Most recent data point
        },
      },
    });
    
  } catch (error) {
    // Comprehensive error handling with logging for debugging
    console.error('Analysis API error:', error);
    
    // Provide user-friendly error messages based on error type
    // This improves user experience by giving actionable feedback
    let errorMessage = 'Failed to perform technical analysis';
    let statusCode = 500; // Default to Internal Server Error
    
    // Type-safe error handling - check if error is an Error instance
    if (error instanceof Error) {
      // Parse different types of errors and provide appropriate responses
      if (error.message.includes('FMP API error')) {
        errorMessage = 'Failed to fetch market data. Please check the symbol or try again later.';
        statusCode = 503; // Service Unavailable - external API issue
      } else if (error.message.includes('No quote data found')) {
        errorMessage = `Symbol "${searchParams.get('symbol')}" not found. Please check the symbol and try again.`;
        statusCode = 404; // Not Found - invalid symbol
      } else {
        errorMessage = error.message; // Use the actual error message for other cases
      }
    }
    
    // Return structured error response with appropriate HTTP status code
    return NextResponse.json(
      {
        success: false, // Consistent response format for error handling
        error: errorMessage, // User-friendly error message
        details: error instanceof Error ? error.message : 'Unknown error', // Technical details for debugging
      },
      { status: statusCode } // HTTP status code matching the error type
    );
  }
}

/**
 * POST Handler - Handles HTTP POST requests to /api/analysis
 * 
 * This endpoint allows clients to submit their own price data for analysis.
 * This is useful for:
 * - Analyzing custom datasets or backtesting scenarios
 * - Testing with specific market conditions
 * - Integration with other data sources beyond FMP
 * - Offline analysis when external APIs are unavailable
 * 
 * Request Body:
 * - symbol: Stock symbol string
 * - priceData: Array of OHLCV data objects with date strings
 * - config: Optional technical analysis configuration (indicator parameters)
 * 
 * Example Request Body:
 * {
 *   "symbol": "AAPL",
 *   "priceData": [
 *     { "date": "2024-01-01", "open": 100, "high": 105, "low": 98, "close": 103, "volume": 1000000 }
 *   ],
 *   "config": { "rsi": { "period": 21 } }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse JSON request body
    // await is needed because request.json() returns a Promise
    const body = await request.json();
    const { symbol, priceData, config } = body; // Destructure expected fields
    
    // Input validation - ensure required fields are present and correct types
    // This prevents runtime errors and provides clear feedback to API consumers
    if (!symbol || !priceData || !Array.isArray(priceData)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body. Expected symbol and priceData array.',
        },
        { status: 400 } // HTTP 400 Bad Request - client error
      );
    }
    
    // Data transformation: Convert date strings to Date objects
    // JSON doesn't have a native Date type, so dates come as ISO strings
    // Our technical analysis engine expects JavaScript Date objects for calculations
    const processedData: PriceData[] = priceData.map((item: any) => ({
      ...item, // Spread operator copies all properties (open, high, low, close, volume)
      date: new Date(item.date), // Convert ISO string to Date object
    }));
    
    // Initialize engine with custom configuration if provided
    // This allows clients to customize indicator parameters (e.g., RSI period, MACD settings)
    // If no config provided, uses default settings from TechnicalAnalysisEngine
    const engine = new TechnicalAnalysisEngine(config);
    
    // Perform comprehensive technical analysis on the provided data
    // Same analysis logic as GET endpoint, but using client-provided data
    const analysis = engine.analyze(processedData, symbol);
    
    // Return successful response with analysis results
    // Same response format as GET endpoint for API consistency
    return NextResponse.json({
      success: true,
      data: analysis, // Complete technical analysis results
      metadata: {
        symbol, // Stock symbol as provided by client
        dataPoints: processedData.length, // Number of data points analyzed
        analysisTimestamp: new Date().toISOString(), // When analysis was performed
        dataSource: 'Client Provided', // Indicate this was custom data
      },
    });
    
  } catch (error) {
    // Consistent error handling across both GET and POST endpoints
    console.error('Analysis API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to perform technical analysis',
        // Type-safe error message extraction
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 } // HTTP 500 Internal Server Error
    );
  }
}

/*
 * Key Improvements in This Version:
 * 
 * 1. REAL DATA INTEGRATION: Replaced mock data with actual market data from FMP API
 * 2. ENHANCED ERROR HANDLING: Specific error messages for different failure scenarios
 * 3. GRACEFUL DEGRADATION: Core analysis works even if optional features (quotes) fail
 * 4. COMPREHENSIVE METADATA: Includes data source, date ranges, and analysis context
 * 5. PRODUCTION READY: Proper external API integration with error recovery
 * 
 * API Design Patterns Demonstrated:
 * 
 * 1. RESTful Design: GET for data retrieval, POST for custom data submission
 * 2. Consistent Response Format: All responses include success/error status and metadata
 * 3. Input Validation: Thorough checking of required fields and data types
 * 4. Error Classification: Different HTTP status codes for different error types
 * 5. Type Safety: TypeScript interfaces ensure data structure consistency
 * 6. Separation of Concerns: Business logic in separate modules, API handles HTTP concerns
 * 7. External API Integration: Proper handling of third-party service dependencies
 * 
 * Next.js App Router Features Used:
 * - Route Handlers: Named export functions become HTTP endpoints
 * - NextRequest/NextResponse: Type-safe request/response handling
 * - Automatic JSON parsing: Built-in support for JSON request/response bodies
 * - File-based routing: File location determines URL path (/api/analysis)
 */