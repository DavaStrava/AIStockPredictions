import { PriceData } from '@/lib/technical-analysis/types';

export interface PortfolioMetrics {
  symbol: string;
  beta: number;
  alpha: number;
  sharpeRatio: number;
  sortinoRatio: number;
  volatility: number;
  expectedReturn: number;
  maxDrawdown: number;
  correlation: {
    [symbol: string]: number;
  };
}

export class PortfolioAnalyzer {
  /**
   * Calculate basic portfolio metrics for a single stock
   */
  static calculateMetrics(
    priceData: PriceData[],
    symbol: string,
    benchmarkData?: PriceData[],
    riskFreeRate: number = 0.02 // 2% annual risk-free rate
  ): PortfolioMetrics {
    if (priceData.length < 30) {
      throw new Error('Insufficient data for portfolio analysis (minimum 30 data points required)');
    }

    // Calculate daily returns
    const returns = this.calculateReturns(priceData);
    const benchmarkReturns = benchmarkData ? this.calculateReturns(benchmarkData) : null;

    // Basic statistics
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const volatility = this.calculateVolatility(returns);
    const expectedReturn = avgReturn * 252; // Annualized
    const annualizedVolatility = volatility * Math.sqrt(252);

    // Risk metrics
    const maxDrawdown = this.calculateMaxDrawdown(priceData);
    const sharpeRatio = (expectedReturn - riskFreeRate) / annualizedVolatility;
    const sortinoRatio = this.calculateSortinoRatio(returns, riskFreeRate);

    // Market metrics (if benchmark available)
    let beta = 1.0;
    let alpha = 0.0;
    const correlation: { [symbol: string]: number } = {};

    if (benchmarkReturns && benchmarkReturns.length === returns.length) {
      beta = this.calculateBeta(returns, benchmarkReturns);
      alpha = this.calculateAlpha(returns, benchmarkReturns, beta, riskFreeRate);
      correlation['SPY'] = this.calculateCorrelation(returns, benchmarkReturns);
    }

    return {
      symbol,
      beta,
      alpha,
      sharpeRatio,
      sortinoRatio,
      volatility: annualizedVolatility,
      expectedReturn,
      maxDrawdown,
      correlation,
    };
  }

  /**
   * Calculate daily returns from price data
   */
  private static calculateReturns(priceData: PriceData[]): number[] {
    const returns: number[] = [];
    
    for (let i = 1; i < priceData.length; i++) {
      const currentPrice = priceData[i].close;
      const previousPrice = priceData[i - 1].close;
      const dailyReturn = (currentPrice - previousPrice) / previousPrice;
      returns.push(dailyReturn);
    }
    
    return returns;
  }

  /**
   * Calculate volatility (standard deviation of returns)
   */
  private static calculateVolatility(returns: number[]): number {
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculate maximum drawdown
   */
  private static calculateMaxDrawdown(priceData: PriceData[]): number {
    let maxDrawdown = 0;
    let peak = priceData[0].close;
    
    for (let i = 1; i < priceData.length; i++) {
      const currentPrice = priceData[i].close;
      
      if (currentPrice > peak) {
        peak = currentPrice;
      }
      
      const drawdown = (peak - currentPrice) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    return maxDrawdown;
  }

  /**
   * Calculate Sortino ratio (downside deviation)
   */
  private static calculateSortinoRatio(returns: number[], riskFreeRate: number): number {
    const dailyRiskFreeRate = riskFreeRate / 252;
    const excessReturns = returns.map(r => r - dailyRiskFreeRate);
    const avgExcessReturn = excessReturns.reduce((sum, r) => sum + r, 0) / excessReturns.length;
    
    // Calculate downside deviation (only negative returns)
    const negativeReturns = excessReturns.filter(r => r < 0);
    if (negativeReturns.length === 0) return Infinity;
    
    const downsideVariance = negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length;
    const downsideDeviation = Math.sqrt(downsideVariance);
    
    return (avgExcessReturn * 252) / (downsideDeviation * Math.sqrt(252));
  }

  /**
   * Calculate beta (systematic risk)
   */
  private static calculateBeta(returns: number[], benchmarkReturns: number[]): number {
    if (returns.length !== benchmarkReturns.length) {
      throw new Error('Returns arrays must have the same length');
    }

    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const meanBenchmark = benchmarkReturns.reduce((sum, r) => sum + r, 0) / benchmarkReturns.length;

    let covariance = 0;
    let benchmarkVariance = 0;

    for (let i = 0; i < returns.length; i++) {
      const returnDiff = returns[i] - meanReturn;
      const benchmarkDiff = benchmarkReturns[i] - meanBenchmark;
      
      covariance += returnDiff * benchmarkDiff;
      benchmarkVariance += benchmarkDiff * benchmarkDiff;
    }

    covariance /= returns.length;
    benchmarkVariance /= benchmarkReturns.length;

    return benchmarkVariance === 0 ? 1 : covariance / benchmarkVariance;
  }

  /**
   * Calculate alpha (excess return)
   */
  private static calculateAlpha(
    returns: number[],
    benchmarkReturns: number[],
    beta: number,
    riskFreeRate: number
  ): number {
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const avgBenchmarkReturn = benchmarkReturns.reduce((sum, r) => sum + r, 0) / benchmarkReturns.length;
    const dailyRiskFreeRate = riskFreeRate / 252;

    // Alpha = (Portfolio Return - Risk Free Rate) - Beta * (Benchmark Return - Risk Free Rate)
    const annualizedReturn = avgReturn * 252;
    const annualizedBenchmarkReturn = avgBenchmarkReturn * 252;
    
    return annualizedReturn - riskFreeRate - beta * (annualizedBenchmarkReturn - riskFreeRate);
  }

  /**
   * Calculate correlation coefficient
   */
  private static calculateCorrelation(returns1: number[], returns2: number[]): number {
    if (returns1.length !== returns2.length) {
      throw new Error('Returns arrays must have the same length');
    }

    const mean1 = returns1.reduce((sum, r) => sum + r, 0) / returns1.length;
    const mean2 = returns2.reduce((sum, r) => sum + r, 0) / returns2.length;

    let numerator = 0;
    let sum1Sq = 0;
    let sum2Sq = 0;

    for (let i = 0; i < returns1.length; i++) {
      const diff1 = returns1[i] - mean1;
      const diff2 = returns2[i] - mean2;
      
      numerator += diff1 * diff2;
      sum1Sq += diff1 * diff1;
      sum2Sq += diff2 * diff2;
    }

    const denominator = Math.sqrt(sum1Sq * sum2Sq);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Calculate Value at Risk (VaR) at given confidence level
   */
  static calculateVaR(returns: number[], confidenceLevel: number = 0.05): number {
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor(returns.length * confidenceLevel);
    return sortedReturns[index];
  }

  /**
   * Calculate Conditional Value at Risk (CVaR)
   */
  static calculateCVaR(returns: number[], confidenceLevel: number = 0.05): number {
    const var = this.calculateVaR(returns, confidenceLevel);
    const tailReturns = returns.filter(r => r <= var);
    return tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length;
  }
}