import { PriceData, TechnicalAnalysisResult, TechnicalSignal, IndicatorConfig, DEFAULT_CONFIG } from './types';
import { validatePriceData, sortPriceData } from './utils';
import { analyzeRSI } from './indicators/rsi';
import { analyzeMACD } from './indicators/macd';
import { analyzeBollingerBands } from './indicators/bollinger-bands';
import { analyzeMovingAverages } from './indicators/moving-averages';
import { analyzeMomentum } from './indicators/momentum';
import { analyzeVolume } from './indicators/volume';
import { analyzeStochastic } from './indicators/stochastic';
import { analyzeWilliamsR } from './indicators/williams-r';

/**
 * Comprehensive Technical Analysis Engine
 * 
 * This is the main orchestrator class that combines multiple technical indicators
 * to provide comprehensive market analysis. It processes price data through various
 * technical analysis methods and generates actionable trading signals.
 * 
 * Features:
 * - Multi-indicator analysis (trend, momentum, volume)
 * - Signal generation with strength ratings
 * - Market sentiment and trend analysis
 * - Consensus signal detection
 * - Configurable indicator parameters
 * - Performance optimized for real-time analysis
 * 
 * Supported Indicators:
 * - Trend: RSI, MACD, Bollinger Bands, Moving Averages
 * - Momentum: Stochastic, Williams %R, ADX
 * - Volume: OBV, VPT, Accumulation/Distribution
 * 
 * @example
 * ```typescript
 * const engine = new TechnicalAnalysisEngine({
 *   rsi: { period: 14, overbought: 75, oversold: 25 }
 * });
 * const analysis = engine.analyze(priceData, 'AAPL');
 * console.log(`Overall sentiment: ${analysis.summary.overall}`);
 * ```
 */
export class TechnicalAnalysisEngine {
  /** Configuration object containing parameters for all indicators */
  private config: IndicatorConfig;
  
