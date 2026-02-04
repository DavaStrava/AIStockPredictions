'use client';

import { RefreshCw } from 'lucide-react';
import { PortfolioHealthResult } from '@/types/portfolio';
import { HealthScoreGauge } from './HealthScoreGauge';
import { RatingBreakdown } from './RatingBreakdown';
import { DiagnosticsPanel } from './DiagnosticsPanel';

interface HealthDashboardProps {
  health: PortfolioHealthResult | null;
  loading: boolean;
  onRefresh: () => void;
}

function formatTimestamp(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

export function HealthDashboard({ health, loading, onRefresh }: HealthDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Portfolio Health Score</h3>
          {health && (
            <p className="text-sm text-slate-500 mt-0.5">
              Analyzed {health.holdingsAnalyzed} holding{health.holdingsAnalyzed !== 1 ? 's' : ''}
              {health.holdingsSkipped > 0 && ` (${health.holdingsSkipped} skipped)`}
              {' · '}
              {formatTimestamp(health.analyzedAt)}
            </p>
          )}
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-800/50 border border-slate-700/50 rounded-lg hover:border-slate-600/50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-slate-300">Refresh</span>
        </button>
      </div>

      {/* Top row: Gauge + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Gauge */}
        <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 flex items-center justify-center">
          <HealthScoreGauge
            score={health?.overallScore ?? 50}
            rating={health?.overallRating ?? 'neutral'}
            loading={loading && !health}
          />
        </div>

        {/* Rating breakdown */}
        <div className="lg:col-span-3 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 flex flex-col justify-center">
          <h4 className="text-sm font-medium text-slate-400 mb-4">Rating Breakdown</h4>
          <RatingBreakdown
            breakdown={
              health?.ratingBreakdown ?? {
                bullish: { count: 0, percent: 0 },
                neutral: { count: 0, percent: 0 },
                bearish: { count: 0, percent: 0 },
              }
            }
            loading={loading && !health}
          />
        </div>
      </div>

      {/* Diagnostics */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <h4 className="text-sm font-medium text-slate-400 mb-4">Holding Diagnostics</h4>
        <DiagnosticsPanel
          holdings={health?.holdings ?? []}
          loading={loading && !health}
        />
      </div>
    </div>
  );
}
