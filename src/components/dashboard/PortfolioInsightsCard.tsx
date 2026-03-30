'use client';

/**
 * PortfolioInsightsCard Component
 *
 * Displays AI-generated portfolio-level insights powered by gpt-4o.
 * Shows portfolio overview and market context analysis.
 * Collapsible sections with loading states and refresh capability.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  BarChart3,
  Globe,
  AlertCircle,
} from 'lucide-react';
import { PortfolioSummary, HoldingWithMarketData, SectorAllocation } from '@/types/portfolio';
import { MarketIndex } from '@/types';
import { LLMInsight } from '@/lib/ai/llm-providers';

interface PortfolioInsightsCardProps {
  portfolioId: string;
  summary: PortfolioSummary | null;
  holdings: HoldingWithMarketData[];
  allocation: SectorAllocation[];
  marketIndices?: MarketIndex[];
}

interface InsightsResponse {
  portfolioOverview: LLMInsight | null;
  marketContext: LLMInsight | null;
  generatedAt: string;
  cacheHit: boolean;
}

interface InsightSectionProps {
  title: string;
  icon: React.ReactNode;
  insight: LLMInsight | null;
  isExpanded: boolean;
  onToggle: () => void;
  loading: boolean;
}

function InsightSection({
  title,
  icon,
  insight,
  isExpanded,
  onToggle,
  loading,
}: InsightSectionProps) {
  return (
    <div className="border border-slate-700/50 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">{icon}</div>
          <span className="font-medium text-slate-200">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {insight && (
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                insight.provider === 'openai'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-slate-600/50 text-slate-400'
              }`}
            >
              {insight.provider === 'openai' ? 'AI' : 'Fallback'}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          {loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-full" />
              <div className="h-4 bg-slate-700 rounded w-5/6" />
              <div className="h-4 bg-slate-700 rounded w-4/6" />
              <div className="h-4 bg-slate-700 rounded w-full" />
              <div className="h-4 bg-slate-700 rounded w-3/4" />
            </div>
          ) : insight ? (
            <div className="prose prose-invert prose-sm max-w-none">
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {insight.content}
              </p>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-700/50">
                <span className="text-xs text-slate-500">
                  Generated {new Date(insight.generatedAt).toLocaleTimeString()}
                </span>
                {insight.metadata?.tokens_total && (
                  <span className="text-xs text-slate-500">
                    {insight.metadata.tokens_total} tokens
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Insight unavailable</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PortfolioInsightsCard({
  portfolioId,
  summary,
  holdings,
  allocation,
  marketIndices,
}: PortfolioInsightsCardProps) {
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'portfolio-overview': true,
    'market-context': false,
  });

  const fetchInsights = useCallback(async (forceRefresh = false) => {
    if (!portfolioId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/portfolios/${portfolioId}/insights`,
        {
          method: forceRefresh ? 'POST' : 'GET',
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch insights');
      }

      setInsights(data.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch insights';
      setError(message);
      console.error('Insights fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [portfolioId]);

  // Fetch insights when portfolio changes and has data
  // Using separate checks to avoid dependency on summary object reference
  const hasSummary = !!summary;
  const hasHoldings = holdings.length > 0;

  useEffect(() => {
    if (portfolioId && hasSummary && hasHoldings) {
      fetchInsights();
    }
  }, [portfolioId, hasSummary, hasHoldings, fetchInsights]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleRefresh = () => {
    fetchInsights(true);
  };

  // Don't show if no holdings
  if (!holdings.length && !loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold text-slate-100">AI Insights</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Sparkles className="w-10 h-10 text-slate-600 mb-3" />
          <p className="text-slate-400">Add holdings to get AI-powered insights</p>
          <p className="text-slate-500 text-sm mt-1">
            Portfolio analysis requires at least one position
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold text-slate-100">AI Insights</h3>
          {insights?.cacheHit && (
            <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded">
              Cached
            </span>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 text-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-slate-300">Refresh</span>
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-3 bg-rose-900/20 border border-rose-800/50 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span className="text-sm text-rose-400">{error}</span>
        </div>
      )}

      {/* Insight Sections */}
      <div className="space-y-3">
        <InsightSection
          title="Portfolio Overview"
          icon={<BarChart3 className="w-4 h-4 text-indigo-400" />}
          insight={insights?.portfolioOverview || null}
          isExpanded={expandedSections['portfolio-overview']}
          onToggle={() => toggleSection('portfolio-overview')}
          loading={loading}
        />

        <InsightSection
          title="Market Context"
          icon={<Globe className="w-4 h-4 text-cyan-400" />}
          insight={insights?.marketContext || null}
          isExpanded={expandedSections['market-context']}
          onToggle={() => toggleSection('market-context')}
          loading={loading}
        />
      </div>

      {/* Powered by indicator */}
      <div className="mt-4 pt-3 border-t border-slate-700/50 text-center">
        <span className="text-xs text-slate-500">
          Powered by GPT-4o • Updated every 15 minutes
        </span>
      </div>
    </div>
  );
}

export default PortfolioInsightsCard;
