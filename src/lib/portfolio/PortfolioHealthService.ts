import { PortfolioService } from './PortfolioService';
import { FMPDataProvider } from '@/lib/data-providers/fmp';
import { TechnicalAnalysisEngine } from '@/lib/technical-analysis/engine';
import { TechnicalAnalysisResult, TechnicalSignal } from '@/lib/technical-analysis/types';
import {
  HoldingWithMarketData,
  HoldingHealthAnalysis,
  PortfolioHealthResult,
  HealthRating,
} from '@/types/portfolio';

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 200;

function scoreFromSummary(summary: TechnicalAnalysisResult['summary']): number {
  const { overall, strength } = summary;
  if (overall === 'bullish') return 67 + strength * 33;
  if (overall === 'bearish') return 33 - strength * 33;
  return 34 + strength * 33;
}

function ratingFromScore(score: number): HealthRating {
  if (score >= 67) return 'bullish';
  if (score >= 34) return 'neutral';
  return 'bearish';
}

function topSignals(
  signals: TechnicalSignal[],
  limit = 3
): Array<{ indicator: string; signal: 'buy' | 'sell' | 'hold'; strength: number }> {
  return [...signals]
    .sort((a, b) => b.strength - a.strength)
    .slice(0, limit)
    .map((s) => ({ indicator: s.indicator, signal: s.signal, strength: s.strength }));
}

function buildDiagnosticMessage(
  symbol: string,
  summary: TechnicalAnalysisResult['summary'],
  score: number
): string {
  const sentimentLabel =
    summary.overall === 'bullish'
      ? 'positive'
      : summary.overall === 'bearish'
        ? 'negative'
        : 'mixed';

  const trendLabel =
    summary.trendDirection === 'up'
      ? 'upward'
      : summary.trendDirection === 'down'
        ? 'downward'
        : 'sideways';

  const volLabel = summary.volatility === 'high' ? 'elevated' : summary.volatility;

  return `${symbol} shows ${sentimentLabel} technical signals (score ${Math.round(score)}/100) with a ${trendLabel} trend and ${volLabel} volatility.`;
}

export class PortfolioHealthService {
  private portfolioService: PortfolioService;
  private fmpProvider: FMPDataProvider;
  private engine: TechnicalAnalysisEngine;

  constructor(
    portfolioService: PortfolioService,
    fmpProvider: FMPDataProvider,
    engine?: TechnicalAnalysisEngine
  ) {
    this.portfolioService = portfolioService;
    this.fmpProvider = fmpProvider;
    this.engine = engine || new TechnicalAnalysisEngine();
  }

  async analyzePortfolioHealth(portfolioId: string): Promise<PortfolioHealthResult> {
    const holdings = await this.portfolioService.getHoldingsWithMarketData(portfolioId);

    const results: HoldingHealthAnalysis[] = [];
    let skipped = 0;

    // Process in batches with delay to avoid FMP rate limits
    for (let i = 0; i < holdings.length; i += BATCH_SIZE) {
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
      }

      const batch = holdings.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.allSettled(
        batch.map((h) => this.analyzeHolding(h))
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          skipped++;
        }
      }
    }

    // Weighted overall score
    const totalWeight = results.reduce((sum, r) => sum + r.portfolioWeight, 0);
    const overallScore =
      totalWeight > 0
        ? results.reduce((sum, r) => sum + r.score * r.portfolioWeight, 0) / totalWeight
        : 50;

    const overallRating = ratingFromScore(overallScore);

    // Rating breakdown with normalized percentages that always sum to 100
    const bullishCount = results.filter((r) => r.rating === 'bullish').length;
    const neutralCount = results.filter((r) => r.rating === 'neutral').length;
    const bearishCount = results.filter((r) => r.rating === 'bearish').length;
    const total = results.length || 1;

    let bullishPct = Math.round((bullishCount / total) * 100);
    let neutralPct = Math.round((neutralCount / total) * 100);
    let bearishPct = Math.round((bearishCount / total) * 100);

    // Adjust for rounding so percentages always sum to exactly 100
    const pctSum = bullishPct + neutralPct + bearishPct;
    if (results.length > 0 && pctSum !== 100) {
      const diff = 100 - pctSum;
      // Apply correction to the largest category to minimize relative error
      if (bullishCount >= neutralCount && bullishCount >= bearishCount) {
        bullishPct += diff;
      } else if (neutralCount >= bearishCount) {
        neutralPct += diff;
      } else {
        bearishPct += diff;
      }
    }

    return {
      portfolioId,
      overallScore: Math.round(overallScore * 10) / 10,
      overallRating,
      ratingBreakdown: {
        bullish: { count: bullishCount, percent: bullishPct },
        neutral: { count: neutralCount, percent: neutralPct },
        bearish: { count: bearishCount, percent: bearishPct },
      },
      holdings: results,
      analyzedAt: new Date().toISOString(),
      holdingsAnalyzed: results.length,
      holdingsSkipped: skipped,
    };
  }

  private async analyzeHolding(holding: HoldingWithMarketData): Promise<HoldingHealthAnalysis> {
    const historicalData = await this.fmpProvider.getHistoricalData(holding.symbol, '6month');
    const analysis = this.engine.analyze(historicalData, holding.symbol);

    const score = scoreFromSummary(analysis.summary);
    const rating = ratingFromScore(score);

    return {
      symbol: holding.symbol,
      companyName: holding.companyName,
      score: Math.round(score * 10) / 10,
      rating,
      signalSummary: analysis.summary.overall,
      topSignals: topSignals(analysis.signals),
      diagnosticMessage: buildDiagnosticMessage(holding.symbol, analysis.summary, score),
      portfolioWeight: holding.portfolioWeight,
      volatility: analysis.summary.volatility,
    };
  }
}
