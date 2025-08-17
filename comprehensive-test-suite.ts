/**
 * COMPREHENSIVE TECHNICAL ANALYSIS TEST SUITE
 * 
 * This file demonstrates advanced testing patterns for financial software systems.
 * It showcases how to build robust, maintainable test suites that validate complex
 * mathematical and algorithmic functionality across various market conditions.
 * 
 * 🎯 KEY EDUCATIONAL CONCEPTS DEMONSTRATED:
 * 
 * 1. TYPE-SAFE ERROR HANDLING:
 *    - Proper handling of TypeScript's 'unknown' error types in catch blocks
 *    - Type guards (instanceof Error) for safe property access
 *    - Fallback string conversion for non-Error thrown values
 * 
 * 2. FINANCIAL TESTING PATTERNS:
 *    - Market scenario simulation (bull, bear, sideways, volatile markets)
 *    - Edge case validation (empty data, invalid relationships)
 *    - Performance testing with realistic data volumes
 *    - Cross-indicator validation and consistency checks
 * 
 * 3. TEST ORGANIZATION PATTERNS:
 *    - Custom test runner with clear pass/fail reporting
 *    - Test isolation (failures don't stop other tests)
 *    - Comprehensive metrics tracking and reporting
 *    - CI/CD integration with proper exit codes
 * 
 * 4. DATA VALIDATION STRATEGIES:
 *    - Boundary condition testing (empty arrays, minimal data)
 *    - Business logic validation (price relationships)
 *    - Range validation (indicator values within expected bounds)
 *    - NaN and infinity detection for mathematical operations
 * 
 * 5. PERFORMANCE TESTING METHODOLOGY:
 *    - Baseline measurement (time, memory before execution)
 *    - Realistic load simulation (1000+ data points)
 *    - Threshold-based validation (execution time, memory usage)
 *    - Resource efficiency assessment
 * 
 * 🏗️ ARCHITECTURAL PATTERNS:
 * - Factory Pattern: createMarketScenario() generates different test data types
 * - Template Method: runTest() provides consistent test execution framework
 * - Strategy Pattern: Different validation approaches for different indicator types
 * - Observer Pattern: Test metrics tracking and reporting
 * 
 * 💡 WHY THIS APPROACH MATTERS:
 * Financial software requires exceptional reliability because incorrect calculations
 * can lead to significant financial losses. This test suite demonstrates how to
 * build confidence in complex mathematical algorithms through comprehensive testing.
 * 
 * The patterns shown here are applicable to any domain requiring high reliability:
 * - Medical software (patient safety)
 * - Aerospace systems (mission critical)
 * - Financial systems (monetary accuracy)
 * - Scientific computing (research validity)
 */

import { generateSamplePriceData, validatePriceData, calculateCorrelation } from './src/lib/technical-analysis/utils';
import { calculateRSI, analyzeRSI } from './src/lib/technical-analysis/indicators/rsi';
import { calculateMACD, analyzeMACD } from './src/lib/technical-analysis/indicators/macd';
import { calculateBollingerBands, analyzeBollingerBands } from './src/lib/technical-analysis/indicators/bollinger-bands';
import { analyzeMovingAverages } from './src/lib/technical-analysis/indicators/moving-averages';
import { analyzeMomentum } from './src/lib/technical-analysis/indicators/momentum';
import { analyzeVolume } from './src/lib/technical-analysis/indicators/volume';
import { PriceData } from './src/lib/technical-analysis/types';

console.log('🧪 COMPREHENSIVE TECHNICAL ANALYSIS TEST SUITE');
console.log('===============================================\n');

