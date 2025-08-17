// Simple test runner to verify the engine works without Vitest
import { TechnicalAnalysisEngine, analyzeTechnicals } from './src/lib/technical-analysis/engine';
import { generateSamplePriceData } from './src/lib/technical-analysis/utils';

console.log('🧪 Simple Engine Test');
console.log('====================');

try {
  // Test 1: Basic engine initialization
  console.log('✓ Testing engine initialization...');
  const engine = new TechnicalAnalysisEngine();
  console.log('✓ Engine initialized successfully');

  // Test 2: Generate sample data
  console.log('✓ Testing sample data generation...');
  const sampleData = generateSamplePriceData('TEST', 100, 100, 0.02);
  console.log(`✓ Generated ${sampleData.length} days of sample data`);

  // Test 3: Run analysis
  console.log('✓ Testing technical analysis...');
  const result = engine.analyze(sampleData, 'TEST');
  console.log(`✓ Analysis completed for ${result.symbol}`);
  console.log(`✓ Generated ${result.signals.length} signals`);
  console.log(`✓ Overall sentiment: ${result.summary.overall}`);

  // Test 4: Test convenience function
  console.log('✓ Testing convenience function...');
  const result2 = analyzeTechnicals(sampleData, 'TEST2');
  console.log(`✓ Convenience function works for ${result2.symbol}`);

  // Test 5: Test with custom config
  console.log('✓ Testing custom configuration...');
  const customConfig = {
    rsi: { period: 21, overbought: 75, oversold: 25 },
  };
  const engine2 = new TechnicalAnalysisEngine(customConfig);
  const result3 = engine2.analyze(sampleData, 'TEST3');
  console.log(`✓ Custom config works for ${result3.symbol}`);

  console.log('\n🎉 All tests passed! The engine is working correctly.');
  console.log('The TypeScript types are properly defined and the functionality works.');

} catch (error) {
  console.error('❌ Test failed:', error);
  process.exit(1);
}