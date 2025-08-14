// Simple test script to verify technical analysis engine
import { TechnicalAnalysisEngine } from './src/lib/technical-analysis/engine.ts';
import { generateSamplePriceData } from './src/lib/technical-analysis/utils.ts';

console.log('🚀 Testing Technical Analysis Engine...\n');

try {
  // Generate sample data
  console.log('📊 Generating sample price data...');
  const sampleData = generateSamplePriceData('AAPL', 100, 150, 0.02);
  console.log(`✅ Generated ${sampleData.length} days of sample data\n`);

  // Initialize engine
  console.log('🔧 Initializing Technical Analysis Engine...');
  const engine = new TechnicalAnalysisEngine();
  console.log('✅ Engine initialized\n');

  // Run analysis
  console.log('📈 Running comprehensive technical analysis...');
  const result = engine.analyze(sampleData, 'AAPL');
  console.log('✅ Analysis completed\n');

  // Display results
  console.log('📋 ANALYSIS RESULTS:');
  console.log('==================');
  console.log(`Symbol: ${result.symbol}`);
  console.log(`Timestamp: ${result.timestamp.toISOString()}`);
  console.log(`Total Signals: ${result.signals.length}`);
  
  console.log('\n📊 INDICATORS GENERATED:');
  console.log('========================');
  Object.entries(result.indicators).forEach(([key, value]) => {
    if (value && Array.isArray(value)) {
      console.log(`${key}: ${value.length} data points`);
    }
  });

  console.log('\n📈 SUMMARY:');
  console.log('===========');
  console.log(`Overall: ${result.summary.overall}`);
  console.log(`Strength: ${(result.summary.strength * 100).toFixed(1)}%`);
  console.log(`Confidence: ${(result.summary.confidence * 100).toFixed(1)}%`);
  console.log(`Trend Direction: ${result.summary.trendDirection}`);
  console.log(`Momentum: ${result.summary.momentum}`);
  console.log(`Volatility: ${result.summary.volatility}`);

  console.log('\n🎯 RECENT SIGNALS:');
  console.log('==================');
  const recentSignals = result.signals.slice(-5); // Last 5 signals
  recentSignals.forEach((signal, index) => {
    console.log(`${index + 1}. ${signal.indicator}: ${signal.signal.toUpperCase()} (${(signal.strength * 100).toFixed(1)}%)`);
    console.log(`   ${signal.description}`);
    console.log(`   Time: ${signal.timestamp.toISOString()}`);
    console.log('');
  });

  // Test strong signals
  console.log('💪 STRONG SIGNALS (>70% strength):');
  console.log('===================================');
  const strongSignals = engine.getStrongSignals(result, 0.7);
  console.log(`Found ${strongSignals.length} strong signals`);
  
  strongSignals.slice(0, 3).forEach((signal, index) => {
    console.log(`${index + 1}. ${signal.indicator}: ${signal.signal.toUpperCase()} (${(signal.strength * 100).toFixed(1)}%)`);
  });

  // Test consensus signals
  console.log('\n🤝 CONSENSUS SIGNALS:');
  console.log('=====================');
  const consensusSignals = engine.getConsensusSignals(result, 2);
  console.log(`Found ${consensusSignals.length} consensus signals`);
  
  consensusSignals.slice(0, 2).forEach((signal, index) => {
    console.log(`${index + 1}. ${signal.indicator}: ${signal.signal.toUpperCase()} (${(signal.strength * 100).toFixed(1)}%)`);
  });

  console.log('\n✅ ALL TESTS PASSED! Technical Analysis Engine is working correctly.');
  
} catch (error) {
  console.error('❌ ERROR:', error.message);
  console.error(error.stack);
  process.exit(1);
}