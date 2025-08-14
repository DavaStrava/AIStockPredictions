// Next.js API Route for Technical Analysis
// This file creates REST API endpoints using Next.js App Router's route handlers
// The file name 'route.ts' in the /api/analysis/ directory creates the endpoint /api/analysis

import { NextRequest, NextResponse } from 'next/server';
import { TechnicalAnalysisEngine } from '@/lib/technical-analysis/engine';
import { PriceData } from '@/lib/technical-analysis/types';

/**
 * Mock Price Data Generator for Development and Demo
 * 
 * In a production app, this would be replaced with real market data from APIs like:
 * - Alpha Vantage, Yahoo Finance, IEX Cloud, or Bloomberg
 * 
 * This function simulates realistic stock price movements using:
 * - Random walk with controlled volatility
 * - Trending components using sine waves
 * - Realistic OHLCV (Open, High, Low, Close, Volume) relationships
 * 
 * @param symbol - Stock symbol (e.g., 'AAPL', 'GOOGL')
 * @param days - Number of historical days to generate
 * @returns Array of PriceData objects with realistic market data
 */
function generateMockPriceData(symbol: string, days: number = 100): PriceData[] {
  const data: PriceData[] = [];
  let basePrice = 100 + Math.random() * 100; // Random starting price between $100-$200
  
  // Generate historical data by working backwards from today
  for (let i = 0; i < days; i++) {
    // Create date for each day, starting from 'days' ago and moving forward
    const date = new Date();
    date.setDate(date.getDate() - (days - i)); // Subtract decreasing days to go chronologically
    
    // Simulate realistic price movements using multiple components:
    const volatility = 0.02; // 2% daily volatility (typical for stocks)
    const trend = Math.sin(i / 20) * 0.001; // Sine wave creates trending periods (0.1% trend component)
    const randomChange = (Math.random() - 0.5) * volatility + trend; // Random walk + trend
    
    // Calculate OHLC (Open, High, Low, Close) prices
    const open = basePrice; // Open price is previous day's close
    const change = basePrice * randomChange; // Dollar amount of change
    const close = basePrice + change; // New closing price
    
    // Generate realistic high/low prices that respect market logic:
    // - High must be >= max(open, close)
    // - Low must be <= min(open, close)
    const spread = Math.abs(change) + (Math.random() * basePrice * 0.01); // Intraday range
    const high = Math.max(open, close) + spread * Math.random(); // High extends above
    const low = Math.min(open, close) - spread * Math.random(); // Low extends below
    
    // Generate volume with realistic patterns:
    // - Base volume around 1M shares
    // - Higher volume on larger price moves (volatility attracts trading)
    // - Random component for daily variation
    const volume = Math.floor(1000000 + Math.abs(change / basePrice) * 5000000 + Math.random() * 2000000);
    
    // Create PriceData object conforming to our technical analysis interface
    data.push({
      date,   // JavaScript Date object
      open,   // Opening price
      high,   // Highest price during the day
      low,    // Lowest price during the day
      close,  // Closing price (most important for technical analysis)
      volume, // Number of shares traded
    });
    
    // Update base price for next iteration (creates price continuity)
    basePrice = close;
  }
  
  return data; // Return chronologically ordered array of price data
}

/**
 * GET Handler - Handles HTTP GET requests to /api/analysis
 * 
 * This endpoint provides technical analysis for a stock symbol using mock data.
 * In Next.js App Router, named export functions (GET, POST, PUT, DELETE) 
 * automatically become HTTP method handlers.
 * 
 * Query Parameters:
 * - symbol: Stock symbol (default: 'AAPL')
 * - days: Number of historical days (default: 100)
 * 
 * Example: GET /api/analysis?symbol=GOOGL&days=50
 */
export async function GET(request: NextRequest) {
  try {
    // Extract query parameters from the URL
    // NextRequest provides a clean way to access URL parameters
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'AAPL'; // Default to Apple stock
    const days = parseInt(searchParams.get('days') || '100'); // Default to 100 days
    
    // Generate mock data for demonstration
    // In production, this would fetch real data from market data APIs
    const priceData = generateMockPriceData(symbol, days);
    
    // Initialize the technical analysis engine with default configuration
    // The engine orchestrates multiple technical indicators (RSI, MACD, etc.)
    const engine = new TechnicalAnalysisEngine();
    
    // Perform comprehensive technical analysis
    // This calculates all indicators and generates trading signals
    const analysis = engine.analyze(priceData, symbol);
    
    // Return successful response with analysis results
    // NextResponse.json() automatically sets Content-Type: application/json
    return NextResponse.json({
      success: true,
      data: analysis, // Complete technical analysis results
      metadata: {
        symbol,
        dataPoints: priceData.length,
        analysisTimestamp: new Date().toISOString(), // When analysis was performed
      },
    });
    
  } catch (error) {
    // Error handling: Log the error and return user-friendly response
    console.error('Analysis API error:', error);
    
    // Return error response with 500 status code
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

/**
 * POST Handler - Handles HTTP POST requests to /api/analysis
 * 
 * This endpoint allows clients to submit their own price data for analysis.
 * Useful for:
 * - Analyzing custom datasets
 * - Testing with specific market scenarios
 * - Integration with external data sources
 * 
 * Request Body:
 * - symbol: Stock symbol string
 * - priceData: Array of OHLCV data objects
 * - config: Optional technical analysis configuration
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
        { status: 400 } // HTTP 400 Bad Request
      );
    }
    
    // Data transformation: Convert date strings to Date objects
    // JSON doesn't have a native Date type, so dates come as strings
    // Our technical analysis engine expects JavaScript Date objects
    const processedData: PriceData[] = priceData.map((item: any) => ({
      ...item, // Spread operator copies all properties (open, high, low, close, volume)
      date: new Date(item.date), // Convert ISO string to Date object
    }));
    
    // Initialize engine with custom configuration if provided
    // This allows clients to customize indicator parameters (e.g., RSI period, MACD settings)
    const engine = new TechnicalAnalysisEngine(config);
    
    // Perform comprehensive technical analysis on the provided data
    const analysis = engine.analyze(processedData, symbol);
    
    // Return successful response with analysis results
    // Same response format as GET endpoint for consistency
    return NextResponse.json({
      success: true,
      data: analysis, // Complete technical analysis results
      metadata: {
        symbol,
        dataPoints: processedData.length, // Number of data points analyzed
        analysisTimestamp: new Date().toISOString(), // When analysis was performed
      },
    });
    
  } catch (error) {
    // Consistent error handling across both endpoints
    console.error('Analysis API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to perform technical analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/*
 * API Design Patterns Demonstrated:
 * 
 * 1. RESTful Design: GET for retrieval, POST for data submission
 * 2. Consistent Response Format: All responses include success/error status
 * 3. Input Validation: Check required fields and data types
 * 4. Error Handling: Graceful error responses with appropriate HTTP status codes
 * 5. Type Safety: TypeScript interfaces ensure data structure consistency
 * 6. Separation of Concerns: Business logic in separate modules, API handles HTTP concerns
 * 7. Metadata: Include useful information about the analysis (timestamp, data points)
 * 
 * Next.js App Router Features Used:
 * - Route Handlers: Named export functions become HTTP endpoints
 * - NextRequest/NextResponse: Type-safe request/response handling
 * - Automatic JSON parsing: Built-in support for JSON request/response bodies
 * - File-based routing: File location determines URL path (/api/analysis)
 */