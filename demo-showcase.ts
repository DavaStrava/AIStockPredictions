import { generateSamplePriceData } from './src/lib/technical-analysis/utils';
import { TechnicalAnalysisEngine } from './src/lib/technical-analysis/engine';
import { PriceData } from './src/lib/technical-analysis/types';

console.log('🚀 TECHNICAL ANALYSIS ENGINE SHOWCASE');
console.log('=====================================\n');

// Create a realistic stock scenario
function createRealisticStock(): PriceData[] {
  const data: PriceData[] = [];
  let currentPrice = 150; // Starting at $150
  const startDate = new Date('2024-01-01');
  
  // Simulate 6 months of trading data with different market phases
  const phases = [
    { days: 30, trend: 'sideways', volatility: 0.015 },    // January - consolidation
    { days: 45, trend: 'bullish', volatility: 0.02 },     // Feb-Mar - bull run
    { days: 20, trend: 'volatile', volatility: 0.04 },    // April - volatility
    { days: 35, trend: 'bearish', volatility: 0.025 },    // May - correction
    { days: 25, trend: 'recovery', volatility: 0.02 },    // June - recovery
  ];
  
  let dayCounter = 0;
  
  phases.forEach(phase => {
    for (let i = 0; i < phase.days; i++) {
      const date = new Date(startDate.getTime() + dayCounter * 24 * 60 * 60 * 1000);
      
      let priceChange = 0;
      switch (phase.trend) {
        case 'bullish':
          priceChange = 0.003 + Math.random() * 0.015; // 0.3-1.8% daily gain
          break;
        case 'bearish':
          priceChange = -0.008 - Math.random() * 0.012; // 0.8-2% daily loss
          break;
        case 'volatile':
          priceChange = (Math.random() - 0.5) * 0.08; // ±4% swings
          break;
        case 'recovery':
          priceChange = 0.001 + Math.random() * 0.01; // 0.1-1.1% daily gain
          break;
        default: // sideways
          priceChange = (Math.random() - 0.5) * 0.03; // ±1.5% oscillation
      }
      
      // Add some noise
      priceChange += (Math.random() - 0.5) * phase.volatility;
      
      const newPrice = currentPrice * (1 + priceChange);
      const volume = Math.floor(1000000 + Math.random() * 2000000); // 1-3M volume
      
      // Higher volume on larger moves
      const volumeMultiplier = 1 + Math.abs(priceChange) * 10;
      
      data.push({
        date,
        open: currentPrice,
        high: Math.max(currentPrice, newPrice) * (1 + Math.random() * 0.01),
        low: Math.min(currentPrice, newPrice) * (1 - Math.random() * 0.01),
        close: newPrice,
        volume: Math.floor(volume * volumeMultiplier)
      });
      
      currentPrice = newPrice;
      dayCounter++;
    }
  });
  
  return data;
}

// Generate realistic stock data
const stockData = createRealisticStock();
console.log(`📊 Generated ${stockData.length} days of realistic stock data`);
console.log(`📅 Date Range: ${stockData[0].date.toDateString()} to ${stockData[stockData.length - 1].date.toDateString()}`);
console.log(`💰 Price Range: $${Math.min(...stockData.map(d => d.close)).toFixed(2)} - $${Math.max(...stockData.map(d => d.close)).toFixed(2)}`);
console.log(`📈 Total Return: ${(((stockData[stockData.length - 1].close - stockData[0].close) / stockData[0].close) * 100).toFixed(2)}%\n`);

// Initialize the engine with custom configuration
const customConfig = {
  rsi: { period: 14, overbought: 75, oversold: 25 },
  macd: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
  bollingerBands: { period: 20, standardDeviations: 2.1 },
  movingAverages: { periods: [10, 20, 50] },
  stochastic: { kPeriod: 14, dPeriod: 3, overbought: 80, oversold: 20 },
  williamsR: { period: 14, overbought: -20, oversold: -80 },
  adx: { period: 14, strongTrend: 25 }
};

console.log('🔧 Initializing Technical Analysis Engine with custom configuration...');
const engine = new TechnicalAnalysisEngine(customConfig);

// Run comprehensive analysis
console.log('⚡ Running comprehensive technical analysis...\n');
const analysis = engine.analyze(stockData, 'DEMO_STOCK');

