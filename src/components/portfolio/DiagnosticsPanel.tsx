'use client';

import { HoldingHealthAnalysis, HealthRating } from '@/types/portfolio';

interface DiagnosticsPanelProps {
  holdings: HoldingHealthAnalysis[];
  loading?: boolean;
}

const RATING_BADGE: Record<HealthRating, { bg: string; text: string }> = {
  bullish: { bg: 'bg-emerald-600/20', text: 'text-emerald-400' },
  neutral: { bg: 'bg-amber-600/20', text: 'text-amber-400' },
  bearish: { bg: 'bg-rose-600/20', text: 'text-rose-400' },
};

const SIGNAL_PILL: Record<string, { bg: string; text: string }> = {
  buy: { bg: 'bg-emerald-600/20', text: 'text-emerald-400' },
  sell: { bg: 'bg-rose-600/20', text: 'text-rose-400' },
  hold: { bg: 'bg-slate-600/30', text: 'text-slate-400' },
};

export function DiagnosticsPanel({ holdings, loading }: DiagnosticsPanelProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl animate-pulse"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-6 bg-slate-700/30 rounded" />
              <div className="w-10 h-6 bg-slate-700/30 rounded-full" />
              <div className="w-16 h-5 bg-slate-700/30 rounded" />
            </div>
            <div className="h-4 w-3/4 bg-slate-700/30 rounded" />
          </div>
        ))}
      </div>
    );
  }

  // Sort worst first (lowest score)
  const sorted = [...holdings].sort((a, b) => a.score - b.score);

  if (sorted.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400">
        No holdings to analyze.
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
      {sorted.map((h) => {
        const badge = RATING_BADGE[h.rating];
        return (
          <div
            key={h.symbol}
            className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-slate-600/50 transition-colors"
          >
            {/* Header row */}
            <div className="flex items-center flex-wrap gap-2 mb-2">
              <span className="font-semibold text-slate-100">{h.symbol}</span>
              {h.companyName && (
                <span className="text-sm text-slate-500 truncate max-w-[140px]">
                  {h.companyName}
                </span>
              )}
              {/* Score badge */}
              <span
                className={`ml-auto px-2.5 py-0.5 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}
              >
                {Math.round(h.score)}
              </span>
              {/* Weight */}
              <span className="text-xs text-slate-500">
                {(h.portfolioWeight * 100).toFixed(1)}% weight
              </span>
            </div>

            {/* Signal pills */}
            {h.topSignals.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {h.topSignals.map((sig, idx) => {
                  const pill = SIGNAL_PILL[sig.signal] || SIGNAL_PILL.hold;
                  return (
                    <span
                      key={idx}
                      className={`px-2 py-0.5 rounded text-xs font-medium ${pill.bg} ${pill.text}`}
                    >
                      {sig.indicator}: {sig.signal.charAt(0).toUpperCase() + sig.signal.slice(1)}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Diagnostic message */}
            <p className="text-sm text-slate-400">{h.diagnosticMessage}</p>
          </div>
        );
      })}
    </div>
  );
}