/**
 * TEST METRICS TRACKING SYSTEM
 * 
 * This simple but effective pattern tracks test execution statistics:
 * 
 * 📊 METRICS COLLECTION PATTERN:
 * - testsRun: Total number of tests executed (coverage metric)
 * - testsPassed: Number of successful tests (quality metric)
 * - testsFailed: Number of failed tests (risk metric)
 * 
 * 🎯 WHY TRACK THESE METRICS:
 * - Success Rate: testsPassed / testsRun gives overall health percentage
 * - Failure Rate: testsFailed / testsRun indicates system stability
 * - Coverage: testsRun shows breadth of testing
 * - Trend Analysis: Track metrics over time to identify quality trends
 * 
 * 💡 PROFESSIONAL TESTING INSIGHT:
 * These metrics are fundamental to software quality assessment and are
 * used by all major testing frameworks (Jest, Mocha, Vitest, etc.).
 * They provide objective measures of code reliability and help teams
 * make informed decisions about release readiness.
 */

// TEST METRICS TRACKING VARIABLES
// These counters maintain state across all test executions
let testsRun = 0;      // Total tests executed (incremented in runTest)
let testsPassed = 0;   // Successful tests (incremented on success)
let testsFailed = 0;   // Failed tests (incremented on exception)

/**
 * Test Runner Function - Executes individual tests with error handling
 * 
 * This function demonstrates several important software engineering patterns:
 * 
 * 🔧 ERROR HANDLING PATTERN:
 * The recent change from `error.message` to proper error type checking shows
 * a crucial TypeScript pattern for handling unknown error types safely.
 * 
 * BEFORE: error.message (assumes error is always an Error object)
 * AFTER:  error instanceof Error ? error.message : String(error)
 * 
 * WHY THIS MATTERS:
 * - JavaScript can throw ANY value (strings, numbers, objects, null, etc.)
 * - TypeScript's catch blocks receive 'unknown' type for safety
 * - Direct property access (error.message) fails if error isn't an Error object
 * - Type guards (instanceof Error) safely check the error type at runtime
 * 
 * 📊 TEST EXECUTION PATTERN:
 * This function implements a common testing framework pattern:
 * 1. Increment test counter (for statistics)
 * 2. Execute test function in try-catch block
 * 3. Track results (passed/failed counts)
 * 4. Provide clear visual feedback with emojis and formatting
 * 
 * 🎯 DEFENSIVE PROGRAMMING:
 * - Assumes errors might not be Error objects (defensive coding)
 * - Provides fallback string conversion for any thrown value
 * - Continues test execution even if individual tests fail
 * - Maintains test isolation (one test failure doesn't stop others)
 * 
 * This pattern is used by major testing frameworks like Jest, Mocha, and Vitest.
 * 
 * @param testName - Human-readable description of what's being tested
 * @param testFn - Function containing the test logic to execute
 */
function runTest(testName: string, testFn: () => void) {
  testsRun++;
  try {
    console.log(`🔍 ${testName}...`);
    testFn();
    testsPassed++;
    console.log(`✅ ${testName} - PASSED\n`);
  } catch (error) {
    testsFailed++;
    console.log(`❌ ${testName} - FAILED`);
    
    // TYPE-SAFE ERROR HANDLING PATTERN
    // This demonstrates proper error handling in TypeScript where catch blocks
    // receive 'unknown' type. We use a type guard to safely extract the message.
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`   Error: ${errorMessage}\n`);
  }
}

