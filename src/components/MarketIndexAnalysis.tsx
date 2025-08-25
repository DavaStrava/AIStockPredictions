'use client';

import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, BarChart3, Clock, AlertCircle, Newspaper } from 'lucide-react';
import AdvancedStockChart from './AdvancedStockChart';
import { PriceData } from '@/lib/technical-analysis/types';

interface MarketIndexAnalysisProps {
  symbol: string;
  onClose: () => void;
}

interface IndexAnalysisData {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  technicalAnalysis: {
    rsi: number;
    macd: {
      macd: number;
      signal: number;
      histogram: number;
    };
    movingAverages: {
      sma20: number;
      sma50: number;
      sma200: number;
    };
    support: number;
    resistance: number;
    trend: 'bullish' | 'bearish' | 'neutral';
  };
  aiSummary: string;
  marketNews: Array<{
    title: string;
    summary: string;
    publishedAt: string;
    source: string;
    sentiment: 'positive' | 'negative' | 'neutral';
  }>;
  priceData: PriceData[];
}

export default function MarketIndexAnalysis({ symbol, onClose }: MarketIndexAnalysisProps) {
  const [data, setData] = useState<IndexAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchIndexAnalysis();
  }, [symbol]);

  const fetchIndexAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/market-index-analysis?symbol=${encodeURIComponent(symbol)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch index analysis');
      }
    } catch (error) {
      console.error('Failed to fetch index analysis:', error);
      setError(error instanceof Error ? error.message : 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${formatPrice(change)}`;
  };

  const formatChangePercent = (changePercent: number) => {
    const sign = changePercent >= 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(2)}%`;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'bullish': return 'text-green-600 dark:text-green-400';
      case 'bearish': return 'text-red-600 dark:text-red-400';
      case 'neutral': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'negative': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'neutral': return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {symbol} Analysis
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Error</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchIndexAnalysis}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.name} ({data.symbol})
            </h2>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatPrice(data.currentPrice)}
              </span>
              <div className={`flex items-center gap-1 ${getChangeColor(data.change)}`}>
                {data.change >= 0 ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )}
                <span className="font-semibold">
                  {formatChange(data.change)} ({formatChangePercent(data.changePercent)})
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-2">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Price Chart & Technical Analysis
              </h3>
              {data.priceData && data.priceData.length > 0 && (
                <AdvancedStockChart
                  priceData={data.priceData}
                  symbol={data.symbol}
                />
              )}
            </div>
          </div>

          {/* Technical Indicators */}
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Technical Indicators
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">RSI (14)</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {data.technicalAnalysis.rsi.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">MACD</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {data.technicalAnalysis.macd.macd.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">SMA 20</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatPrice(data.technicalAnalysis.movingAverages.sma20)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">SMA 50</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatPrice(data.technicalAnalysis.movingAverages.sma50)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">SMA 200</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatPrice(data.technicalAnalysis.movingAverages.sma200)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Support</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatPrice(data.technicalAnalysis.support)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Resistance</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatPrice(data.technicalAnalysis.resistance)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Trend</span>
                  <span className={`font-medium capitalize ${getTrendColor(data.technicalAnalysis.trend)}`}>
                    {data.technicalAnalysis.trend}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            AI Market Summary
          </h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {data.aiSummary}
          </p>
        </div>

        {/* Market News */}
        {data.marketNews && data.marketNews.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              Market News & Impact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.marketNews.map((news, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
                      {news.title}
                    </h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSentimentColor(news.sentiment)}`}>
                      {news.sentiment}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                    {news.summary}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{news.source}</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{news.publishedAt}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}