// Display comprehensive results
console.log('📋 COMPREHENSIVE ANALYSIS RESULTS');
console.log('=================================');
console.log(`Symbol: ${analysis.symbol}`);
console.log(`Analysis Date: ${analysis.timestamp.toLocaleString()}`);
console.log(`Total Signals Generated: ${analysis.signals.length}\n`);

// Market Summary
console.log('📊 MARKET SUMMARY');
console.log('-----------------');
console.log(`Overall Sentiment: ${analysis.summary.overall.toUpperCase()}`);
console.log(`Signal Strength: ${(analysis.summary.strength * 100).toFixed(1)}%`);
console.log(`Confidence Level: ${(analysis.summary.confidence * 100).toFixed(1)}%`);
console.log(`Trend Direction: ${analysis.summary.trendDirection.toUpperCase()}`);
console.log(`Momentum: ${analysis.summary.momentum.toUpperCase()}`);
console.log(`Volatility: ${analysis.summary.volatility.toUpperCase()}\n`);

// Indicator Summary
console.log('🔍 TECHNICAL INDICATORS SUMMARY');
console.log('-------------------------------');
Object.entries(analysis.indicators).forEach(([indicator, data]) => {
  if (data && Array.isArray(data) && data.length > 0) {
    const latest = data[data.length - 1];
    
    switch (indicator) {
      case 'rsi':
        console.log(`RSI (14): ${latest.value.toFixed(2)} - ${latest.overbought ? 'OVERBOUGHT' : latest.oversold ? 'OVERSOLD' : 'NEUTRAL'}`);
        break;
      case 'macd':
        console.log(`MACD: ${latest.macd.toFixed(4)} | Signal: ${latest.signal.toFixed(4)} | Histogram: ${latest.histogram.toFixed(4)}`);
        break;
      case 'bollingerBands':
        console.log(`Bollinger Bands: Upper ${latest.upper.toFixed(2)} | Middle ${latest.middle.toFixed(2)} | Lower ${latest.lower.toFixed(2)}`);
        console.log(`  %B: ${(latest.percentB * 100).toFixed(1)}% | Bandwidth: ${(latest.bandwidth * 100).toFixed(2)}% | Squeeze: ${latest.squeeze ? 'YES' : 'NO'}`);
        break;
      case 'stochastic':
        console.log(`Stochastic: %K ${latest.k.toFixed(1)} | %D ${latest.d.toFixed(1)} - ${latest.overbought ? 'OVERBOUGHT' : latest.oversold ? 'OVERSOLD' : 'NEUTRAL'}`);
        break;
      case 'williamsR':
        console.log(`Williams %R: ${latest.value.toFixed(1)}% - ${latest.overbought ? 'OVERBOUGHT' : latest.oversold ? 'OVERSOLD' : 'NEUTRAL'}`);
        break;
      case 'adx':
        console.log(`ADX: ${latest.adx.toFixed(1)} (${latest.trend.toUpperCase()}) | +DI: ${latest.plusDI.toFixed(1)} | -DI: ${latest.minusDI.toFixed(1)} | Direction: ${latest.direction.toUpperCase()}`);
        break;
      case 'obv':
        console.log(`OBV: ${latest.value.toFixed(0)} - Trend: ${latest.trend.toUpperCase()}`);
        break;
    }
  }
});

// Recent Strong Signals
console.log('\n💪 RECENT STRONG SIGNALS (>70% Strength)');
console.log('----------------------------------------');
const strongSignals = engine.getStrongSignals(analysis, 0.7).slice(-10); // Last 10 strong signals
if (strongSignals.length === 0) {
  console.log('No strong signals in recent period');
} else {
  strongSignals.forEach((signal, index) => {
    console.log(`${index + 1}. ${signal.indicator}: ${signal.signal.toUpperCase()} (${(signal.strength * 100).toFixed(1)}%)`);
    console.log(`   ${signal.description}`);
    console.log(`   Date: ${signal.timestamp.toDateString()}\n`);
  });
}

