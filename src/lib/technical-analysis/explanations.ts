import { TechnicalSignal } from './types';

/**
 * Market context interface for contextual explanations
 */
export interface MarketContext {
  condition: 'bull' | 'bear' | 'sideways';
  volatility: 'low' | 'medium' | 'high';
  sector: string;
  marketCap?: 'small' | 'mid' | 'large';
}

/**
 * Individual indicator explanation structure
 */
export interface IndicatorExplanation {
  indicator: string;
  value: number;
  explanation: string;
  actionableInsight: string;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  timeframe: string;
}

/**
 * Explanation template for different indicator ranges
 */
interface IndicatorTemplate {
  ranges: {
    [key: string]: {
      min: number;
      max: number;
      explanation: string;
      action: string;
      riskLevel: 'low' | 'medium' | 'high';
      timeframe: string;
    };
  };
  contextualFactors: string[];
}

/**
 * RSI explanation templates with market context awareness
 */
const RSI_TEMPLATES: IndicatorTemplate = {
  ranges: {
    oversold: {
      min: 0,
      max: 30,
      explanation: "shows oversold conditions, which historically has led to short-term bounces in this price range. This suggests the stock may have been sold down more than fundamentals justify.",
      action: "This could be a buying opportunity, but confirm with other indicators and monitor for 2-3 trading days to ensure the reversal is sustainable.",
      riskLevel: 'low',
      timeframe: '2-3 trading days'
    },
    neutral: {
      min: 30,
      max: 70,
      explanation: "is in neutral territory, indicating balanced buying and selling pressure. The stock is neither overbought nor oversold at current levels.",
      action: "No immediate action required. Monitor for trend changes above 70 (overbought) or below 30 (oversold) for potential trading opportunities.",
      riskLevel: 'low',
      timeframe: 'ongoing monitoring'
    },
    overbought: {
      min: 70,
      max: 100,
      explanation: "indicates the stock is in overbought territory, suggesting potential selling pressure may emerge soon. This typically occurs when buying momentum has pushed the stock price higher than fundamental value would support.",
      action: "Consider waiting for RSI to drop below 50 before entering a position, or take profits if currently holding. Watch for confirmation from other indicators.",
      riskLevel: 'medium',
      timeframe: '1-2 weeks'
    }
  },
  contextualFactors: ['sector performance', 'market volatility', 'recent earnings', 'market cap considerations']
};

/**
 * MACD explanation templates
 */
const MACD_TEMPLATES: IndicatorTemplate = {
  ranges: {
    bullish: {
      min: -Infinity,
      max: Infinity,
      explanation: "shows a bullish crossover, suggesting upward momentum is building. This occurs when the faster moving average crosses above the slower one, indicating strengthening buying interest.",
      action: "This MACD crossover suggests potential upward momentum - monitor for confirmation over next 2-3 trading days. Consider entering positions if other indicators align.",
      riskLevel: 'medium',
      timeframe: '2-3 trading days'
    },
    bearish: {
      min: -Infinity,
      max: Infinity,
      explanation: "indicates bearish momentum with the signal line crossing below the MACD line. This suggests weakening buying pressure and potential downward price movement ahead.",
      action: "Consider reducing position size or setting stop-loss orders as downward pressure may continue. Wait for bullish crossover before re-entering.",
      riskLevel: 'high',
      timeframe: '1-2 weeks'
    },
    neutral: {
      min: -Infinity,
      max: Infinity,
      explanation: "is showing mixed signals with no clear directional bias at the current price level. The indicator lines are converging without a definitive crossover pattern.",
      action: "Wait for clearer MACD signals before making position changes. Look for decisive crossovers above or below the signal line.",
      riskLevel: 'low',
      timeframe: 'ongoing monitoring'
    }
  },
  contextualFactors: ['trend strength', 'volume confirmation', 'market momentum', 'sector rotation']
};

/**
 * Bollinger Bands explanation templates
 */
const BOLLINGER_BANDS_TEMPLATES: IndicatorTemplate = {
  ranges: {
    lower_band: {
      min: -Infinity,
      max: Infinity,
      explanation: "is approaching or touching the lower Bollinger Band, suggesting the stock may be oversold relative to its recent trading range. This often indicates a potential bounce back toward the middle band.",
      action: "Consider this a potential buying opportunity, especially if supported by other indicators. Target the middle band for profit-taking.",
      riskLevel: 'medium',
      timeframe: '1-2 weeks'
    },
    upper_band: {
      min: -Infinity,
      max: Infinity,
      explanation: "is near or touching the upper Bollinger Band, indicating the stock may be overbought relative to its recent volatility. This suggests potential resistance and possible pullback.",
      action: "Consider taking profits or reducing position size. Watch for a move back toward the middle band before re-entering.",
      riskLevel: 'medium',
      timeframe: '1-2 weeks'
    },
    middle_range: {
      min: -Infinity,
      max: Infinity,
      explanation: "is trading within the middle range of its Bollinger Bands, indicating normal price action relative to recent volatility. No extreme conditions are present.",
      action: "Monitor for moves toward the upper or lower bands for potential trading opportunities. Current levels suggest balanced conditions.",
      riskLevel: 'low',
      timeframe: 'ongoing monitoring'
    }
  },
  contextualFactors: ['volatility regime', 'mean reversion tendency', 'breakout potential', 'volume patterns']
};

