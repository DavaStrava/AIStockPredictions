'use client';

import { HealthRating } from '@/types/portfolio';

interface HealthScoreGaugeProps {
  score: number;
  rating: HealthRating;
  loading?: boolean;
}

const RATING_LABELS: Record<HealthRating, string> = {
  bullish: 'Bullish',
  neutral: 'Neutral',
  bearish: 'Bearish',
};

const RATING_COLORS: Record<HealthRating, string> = {
  bullish: 'text-emerald-400',
  neutral: 'text-amber-400',
  bearish: 'text-rose-400',
};

export function HealthScoreGauge({ score, rating, loading }: HealthScoreGaugeProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-48 h-28 bg-slate-700/30 rounded-full animate-pulse" />
        <div className="mt-4 w-16 h-8 bg-slate-700/30 rounded animate-pulse" />
        <div className="mt-2 w-20 h-5 bg-slate-700/30 rounded animate-pulse" />
      </div>
    );
  }

  // Gauge geometry: semi-circle from 180° (left) to 0° (right)
  const cx = 100;
  const cy = 100;
  const r = 80;
  const needleLength = 65;

  // Needle rotation: score 0 → 0° (pointing left), score 100 → 180° (pointing right)
  const needleRotation = (score / 100) * 180;

  // Arc helper
  function describeArc(startDeg: number, endDeg: number): string {
    const startRad = (startDeg * Math.PI) / 180;
    const endRad = (endDeg * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy - r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy - r * Math.sin(endRad);
    const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
    const sweep = endDeg < startDeg ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} ${sweep} ${x2} ${y2}`;
  }

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 120" className="w-56 h-32">
        {/* Red zone: 0-33 (180° to 120°) */}
        <path
          d={describeArc(180, 120)}
          fill="none"
          stroke="#f87171"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.3"
        />
        {/* Amber zone: 34-66 (120° to 60°) */}
        <path
          d={describeArc(120, 60)}
          fill="none"
          stroke="#fbbf24"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.3"
        />
        {/* Green zone: 67-100 (60° to 0°) */}
        <path
          d={describeArc(60, 0)}
          fill="none"
          stroke="#34d399"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.3"
        />

        {/* Needle — uses CSS transform rotate for smooth animation */}
        <g
          style={{
            transform: `rotate(${needleRotation}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
            transition: 'transform 0.8s ease-out',
          }}
        >
          <line
            x1={cx}
            y1={cy}
            x2={cx - needleLength}
            y2={cy}
            stroke="#e2e8f0"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
        {/* Needle pivot */}
        <circle cx={cx} cy={cy} r="5" fill="#e2e8f0" />
      </svg>

      {/* Score number */}
      <p className="text-4xl font-bold text-slate-100 -mt-2">
        {Math.round(score)}
      </p>
      {/* Rating label */}
      <p className={`text-sm font-medium mt-1 ${RATING_COLORS[rating]}`}>
        {RATING_LABELS[rating]}
      </p>
    </div>
  );
}
