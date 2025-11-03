'use client';

import React from 'react';
import { TrendingUp, AlertTriangle, Info, Lightbulb, Target, Clock } from 'lucide-react';
import { TechnicalAnalysisResult, PriceData } from '@/lib/technical-analysis/types';

interface MarketInsight {
  id: string;
  type: 'tip' | 'warning' | 'info' | 'opportunity';
  title: string;
  content: string;
  timestamp?: string;
}

interface AdditionalInsightsSidebarProps {
  symbol?: string;
  analysis?: TechnicalAnalysisResult | null;
  priceData?: PriceData[];
  className?: string;
}

/**
 * AdditionalInsightsSidebar provides supplementary information and insights
 * for large screens (xl:block). Contains market tips, educational content,
 * and contextual information to enhance the user experience.
 */
const AdditionalInsightsSidebar: React.FC<AdditionalInsightsSidebarProps> = ({
  symbol,
  analysis,
  priceData,
  className = ''
}) => {
  // Mock insights data - in a real implementation, this would come from props or API
  const insights: MarketInsight[] = [
    {
      id: '1',
      type: 'tip',
      title: 'Technical Analysis Tip',
      content: 'When RSI is above 70, consider waiting for a pullback before entering a position. Overbought conditions often lead to short-term corrections.',
      timestamp: '2 hours ago'
    },
    {
      id: '2',
      type: 'warning',
      title: 'Market Volatility Alert',
      content: 'Current VIX levels suggest increased market volatility. Consider reducing position sizes and implementing tighter stop-losses.',
      timestamp: '4 hours ago'
    },
    {
      id: '3',
      type: 'opportunity',
      title: 'Sector Rotation Signal',
      content: 'Technology stocks showing relative strength while utilities lag. This pattern often indicates risk-on sentiment returning to markets.',
      timestamp: '6 hours ago'
    },
    {
      id: '4',
      type: 'info',
      title: 'Economic Calendar',
      content: 'Federal Reserve meeting scheduled for next week. Monitor for potential interest rate guidance that could impact market direction.',
      timestamp: '1 day ago'
    }
  ];

  const getInsightIcon = (type: MarketInsight['type']) => {
    switch (type) {
      case 'tip':
        return <Lightbulb className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      case 'opportunity':
        return <Target className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getInsightColors = (type: MarketInsight['type']) => {
    switch (type) {
      case 'tip':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          icon: 'text-blue-600 dark:text-blue-400',
          title: 'text-blue-900 dark:text-blue-100'
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          border: 'border-amber-200 dark:border-amber-800',
          icon: 'text-amber-600 dark:text-amber-400',
          title: 'text-amber-900 dark:text-amber-100'
        };
      case 'info':
        return {
          bg: 'bg-gray-50 dark:bg-gray-900/20',
          border: 'border-gray-200 dark:border-gray-800',
          icon: 'text-gray-600 dark:text-gray-400',
          title: 'text-gray-900 dark:text-gray-100'
        };
      case 'opportunity':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          icon: 'text-green-600 dark:text-green-400',
          title: 'text-green-900 dark:text-green-100'
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-900/20',
          border: 'border-gray-200 dark:border-gray-800',
          icon: 'text-gray-600 dark:text-gray-400',
          title: 'text-gray-900 dark:text-gray-100'
        };
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Market Insights</h3>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {insights.map((insight) => {
          const colors = getInsightColors(insight.type);
          return (
            <div
              key={insight.id}
              className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 ${colors.icon}`}>
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium text-sm ${colors.title} mb-2`}>
                    {insight.title}
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {insight.content}
                  </p>
                  {insight.timestamp && (
                    <div className="flex items-center gap-1 mt-2">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {insight.timestamp}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Educational Section */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Quick Learning</h4>
        <div className="space-y-3">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <h5 className="font-medium text-sm text-indigo-900 dark:text-indigo-100 mb-1">
              What is RSI?
            </h5>
            <p className="text-xs text-indigo-700 dark:text-indigo-300">
              Relative Strength Index measures momentum. Values above 70 suggest overbought conditions.
            </p>
          </div>
          
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <h5 className="font-medium text-sm text-emerald-900 dark:text-emerald-100 mb-1">
              Support & Resistance
            </h5>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              Key price levels where stocks tend to bounce or break through. Watch for volume confirmation.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Insights updated throughout the trading day
        </p>
      </div>
    </div>
  );
};

export default AdditionalInsightsSidebar;