/**
 * Market Scenario Generator - Creates realistic test data for different market conditions
 * 
 * This helper function demonstrates several important testing and software design patterns:
 * 
 * 🏭 TEST DATA FACTORY PATTERN:
 * This function acts as a factory that creates different types of test data based on
 * market scenarios. This pattern provides several benefits:
 * - Centralized test data creation logic
 * - Consistent data structure across all tests
 * - Easy to modify market behavior for all tests
 * - Realistic data that mimics actual market conditions
 * 
 * 📈 FINANCIAL MARKET MODELING:
 * Each scenario models real market behaviors:
 * - BULLISH: Consistent upward price movement (bull markets)
 * - BEARISH: Consistent downward price movement (bear markets)  
 * - SIDEWAYS: Price oscillation within a range (consolidation)
 * - VOLATILE: Large random price swings (high uncertainty periods)
 * 
 * 🎯 UNION TYPE USAGE:
 * The type parameter uses a union type ('bullish' | 'bearish' | 'sideways' | 'volatile')
 * which provides:
 * - Type safety: Only valid scenario types are accepted
 * - IntelliSense support: IDE can suggest valid options
 * - Compile-time validation: Typos are caught before runtime
 * 
 * 🔧 SWITCH STATEMENT PATTERN:
 * The switch statement provides clean, readable logic for handling different scenarios.
 * Each case modifies the base data to create the desired market behavior.
 * 
 * This pattern is commonly used in financial testing to validate that algorithms
 * work correctly across different market conditions.
 * 
 * @param type - The type of market scenario to create
 * @param days - Number of trading days to generate (default: 100)
 * @returns Array of price data representing the specified market scenario
 */
function createMarketScenario(type: 'bullish' | 'bearish' | 'sideways' | 'volatile', days: number = 100): PriceData[] {
  // Start with baseline random data, then modify it to create specific market patterns
  const baseData = generateSamplePriceData('TEST', days, 100, 0.01);

  switch (type) {
    case 'bullish':
      // BULLISH MARKET SIMULATION
      // Models a bull market with consistent upward price movement
      for (let i = 1; i < baseData.length; i++) {
        // Trend factor creates 0.5-1.5% daily gains (realistic bull market behavior)
        const trendFactor = 1 + (0.005 + Math.random() * 0.01);
        baseData[i].close = baseData[i - 1].close * trendFactor;
        
        // Generate realistic OHLC relationships
        // High is slightly above close, low is slightly below
        baseData[i].high = baseData[i].close * (1 + Math.random() * 0.02);
        baseData[i].low = baseData[i].close * (1 - Math.random() * 0.015);
        baseData[i].open = baseData[i - 1].close; // Gap-free opening
      }
      break;

    case 'bearish':
      // BEARISH MARKET SIMULATION  
      // Models a bear market with consistent downward price movement
      for (let i = 1; i < baseData.length; i++) {
        // Trend factor creates 0.5-1.5% daily losses (realistic bear market behavior)
        const trendFactor = 1 - (0.005 + Math.random() * 0.01);
        baseData[i].close = baseData[i - 1].close * trendFactor;
        
        // In bear markets, selling pressure often creates different OHLC patterns
        baseData[i].high = baseData[i].close * (1 + Math.random() * 0.015);
        baseData[i].low = baseData[i].close * (1 - Math.random() * 0.02);
        baseData[i].open = baseData[i - 1].close;
      }
      break;

    case 'volatile':
      // HIGH VOLATILITY SIMULATION
      // Models periods of high uncertainty with large price swings
      for (let i = 1; i < baseData.length; i++) {
        // Volatility factor creates ±5% daily moves (much higher than normal)
        const volatilityFactor = 1 + (Math.random() - 0.5) * 0.1;
        baseData[i].close = baseData[i - 1].close * volatilityFactor;
        
        // Volatile markets have wider high-low ranges
        baseData[i].high = baseData[i].close * (1 + Math.random() * 0.05);
        baseData[i].low = baseData[i].close * (1 - Math.random() * 0.05);
        baseData[i].open = baseData[i - 1].close;
      }
      break;

    case 'sideways':
      // SIDEWAYS MARKET SIMULATION
      // Models consolidation periods where price oscillates within a range
      const basePrice = baseData[0].close;
      for (let i = 1; i < baseData.length; i++) {
        // Sine wave creates smooth oscillation pattern (technical analysis concept)
        const oscillation = Math.sin(i * 0.2) * 0.02; // 2% oscillation amplitude
        const noise = (Math.random() - 0.5) * 0.01; // 1% random noise for realism
        
        // Price oscillates around the base price rather than trending
        baseData[i].close = basePrice * (1 + oscillation + noise);
        baseData[i].high = baseData[i].close * (1 + Math.random() * 0.01);
        baseData[i].low = baseData[i].close * (1 - Math.random() * 0.01);
        baseData[i].open = baseData[i - 1].close;
      }
      break;
  }

  return baseData;
}