  /**
   * Creates a new Technical Analysis Engine instance
   * 
   * @param config - Optional partial configuration to override defaults
   *                 Any unspecified parameters will use DEFAULT_CONFIG values
   */
  constructor(config?: Partial<IndicatorConfig>) {
    // Merge user configuration with defaults
    // This allows users to override only specific parameters while keeping defaults for others
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Performs comprehensive technical analysis on price data
   * 
   * This is the main analysis method that orchestrates all technical indicators
   * and generates a complete market analysis report. It processes the data through
   * multiple indicator categories and combines the results into actionable insights.
   * 
   * Analysis Process:
   * 1. Data validation and preparation
   * 2. Individual indicator calculations
   * 3. Signal generation and aggregation
   * 4. Market summary generation
   * 5. Error handling and graceful degradation
   * 
   * @param data - Array of price data points (OHLCV format)
   * @param symbol - Stock symbol or identifier for the analysis
   * @returns Comprehensive analysis result with indicators, signals, and summary
   * 
   * @example
   * ```typescript
   * const analysis = engine.analyze(priceData, 'AAPL');
   * console.log(`Found ${analysis.signals.length} trading signals`);
   * console.log(`Market sentiment: ${analysis.summary.overall}`);
   * ```
   */
  public analyze(data: PriceData[], symbol: string): TechnicalAnalysisResult {
    // Step 1: Data Validation and Preparation
    // Ensure data integrity before processing through indicators
    validatePriceData(data);
    
    // Sort data chronologically (oldest to newest)
    // Technical indicators require sequential data for accurate calculations
    const sortedData = sortPriceData(data);
    
    // Step 2: Initialize Result Structure
    // Create the comprehensive result object that will hold all analysis data
    const result: TechnicalAnalysisResult = {
      symbol,
      timestamp: new Date(), // Analysis timestamp for tracking
      signals: [],           // Will accumulate all trading signals
      indicators: {},        // Will hold all indicator calculation results
      summary: {             // Default neutral summary, will be calculated later
        overall: 'neutral',
        strength: 0.5,
        confidence: 0.5,
        trendDirection: 'sideways',
        momentum: 'stable',
        volatility: 'medium',
      },
    };
    
    // Step 3: Indicator Analysis with Error Handling
    // Process each indicator category independently to prevent single failures
    // from breaking the entire analysis
    try {
      // RSI Analysis - Momentum Oscillator
      // Check if RSI is configured and we have sufficient data
      if (this.config.rsi && sortedData.length >= this.config.rsi.period) {
        const rsiAnalysis = analyzeRSI(sortedData, symbol, this.config.rsi);
        result.indicators.rsi = rsiAnalysis.results;
        result.signals.push(...rsiAnalysis.signals);
      }
      
      // MACD Analysis - Trend Following Momentum Indicator
      // Requires more data due to slow EMA + signal line calculation
      if (this.config.macd && sortedData.length >= this.config.macd.slowPeriod + this.config.macd.signalPeriod) {
        const macdAnalysis = analyzeMACD(sortedData, symbol, this.config.macd);
        result.indicators.macd = macdAnalysis.results;
        result.signals.push(...macdAnalysis.signals);
      }
      
      // Bollinger Bands Analysis - Volatility and Mean Reversion
      // Helps identify overbought/oversold conditions and volatility changes
      if (this.config.bollingerBands && sortedData.length >= this.config.bollingerBands.period) {
        const bbAnalysis = analyzeBollingerBands(sortedData, symbol, this.config.bollingerBands);
        result.indicators.bollingerBands = bbAnalysis.results;
        result.signals.push(...bbAnalysis.signals);
      }
      
      // Moving Averages Analysis - Trend Identification
      // Includes both SMA and EMA with crossover detection
      if (this.config.movingAverages && this.config.movingAverages.periods.length > 0) {
        const minPeriod = Math.min(...this.config.movingAverages.periods);
        if (sortedData.length >= minPeriod) {
          const maAnalysis = analyzeMovingAverages(sortedData, symbol, {
            periods: this.config.movingAverages.periods,
            includeEMA: true,
            detectCrossovers: true,
          });
          // Flatten arrays since moving averages returns arrays of arrays (one per period)
          result.indicators.sma = maAnalysis.sma.flat();
          result.indicators.ema = maAnalysis.ema?.flat();
          result.signals.push(...maAnalysis.signals);
        }
      }
      
      // Stochastic Oscillator Analysis
      if (this.config.stochastic && sortedData.length >= this.config.stochastic.kPeriod + this.config.stochastic.dPeriod) {
        const stochasticAnalysis = analyzeStochastic(sortedData, symbol, this.config.stochastic);
        result.indicators.stochastic = stochasticAnalysis.results;
        result.signals.push(...stochasticAnalysis.signals);
      }
      
      // Williams %R Analysis
      if (this.config.williamsR && sortedData.length >= this.config.williamsR.period) {
        const williamsRAnalysis = analyzeWilliamsR(sortedData, symbol, this.config.williamsR);
        result.indicators.williamsR = williamsRAnalysis.results;
        result.signals.push(...williamsRAnalysis.signals);
      }
      
      // Momentum Analysis - ADX and other momentum indicators
      if (this.config.adx) {
        const momentumAnalysis = analyzeMomentum(sortedData, symbol, {
          adx: this.config.adx,
        });
        result.indicators.adx = momentumAnalysis.adx;
        result.signals.push(...momentumAnalysis.signals);
      }
      
      // Volume Analysis - Volume-Based Indicators
      // Requires sufficient data for meaningful volume pattern analysis
      if (sortedData.length >= 20) {
        const volumeAnalysis = analyzeVolume(sortedData, symbol);
        result.indicators.obv = volumeAnalysis.obv;
        result.indicators.volumePriceTrend = volumeAnalysis.vpt;
        result.indicators.accumulationDistribution = volumeAnalysis.ad;
        result.signals.push(...volumeAnalysis.signals);
      }
      
      // Step 4: Generate Market Summary
      // Analyze all signals to create overall market assessment
      result.summary = this.generateSummary(result.signals, sortedData);
      
    } catch (error) {
      // Graceful error handling - log error but return partial results
      // This ensures the system remains functional even if some indicators fail
      console.error('Error in technical analysis:', error);
      // The result object will contain whatever indicators succeeded
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