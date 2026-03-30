/**
 * Portfolio Insights API
 *
 * Generates AI-powered portfolio-level insights including:
 * - Portfolio overview: composition, diversification, performance drivers
 * - Market context: how market conditions are affecting the portfolio
 *
 * Uses gpt-4o for high-quality analysis with 15-minute caching.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/connection';
import { getFMPProvider } from '@/lib/data-providers/fmp';
import { PortfolioService, PortfolioNotFoundError } from '@/lib/portfolio/PortfolioService';
import { getLLMInsightService, LLMInsight } from '@/lib/ai/llm-providers';
import { HoldingWithMarketData } from '@/types/portfolio';

interface PortfolioInsightsResponse {
  portfolioOverview: LLMInsight | null;
  marketContext: LLMInsight | null;
  generatedAt: string;
  cacheHit: boolean;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Simple in-memory cache for portfolio insights
// NOTE: This cache is scoped to a single process and will be lost on serverless cold starts.
// For a personal app (5-10 users), this is acceptable. For production scale, consider
// using a persistent cache like Redis/Upstash or Vercel KV.
const insightsCache = new Map<string, { data: PortfolioInsightsResponse; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: portfolioId } = await params;

    // Check cache first
    const cached = insightsCache.get(portfolioId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: { ...cached.data, cacheHit: true },
      });
    }

    const db = getDatabase();
    const fmpProvider = getFMPProvider();
    const portfolioService = new PortfolioService(db, fmpProvider);

    // Verify portfolio exists and get data
    const portfolio = await portfolioService.getPortfolioById(portfolioId);
    if (!portfolio) {
      return NextResponse.json(
        { success: false, error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    // Fetch all required data in parallel
    const [summary, holdings, allocation, marketIndicesResponse] = await Promise.all([
      portfolioService.getPortfolioSummary(portfolioId),
      portfolioService.getHoldingsWithMarketData(portfolioId),
      portfolioService.getSectorAllocation(portfolioId),
      fetch(`${request.nextUrl.origin}/api/market-indices`).then(res => res.json()).catch(() => ({ success: false })),
    ]);

    // Get market indices
    const marketIndices = marketIndicesResponse.success ? marketIndicesResponse.data : [];

    // Calculate top movers
    const gainers = [...holdings]
      .filter((h: HoldingWithMarketData) => h.dayChangePercent > 0)
      .sort((a: HoldingWithMarketData, b: HoldingWithMarketData) => b.dayChangePercent - a.dayChangePercent)
      .slice(0, 5);
    const losers = [...holdings]
      .filter((h: HoldingWithMarketData) => h.dayChangePercent < 0)
      .sort((a: HoldingWithMarketData, b: HoldingWithMarketData) => a.dayChangePercent - b.dayChangePercent)
      .slice(0, 5);

    // Prepare data payloads for AI
    const portfolioOverviewData = {
      summary,
      holdings: holdings.slice(0, 10), // Top 10 by weight
      allocation,
      topMovers: { gainers, losers },
    };

    const marketContextData = {
      portfolioSummary: summary,
      marketIndices,
      holdings: holdings.slice(0, 10),
      sectorPerformance: allocation,
    };

    // Generate insights using the LLM service
    const llmService = getLLMInsightService();

    // Generate both insights in parallel
    const [portfolioOverview, marketContext] = await Promise.allSettled([
      llmService.generateInsight('portfolio-overview', portfolioOverviewData, portfolio.name),
      llmService.generateInsight('market-context', marketContextData, portfolio.name),
    ]);

    const response: PortfolioInsightsResponse = {
      portfolioOverview: portfolioOverview.status === 'fulfilled' ? portfolioOverview.value : null,
      marketContext: marketContext.status === 'fulfilled' ? marketContext.value : null,
      generatedAt: new Date().toISOString(),
      cacheHit: false,
    };

    // Store in cache
    insightsCache.set(portfolioId, { data: response, timestamp: Date.now() });

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Portfolio insights error:', error);

    if (error instanceof PortfolioNotFoundError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate portfolio insights',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST endpoint to force refresh insights
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: portfolioId } = await params;

  // Clear cache for this portfolio
  insightsCache.delete(portfolioId);

  // Generate fresh insights
  return GET(request, { params });
}
