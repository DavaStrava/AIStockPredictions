import { generateSamplePriceData } from './src/lib/technical-analysis/utils';

console.log('Testing sample data generation...');

try {
  const data = generateSamplePriceData('TEST', 10, 100, 0.02);
  console.log('✅ Sample data generated successfully');
  console.log(`Generated ${data.length} data points`);
  console.log('First data point:', data[0]);
  console.log('Last data point:', data[data.length - 1]);
} catch (error) {
  console.error('❌ Error:', error);
}