/**
 * Apply market context to base explanation
 */
function applyMarketContext(
  baseExplanation: string,
  baseAction: string,
  symbol: string,
  marketContext?: MarketContext
): { explanation: string; action: string } {
  let contextualExplanation = baseExplanation;
  let contextualAction = baseAction;

  if (marketContext) {
    // Add market condition context
    if (marketContext.condition === 'bull') {
      contextualExplanation += " In the current bull market environment, this signal may have increased reliability for upward moves.";
    } else if (marketContext.condition === 'bear') {
      contextualExplanation += " Given the current bear market conditions, exercise extra caution and consider shorter timeframes.";
      contextualAction += " Bear market conditions suggest using tighter stop-losses.";
    } else if (marketContext.condition === 'sideways') {
      contextualExplanation += " In the current sideways market, this signal may indicate range-bound trading opportunities.";
    }

    // Add volatility context
    if (marketContext.volatility === 'high') {
      contextualAction += " High market volatility suggests using smaller position sizes and wider stop-losses.";
    } else if (marketContext.volatility === 'low') {
      contextualAction += " Low volatility environment may lead to more reliable technical signals.";
    }

    // Add sector context
    if (marketContext.sector) {
      contextualExplanation += ` As a ${marketContext.sector} stock, consider sector-specific factors that may influence this signal.`;
    }

    // Add market cap context
    if (marketContext.marketCap === 'small') {
      contextualAction += " Small-cap stocks tend to be more volatile - consider this in position sizing.";
    } else if (marketContext.marketCap === 'large') {
      contextualAction += " Large-cap stocks typically show more stable technical patterns.";
    }
  }

  return {
    explanation: contextualExplanation,
    action: contextualAction
  };
}

/**
 * Generate RSI explanation with market context
 */
export function generateRSIExplanation(
  signal: TechnicalSignal,
  symbol: string,
  currentPrice: number,
  marketContext?: MarketContext
): IndicatorExplanation {
  const { value } = signal;
  const template = RSI_TEMPLATES;
  
  let range: string;
  if (value < 30) {
    range = 'oversold';
  } else if (value > 70) {
    range = 'overbought';
  } else {
    range = 'neutral';
  }

  const rangeData = template.ranges[range];
  const baseExplanation = `${symbol}'s RSI of ${value.toFixed(1)} ${rangeData.explanation}`;
  const baseAction = rangeData.action;

  const { explanation, action } = applyMarketContext(baseExplanation, baseAction, symbol, marketContext);

  return {
    indicator: signal.indicator,
    value,
    explanation,
    actionableInsight: action,
    riskLevel: rangeData.riskLevel,
    confidence: signal.strength || 0.7,
    timeframe: rangeData.timeframe
  };
}

/**
 * Generate MACD explanation with market context
 */
export function generateMACDExplanation(
  signal: TechnicalSignal,
  symbol: string,
  currentPrice: number,
  marketContext?: MarketContext
): IndicatorExplanation {
  const { signal: signalType } = signal;
  const template = MACD_TEMPLATES;
  
  let range: string;
  if (signalType === 'buy') {
    range = 'bullish';
  } else if (signalType === 'sell') {
    range = 'bearish';
  } else {
    range = 'neutral';
  }

  const rangeData = template.ranges[range];
  let baseExplanation: string;
  if (range === 'bullish') {
    baseExplanation = `${symbol}'s MACD shows a bullish signal at current price of $${currentPrice}, suggesting upward momentum is building. This bullish crossover occurs when the faster moving average crosses above the slower one, indicating strengthening buying interest.`;
  } else {
    baseExplanation = `${symbol}'s MACD ${rangeData.explanation}`;
  }
  const baseAction = rangeData.action;

  const { explanation, action } = applyMarketContext(baseExplanation, baseAction, symbol, marketContext);

  return {
    indicator: signal.indicator,
    value: signal.value,
    explanation,
    actionableInsight: action,
    riskLevel: rangeData.riskLevel,
    confidence: signal.strength || 0.7,
    timeframe: rangeData.timeframe
  };
}

/**
 * Generate Bollinger Bands explanation with market context
 */