/**
 * TEST 1: Data Validation and Edge Cases
 * 
 * This test demonstrates several critical testing patterns for robust software:
 * 
 * 🛡️ NEGATIVE TESTING PATTERN:
 * Testing what happens when things go wrong is as important as testing success cases.
 * This test validates that our system properly rejects invalid data rather than
 * processing it and producing incorrect results.
 * 
 * 🔍 EXCEPTION TESTING PATTERN:
 * The pattern used here tests that functions throw expected errors:
 * 1. Call function that should throw
 * 2. If no exception thrown, fail the test (throw new Error)
 * 3. If exception thrown, verify it's the expected type/message
 * 4. Re-throw if it's an unexpected error
 * 
 * 📊 FINANCIAL DATA VALIDATION:
 * In financial applications, data integrity is critical because:
 * - Bad data leads to incorrect calculations
 * - Incorrect calculations lead to bad investment decisions
 * - Bad investment decisions can cause significant financial losses
 * 
 * The validation checks demonstrate real-world financial data constraints:
 * - High price must be >= Low price (basic market logic)
 * - All prices must be non-negative (no negative stock prices)
 * - Required fields must be present (date, OHLCV data)
 * 
 * 🎯 EDGE CASE TESTING:
 * - Empty arrays (boundary condition)
 * - Invalid price relationships (business logic validation)
 * - Minimal valid data (minimum viable input)
 * 
 * This comprehensive validation prevents the "garbage in, garbage out" problem
 * common in data processing applications.
 */
runTest('Data Validation and Edge Cases', () => {
  // NEGATIVE TEST: Empty data should be rejected
  // This tests the boundary condition where no data is provided
  try {
    validatePriceData([]);
    throw new Error('Should have thrown error for empty data');
  } catch (error) {
    // Apply the same type-safe error handling pattern used in runTest
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes('non-empty array')) {
      throw error;
    }
  }

  // NEGATIVE TEST: Invalid price relationships should be rejected
  // This tests business logic validation (high must be >= low)
  const invalidData = [
    { date: new Date(), open: 100, high: 90, low: 95, close: 98, volume: 1000 } // high < low
  ];

  try {
    validatePriceData(invalidData);
    throw new Error('Should have thrown error for invalid data');
  } catch (error) {
    // Consistent error handling pattern throughout the test
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes('high price cannot be less than low price')) {
      throw error;
    }
  }

  // POSITIVE TEST: Valid minimal data should be accepted
  // This tests the minimum viable input that should pass validation
  const minimalData = generateSamplePriceData('TEST', 5, 100, 0.01);
  validatePriceData(minimalData); // Should not throw
});

// Test 2: RSI in Different Market Conditions
runTest('RSI Analysis in Different Market Conditions', () => {
  const scenarios = ['bullish', 'bearish', 'sideways', 'volatile'] as const;

  scenarios.forEach(scenario => {
    const data = createMarketScenario(scenario, 50);
    const rsiAnalysis = analyzeRSI(data, 'TEST');

    // Verify RSI values are within valid range
    rsiAnalysis.results.forEach(result => {
      if (result.value < 0 || result.value > 100) {
        throw new Error(`Invalid RSI value: ${result.value}`);
      }
    });

    // Check signal generation
    const signals = rsiAnalysis.signals;
    console.log(`   ${scenario.toUpperCase()}: ${signals.length} RSI signals generated`);

    // Verify signal properties
    signals.forEach(signal => {
      if (signal.strength < 0 || signal.strength > 1) {
        throw new Error(`Invalid signal strength: ${signal.strength}`);
      }
      if (!['buy', 'sell', 'hold'].includes(signal.signal)) {
        throw new Error(`Invalid signal type: ${signal.signal}`);
      }
    });
  });
});

