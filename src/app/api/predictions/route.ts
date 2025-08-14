import { NextRequest, NextResponse } from 'next/server';
import { TechnicalAnalysisEngine } from '@/lib/technical-analysis/engine';
import { PriceData, TechnicalSignal } from '@/lib/technical-analysis/types';

// Mock price data generator (same as analysis route)
function generateMockPriceData(symbol: string, days: number = 100): PriceData[] {
  const data: PriceData[] = [];
  let basePrice = 100 + Math.random() * 100;
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    
    const volatility = 0.02;
    const trend = Math.sin(i / 20) * 0.001;
    const randomChange = (Math.random() - 0.5) * volatility + trend;
    
    const open = basePrice;
    const change = basePrice * randomChange;
    const close = basePrice + change;
    
    const spread = Math.abs(change) + (Math.random() * basePrice * 0.01);
    const high = Math.max(open, close) + spread * Math.random();
    const low = Math.min(open, close) - spread * Math.random();
    
    const volume = Math.floor(1000000 + Math.abs(change / basePrice) * 5000000 + Math.random() * 2000000);
    
    data.push({
      date,
      open,
      high,
      low,
      close,
      volume,
    });
    
    basePrice = close;
  }
  
  return data;
}

interface PredictionResult {
  symbol: string;
  currentPrice: number;
  prediction: {
    direction: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    targetPrice: number;
    timeframe: string;
    reasoning: string[];
  };
  signals: TechnicalSignal[];
  riskMetrics: {
    volatility: 'low' | 'medium' | 'high';
    support: number;
    resistance: number;
    stopLoss: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbols = searchParams.get('symbols')?.split(',') || ['AAPL', 'GOOGL', 'MSFT'];
    
    const predictions: PredictionResult[] = [];
    
    for (const symbol of symbols) {
      // Generate mock data and analyze
      const priceData = generateMockPriceData(symbol.trim(), 100);
      const engine = new TechnicalAnalysisEngine();
      const analysis = engine.analyze(priceData, symbol);
      
      const currentPrice = priceData[priceData.length - 1].close;
      const recentPrices = priceData.slice(-20).map(d => d.close);
      const support = Math.min(...recentPrices);
      const resistance = Math.max(...recentPrices);
      
      // Generate prediction based on analysis
      const strongSignals = engine.getStrongSignals(analysis, 0.6);
      const bullishSignals = strongSignals.filter(s => s.signal === 'buy');
      const bearishSignals = strongSignals.filter(s => s.signal === 'sell');
      
      let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      let targetPrice = currentPrice;
      let reasoning: string[] = [];
      
      if (bullishSignals.length > bearishSignals.length) {
        direction = 'bullish';
        targetPrice = currentPrice * (1 + 0.05 + Math.random() * 0.1); // 5-15% upside
        reasoning = bullishSignals.slice(0, 3).map(s => s.description);
      } else if (bearishSignals.length > bullishSignals.length) {
        direction = 'bearish';
        targetPrice = currentPrice * (1 - 0.05 - Math.random() * 0.1); // 5-15% downside
        reasoning = bearishSignals.slice(0, 3).map(s => s.description);
      } else {
        reasoning = ['Mixed signals from technical indicators', 'Market consolidation phase', 'Awaiting clearer directional bias'];
      }
      
      const prediction: PredictionResult = {
        symbol,
        currentPrice: Math.round(currentPrice * 100) / 100,
        prediction: {
          direction,
          confidence: analysis.summary.confidence,
          targetPrice: Math.round(targetPrice * 100) / 100,
          timeframe: '1-2 weeks',
          reasoning,
        },
        signals: strongSignals.slice(0, 5), // Top 5 signals
        riskMetrics: {
          volatility: analysis.summary.volatility,
          support: Math.round(support * 100) / 100,
          resistance: Math.round(resistance * 100) / 100,
          stopLoss: Math.round(currentPrice * 0.95 * 100) / 100, // 5% stop loss
        },
      };
      
      predictions.push(prediction);
    }
    
    return NextResponse.json({
      success: true,
      data: predictions,
      metadata: {
        timestamp: new Date().toISOString(),
        symbolsAnalyzed: symbols.length,
      },
    });
    
  } catch (error) {
    console.error('Predictions API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate predictions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}