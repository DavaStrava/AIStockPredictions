/**
 * Mock data for E2E tests
 */

export const mockStockPredictions = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    currentPrice: 185.50,
    predictedPrice: 195.00,
    confidence: 0.85,
    signal: 'buy' as const,
    changePercent: 5.12,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    currentPrice: 142.30,
    predictedPrice: 150.00,
    confidence: 0.78,
    signal: 'buy' as const,
    changePercent: 5.41,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    currentPrice: 378.90,
    predictedPrice: 390.00,
    confidence: 0.82,
    signal: 'buy' as const,
    changePercent: 2.93,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    currentPrice: 875.25,
    predictedPrice: 920.00,
    confidence: 0.75,
    signal: 'buy' as const,
    changePercent: 5.11,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    currentPrice: 245.80,
    predictedPrice: 230.00,
    confidence: 0.68,
    signal: 'sell' as const,
    changePercent: -6.43,
    lastUpdated: new Date().toISOString(),
  },
];

export const mockTechnicalIndicators = [
  {
    name: 'RSI',
    value: 65.5,
    signal: 'bullish' as const,
    interpretation: 'Momentum is positive but approaching overbought territory',
  },
  {
    name: 'MACD',
    value: 2.35,
    signal: 'bullish' as const,
    interpretation: 'MACD line is above signal line, indicating bullish momentum',
  },
  {
    name: 'SMA_50',
    value: 180.25,
    signal: 'bullish' as const,
    interpretation: 'Price is above 50-day moving average',
  },
  {
    name: 'SMA_200',
    value: 165.50,
    signal: 'bullish' as const,
    interpretation: 'Price is above 200-day moving average, indicating long-term uptrend',
  },
  {
    name: 'Bollinger_Bands',
    value: 0.75,
    signal: 'neutral' as const,
    interpretation: 'Price is within normal trading range',
  },
];

export const mockAnalysisData = {
  symbol: 'AAPL',
  currentPrice: 185.50,
  indicators: mockTechnicalIndicators,
  overallSignal: 'bullish' as const,
  riskLevel: 'medium' as const,
  marketContext: {
    trend: 'uptrend' as const,
    volatility: 'moderate' as const,
    volume: 'average' as const,
  },
};

export const mockMarketIndices = [
  {
    symbol: '^DJI',
    name: 'Dow Jones Industrial Average',
    value: 38654.42,
    change: 125.35,
    changePercent: 0.33,
  },
  {
    symbol: '^GSPC',
    name: 'S&P 500',
    value: 5026.61,
    change: 18.44,
    changePercent: 0.37,
  },
  {
    symbol: '^IXIC',
    name: 'NASDAQ Composite',
    value: 15990.66,
    change: 85.22,
    changePercent: 0.54,
  },
];

/** Empty response for testing empty states */
export const emptyPredictions: typeof mockStockPredictions = [];
export const emptyIndicators: typeof mockTechnicalIndicators = [];