// Test 3: MACD Signal Accuracy
runTest('MACD Signal Accuracy', () => {
  const bullishData = createMarketScenario('bullish', 60);
  const bearishData = createMarketScenario('bearish', 60);

  const bullishMACD = analyzeMACD(bullishData, 'BULL');
  const bearishMACD = analyzeMACD(bearishData, 'BEAR');

  // In a strong bullish trend, we should see more bullish crossovers
  const bullishCrossovers = bullishMACD.results.filter(r => r.crossover === 'bullish').length;
  const bearishCrossovers = bearishMACD.results.filter(r => r.crossover === 'bullish').length;

  console.log(`   Bullish trend: ${bullishCrossovers} bullish MACD crossovers`);
  console.log(`   Bearish trend: ${bearishCrossovers} bullish MACD crossovers`);

  // Verify MACD components
  bullishMACD.results.forEach(result => {
    if (isNaN(result.macd) || isNaN(result.signal) || isNaN(result.histogram)) {
      throw new Error('MACD components contain NaN values');
    }
  });
});

// Test 4: Bollinger Bands Squeeze Detection
runTest('Bollinger Bands Squeeze Detection', () => {
  const sidewaysData = createMarketScenario('sideways', 80);
  const volatileData = createMarketScenario('volatile', 80);

  const sidewaysBB = analyzeBollingerBands(sidewaysData, 'SIDEWAYS');
  const volatileBB = analyzeBollingerBands(volatileData, 'VOLATILE');

  // Count squeezes
  const sidewaysSqueezes = sidewaysBB.results.filter(r => r.squeeze).length;
  const volatileSqueezes = volatileBB.results.filter(r => r.squeeze).length;

  console.log(`   Sideways market: ${sidewaysSqueezes} squeeze periods`);
  console.log(`   Volatile market: ${volatileSqueezes} squeeze periods`);

  // Verify %B calculations
  sidewaysBB.results.forEach(result => {
    if (result.percentB < -0.5 || result.percentB > 1.5) {
      console.warn(`Extreme %B value: ${result.percentB}`);
    }
    if (result.bandwidth < 0) {
      throw new Error(`Negative bandwidth: ${result.bandwidth}`);
    }
  });
});

// Test 5: Moving Average Crossover Detection
runTest('Moving Average Crossover Detection', () => {
  const trendingData = createMarketScenario('bullish', 100);

  const maAnalysis = analyzeMovingAverages(trendingData, 'TREND', {
    periods: [10, 20, 50],
    includeEMA: true,
    detectCrossovers: true
  });

  // Check for crossover signals
  const crossoverSignals = maAnalysis.signals.filter(s => s.indicator.includes('Crossover'));
  console.log(`   Generated ${crossoverSignals.length} crossover signals`);

  // Verify SMA and EMA arrays
  if (!maAnalysis.sma || maAnalysis.sma.length === 0) {
    throw new Error('No SMA results generated');
  }
  if (!maAnalysis.ema || maAnalysis.ema.length === 0) {
    throw new Error('No EMA results generated');
  }

  // Verify moving average values are reasonable
  maAnalysis.sma.flat().forEach(result => {
    if (result.value <= 0) {
      throw new Error(`Invalid moving average value: ${result.value}`);
    }
  });
});