export function generateBollingerBandsExplanation(
  signal: TechnicalSignal,
  symbol: string,
  currentPrice: number,
  marketContext?: MarketContext
): IndicatorExplanation {
  const { signal: signalType } = signal;
  const template = BOLLINGER_BANDS_TEMPLATES;
  
  let range: string;
  if (signalType === 'buy') {
    range = 'lower_band';
  } else if (signalType === 'sell') {
    range = 'upper_band';
  } else {
    range = 'middle_range';
  }

  const rangeData = template.ranges[range];
  const baseExplanation = `${symbol} ${rangeData.explanation}`;
  const baseAction = rangeData.action;

  const { explanation, action } = applyMarketContext(baseExplanation, baseAction, symbol, marketContext);

  return {
    indicator: signal.indicator,
    value: signal.value,
    explanation,
    actionableInsight: action,
    riskLevel: rangeData.riskLevel,
    confidence: signal.strength || 0.6,
    timeframe: rangeData.timeframe
  };
}

/**
 * Generate fallback explanation for unknown indicators
 */
export function generateFallbackExplanation(
  signal: TechnicalSignal,
  symbol: string,
  currentPrice: number,
  marketContext?: MarketContext
): IndicatorExplanation {
  const baseExplanation = `${signal.indicator} value of ${signal.value.toFixed(2)} for ${symbol} requires additional context for interpretation. This indicator is showing ${signal.signal} conditions based on its current reading.`;
  const baseAction = `Monitor this indicator alongside other technical signals for better decision making. Consider the overall market context when interpreting this signal.`;

  const { explanation, action } = applyMarketContext(baseExplanation, baseAction, symbol, marketContext);

  return {
    indicator: signal.indicator,
    value: signal.value,
    explanation,
    actionableInsight: action,
    riskLevel: 'medium',
    confidence: signal.strength || 0.5,
    timeframe: 'ongoing monitoring'
  };
}

/**
 * Main function to generate contextual explanations for any technical indicator
 */
export function generateTechnicalIndicatorExplanation(
  signal: TechnicalSignal,
  symbol: string,
  currentPrice: number,
  marketContext?: MarketContext
): IndicatorExplanation {
  switch (signal.indicator.toUpperCase()) {
    case 'RSI':
      return generateRSIExplanation(signal, symbol, currentPrice, marketContext);
    case 'MACD':
      return generateMACDExplanation(signal, symbol, currentPrice, marketContext);
    case 'BOLLINGER_BANDS':
    case 'BOLLINGER BANDS':
      return generateBollingerBandsExplanation(signal, symbol, currentPrice, marketContext);
    default:
      return generateFallbackExplanation(signal, symbol, currentPrice, marketContext);
  }
}

/**
 * Generate explanations for multiple indicators with conflict detection
 */
export function generateMultipleIndicatorExplanations(
  signals: TechnicalSignal[],
  symbol: string,
  currentPrice: number,
  marketContext?: MarketContext
): {
  explanations: IndicatorExplanation[];
  conflicts: string[];
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
} {
  const explanations = signals.map(signal => 
    generateTechnicalIndicatorExplanation(signal, symbol, currentPrice, marketContext)
  );

  // Detect conflicting signals
  const conflicts: string[] = [];
  const buySignals = signals.filter(s => s.signal === 'buy');
  const sellSignals = signals.filter(s => s.signal === 'sell');

  if (buySignals.length > 0 && sellSignals.length > 0) {
    conflicts.push(
      `Mixed signals detected: ${buySignals.map(s => s.indicator).join(', ')} suggest buying, while ${sellSignals.map(s => s.indicator).join(', ')} suggest selling. Consider waiting for clearer consensus or use smaller position sizes.`
    );
  }

  // Determine overall sentiment
  const bullishCount = buySignals.length;
  const bearishCount = sellSignals.length;
  const neutralCount = signals.filter(s => s.signal === 'hold').length;

  let overallSentiment: 'bullish' | 'bearish' | 'neutral';
  if (bullishCount > bearishCount + neutralCount) {
    overallSentiment = 'bullish';
  } else if (bearishCount > bullishCount + neutralCount) {
    overallSentiment = 'bearish';
  } else {
    overallSentiment = 'neutral';
  }

  return {
    explanations,
    conflicts,
    overallSentiment
  };
}

/**
 * Get market context from various data sources
 */
export function inferMarketContext(
  symbol: string,
  sector?: string,
  marketCap?: number
): MarketContext {
  // This would typically integrate with market data APIs
  // For now, providing a basic implementation
  
  const marketCapCategory = marketCap 
    ? marketCap > 10000000000 ? 'large' 
      : marketCap > 2000000000 ? 'mid' 
      : 'small'
    : undefined;

  return {
    condition: 'sideways', // Would be determined from market indices
    volatility: 'medium',  // Would be calculated from recent price action
    sector: sector || 'unknown',
    marketCap: marketCapCategory
  };
}