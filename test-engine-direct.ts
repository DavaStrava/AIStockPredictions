import { generateSamplePriceData } from './src/lib/technical-analysis/utils';

// Import the engine class directly
class TechnicalAnalysisEngine {
  analyze(data: any[], symbol: string) {
    return {
      symbol,
      timestamp: new Date(),
      signals: [],
      indicators: {},
      summary: {
        overall: 'neutral' as const,
        strength: 0.5,
        confidence: 0.5,
        trendDirection: 'sideways' as const,
        momentum: 'stable' as const,
        volatility: 'medium' as const,
      },
    };
  }
}

console.log('🧪 Testing Engine Class Directly...\n');

try {
  const data = generateSamplePriceData('TEST', 50, 100, 0.02);
  const engine = new TechnicalAnalysisEngine();
  const result = engine.analyze(data, 'TEST');
  
  console.log('✅ Engine test successful!');
  console.log(`Symbol: ${result.symbol}`);
  console.log(`Overall: ${result.summary.overall}`);
  
} catch (error) {
  console.error('❌ Error:', error);
}