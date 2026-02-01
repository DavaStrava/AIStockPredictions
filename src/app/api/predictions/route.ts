/**
 * Predictions API Route
 * Endpoint: GET /api/predictions
 *
 * Generates AI-powered stock predictions based on technical analysis.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  withMiddleware,
  withErrorHandling,
  withRateLimit,
  withValidation,
  withLogging,
  ApiResponse,
  RequestContext,
  NotFoundError,
} from '@/lib/api/middleware';
import { PredictionSymbolsSchema } from '@/lib/validation/schemas';
import { TechnicalAnalysisEngine } from '@/lib/technical-analysis/engine';
import { getFMPProvider } from '@/lib/data-providers/fmp';
import { PredictionResult } from '@/types/predictions';

export const GET = withMiddleware(
  withErrorHandling(),
  withRateLimit({ requestsPerMinute: 20 }),
  withValidation(PredictionSymbolsSchema, 'query'),
  withLogging(),
  async (req: NextRequest, { validatedData }: RequestContext) => {
    const { symbols: symbolsParam } = validatedData as { symbols?: string };

    // Parse symbols or use defaults
    const symbols = symbolsParam?.split(',') || ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'];

    const fmpProvider = getFMPProvider();
    const predictions: PredictionResult[] = [];

    // Process each symbol
    for (const symbol of symbols) {
      try {
        const cleanSymbol = symbol.trim().toUpperCase();

        // Fetch real data in parallel
        const [historicalData, quote] = await Promise.all([
          fmpProvider.getHistoricalData(cleanSymbol, '6month'),
          fmpProvider.getQuote(cleanSymbol)
        ]);

        if (historicalData.length === 0) {
          console.warn(`No historical data for ${cleanSymbol}, skipping`);
          continue;
        }

        // Perform technical analysis
        const engine = new TechnicalAnalysisEngine();
        const analysis = engine.analyze(historicalData, cleanSymbol);

        // Calculate support and resistance from recent data
        const recentPrices = historicalData.slice(-20).map(d => d.close);
        const support = Math.min(...recentPrices);
        const resistance = Math.max(...recentPrices);

        // Generate prediction based on analysis
        const strongSignals = engine.getStrongSignals(analysis, 0.6);
        const bullishSignals = strongSignals.filter(s => s.signal === 'buy');
        const bearishSignals = strongSignals.filter(s => s.signal === 'sell');

        let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
        let targetPrice = quote.price;
        let reasoning: string[] = [];

        // Determine direction based on signals and overall sentiment
        const sentimentScore = analysis.summary.strength;
        const overallSentiment = analysis.summary.overall;

        if (overallSentiment === 'bullish' && bullishSignals.length > bearishSignals.length) {
          direction = 'bullish';
          targetPrice = quote.price * (1 + 0.03 + Math.random() * 0.07); // 3-10% upside
          reasoning = [
            `Strong bullish sentiment (${Math.round(sentimentScore * 100)}% strength)`,
            ...bullishSignals.slice(0, 2).map(s => s.description)
          ];
        } else if (overallSentiment === 'bearish' && bearishSignals.length > bullishSignals.length) {
          direction = 'bearish';
          targetPrice = quote.price * (1 - 0.03 - Math.random() * 0.07); // 3-10% downside
          reasoning = [
            `Strong bearish sentiment (${Math.round(sentimentScore * 100)}% strength)`,
            ...bearishSignals.slice(0, 2).map(s => s.description)
          ];
        } else {
          reasoning = [
            'Mixed signals from technical indicators',
            `Current trend: ${analysis.summary.trendDirection}`,
            `Momentum: ${analysis.summary.momentum}`
          ];
        }

        // Determine volatility category
        let volatility: 'low' | 'medium' | 'high' = 'medium';
        const volatilityLevel = analysis.summary.volatility;
        if (volatilityLevel === 'low') volatility = 'low';
        else if (volatilityLevel === 'high') volatility = 'high';

        const prediction: PredictionResult = {
          symbol: cleanSymbol,
          currentPrice: Math.round(quote.price * 100) / 100,
          prediction: {
            direction,
            confidence: analysis.summary.confidence,
            targetPrice: Math.round(targetPrice * 100) / 100,
            timeframe: '1-2 weeks',
            reasoning,
          },
          signals: strongSignals.slice(0, 5),
          riskMetrics: {
            volatility,
            support: Math.round(support * 100) / 100,
            resistance: Math.round(resistance * 100) / 100,
            stopLoss: Math.round(quote.price * 0.95 * 100) / 100,
          },
          marketData: {
            dayChange: quote.change || 0,
            dayChangePercent: quote.changesPercentage || 0,
            volume: quote.volume || 0,
            avgVolume: quote.avgVolume || 0,
            marketCap: quote.marketCap || 0,
            pe: quote.pe || 0,
          },
        };

        predictions.push(prediction);

      } catch (error) {
        console.error(`Failed to process symbol ${symbol}:`, error);
        // Continue with other symbols
      }
    }

    if (predictions.length === 0) {
      throw new NotFoundError('No valid predictions could be generated for the requested symbols');
    }

    // Return in original format for backward compatibility
    return NextResponse.json({
      success: true,
      data: predictions,
      metadata: {
        timestamp: new Date().toISOString(),
        symbolsRequested: symbols.length,
        symbolsProcessed: predictions.length,
        dataSource: 'Financial Modeling Prep',
      },
    });
  }
);