// Consensus Signals
console.log('🤝 CONSENSUS SIGNALS (Multiple Indicators Agree)');
console.log('------------------------------------------------');
const consensusSignals = engine.getConsensusSignals(analysis, 2);
if (consensusSignals.length === 0) {
  console.log('No consensus signals found');
} else {
  consensusSignals.slice(-5).forEach((signal, index) => {
    console.log(`${index + 1}. ${signal.indicator}: ${signal.signal.toUpperCase()} (${(signal.strength * 100).toFixed(1)}%)`);
    console.log(`   ${signal.description}`);
    console.log(`   Date: ${signal.timestamp.toDateString()}\n`);
  });
}

// Signal Distribution Analysis
console.log('📈 SIGNAL DISTRIBUTION ANALYSIS');
console.log('-------------------------------');
const buySignals = analysis.signals.filter(s => s.signal === 'buy');
const sellSignals = analysis.signals.filter(s => s.signal === 'sell');
const holdSignals = analysis.signals.filter(s => s.signal === 'hold');

console.log(`Buy Signals: ${buySignals.length} (${((buySignals.length / analysis.signals.length) * 100).toFixed(1)}%)`);
console.log(`Sell Signals: ${sellSignals.length} (${((sellSignals.length / analysis.signals.length) * 100).toFixed(1)}%)`);
console.log(`Hold Signals: ${holdSignals.length} (${((holdSignals.length / analysis.signals.length) * 100).toFixed(1)}%)`);

// Average signal strength by type
const avgBuyStrength = buySignals.length > 0 ? buySignals.reduce((sum, s) => sum + s.strength, 0) / buySignals.length : 0;
const avgSellStrength = sellSignals.length > 0 ? sellSignals.reduce((sum, s) => sum + s.strength, 0) / sellSignals.length : 0;

console.log(`Average Buy Signal Strength: ${(avgBuyStrength * 100).toFixed(1)}%`);
console.log(`Average Sell Signal Strength: ${(avgSellStrength * 100).toFixed(1)}%`);

// Indicator Performance
console.log('\n🎯 INDICATOR PERFORMANCE');
console.log('------------------------');
const indicatorStats = new Map();

analysis.signals.forEach(signal => {
  const indicator = signal.indicator;
  if (!indicatorStats.has(indicator)) {
    indicatorStats.set(indicator, { count: 0, totalStrength: 0, buy: 0, sell: 0 });
  }
  const stats = indicatorStats.get(indicator);
  stats.count++;
  stats.totalStrength += signal.strength;
  if (signal.signal === 'buy') stats.buy++;
  if (signal.signal === 'sell') stats.sell++;
});

Array.from(indicatorStats.entries())
  .sort((a, b) => b[1].count - a[1].count)
  .slice(0, 10)
  .forEach(([indicator, stats]) => {
    const avgStrength = (stats.totalStrength / stats.count * 100).toFixed(1);
    console.log(`${indicator}: ${stats.count} signals (${avgStrength}% avg strength) | Buy: ${stats.buy} | Sell: ${stats.sell}`);
  });

// Trading Recommendation
console.log('\n🎯 TRADING RECOMMENDATION');
console.log('=========================');
const recentSignals = analysis.signals.slice(-20); // Last 20 signals
const recentBuy = recentSignals.filter(s => s.signal === 'buy').length;
const recentSell = recentSignals.filter(s => s.signal === 'sell').length;
const recentStrong = recentSignals.filter(s => s.strength > 0.7).length;

console.log(`Based on ${recentSignals.length} recent signals:`);
console.log(`Recent Buy Signals: ${recentBuy}`);
console.log(`Recent Sell Signals: ${recentSell}`);
console.log(`Recent Strong Signals: ${recentStrong}`);

let recommendation = 'HOLD';
if (recentBuy > recentSell * 1.5 && recentStrong >= 3) {
  recommendation = 'BUY';
} else if (recentSell > recentBuy * 1.5 && recentStrong >= 3) {
  recommendation = 'SELL';
}

console.log(`\n🎯 RECOMMENDATION: ${recommendation}`);
console.log(`Overall Market Sentiment: ${analysis.summary.overall.toUpperCase()}`);
console.log(`Confidence: ${(analysis.summary.confidence * 100).toFixed(1)}%`);

console.log('\n✨ TECHNICAL ANALYSIS COMPLETE!');
console.log('===============================');
console.log('The engine has successfully analyzed the stock data and provided');
console.log('comprehensive technical insights with actionable trading signals.');
console.log('\n🚀 Ready for integration with prediction and backtesting systems!');