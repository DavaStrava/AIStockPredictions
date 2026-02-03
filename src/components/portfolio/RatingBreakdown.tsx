'use client';

interface RatingBreakdownProps {
  breakdown: {
    bullish: { count: number; percent: number };
    neutral: { count: number; percent: number };
    bearish: { count: number; percent: number };
  };
  loading?: boolean;
}

export function RatingBreakdown({ breakdown, loading }: RatingBreakdownProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-slate-700/30 rounded-full animate-pulse" />
        <div className="flex gap-6">
          <div className="h-4 w-24 bg-slate-700/30 rounded animate-pulse" />
          <div className="h-4 w-24 bg-slate-700/30 rounded animate-pulse" />
          <div className="h-4 w-24 bg-slate-700/30 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const { bullish, neutral, bearish } = breakdown;
  const total = bullish.count + neutral.count + bearish.count;

  // Ensure at least 2% width for non-zero segments so they're visible
  const segments = [
    { key: 'bullish', color: 'bg-emerald-500', label: 'Bullish', ...bullish, dotColor: 'bg-emerald-400' },
    { key: 'neutral', color: 'bg-amber-500', label: 'Neutral', ...neutral, dotColor: 'bg-amber-400' },
    { key: 'bearish', color: 'bg-rose-500', label: 'Bearish', ...bearish, dotColor: 'bg-rose-400' },
  ].filter((s) => s.count > 0);

  return (
    <div className="space-y-4">
      {/* Stacked bar */}
      <div className="flex h-6 rounded-full overflow-hidden bg-slate-700/30">
        {segments.map((seg) => (
          <div
            key={seg.key}
            className={`${seg.color} transition-all duration-700 ease-out`}
            style={{ width: `${Math.max(seg.percent, total > 0 ? 2 : 0)}%` }}
          />
        ))}
        {total === 0 && (
          <div className="bg-slate-600 w-full" />
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {[
          { label: 'Bullish', dotColor: 'bg-emerald-400', ...bullish },
          { label: 'Neutral', dotColor: 'bg-amber-400', ...neutral },
          { label: 'Bearish', dotColor: 'bg-rose-400', ...bearish },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm">
            <span className={`w-2.5 h-2.5 rounded-full ${item.dotColor}`} />
            <span className="text-slate-300">
              {item.label}: {item.count} ({item.percent}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
