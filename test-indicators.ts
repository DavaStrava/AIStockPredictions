import { generateSamplePriceData } from './src/lib/technical-analysis/utils';
import { calculateRSI } from './src/lib/technical-analysis/indicators/rsi';
import { calculateMACD } from './src/lib/technical-analysis/indicators/macd';
import { calculateBollingerBands } from './src/lib/technical-analysis/indicators/bollinger-bands';

console.log('🧪 Testing Individual Technical Indicators...\n');

try {
  // Generate sample data
  const data = generateSamplePriceData('TEST', 50, 100, 0.02);
  console.log(`📊 Generated ${data.length} days of sample data\n`);

  // Test RSI
  console.log('📈 Testing RSI...');
  const rsiResults = calculateRSI(data);
  console.log(`✅ RSI calculated: ${rsiResults.length} data points`);
  console.log(`   Latest RSI: ${rsiResults[rsiResults.length - 1].value.toFixed(2)}`);

  // Test MACD
  console.log('\n📈 Testing MACD...');
  const macdResults = calculateMACD(data);
  console.log(`✅ MACD calculated: ${macdResults.length} data points`);
  console.log(`   Latest MACD: ${macdResults[macdResults.length - 1].macd.toFixed(4)}`);

  // Test Bollinger Bands
  console.log('\n📈 Testing Bollinger Bands...');
  const bbResults = calculateBollingerBands(data);
  console.log(`✅ Bollinger Bands calculated: ${bbResults.length} data points`);
  console.log(`   Latest Upper Band: ${bbResults[bbResults.length - 1].upper.toFixed(2)}`);
  console.log(`   Latest Lower Band: ${bbResults[bbResults.length - 1].lower.toFixed(2)}`);

  console.log('\n✅ All individual indicators working correctly!');

} catch (error) {
  console.error('❌ Error:', error);
  console.error(error.stack);
}