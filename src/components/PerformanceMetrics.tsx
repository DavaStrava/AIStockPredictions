'use client';

import { PriceData } from '@/lib/technical-analysis/types';

interface PerformanceMetricsProps {
  symbol: string;
  priceData: PriceData[];
}

interface PerformanceStats {
  currentPrice: number;
  dayChange: number;
  dayChangePercent: number;
  weekChange: number;
  weekChangePercent: number;
  monthChange: number;
  monthChangePercent: number;
  volatility: number;
  averageVolume: number;
  high52Week: number;
  low52Week: number;
  priceToHigh: number;
  priceToLow: number;
}

export default function PerformanceMetrics({ symbol, priceData }: PerformanceMetricsProps) {
  const calculateStats = (): PerformanceStats => {
    if (priceData.length === 0) {
      return {
        currentPrice: 0,
        dayChange: 0,
        dayChangePercent: 0,
        weekChange: 0,
        weekChangePercent: 0,
        monthChange: 0,
        monthChangePercent: 0,
        volatility: 0,
        averageVolume: 0,
        high52Week: 0,
        low52Week: 0,
        priceToHigh: 0,
        priceToLow: 0,
      };
    }

    const sortedData = [...priceData].sort((a, b) => a.date.getTime() - b.date.getTime());
    const currentPrice = sortedData[sortedData.length - 1].close;
    
    // Day change (last 2 days)
    const dayChange = sortedData.length > 1 
      ? currentPrice - sortedData[sortedData.length - 2].close
      : 0;
    const dayChangePercent = sortedData.length > 1 
      ? (dayChange / sortedData[sortedData.length - 2].close) * 100
      : 0;

    // Week change (last 7 days or available data)
    const weekIndex = Math.max(0, sortedData.length - 7);
    const weekPrice = sortedData[weekIndex].close;
    const weekChange = currentPrice - weekPrice;
    const weekChangePercent = (weekChange / weekPrice) * 100;

    // Month change (last 30 days or available data)
    const monthIndex = Math.max(0, sortedData.length - 30);
    const monthPrice = sortedData[monthIndex].close;
    const monthChange = currentPrice - monthPrice;
    const monthChangePercent = (monthChange / monthPrice) * 100;

    // Volatility (standard deviation of daily returns)
    const returns = [];
    for (let i = 1; i < sortedData.length; i++) {
      const dailyReturn = (sortedData[i].close - sortedData[i - 1].close) / sortedData[i - 1].close;
      returns.push(dailyReturn);
    }
    
    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized volatility

    // Average volume
    const averageVolume = sortedData.reduce((sum, d) => sum + d.volume, 0) / sortedData.length;

    // 52-week high/low (or available data range)
    const high52Week = Math.max(...sortedData.map(d => d.high));
    const low52Week = Math.min(...sortedData.map(d => d.low));
    
    const priceToHigh = ((currentPrice - high52Week) / high52Week) * 100;
    const priceToLow = ((currentPrice - low52Week) / low52Week) * 100;

    return {
      currentPrice,
      dayChange,
      dayChangePercent,
      weekChange,
      weekChangePercent,
      monthChange,
      monthChangePercent,
      volatility,
      averageVolume,
      high52Week,
      low52Week,
      priceToHigh,
      priceToLow,
    };
  };

  const stats = calculateStats();

  const formatPrice = (value: number) => `$${value.toFixed(2)}`;
  const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  const formatVolume = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return Math.round(value).toString();
  };

  const getChangeColor = (value: number) => {
    if (value > 0) return 'text-green-600 dark:text-green-400';
    if (value < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    changePercent, 
    subtitle 
  }: { 
    title: string; 
    value: string; 
    change?: number; 
    changePercent?: number; 
    subtitle?: string; 
  }) => (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</div>
      <div className="text-xl font-semibold text-foreground">{value}</div>
      {change !== undefined && changePercent !== undefined && (
        <div className={`text-sm ${getChangeColor(change)}`}>
          {formatPrice(change)} ({formatPercent(changePercent)})
        </div>
      )}
      {subtitle && (
        <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
      )}
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">
        {symbol} Performance Metrics
      </h3>

      {/* Current Price Section */}
      <div className="mb-6">
        <div className="flex items-baseline space-x-4">
          <span className="text-3xl font-bold text-foreground">
            {formatPrice(stats.currentPrice)}
          </span>
          <span className={`text-lg font-medium ${getChangeColor(stats.dayChange)}`}>
            {formatPrice(stats.dayChange)} ({formatPercent(stats.dayChangePercent)})
          </span>
          <span className="text-sm text-gray-500">Today</span>
        </div>
      </div>

      {/* Performance Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="1 Week"
          value={formatPrice(stats.currentPrice)}
          change={stats.weekChange}
          changePercent={stats.weekChangePercent}
        />
        <MetricCard
          title="1 Month"
          value={formatPrice(stats.currentPrice)}
          change={stats.monthChange}
          changePercent={stats.monthChangePercent}
        />
        <MetricCard
          title="Volatility"
          value={`${stats.volatility.toFixed(1)}%`}
          subtitle="Annualized"
        />
        <MetricCard
          title="Avg Volume"
          value={formatVolume(stats.averageVolume)}
          subtitle="Daily average"
        />
      </div>

      {/* Range Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Price Range</h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">52W High</span>
              <div className="text-right">
                <div className="font-medium text-foreground">{formatPrice(stats.high52Week)}</div>
                <div className={`text-xs ${getChangeColor(stats.priceToHigh)}`}>
                  {formatPercent(stats.priceToHigh)}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">52W Low</span>
              <div className="text-right">
                <div className="font-medium text-foreground">{formatPrice(stats.low52Week)}</div>
                <div className={`text-xs ${getChangeColor(stats.priceToLow)}`}>
                  {formatPercent(stats.priceToLow)}
                </div>
              </div>
            </div>
          </div>

          {/* Visual range indicator */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>52W Low</span>
              <span>Current</span>
              <span>52W High</span>
            </div>
            <div className="relative h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
              <div 
                className="absolute h-2 bg-blue-500 rounded-full"
                style={{
                  left: '0%',
                  width: `${((stats.currentPrice - stats.low52Week) / (stats.high52Week - stats.low52Week)) * 100}%`
                }}
              />
              <div 
                className="absolute w-2 h-2 bg-blue-700 rounded-full transform -translate-x-1"
                style={{
                  left: `${((stats.currentPrice - stats.low52Week) / (stats.high52Week - stats.low52Week)) * 100}%`
                }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Risk Metrics</h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Risk Level</span>
              <span className={`text-sm font-medium ${
                stats.volatility < 20 ? 'text-green-600 dark:text-green-400' :
                stats.volatility < 40 ? 'text-yellow-600 dark:text-yellow-400' :
                'text-red-600 dark:text-red-400'
              }`}>
                {stats.volatility < 20 ? 'Low' : stats.volatility < 40 ? 'Medium' : 'High'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Price Stability</span>
              <span className="text-sm font-medium text-foreground">
                {stats.volatility < 15 ? 'Very Stable' :
                 stats.volatility < 25 ? 'Stable' :
                 stats.volatility < 35 ? 'Moderate' : 'Volatile'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Trend Strength</span>
              <span className="text-sm font-medium text-foreground">
                {Math.abs(stats.monthChangePercent) > 10 ? 'Strong' :
                 Math.abs(stats.monthChangePercent) > 5 ? 'Moderate' : 'Weak'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}