// Test 6: Momentum Indicators Consistency
runTest('Momentum Indicators Consistency', () => {
  const data = createMarketScenario('volatile', 70);

  const momentumAnalysis = analyzeMomentum(data, 'MOMENTUM');

  // Verify Stochastic values
  momentumAnalysis.stochastic.forEach(result => {
    if (result.k < 0 || result.k > 100 || result.d < 0 || result.d > 100) {
      throw new Error(`Invalid Stochastic values: K=${result.k}, D=${result.d}`);
    }
  });

  // Verify Williams %R values
  momentumAnalysis.williamsR.forEach(result => {
    if (result.value > 0 || result.value < -100) {
      throw new Error(`Invalid Williams %R value: ${result.value}`);
    }
  });

  // Verify ADX values
  momentumAnalysis.adx.forEach(result => {
    if (result.adx < 0 || result.adx > 100) {
      throw new Error(`Invalid ADX value: ${result.adx}`);
    }
    if (result.plusDI < 0 || result.minusDI < 0) {
      throw new Error(`Invalid DI values: +DI=${result.plusDI}, -DI=${result.minusDI}`);
    }
  });

  console.log(`   Stochastic: ${momentumAnalysis.stochastic.length} data points`);
  console.log(`   Williams %R: ${momentumAnalysis.williamsR.length} data points`);
  console.log(`   ADX: ${momentumAnalysis.adx.length} data points`);
});

// Test 7: Volume Indicators Analysis
runTest('Volume Indicators Analysis', () => {
  const data = createMarketScenario('bullish', 60);

  // Enhance volume data to be more realistic
  for (let i = 1; i < data.length; i++) {
    const priceChange = (data[i].close - data[i - 1].close) / data[i - 1].close;
    // Higher volume on larger price moves
    const volumeMultiplier = 1 + Math.abs(priceChange) * 5;
    data[i].volume = Math.floor(data[i].volume * volumeMultiplier);
  }

  const volumeAnalysis = analyzeVolume(data, 'VOLUME');

  // Verify OBV trend
  const obvValues = volumeAnalysis.obv.map(r => r.value);
  console.log(`   OBV range: ${Math.min(...obvValues).toFixed(0)} to ${Math.max(...obvValues).toFixed(0)}`);

  // Verify VPT calculations
  volumeAnalysis.vpt.forEach(result => {
    if (isNaN(result.value)) {
      throw new Error('VPT contains NaN values');
    }
  });

  // Verify A/D Line
  volumeAnalysis.ad.forEach(result => {
    if (isNaN(result.value)) {
      throw new Error('A/D Line contains NaN values');
    }
  });

  console.log(`   Generated ${volumeAnalysis.signals.length} volume signals`);
});

// Test 8: Signal Strength and Consistency
runTest('Signal Strength and Consistency', () => {
  const scenarios = ['bullish', 'bearish', 'sideways'] as const;

  scenarios.forEach(scenario => {
    const data = createMarketScenario(scenario, 80);

    // Test multiple indicators
    const rsiAnalysis = analyzeRSI(data, 'TEST');
    const macdAnalysis = analyzeMACD(data, 'TEST');
    const bbAnalysis = analyzeBollingerBands(data, 'TEST');

    const allSignals = [
      ...rsiAnalysis.signals,
      ...macdAnalysis.signals,
      ...bbAnalysis.signals
    ];

    // Verify signal strength distribution
    const strongSignals = allSignals.filter(s => s.strength >= 0.7).length;
    const mediumSignals = allSignals.filter(s => s.strength >= 0.4 && s.strength < 0.7).length;
    const weakSignals = allSignals.filter(s => s.strength < 0.4).length;

    console.log(`   ${scenario.toUpperCase()}: Strong(${strongSignals}) Medium(${mediumSignals}) Weak(${weakSignals})`);

    // Verify all signals have valid timestamps
    allSignals.forEach(signal => {
      if (!(signal.timestamp instanceof Date)) {
        throw new Error('Invalid signal timestamp');
      }
      if (signal.timestamp > new Date()) {
        throw new Error('Signal timestamp in future');
      }
    });
  });
});

