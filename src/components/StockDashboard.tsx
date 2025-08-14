'use client';

import { useState, useEffect } from 'react';
import { TechnicalAnalysisResult, TechnicalSignal } from '@/lib/technical-analysis/types';

interface PredictionResult {
  symbol: string;
  currentPrice: number;
  prediction: {
    direction: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    targetPrice: number;
    timeframe: string;
    reasoning: string[];
  };
  signals: TechnicalSignal[];
  riskMetrics: {
    volatility: 'low' | 'medium' | 'high';
    support: number;
    resistance: number;
    stopLoss: number;
  };
}

export default function StockDashboard() {
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [selectedStock, setSelectedStock] = useState<string>('');
  const [analysis, setAnalysis] = useState<TechnicalAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [customSymbol, setCustomSymbol] = useState('');

  // Load initial predictions
  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async (symbols?: string) => {
    try {
      setLoading(true);
      const url = symbols 
        ? `/api/predictions?symbols=${symbols}`
        : '/api/predictions?symbols=AAPL,GOOGL,MSFT,TSLA,NVDA';
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setPredictions(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedAnalysis = async (symbol: string) => {
    try {
      const response = await fetch(`/api/analysis?symbol=${symbol}&days=100`);
      const data = await response.json();
      
      if (data.success) {
        setAnalysis(data.data);
        setSelectedStock(symbol);
      }
    } catch (error) {
      console.error('Failed to fetch analysis:', error);
    }
  };

  const handleCustomAnalysis = async () => {
    if (customSymbol.trim()) {
      await fetchPredictions(customSymbol.trim().toUpperCase());
      setCustomSymbol('');
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'bullish': return 'text-green-600 dark:text-green-400';
      case 'bearish': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getDirectionBg = (direction: string) => {
    switch (direction) {
      case 'bullish': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'bearish': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default: return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading predictions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with custom analysis */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Stock Predictions</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            AI-powered technical analysis with real-time insights
          </p>
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter symbol (e.g., AAPL)"
            value={customSymbol}
            onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === 'Enter' && handleCustomAnalysis()}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-foreground text-sm"
          />
          <button
            onClick={handleCustomAnalysis}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            Analyze
          </button>
        </div>
      </div>

      {/* Predictions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {predictions.map((prediction) => (
          <div
            key={prediction.symbol}
            className={`border rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${getDirectionBg(prediction.prediction.direction)}`}
            onClick={() => fetchDetailedAnalysis(prediction.symbol)}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{prediction.symbol}</h3>
                <p className="text-2xl font-bold text-foreground">${prediction.currentPrice}</p>
              </div>
              <div className="text-right">
                <span className={`text-sm font-medium ${getDirectionColor(prediction.prediction.direction)}`}>
                  {prediction.prediction.direction.toUpperCase()}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round(prediction.prediction.confidence * 100)}% confidence
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Target:</span>
                <span className="font-medium text-foreground">${prediction.prediction.targetPrice}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Timeframe:</span>
                <span className="font-medium text-foreground">{prediction.prediction.timeframe}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Volatility:</span>
                <span className="font-medium text-foreground capitalize">{prediction.riskMetrics.volatility}</span>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Key Signals:</p>
              <div className="space-y-1">
                {prediction.signals.slice(0, 2).map((signal, idx) => (
                  <div key={idx} className="text-xs">
                    <span className={`font-medium ${getDirectionColor(signal.signal === 'buy' ? 'bullish' : signal.signal === 'sell' ? 'bearish' : 'neutral')}`}>
                      {signal.indicator}:
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-1">
                      {signal.description.slice(0, 40)}...
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Analysis Modal/Section */}
      {analysis && selectedStock && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-foreground">
              Detailed Analysis: {selectedStock}
            </h3>
            <button
              onClick={() => setAnalysis(null)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Summary */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Market Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Overall Sentiment:</span>
                  <span className={`font-medium ${getDirectionColor(analysis.summary.overall)}`}>
                    {analysis.summary.overall.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Strength:</span>
                  <span className="font-medium text-foreground">
                    {Math.round(analysis.summary.strength * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Trend Direction:</span>
                  <span className="font-medium text-foreground capitalize">
                    {analysis.summary.trendDirection}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Momentum:</span>
                  <span className="font-medium text-foreground capitalize">
                    {analysis.summary.momentum}
                  </span>
                </div>
              </div>
            </div>

            {/* Technical Indicators */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Technical Indicators</h4>
              <div className="space-y-2 text-sm">
                {analysis.indicators.rsi && analysis.indicators.rsi.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">RSI:</span>
                    <span className="font-medium text-foreground">
                      {Math.round(analysis.indicators.rsi[analysis.indicators.rsi.length - 1].value)}
                    </span>
                  </div>
                )}
                {analysis.indicators.macd && analysis.indicators.macd.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">MACD:</span>
                    <span className="font-medium text-foreground">
                      {analysis.indicators.macd[analysis.indicators.macd.length - 1].macd.toFixed(2)}
                    </span>
                  </div>
                )}
                {analysis.indicators.bollingerBands && analysis.indicators.bollingerBands.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">BB %B:</span>
                    <span className="font-medium text-foreground">
                      {(analysis.indicators.bollingerBands[analysis.indicators.bollingerBands.length - 1].percentB * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* All Signals */}
          <div className="mt-6">
            <h4 className="font-semibold text-foreground mb-3">All Trading Signals</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {analysis.signals.map((signal, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                  <div>
                    <span className="font-medium text-foreground">{signal.indicator}</span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">
                      {signal.description}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`font-medium ${getDirectionColor(signal.signal === 'buy' ? 'bullish' : signal.signal === 'sell' ? 'bearish' : 'neutral')}`}>
                      {signal.signal.toUpperCase()}
                    </span>
                    <div className="text-xs text-gray-500">
                      {Math.round(signal.strength * 100)}% strength
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}