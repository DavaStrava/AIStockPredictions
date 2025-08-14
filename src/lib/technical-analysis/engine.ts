import { PriceData, TechnicalAnalysisResult, TechnicalSignal, IndicatorConfig, DEFAULT_CONFIG } from './types';
import { validatePriceData, sortPriceData } from './utils';
import { analyzeRSI } from './indicators/rsi';
import { analyzeMACD } from './indicators/macd';
import { analyzeBollingerBands } from './indicators/bollinger-bands';
import { analyzeMovingAverages } from './indicators/moving-averages';
import { analyzeMomentum } from './indicators/momentum';
import { analyzeVolume } from './indicators/volume';

/**
 * Comprehensive Technical Analysis Engine
 * 
 * This engine combines multiple technical indicators to provide a complete
 * analysis of price data with signals, trends, and confidence scores.
 */
export class TechnicalAnalysisEngine {
  private config: IndicatorConfig;
  
  constructor(config?: Partial<IndicatorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Analyze price data with all available indicators
   */
  public analyze(data: PriceData[], symbol: string): TechnicalAnalysisResult {
    // Validate and sort data
    validatePriceData(data);
    const sortedData = sortPriceData(data);
    
    // Initialize result structure
    const result: TechnicalAnalysisResult = {
      symbol,
      timestamp: new Date(),
      signals: [],
      indicators: {},
      summary: {
        overall: 'neutral',
        strength: 0.5,
        confidence: 0.5,
        trendDirection: 'sideways',
        momentum: 'stable',
        volatility: 'medium',
      },
    };
    
    // Analyze each indicator category
    try {
      // RSI Analysis
      if (this.config.rsi && sortedData.length >= this.config.rsi.period) {
        const rsiAnalysis = analyzeRSI(sortedData, symbol, this.config.rsi);
        result.indicators.rsi = rsiAnalysis.results;
        result.signals.push(...rsiAnalysis.signals);
      }
      
      // MACD Analysis
      if (this.config.macd && sortedData.length >= this.config.macd.slowPeriod + this.config.macd.signalPeriod) {
        const macdAnalysis = analyzeMACD(sortedData, symbol, this.config.macd);
        result.indicators.macd = macdAnalysis.results;
        result.signals.push(...macdAnalysis.signals);
      }
      
      // Bollinger Bands Analysis
      if (this.config.bollingerBands && sortedData.length >= this.config.bollingerBands.period) {
        const bbAnalysis = analyzeBollingerBands(sortedData, symbol, this.config.bollingerBands);
        result.indicators.bollingerBands = bbAnalysis.results;
        result.signals.push(...bbAnalysis.signals);
      }
      
      // Moving Averages Analysis
      if (this.config.movingAverages && this.config.movingAverages.periods.length > 0) {
        const minPeriod = Math.min(...this.config.movingAverages.periods);
        if (sortedData.length >= minPeriod) {
          const maAnalysis = analyzeMovingAverages(sortedData, symbol, {
            periods: this.config.movingAverages.periods,
            includeEMA: true,
            detectCrossovers: true,
          });
          result.indicators.sma = maAnalysis.sma.flat();
          result.indicators.ema = maAnalysis.ema?.flat();
          result.signals.push(...maAnalysis.signals);
        }
      }
      
      // Momentum Analysis
      if (this.config.stochastic || this.config.williamsR || this.config.adx) {
        const momentumAnalysis = analyzeMomentum(sortedData, symbol, {
          stochastic: this.config.stochastic,
          williamsR: this.config.williamsR,
          adx: this.config.adx,
        });
        result.indicators.stochastic = momentumAnalysis.stochastic;
        result.indicators.williamsR = momentumAnalysis.williamsR;
        result.indicators.adx = momentumAnalysis.adx;
        result.signals.push(...momentumAnalysis.signals);
      }
      
      // Volume Analysis
      if (sortedData.length >= 20) { // Need sufficient data for volume analysis
        const volumeAnalysis = analyzeVolume(sortedData, symbol);
        result.indicators.obv = volumeAnalysis.obv;
        result.indicators.volumePriceTrend = volumeAnalysis.vpt;
        result.indicators.accumulationDistribution = volumeAnalysis.ad;
        result.signals.push(...volumeAnalysis.signals);
      }
      
      // Generate summary
      result.summary = this.generateSummary(result.signals, sortedData);
      
    } catch (error) {
      console.error('Error in technical analysis:', error);
      // Return partial results even if some indicators fail
    }
    
    return result;
  }
  
  /**
   * Generate overall summary from all signals
   */
  private generateSummary(signals: TechnicalSignal[], data: PriceData[]) {
    const buySignals = signals.filter(s => s.signal === 'buy');
    const sellSignals = signals.filter(s => s.signal === 'sell');
    
    // Calculate overall sentiment
    const buyStrength = buySignals.reduce((sum, s) => sum + s.strength, 0);
    const sellStrength = sellSignals.reduce((sum, s) => sum + s.strength, 0);
    const totalStrength = buyStrength + sellStrength;
    
    let overall: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let strength = 0.5;
    
    if (totalStrength > 0) {
      const bullishRatio = buyStrength / totalStrength;
      
      if (bullishRatio > 0.6) {
        overall = 'bullish';
        strength = Math.min(0.9, 0.5 + (bullishRatio - 0.5) * 0.8);
      } else if (bullishRatio < 0.4) {
        overall = 'bearish';
        strength = Math.min(0.9, 0.5 + (0.5 - bullishRatio) * 0.8);
      }
    }
    
    // Calculate confidence based on signal consensus
    const confidence = Math.min(0.9, Math.max(0.1, signals.length / 10));
    
    // Determine trend direction
    const recentData = data.slice(-20); // Last 20 periods
    const trendDirection = this.calculateTrendDirection(recentData);
    
    // Determine momentum
    const momentum = this.calculateMomentum(recentData);
    
    // Determine volatility
    const volatility = this.calculateVolatility(recentData);
    
    return {
      overall,
      strength,
      confidence,
      trendDirection,
      momentum,
      volatility,
    };
  }
  
  /**
   * Calculate trend direction from recent price data
   */
  private calculateTrendDirection(data: PriceData[]): 'up' | 'down' | 'sideways' {
    if (data.length < 10) return 'sideways';
    
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, d) => sum + d.close, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.close, 0) / secondHalf.length;
    
