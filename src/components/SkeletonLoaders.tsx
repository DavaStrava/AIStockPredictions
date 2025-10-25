/**
 * SkeletonLoaders Component Library
 * 
 * Provides skeleton loading states for responsive components to prevent
 * Cumulative Layout Shift (CLS) during content loading.
 * 
 * Key Performance Benefits:
 * - Prevents layout shift by reserving space before content loads
 * - Provides visual feedback during loading states
 * - Maintains consistent dimensions across breakpoints
 * - Improves perceived performance with smooth animations
 */

/**
 * Base skeleton element with pulse animation
 */
const SkeletonElement = ({ 
  className = '', 
  'data-testid': testId 
}: { 
  className?: string; 
  'data-testid'?: string;
}) => (
  <div 
    className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`}
    data-testid={testId}
  />
);

/**
 * Stock Card Skeleton
 * Matches the dimensions and layout of actual stock prediction cards
 */
export const StockCardSkeleton = () => {
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 md:p-6 space-y-4"
      data-testid="stock-card-skeleton"
      style={{ minHeight: '320px' }} // Prevent layout shift
    >
      {/* Header section */}
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <SkeletonElement className="h-6 w-20" data-testid="skeleton-symbol" />
          <SkeletonElement className="h-8 w-32" data-testid="skeleton-price" />
        </div>
        <SkeletonElement className="h-10 w-24 rounded-full" data-testid="skeleton-badge" />
      </div>

      {/* Prediction section */}
      <div className="space-y-2">
        <SkeletonElement className="h-4 w-full" />
        <SkeletonElement className="h-4 w-5/6" />
        <SkeletonElement className="h-4 w-4/5" />
      </div>

      {/* Metrics section */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <SkeletonElement className="h-3 w-16" />
          <SkeletonElement className="h-5 w-20" />
        </div>
        <div className="space-y-2">
          <SkeletonElement className="h-3 w-16" />
          <SkeletonElement className="h-5 w-20" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-2">
        <SkeletonElement className="h-10 flex-1" />
        <SkeletonElement className="h-10 w-10" />
      </div>
    </div>
  );
};

/**
 * Responsive Grid Skeleton
 * Shows multiple stock card skeletons in responsive grid layout
 */
export const ResponsiveGridSkeleton = ({ count = 3 }: { count?: number }) => {
  return (
    <div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-5 lg:gap-6"
      data-testid="responsive-grid-skeleton"
    >
      {Array.from({ length: count }).map((_, index) => (
        <StockCardSkeleton key={index} />
      ))}
    </div>
  );
};

/**
 * Chart Skeleton
 * Matches the dimensions of stock charts
 */
export const ChartSkeleton = ({ height = '400px' }: { height?: string }) => {
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 md:p-6"
      data-testid="chart-skeleton"
      style={{ height }}
    >
      <div className="space-y-4 h-full">
        {/* Chart title */}
        <div className="flex items-center justify-between">
          <SkeletonElement className="h-6 w-48" />
          <SkeletonElement className="h-8 w-32" />
        </div>

        {/* Chart area */}
        <div className="flex-1 flex items-end gap-2" style={{ height: 'calc(100% - 60px)' }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonElement 
              key={i} 
              className="flex-1"
              style={{ 
                height: `${Math.random() * 60 + 40}%`,
                minWidth: '20px'
              }}
            />
          ))}
        </div>

        {/* Chart legend */}
        <div className="flex gap-4">
          <SkeletonElement className="h-4 w-24" />
          <SkeletonElement className="h-4 w-24" />
          <SkeletonElement className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
};

/**
 * Market Index Card Skeleton
 * Matches the dimensions of market index cards
 */
export const MarketIndexCardSkeleton = () => {
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 space-y-3"
      data-testid="market-index-skeleton"
      style={{ minHeight: '120px' }}
    >
      <div className="flex items-center justify-between">
        <SkeletonElement className="h-5 w-16" />
        <SkeletonElement className="h-6 w-20 rounded-full" />
      </div>
      <SkeletonElement className="h-8 w-32" />
      <div className="flex gap-2">
        <SkeletonElement className="h-4 w-16" />
        <SkeletonElement className="h-4 w-20" />
      </div>
    </div>
  );
};

/**
 * Sidebar Skeleton
 * Matches the dimensions of sidebar components
 */
export const SidebarSkeleton = ({ itemCount = 4 }: { itemCount?: number }) => {
  return (
    <div 
      className="space-y-4"
      data-testid="sidebar-skeleton"
    >
      <SkeletonElement className="h-7 w-48 mb-6" />
      {Array.from({ length: itemCount }).map((_, index) => (
        <MarketIndexCardSkeleton key={index} />
      ))}
    </div>
  );
};

/**
 * AI Insights Skeleton
 * Matches the dimensions of AI insights component
 */
export const AIInsightsSkeleton = () => {
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 md:p-6 space-y-4"
      data-testid="ai-insights-skeleton"
      style={{ minHeight: '300px' }}
    >
      <div className="flex items-center gap-3">
        <SkeletonElement className="h-8 w-8 rounded-full" />
        <SkeletonElement className="h-6 w-40" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <SkeletonElement className="h-4 w-full" />
            <SkeletonElement className="h-4 w-11/12" />
            <SkeletonElement className="h-4 w-10/12" />
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <SkeletonElement className="h-10 w-full" />
      </div>
    </div>
  );
};

/**
 * Performance Metrics Skeleton
 * Matches the dimensions of performance metrics component
 */
export const PerformanceMetricsSkeleton = () => {
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 md:p-6"
      data-testid="performance-metrics-skeleton"
      style={{ minHeight: '200px' }}
    >
      <SkeletonElement className="h-6 w-48 mb-6" />
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <SkeletonElement className="h-4 w-20" />
            <SkeletonElement className="h-8 w-24" />
            <SkeletonElement className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Technical Indicator Explanations Skeleton
 * Matches the dimensions of technical indicator explanations
 */
export const TechnicalIndicatorsSkeleton = ({ count = 3 }: { count?: number }) => {
  return (
    <div 
      className="space-responsive-card"
      data-testid="technical-indicators-skeleton"
    >
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <SkeletonElement className="h-7 w-48" />
        <SkeletonElement className="h-6 w-20 rounded-full" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-5">
        {Array.from({ length: count }).map((_, i) => (
          <div 
            key={i}
            className="padding-responsive-card border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
            style={{ minHeight: '180px' }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <SkeletonElement className="h-5 w-24" />
                <SkeletonElement className="h-6 w-16 rounded-full" />
              </div>
              <SkeletonElement className="h-4 w-20" />
              <div className="space-y-2">
                <SkeletonElement className="h-3 w-full" />
                <SkeletonElement className="h-3 w-11/12" />
                <SkeletonElement className="h-3 w-10/12" />
              </div>
              <SkeletonElement className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Collapsible Section Skeleton
 * Matches the dimensions of collapsible sections
 */
export const CollapsibleSectionSkeleton = ({ expanded = false }: { expanded?: boolean }) => {
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
      data-testid="collapsible-section-skeleton"
    >
      <div className="padding-responsive-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SkeletonElement className="h-6 w-6 rounded" />
          <SkeletonElement className="h-5 w-40" />
        </div>
        <SkeletonElement className="h-5 w-5 rounded" />
      </div>
      
      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 padding-responsive-card">
          <div className="space-y-3">
            <SkeletonElement className="h-4 w-full" />
            <SkeletonElement className="h-4 w-11/12" />
            <SkeletonElement className="h-4 w-10/12" />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Search Bar Skeleton
 * Matches the dimensions of search components
 */
export const SearchBarSkeleton = () => {
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 md:p-6"
      data-testid="search-bar-skeleton"
    >
      <div className="flex gap-3">
        <SkeletonElement className="h-12 flex-1" />
        <SkeletonElement className="h-12 w-32" />
      </div>
    </div>
  );
};

/**
 * Full Dashboard Skeleton
 * Complete skeleton for the entire dashboard layout
 */
export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6" data-testid="dashboard-skeleton">
      <SearchBarSkeleton />
      <ResponsiveGridSkeleton count={4} />
      <ChartSkeleton />
      <PerformanceMetricsSkeleton />
    </div>
  );
};