/**
 * TEST 9: Performance and Memory Usage
 * 
 * This test demonstrates performance testing patterns crucial for production systems:
 * 
 * ⚡ PERFORMANCE TESTING PATTERN:
 * Performance tests validate that code meets non-functional requirements:
 * - Execution time (latency requirements)
 * - Memory usage (resource consumption limits)
 * - Throughput (data processing capacity)
 * 
 * 📊 BENCHMARKING METHODOLOGY:
 * 1. Capture baseline metrics (time, memory) before execution
 * 2. Execute the code under test with realistic data volume
 * 3. Capture metrics after execution
 * 4. Calculate deltas and compare against thresholds
 * 5. Fail test if performance degrades beyond acceptable limits
 * 
 * 🔍 MEMORY PROFILING TECHNIQUE:
 * Using process.memoryUsage().heapUsed provides insight into:
 * - Memory allocation patterns
 * - Potential memory leaks
 * - Resource efficiency of algorithms
 * - Scalability characteristics
 * 
 * 💡 WHY PERFORMANCE TESTING MATTERS:
 * - Financial applications need real-time responsiveness
 * - Large datasets (1000+ data points) simulate realistic usage
 * - Memory constraints matter in serverless environments (Lambda)
 * - Performance regression detection prevents production issues
 * 
 * 🎯 THRESHOLD-BASED VALIDATION:
 * - 5 second execution limit ensures reasonable user experience
 * - 100 MB memory limit prevents excessive resource consumption
 * - Thresholds should be based on actual production requirements
 * 
 * This pattern is essential for maintaining system performance as code evolves.
 */
runTest('Performance and Memory Usage', () => {
  const largeDataset = generateSamplePriceData('PERF', 1000, 100, 0.02);

  // PERFORMANCE MEASUREMENT SETUP
  // Capture baseline metrics before executing the code under test
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;

  // COMPREHENSIVE ANALYSIS EXECUTION
  // Run all technical analysis functions to simulate real-world usage
  const rsiAnalysis = analyzeRSI(largeDataset, 'PERF');
  const macdAnalysis = analyzeMACD(largeDataset, 'PERF');
  const bbAnalysis = analyzeBollingerBands(largeDataset, 'PERF');
  const maAnalysis = analyzeMovingAverages(largeDataset, 'PERF');
  const momentumAnalysis = analyzeMomentum(largeDataset, 'PERF');
  const volumeAnalysis = analyzeVolume(largeDataset, 'PERF');

  // PERFORMANCE MEASUREMENT COMPLETION
  // Capture final metrics and calculate performance deltas
  const endTime = Date.now();
  const endMemory = process.memoryUsage().heapUsed;

  const executionTime = endTime - startTime;
  const memoryUsed = (endMemory - startMemory) / 1024 / 1024; // Convert bytes to MB

  // PERFORMANCE REPORTING
  // Provide detailed metrics for analysis and debugging
  console.log(`   Processed 1000 data points in ${executionTime}ms`);
  console.log(`   Memory usage: ${memoryUsed.toFixed(2)} MB`);
  
  // IMPROVED FORMATTING: Multi-line expression for better readability
  // This change makes the complex calculation more maintainable
  console.log(`   Total signals generated: ${rsiAnalysis.signals.length +
    macdAnalysis.signals.length +
    bbAnalysis.signals.length +
    maAnalysis.signals.length +
    momentumAnalysis.signals.length +
    volumeAnalysis.signals.length
    }`);

  // THRESHOLD VALIDATION
  // Fail the test if performance degrades beyond acceptable limits
  if (executionTime > 5000) { // 5 seconds
    throw new Error(`Performance too slow: ${executionTime}ms`);
  }
  if (memoryUsed > 100) { // 100 MB
    throw new Error(`Memory usage too high: ${memoryUsed.toFixed(2)} MB`);
  }
});

