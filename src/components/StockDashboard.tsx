'use client';

import { useState, useEffect } from 'react';
import { TechnicalAnalysisResult, TechnicalSignal, PriceData } from '@/lib/technical-analysis/types';
import SimpleStockChart from './SimpleStockChart';
import PerformanceMetrics from './PerformanceMetrics';
import StockSearch from './StockSearch';

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
  const [priceData, setPriceData] = useState<PriceData[]>([]);
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
      const response = await fetch(`/api/analysis?symbol=${symbol}&period=1year`);
      const data = await response.json();
      
      if (data.success) {
        setAnalysis(data.data);
        setSelectedStock(symbol);
        // Use real price data from FMP
        if (data.priceData && Array.isArray(data.priceData)) {
          const processedPriceData = data.priceData.map((item: any) => ({
            ...item,
            date: new Date(item.date),
          }));
          setPriceData(processedPriceData);
        }
      } else {
        console.error('Analysis failed:', data.error);
        // You could show a user-friendly error message here
      }
    } catch (error) {
      console.error('Failed to fetch analysis:', error);
      // You could show a user-friendly error message here
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
      {/* Header with smart search */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Stock Predictions</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              AI-powered technical analysis with real market data
            </p>
          </div>
          
          <div className="w-full sm:w-96">
            <StockSearch 
              onSelectStock={(symbol) => fetchDetailedAnalysis(symbol)}
              placeholder="Search any stock (e.g., Apple, TSLA, Microsoft...)"
            />
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Popular:</span>
          {['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'AMZN', 'META'].map((symbol) => (
            <button
              key={symbol}
              onClick={() => fetchDetailedAnalysis(symbol)}
              className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {symbol}
            </button>
          ))}
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

      {/* Detailed Analysis Section */}
      {analysis && selectedStock && priceData.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-foreground">
              Detailed Analysis: {selectedStock}
            </h3>
            <button
              onClick={() => {
                setAnalysis(null);
                setPriceData([]);
                setSelectedStock('');
              }}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-lg"
            >
              ✕
            </button>
          </div>

          {/* Performance Metrics */}
          <PerformanceMetrics symbol={selectedStock} priceData={priceData} />

          {/* Interactive Charts */}
          <SimpleStockChart symbol={selectedStock} priceData={priceData} analysis={analysis} />

          {/* Analysis Summary Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Market Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h4 className="font-semibold text-foreground mb-4">Market Summary</h4>
              <div className="space-y-3">
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
                  <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
                  <span className="font-medium text-foreground">
                    {Math.round(analysis.summary.confidence * 100)}%
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
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Volatility:</span>
                  <span className="font-medium text-foreground capitalize">
                    {analysis.summary.volatility}
                  </span>
                </div>
              </div>
            </div>

            {/* Technical Indicators */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h4 className="font-semibold text-foreground mb-4">Technical Indicators</h4>
              <div className="space-y-3">
                {analysis.indicators.rsi && analysis.indicators.rsi.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">RSI (14):</span>
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
                {analysis.indicators.sma && analysis.indicators.sma.length > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">SMA 20:</span>
                      <span className="font-medium text-foreground">
                        ${analysis.indicators.sma.find(s => s.period === 20)?.value.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">SMA 50:</span>
                      <span className="font-medium text-foreground">
                        ${analysis.indicators.sma.find(s => s.period === 50)?.value.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Trading Signals */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="font-semibold text-foreground mb-4">Trading Signals ({analysis.signals.length})</h4>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {analysis.signals.map((signal, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-foreground">{signal.indicator}</span>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        signal.signal === 'buy' 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : signal.signal === 'sell'
                          ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                          : 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
                      }`}>
                        {signal.signal.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {signal.description}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm font-medium text-foreground">
                      {Math.round(signal.strength * 100)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      strength
                    </div>
                  </div>
                </div>
              ))}
              {analysis.signals.length === 0 && (
                <p className="text-gray-500 text-center py-4">No trading signals generated</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}