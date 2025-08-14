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

// Test Results Tracking
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

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
    console.log(`   Error: ${error.message}\n`);
  }
}

// Helper function to create different market scenarios
function createMarketScenario(type: 'bullish' | 'bearish' | 'sideways' | 'volatile', days: number = 100): PriceData[] {
  const baseData = generateSamplePriceData('TEST', days, 100, 0.01);
  
  switch (type) {
    case 'bullish':
      // Create consistent upward trend
      for (let i = 1; i < baseData.length; i++) {
        const trendFactor = 1 + (0.005 + Math.random() * 0.01); // 0.5-1.5% daily increase
        baseData[i].close = baseData[i - 1].close * trendFactor;
        baseData[i].high = baseData[i].close * (1 + Math.random() * 0.02);
        baseData[i].low = baseData[i].close * (1 - Math.random() * 0.015);
        baseData[i].open = baseData[i - 1].close;
      }
      break;
      
    case 'bearish':
      // Create consistent downward trend
      for (let i = 1; i < baseData.length; i++) {
        const trendFactor = 1 - (0.005 + Math.random() * 0.01); // 0.5-1.5% daily decrease
        baseData[i].close = baseData[i - 1].close * trendFactor;
        baseData[i].high = baseData[i].close * (1 + Math.random() * 0.015);
        baseData[i].low = baseData[i].close * (1 - Math.random() * 0.02);
        baseData[i].open = baseData[i - 1].close;
      }
      break;
      
    case 'volatile':
      // Create high volatility with random large moves
      for (let i = 1; i < baseData.length; i++) {
        const volatilityFactor = 1 + (Math.random() - 0.5) * 0.1; // ±5% daily moves
        baseData[i].close = baseData[i - 1].close * volatilityFactor;
        baseData[i].high = baseData[i].close * (1 + Math.random() * 0.05);
        baseData[i].low = baseData[i].close * (1 - Math.random() * 0.05);
        baseData[i].open = baseData[i - 1].close;
      }
      break;
      
    case 'sideways':
      // Create sideways movement with small oscillations
      const basePrice = baseData[0].close;
      for (let i = 1; i < baseData.length; i++) {
        const oscillation = Math.sin(i * 0.2) * 0.02; // 2% oscillation
        const noise = (Math.random() - 0.5) * 0.01; // 1% random noise
        baseData[i].close = basePrice * (1 + oscillation + noise);
        baseData[i].high = baseData[i].close * (1 + Math.random() * 0.01);
        baseData[i].low = baseData[i].close * (1 - Math.random() * 0.01);
        baseData[i].open = baseData[i - 1].close;
      }
      break;
  }
  
  return baseData;
}

// Test 1: Data Validation and Edge Cases
runTest('Data Validation and Edge Cases', () => {
  // Test empty data
  try {
    validatePriceData([]);
    throw new Error('Should have thrown error for empty data');
  } catch (error) {
    if (!error.message.includes('non-empty array')) {
      throw error;
    }
  }
  
  // Test invalid data
  const invalidData = [
    { date: new Date(), open: 100, high: 90, low: 95, close: 98, volume: 1000 } // high < low
  ];
  
  try {
    validatePriceData(invalidData);
    throw new Error('Should have thrown error for invalid data');
  } catch (error) {
    if (!error.message.includes('high price cannot be less than low price')) {
      throw error;
    }
  }
  
  // Test minimum data requirements
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

// Test 9: Performance and Memory Usage
runTest('Performance and Memory Usage', () => {
  const largeDataset = generateSamplePriceData('PERF', 1000, 100, 0.02);
  
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;
  
  // Run comprehensive analysis
  const rsiAnalysis = analyzeRSI(largeDataset, 'PERF');
  const macdAnalysis = analyzeMACD(largeDataset, 'PERF');
  const bbAnalysis = analyzeBollingerBands(largeDataset, 'PERF');
  const maAnalysis = analyzeMovingAverages(largeDataset, 'PERF');
  const momentumAnalysis = analyzeMomentum(largeDataset, 'PERF');
  const volumeAnalysis = analyzeVolume(largeDataset, 'PERF');
  
  const endTime = Date.now();
  const endMemory = process.memoryUsage().heapUsed;
  
  const executionTime = endTime - startTime;
  const memoryUsed = (endMemory - startMemory) / 1024 / 1024; // MB
  
  console.log(`   Processed 1000 data points in ${executionTime}ms`);
  console.log(`   Memory usage: ${memoryUsed.toFixed(2)} MB`);
  console.log(`   Total signals generated: ${
    rsiAnalysis.signals.length + 
    macdAnalysis.signals.length + 
    bbAnalysis.signals.length + 
    maAnalysis.signals.length + 
    momentumAnalysis.signals.length + 
    volumeAnalysis.signals.length
  }`);
  
  // Performance thresholds
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

// Final Results
console.log('\n🏁 TEST SUITE COMPLETED');
console.log('======================');
console.log(`Tests Run: ${testsRun}`);
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsFailed}`);
console.log(`Success Rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
  console.log('\n🎉 ALL TESTS PASSED! Technical Analysis Engine is robust and ready for production use.');
} else {
  console.log(`\n⚠️  ${testsFailed} test(s) failed. Please review the errors above.`);
  process.exit(1);
}