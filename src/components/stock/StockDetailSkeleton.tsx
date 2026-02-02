/**
 * StockDetailSkeleton Component
 *
 * Loading skeleton for the stock detail page.
 * Shows placeholder content while data is being fetched.
 */

'use client';

export function StockDetailSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-slate-700" />
          <div className="flex-1">
            <div className="h-8 w-32 bg-slate-700 rounded mb-2" />
            <div className="h-4 w-48 bg-slate-700 rounded" />
          </div>
        </div>
        <div className="flex items-baseline gap-4">
          <div className="h-10 w-36 bg-slate-700 rounded" />
          <div className="h-6 w-24 bg-slate-700 rounded" />
          <div className="h-6 w-20 bg-slate-700 rounded-full" />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            {/* Time Range Selector */}
            <div className="flex justify-between items-center mb-6">
              <div className="h-6 w-24 bg-slate-700 rounded" />
              <div className="flex gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-8 w-10 bg-slate-700 rounded-md" />
                ))}
              </div>
            </div>
            {/* Chart Area */}
            <div className="h-80 bg-slate-700 rounded-lg" />
          </div>
        </div>

        {/* Metrics Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <div className="h-6 w-32 bg-slate-700 rounded mb-6" />

            {/* 52-Week Range */}
            <div className="mb-6">
              <div className="h-4 w-28 bg-slate-700 rounded mb-2" />
              <div className="h-2 w-full bg-slate-700 rounded-full mb-2" />
              <div className="flex justify-between">
                <div className="h-4 w-16 bg-slate-700 rounded" />
                <div className="h-4 w-16 bg-slate-700 rounded" />
              </div>
            </div>

            {/* Day's Range */}
            <div className="mb-6">
              <div className="h-4 w-24 bg-slate-700 rounded mb-2" />
              <div className="h-2 w-full bg-slate-700 rounded-full mb-2" />
              <div className="flex justify-between">
                <div className="h-4 w-16 bg-slate-700 rounded" />
                <div className="h-4 w-16 bg-slate-700 rounded" />
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="h-4 w-24 bg-slate-700 rounded" />
                  <div className="h-4 w-20 bg-slate-700 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StockDetailSkeleton;
