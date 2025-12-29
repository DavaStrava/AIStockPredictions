import { NextRequest, NextResponse } from 'next/server';
import { TechnicalAnalysisEngine } from '@/lib/technical-analysis/engine';
import { getFMPProvider } from '@/lib/data-providers/fmp';
import { getLLMInsightService } from '@/lib/ai/llm-providers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'AAPL';
    const types = searchParams.get('types')?.split(',') || ['technical', 'portfolio', 'sentiment'];
    
    // Get technical analysis data first
    const fmpProvider = getFMPProvider();
    const priceData = await fmpProvider.getHistoricalData(symbol.toUpperCase(), '6month');
    
    if (priceData.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No historical data found for symbol: ${symbol}`,
        },
        { status: 404 }
      );
    }
    
    // Perform technical analysis
    const engine = new TechnicalAnalysisEngine();
    const analysis = engine.analyze(priceData, symbol.toUpperCase());
    
    // Generate AI insights with delay between requests to avoid rate limits
    const insightService = getLLMInsightService();
    const insights: any = {};
    
    for (let i = 0; i < types.length; i++) {
      const type = types[i];
      if (['technical', 'portfolio', 'sentiment'].includes(type)) {
        try {
          // Add delay between requests to avoid rate limiting (except for first request)
          if (i > 0) {
            await new Promise(r => setTimeout(r, 1500)); // 1.5s delay between requests
          }
          insights[type] = await insightService.generateInsight(
            type as 'technical' | 'portfolio' | 'sentiment',
            analysis,
            symbol.toUpperCase()
          );
        } catch (error) {
          console.error(`Provider failed for ${type}:`, error);
          // Continue with other insights
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        insights,
        analysis: {
          summary: analysis.summary,
          signalCount: analysis.signals.length,
          indicatorCount: Object.keys(analysis.indicators).length,
        },
      },
      metadata: {
        symbol: symbol.toUpperCase(),
        insightTypes: Object.keys(insights),
        dataSource: 'Financial Modeling Prep + AI Analysis',
        timestamp: new Date().toISOString(),
      },
    });
    
  } catch (error) {
    console.error('Insights API error:', error);
    
    let errorMessage = 'Failed to generate AI insights';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('FMP API error')) {
        errorMessage = 'Failed to fetch market data for analysis';
        statusCode = 503;
      } else if (error.message.includes('All LLM providers failed')) {
        errorMessage = 'AI analysis temporarily unavailable. Please try again later.';
        statusCode = 503;
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: statusCode }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, analysis, insightTypes = ['technical', 'portfolio', 'sentiment'] } = body;
    
    if (!symbol || !analysis) {
      return NextResponse.json(
        {
          success: false,
          error: 'Symbol and analysis data are required',
        },
        { status: 400 }
      );
    }
    
    // Generate AI insights from provided analysis
    const insightService = getLLMInsightService();
    const insights: any = {};
    
    // Generate AI insights with delay between requests to avoid rate limits
    const insightService = getLLMInsightService();
    const insights: any = {};
    
    for (let i = 0; i < insightTypes.length; i++) {
      const type = insightTypes[i];
      if (['technical', 'portfolio', 'sentiment'].includes(type)) {
        try {
          // Add delay between requests to avoid rate limiting (except for first request)
          if (i > 0) {
            await new Promise(r => setTimeout(r, 1500)); // 1.5s delay between requests
          }
          insights[type] = await insightService.generateInsight(
            type as 'technical' | 'portfolio' | 'sentiment',
            analysis,
            symbol.toUpperCase()
          );
        } catch (error) {
          console.error(`Provider failed for ${type}:`, error);
          // Continue with other insights
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        insights,
      },
      metadata: {
        symbol: symbol.toUpperCase(),
        insightTypes: Object.keys(insights),
        timestamp: new Date().toISOString(),
      },
    });
    
  } catch (error) {
    console.error('Insights API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate AI insights',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}