'use client';

import { useState, useEffect, useCallback } from 'react';
import { LLMInsight, AIInsightsProps } from '@/types';

/** Tab type for insight navigation */
type InsightTabId = 'technical' | 'portfolio' | 'sentiment';

/** Tab definition with label, subtitle, and icon */
interface InsightTab {
  id: InsightTabId;
  label: string;
  subtitle: string;
  icon: string;
}

export default function AIInsights({ symbol }: AIInsightsProps) {
  const [insights, setInsights] = useState<{
    technical?: LLMInsight;
    portfolio?: LLMInsight;
    sentiment?: LLMInsight;
  }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<InsightTabId>('technical');

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/insights?symbol=${symbol}&types=technical,portfolio,sentiment`);
      const data = await response.json();

      if (data.success) {
        setInsights(data.data.insights);
      } else {
        setError(data.error || 'Failed to fetch AI insights');
      }
    } catch (err) {
      console.error('Failed to fetch insights:', err);
      setError('Failed to connect to AI analysis service');
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    if (symbol) {
      fetchInsights();
    }
  }, [symbol, fetchInsights]);

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'openai':
        return '🤖';
      case 'bedrock':
        return '☁️';
      case 'cached':
        return '💾';
      default:
        return '🔍';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getDataQualityBadge = (quality?: string) => {
    const colors = {
      high: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      medium: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      low: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
    };

    return colors[quality as keyof typeof colors] || colors.medium;
  };

  // Determine if user holds this stock for dynamic subtitle (explicit false for undefined)
  const isHeld = insights.portfolio?.metadata?.position_held ?? false;

  const tabs: InsightTab[] = [
    { id: 'technical', label: 'Technical Analysis', subtitle: 'Chart patterns & indicators', icon: '📊' },
    { id: 'portfolio', label: 'Portfolio Theory', subtitle: isHeld ? 'Based on your position' : 'Considering adding', icon: '📈' },
    { id: 'sentiment', label: 'Technical Psychology', subtitle: 'Derived from price & volume', icon: '🧠' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        <span className="text-gray-600 dark:text-gray-400">Generating AI insights for {symbol}...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-red-600 dark:text-red-400 mr-2">⚠️</div>
          <div>
            <h4 className="text-sm font-medium text-red-800 dark:text-red-200">AI Analysis Unavailable for {symbol}</h4>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            <button
              onClick={fetchInsights}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentInsight = insights[activeTab];
  const hasInsights = Object.keys(insights).length > 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h4 className="hierarchy-primary">
          Analysis for {symbol}
        </h4>
        <button
          onClick={fetchInsights}
          className="text-responsive-button text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
        >
          🔄 Refresh
        </button>
      </div>

      {hasInsights ? (
        <>
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-3 py-2 rounded-md transition-colors ${activeTab === tab.id
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                <div className="flex flex-col items-center">
                  <div className="flex items-center text-sm font-medium">
                    <span className="mr-1.5">{tab.icon}</span>
                    {tab.label}
                  </div>
                  <span className={`text-xs mt-0.5 ${activeTab === tab.id
                    ? 'text-blue-500 dark:text-blue-300'
                    : 'text-gray-500 dark:text-gray-400'
                    }`}>
                    {tab.subtitle}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Insight Content */}
          {currentInsight ? (
            <div className="space-y-4">
              {/* Insight Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <span className="text-responsive-price-sm">{getProviderIcon(currentInsight.provider)}</span>
                  <div>
                    <h4 className="hierarchy-secondary">
                      {tabs.find(t => t.id === activeTab)?.label} Analysis
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-responsive-label font-semibold ${getConfidenceColor(currentInsight.confidence)}`}>
                        {Math.round(currentInsight.confidence * 100)}% confidence
                      </span>
                      <span className={`px-2 py-1 text-responsive-badge rounded-full ${getDataQualityBadge(currentInsight.metadata.data_quality)}`}>
                        {currentInsight.metadata.data_quality || 'medium'} quality
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-responsive-caption text-gray-500">
                  {currentInsight.provider === 'openai' ? 'GPT-4' :
                    currentInsight.provider === 'bedrock' ? 'AWS Bedrock' : 'Cached'}
                </div>
              </div>

              {/* Insight Content */}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg padding-responsive-card">
                  <p className="text-responsive-body text-high-contrast reading-line-height whitespace-pre-wrap">
                    {currentInsight.content}
                  </p>
                </div>
              </div>

              {/* Metadata */}
              {currentInsight.metadata && (
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <h5 className="hierarchy-tertiary mb-2">Analysis Details</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-responsive-body-sm">
                    {currentInsight.metadata.timeframe && (
                      <div>
                        <span className="text-gray-500">Timeframe:</span>
                        <span className="ml-1 font-medium text-foreground">{currentInsight.metadata.timeframe}</span>
                      </div>
                    )}
                    {currentInsight.metadata.market_conditions && (
                      <div>
                        <span className="text-gray-500">Market:</span>
                        <span className="ml-1 font-medium text-foreground capitalize">{currentInsight.metadata.market_conditions}</span>
                      </div>
                    )}
                    {currentInsight.metadata.indicators_used && (
                      <div className="col-span-2">
                        <span className="text-gray-500">Indicators:</span>
                        <span className="ml-1 font-medium text-foreground">
                          {currentInsight.metadata.indicators_used.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <span className="text-4xl mb-2 block">🤔</span>
              <p>No {activeTab} insights available</p>
              <p className="text-sm mt-1">Try refreshing or check back later</p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <span className="text-4xl mb-2 block">🔍</span>
          <p>No AI insights available</p>
          <p className="text-sm mt-1">Click refresh to generate insights</p>
        </div>
      )}

      {/* AI Disclaimer */}
      <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start">
          <div className="text-blue-600 dark:text-blue-400 mr-2">ℹ️</div>
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <strong>AI Analysis Disclaimer:</strong> These insights are generated by AI and should be used for informational purposes only.
            Always conduct your own research and consider consulting with financial professionals before making investment decisions.
          </div>
        </div>
      </div>
    </div>
  );
}