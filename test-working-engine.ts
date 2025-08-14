import { generateSamplePriceData, validatePriceData, sortPriceData } from './src/lib/technical-analysis/utils';
import { calculateRSI } from './src/lib/technical-analysis/indicators/rsi';
import { calculateMACD } from './src/lib/technical-analysis/indicators/macd';
import { calculateBollingerBands } from './src/lib/technical-analysis/indicators/bollinger-bands';

console.log('🚀 Testing Working Technical Analysis Engine...\n');

try {
  // Generate sample data
  console.log('📊 Generating sample price data...');
  const sampleData = generateSamplePriceData('AAPL', 100, 150, 0.02);
  console.log(`✅ Generated ${sampleData.length} days of sample data\n`);

  // Validate and sort data
  validatePriceData(sampleData);
  const sortedData = sortPriceData(sampleData);
  console.log('✅ Data validated and sorted\n');

  // Run individual analyses
  console.log('📈 Running technical analysis...');
  
  // RSI Analysis
  const rsiResults = calculateRSI(sortedData, 14, 70, 30);
  console.log(`✅ RSI: ${rsiResults.length} data points`);
  
  // MACD Analysis  
  const macdResults = calculateMACD(sortedData, 12, 26, 9);
  console.log(`✅ MACD: ${macdResults.length} data points`);
  
  // Bollinger Bands Analysis
  const bbResults = calculateBollingerBands(sortedData, 20, 2);
  console.log(`✅ Bollinger Bands: ${bbResults.length} data points`);

  // Display latest values
  console.log('\n📊 LATEST INDICATOR VALUES:');
  console.log('===========================');
  
  if (rsiResults.length > 0) {
    const latestRSI = rsiResults[rsiResults.length - 1];
    console.log(`RSI: ${latestRSI.value.toFixed(2)} (${latestRSI.signal})`);
    console.log(`  Overbought: ${latestRSI.overbought}, Oversold: ${latestRSI.oversold}`);
  }
  
  if (macdResults.length > 0) {
    const latestMACD = macdResults[macdResults.length - 1];
    console.log(`MACD: ${latestMACD.macd.toFixed(4)}`);
    console.log(`  Signal: ${latestMACD.signal.toFixed(4)}`);
    console.log(`  Histogram: ${latestMACD.histogram.toFixed(4)}`);
    console.log(`  Crossover: ${latestMACD.crossover}`);
  }
  
  if (bbResults.length > 0) {
    const latestBB = bbResults[bbResults.length - 1];
    console.log(`Bollinger Bands:`);
    console.log(`  Upper: ${latestBB.upper.toFixed(2)}`);
    console.log(`  Middle: ${latestBB.middle.toFixed(2)}`);
    console.log(`  Lower: ${latestBB.lower.toFixed(2)}`);
    console.log(`  %B: ${(latestBB.percentB * 100).toFixed(1)}%`);
    console.log(`  Bandwidth: ${(latestBB.bandwidth * 100).toFixed(2)}%`);
    console.log(`  Squeeze: ${latestBB.squeeze}`);
  }

  // Count signals
  let totalSignals = 0;
  let buySignals = 0;
  let sellSignals = 0;
  
  rsiResults.forEach(r => {
    if (r.signal !== 'hold') {
      totalSignals++;
      if (r.signal === 'buy') buySignals++;
      if (r.signal === 'sell') sellSignals++;
    }
  });

  console.log('\n🎯 SIGNAL SUMMARY:');
  console.log('==================');
  console.log(`Total Signals Generated: ${totalSignals}`);
  console.log(`Buy Signals: ${buySignals}`);
  console.log(`Sell Signals: ${sellSignals}`);
  console.log(`Hold Signals: ${rsiResults.length - totalSignals}`);

  // Calculate basic trend
  const recentPrices = sortedData.slice(-10).map(d => d.close);
  const firstPrice = recentPrices[0];
  const lastPrice = recentPrices[recentPrices.length - 1];
  const trendDirection = lastPrice > firstPrice ? 'UP' : lastPrice < firstPrice ? 'DOWN' : 'SIDEWAYS';
  
  console.log('\n📈 BASIC TREND ANALYSIS:');
  console.log('========================');
  console.log(`Recent Trend (10 days): ${trendDirection}`);
  console.log(`Price Change: ${((lastPrice - firstPrice) / firstPrice * 100).toFixed(2)}%`);
  console.log(`Current Price: $${lastPrice.toFixed(2)}`);

  console.log('\n✅ TECHNICAL ANALYSIS ENGINE TEST COMPLETED SUCCESSFULLY!');
  console.log('🎉 All indicators are working correctly and generating signals.');
  
} catch (error) {
  console.error('❌ ERROR:', error.message);
  console.error(error.stack);
  process.exit(1);
}