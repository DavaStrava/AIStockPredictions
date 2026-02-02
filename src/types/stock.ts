/**
 * Stock Detail Types
 *
 * Types for the individual stock detail page, including quotes,
 * historical data, and market status information.
 */

/**
 * Time range options for stock price charts.
 */
export type StockDetailTimeRange = '1D' | '5D' | '1M' | '6M' | 'YTD' | '1Y' | '5Y' | 'MAX';

/**
 * Market trading status.
 */
export type MarketStatus = 'open' | 'closed' | 'pre-market' | 'after-hours';

/**
 * Real-time stock quote data.
 */
export interface StockQuote {
  symbol: string;
  companyName: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  yearHigh: number;
  yearLow: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  pe: number | null;
  eps: number | null;
  dividendYield?: number;
  exchange: string;
}

/**
 * Historical price point for charting.
 */
export interface StockPricePoint {
  date: string;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

/**
 * API response structure for stock detail endpoint.
 */
export interface StockDetailApiResponse {
  success: boolean;
  data?: {
    quote: StockQuote;
    priceHistory: StockPricePoint[];
    marketStatus: MarketStatus;
  };
  error?: string;
}

/**
 * Props for StockDetailPage component.
 */
export interface StockDetailPageProps {
  symbol: string;
}

/**
 * Props for StockHeader component.
 */
export interface StockHeaderProps {
  symbol: string;
  companyName: string;
  price: number;
  change: number;
  changePercent: number;
  marketStatus: MarketStatus;
}

/**
 * Props for StockChart component.
 */
export interface StockChartProps {
  priceHistory: StockPricePoint[];
  selectedRange: StockDetailTimeRange;
  onRangeChange: (range: StockDetailTimeRange) => void;
  loading?: boolean;
}

/**
 * Props for StockMetricsSidebar component.
 */
export interface StockMetricsSidebarProps {
  quote: StockQuote;
}

/**
 * Hook return type for useStockData.
 */
export interface UseStockDataReturn {
  quote: StockQuote | null;
  priceHistory: StockPricePoint[];
  marketStatus: MarketStatus;
  loading: boolean;
  error: string | null;
  selectedRange: StockDetailTimeRange;
  setSelectedRange: (range: StockDetailTimeRange) => void;
}

/**
 * Time range configuration for chart selectors.
 */
export interface TimeRangeConfig {
  value: StockDetailTimeRange;
  label: string;
  apiPeriod: '1day' | '5day' | '1month' | '6month' | '1year' | '5year' | null;
}
