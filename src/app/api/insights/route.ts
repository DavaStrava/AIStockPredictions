import { NextRequest, NextResponse } from 'next/server';
import { TechnicalAnalysisEngine } from '@/lib/technical-analysis/engine';
import { getFMPProvider } from '@/lib/data-providers/fmp';
import { getLLMInsightService, LLMInsight } from '@/lib/ai/llm-providers';
import { getDatabase } from '@/lib/database/connection';
import { getPortfolioService } from '@/lib/portfolio/PortfolioService';
import { getDemoUserId } from '@/lib/auth/demo-user';
import { TechnicalAnalysisResult } from '@/lib/technical-analysis/types';

/** Valid insight types */
type InsightType = 'technical' | 'portfolio' | 'sentiment';

/** Result of insight generation */
type InsightsResult = Partial<Record<InsightType, LLMInsight>>;

/**
 * Portfolio insight data structure for AI context
 * Contains aggregated portfolio information and position details if held
 */
interface PortfolioInsightData {
  /** Summary of total portfolio (aggregated across all user portfolios) */
  portfolio: {
    totalValue: number;
    cashAvailable: number;
    positionsCount: number;
  };
  /** Position details if the user holds this symbol */
  position: {
    shares: number;
    avgCostBasis: number;
    currentPrice: number;
    marketValue: number;
    totalReturn: number;
    totalReturnPercent: number;
  } | null;
  /** Whether the user currently holds this symbol */
  isHeld: boolean;
}

/**
 * Fetches portfolio context for a given symbol.
 * Aggregates data across all user portfolios and finds position if held.
 */
async function getPortfolioInsightData(symbol: string): Promise<PortfolioInsightData | null> {
  try {
    const userId = await getDemoUserId();
    const db = getDatabase();
    const fmpProvider = getFMPProvider();
    const portfolioService = getPortfolioService(db, fmpProvider);

    // Get all user portfolios
    const portfolios = await portfolioService.getUserPortfolios(userId);
    if (portfolios.length === 0) {
      return null;
    }

    // Fetch all portfolio data in parallel to avoid N+1 query problem
    const portfolioDataResults = await Promise.allSettled(
      portfolios.map(async (portfolio) => {
        const [summary, holdings] = await Promise.all([
          portfolioService.getPortfolioSummary(portfolio.id),
          portfolioService.getHoldingsWithMarketData(portfolio.id),
        ]);
        return { portfolioId: portfolio.id, summary, holdings };
      })
    );

    // Aggregate data across all portfolios
    let totalValue = 0;
    let cashAvailable = 0;
    let positionsCount = 0;
    let foundPosition: PortfolioInsightData['position'] = null;

    for (const result of portfolioDataResults) {
      if (result.status === 'rejected') {
        console.error('Error fetching portfolio data:', result.reason);
        continue;
      }

      const { summary, holdings } = result.value;

      // Aggregate totals
      totalValue += summary.totalEquity;
      cashAvailable += summary.cashBalance;
      positionsCount += summary.holdingsCount;

      // Check if this portfolio holds the symbol
      const holding = holdings.find(h => h.symbol.toUpperCase() === symbol.toUpperCase());

      if (holding && !foundPosition) {
        foundPosition = {
          shares: holding.quantity,
          avgCostBasis: holding.averageCost,
          currentPrice: holding.currentPrice,
          marketValue: holding.marketValue,
          totalReturn: holding.totalGainLoss,
          totalReturnPercent: holding.totalGainLossPercent,
        };
      }
    }

    return {
      portfolio: {
        totalValue,
        cashAvailable,
        positionsCount,
      },
      position: foundPosition,
      isHeld: foundPosition !== null,
    };
  } catch (error) {
    console.error('Error fetching portfolio insight data:', error);
    return null;
  }
}

/**
 * Generates AI insights for a given symbol and analysis.
 * Shared logic for both GET and POST handlers.
 *
 * @param analysis - Technical analysis result
 * @param symbol - Stock symbol
 * @param types - Array of insight types to generate
 * @returns Record of generated insights by type
 */
async function generateInsightsWithContext(
  analysis: TechnicalAnalysisResult,
  symbol: string,
  types: string[]
): Promise<InsightsResult> {
  const insightService = getLLMInsightService();
  const insights: InsightsResult = {};
  const validTypes: InsightType[] = ['technical', 'portfolio', 'sentiment'];

  // Fetch portfolio context if portfolio insight is requested
  let portfolioContext: PortfolioInsightData | null = null;
  if (types.includes('portfolio')) {
    portfolioContext = await getPortfolioInsightData(symbol);
    if (!portfolioContext) {
      console.warn(`No portfolio context available for ${symbol}, using technical-only analysis`);
    }
  }

  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    if (!validTypes.includes(type as InsightType)) {
      continue;
    }

    try {
      // Add delay between requests to avoid rate limiting (except for first request)
      if (i > 0) {
        await new Promise(r => setTimeout(r, 1500));
      }

      // For portfolio type, include portfolio context in data
      // Provide fallback structure if portfolioContext is null
      let dataForInsight: TechnicalAnalysisResult & { portfolioContext?: PortfolioInsightData | null } = analysis;
      if (type === 'portfolio') {
        dataForInsight = {
          ...analysis,
          portfolioContext: portfolioContext ?? {
            isHeld: false,
            portfolio: { totalValue: 0, cashAvailable: 0, positionsCount: 0 },
            position: null,
          },
        };
      }

      const insight = await insightService.generateInsight(
        type as InsightType,
        dataForInsight,
        symbol
      );

      // Add position_held to metadata for portfolio insights
      if (type === 'portfolio') {
        insight.metadata.position_held = portfolioContext?.isHeld ?? false;
      }

      insights[type as InsightType] = insight;
    } catch (error) {
      console.error(`Provider failed for ${type}:`, error);
      // Continue with other insights
    }
  }

  return insights;
}

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

    // Generate AI insights using shared helper
    const insights = await generateInsightsWithContext(analysis, symbol.toUpperCase(), types);

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

    // Generate AI insights using shared helper
    const insights = await generateInsightsWithContext(analysis, symbol.toUpperCase(), insightTypes);

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