    const change = (secondAvg - firstAvg) / firstAvg;
    
    if (change > 0.02) return 'up';
    if (change < -0.02) return 'down';
    return 'sideways';
  }
  
  /**
   * Calculate momentum from recent price changes
   */
  private calculateMomentum(data: PriceData[]): 'increasing' | 'decreasing' | 'stable' {
    if (data.length < 5) return 'stable';
    
    const changes = [];
    for (let i = 1; i < data.length; i++) {
      changes.push((data[i].close - data[i - 1].close) / data[i - 1].close);
    }
    
    const recentChanges = changes.slice(-5);
    const earlierChanges = changes.slice(-10, -5);
    
    if (earlierChanges.length === 0) return 'stable';
    
    const recentAvg = recentChanges.reduce((sum, c) => sum + Math.abs(c), 0) / recentChanges.length;
    const earlierAvg = earlierChanges.reduce((sum, c) => sum + Math.abs(c), 0) / earlierChanges.length;
    
    const momentumChange = (recentAvg - earlierAvg) / earlierAvg;
    
    if (momentumChange > 0.2) return 'increasing';
    if (momentumChange < -0.2) return 'decreasing';
    return 'stable';
  }
  
  /**
   * Calculate volatility from recent price data
   */
  private calculateVolatility(data: PriceData[]): 'low' | 'medium' | 'high' {
    if (data.length < 10) return 'medium';
    
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      returns.push((data[i].close - data[i - 1].close) / data[i - 1].close);
    }
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);
    
    // Annualized volatility thresholds (assuming daily data)
    const annualizedVol = volatility * Math.sqrt(252);
    
    if (annualizedVol < 0.15) return 'low';
    if (annualizedVol > 0.30) return 'high';
    return 'medium';
  }
  
  /**
   * Get signals filtered by strength threshold
   */
  public getStrongSignals(result: TechnicalAnalysisResult, minStrength: number = 0.7): TechnicalSignal[] {
    return result.signals.filter(signal => signal.strength >= minStrength);
  }
  
  /**
   * Get signals by indicator type
   */
  public getSignalsByIndicator(result: TechnicalAnalysisResult, indicator: string): TechnicalSignal[] {
    return result.signals.filter(signal => signal.indicator === indicator);
  }
  
  /**
   * Get consensus signals (multiple indicators agreeing)
   */
  public getConsensusSignals(result: TechnicalAnalysisResult, minConsensus: number = 2): TechnicalSignal[] {
    const signalGroups = new Map<string, TechnicalSignal[]>();
    
    // Group signals by type and timestamp
    for (const signal of result.signals) {
      const key = `${signal.signal}_${signal.timestamp.getTime()}`;
      if (!signalGroups.has(key)) {
        signalGroups.set(key, []);
      }
      signalGroups.get(key)!.push(signal);
    }
    
    // Return signals with sufficient consensus
    const consensusSignals: TechnicalSignal[] = [];
    const signalGroupsArray = Array.from(signalGroups.values());
    for (const signals of signalGroupsArray) {
      if (signals.length >= minConsensus) {
        // Create a combined signal with average strength
        const avgStrength = signals.reduce((sum, s) => sum + s.strength, 0) / signals.length;
        const combinedSignal: TechnicalSignal = {
          ...signals[0],
          indicator: `Consensus (${signals.map(s => s.indicator).join(', ')})`,
          strength: avgStrength,
          description: `Multiple indicators agree: ${signals[0].description}`,
        };
        consensusSignals.push(combinedSignal);
      }
    }
    
    return consensusSignals;
  }
}

/**
 * Convenience function for quick analysis
 */
export function analyzeTechnicals(
  data: PriceData[],
  symbol: string,
  config?: Partial<IndicatorConfig>
): TechnicalAnalysisResult {
  const engine = new TechnicalAnalysisEngine(config);
  return engine.analyze(data, symbol);
}

/**
 * Export all indicator functions for individual use
 */
export {
  analyzeRSI,
  analyzeMACD,
  analyzeBollingerBands,
  analyzeMovingAverages,
  analyzeMomentum,
  analyzeVolume,
};