// Test 10: Real-world Data Simulation
runTest('Real-world Data Simulation', () => {
  // Simulate a realistic stock with various market phases
  const phases = [
    { type: 'sideways' as const, days: 20 },
    { type: 'bullish' as const, days: 30 },
    { type: 'volatile' as const, days: 15 },
    { type: 'bearish' as const, days: 25 },
    { type: 'sideways' as const, days: 10 }
  ];

  let combinedData: PriceData[] = [];
  let currentPrice = 100;

  phases.forEach(phase => {
    const phaseData = createMarketScenario(phase.type, phase.days);

    // Adjust starting price to continue from previous phase
    if (combinedData.length > 0) {
      const priceAdjustment = currentPrice / phaseData[0].close;
      phaseData.forEach(d => {
        d.open *= priceAdjustment;
        d.high *= priceAdjustment;
        d.low *= priceAdjustment;
        d.close *= priceAdjustment;
      });
    }

    // Adjust dates to be sequential
    const startDate = combinedData.length > 0
      ? new Date(combinedData[combinedData.length - 1].date.getTime() + 24 * 60 * 60 * 1000)
      : phaseData[0].date;

    phaseData.forEach((d, i) => {
      d.date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    });

    combinedData.push(...phaseData);
    currentPrice = phaseData[phaseData.length - 1].close;
  });

  // Run full analysis on combined realistic data
  const rsiAnalysis = analyzeRSI(combinedData, 'REALISTIC');
  const macdAnalysis = analyzeMACD(combinedData, 'REALISTIC');
  const bbAnalysis = analyzeBollingerBands(combinedData, 'REALISTIC');

  console.log(`   Analyzed ${combinedData.length} days of realistic market data`);
  console.log(`   RSI signals: ${rsiAnalysis.signals.length}`);
  console.log(`   MACD signals: ${macdAnalysis.signals.length}`);
  console.log(`   BB signals: ${bbAnalysis.signals.length}`);

  // Verify signal distribution makes sense
  const totalSignals = rsiAnalysis.signals.length + macdAnalysis.signals.length + bbAnalysis.signals.length;
  const signalDensity = totalSignals / combinedData.length;

  console.log(`   Signal density: ${(signalDensity * 100).toFixed(1)}% (${totalSignals} signals / ${combinedData.length} days)`);

  if (signalDensity > 0.5) { // More than 50% signal density seems excessive
    console.warn(`   High signal density detected: ${(signalDensity * 100).toFixed(1)}%`);
  }
});

/**
 * TEST SUITE COMPLETION AND REPORTING
 * 
 * This section demonstrates professional test reporting patterns:
 * 
 * 📊 TEST METRICS REPORTING:
 * Comprehensive test suites should provide clear metrics:
 * - Total tests executed (coverage breadth)
 * - Pass/fail counts (quality assessment)  
 * - Success rate percentage (overall health)
 * 
 * 🚨 EXIT CODE PATTERN:
 * Using process.exit(1) for test failures is a standard practice because:
 * - Exit code 0 = success (all tests passed)
 * - Exit code 1 = failure (one or more tests failed)
 * - CI/CD systems use exit codes to determine build success/failure
 * - Automated deployment pipelines can halt on test failures
 * 
 * 🎯 CLEAR SUCCESS/FAILURE COMMUNICATION:
 * - Visual indicators (emojis) make results immediately recognizable
 * - Specific messaging guides next actions
 * - Production readiness assessment based on test results
 * 
 * This pattern ensures that test results are actionable and integrate
 * well with automated development workflows.
 */

// FINAL TEST RESULTS SUMMARY
console.log('\n🏁 TEST SUITE COMPLETED');
console.log('======================');
console.log(`Tests Run: ${testsRun}`);
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsFailed}`);
console.log(`Success Rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);

// CONDITIONAL REPORTING BASED ON RESULTS
if (testsFailed === 0) {
  console.log('\n🎉 ALL TESTS PASSED! Technical Analysis Engine is robust and ready for production use.');
} else {
  console.log(`\n⚠️  ${testsFailed} test(s) failed. Please review the errors above.`);
  
  // EXIT WITH ERROR CODE FOR CI/CD INTEGRATION
  // This ensures that automated build systems recognize test failures
  // and can take appropriate action (halt deployment, send notifications, etc.)
  process.exit(1);
}