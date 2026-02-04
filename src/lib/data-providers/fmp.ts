/**
 * Financial Modeling Prep (FMP) Data Provider
 *
 * Provides real-time and historical stock market data from the FMP API.
 */

import { PriceData } from '@/lib/technical-analysis/types';

/** Historical price data from FMP API */
interface FMPHistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose: number;
  volume: number;
  unadjustedVolume: number;
  change: number;
  changePercent: number;
  vwap: number;
  label: string;
  changeOverTime: number;
}

/** Real-time quote data from FMP API */
interface FMPQuote {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50: number;
  priceAvg200: number;
  exchange: string;
  volume: number;
  avgVolume: number;
  open: number;
  previousClose: number;
  eps: number;
  pe: number;
  earningsAnnouncement: string;
  sharesOutstanding: number;
  timestamp: number;
}

/**
 * FMP Data Provider for fetching stock market data.
 */
export class FMPDataProvider {
  private apiKey: string;
  private baseUrl = 'https://financialmodelingprep.com/api/v3';

  /**
   * @param apiKey - Optional API key, falls back to FMP_API_KEY env variable
   */
  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.FMP_API_KEY || '';

    if (!this.apiKey) {
      console.warn('FMP API key not provided. Using demo key with limited requests.');
      this.apiKey = 'demo';
    }
  }

  /**
   * Fetch historical price data for technical analysis.
   * @param symbol - Stock ticker symbol (e.g., 'AAPL')
   * @param period - Time period for data
   * @returns Array of standardized price data sorted chronologically
   */
  async getHistoricalData(
    symbol: string,
    period: '1day' | '5day' | '1month' | '3month' | '6month' | '1year' | '5year' = '1year'
  ): Promise<PriceData[]> {
    try {
      const url = `${this.baseUrl}/historical-price-full/${symbol}?apikey=${this.apiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`FMP API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.Error) {
        throw new Error(`FMP API error: ${data.Error}`);
      }

      if (!data.historical || !Array.isArray(data.historical)) {
        throw new Error('Invalid response format from FMP API');
      }

      // Transform FMP data to internal PriceData format with proportional price adjustment
      const priceData: PriceData[] = data.historical
        .map((item: FMPHistoricalData) => ({
          date: new Date(item.date),
          // Proportionally adjust OHLC prices for splits/dividends
          open: item.close !== 0 ? (item.open * item.adjClose) / item.close : item.open,
          high: item.close !== 0 ? (item.high * item.adjClose) / item.close : item.high,
          low: item.close !== 0 ? (item.low * item.adjClose) / item.close : item.low,
          close: item.adjClose,
          volume: item.volume,
        }))
        .sort((a: PriceData, b: PriceData) => a.date.getTime() - b.date.getTime());

      const filteredData = this.filterByPeriod(priceData, period);

      if (process.env.NODE_ENV === 'development' && filteredData.length > 0) {
        const latestData = filteredData[filteredData.length - 1];
        console.log(
          `[FMP] ${symbol} latest price: ${latestData.close.toFixed(2)} on ${latestData.date.toLocaleDateString()}`
        );
      }

      return filteredData;
    } catch (error) {
      console.error(`Failed to fetch historical data for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get real-time quote for a single stock.
   * @param symbol - Stock ticker symbol
   * @returns Current market quote data
   */
  async getQuote(symbol: string): Promise<FMPQuote> {
    try {
      const url = `${this.baseUrl}/quote/${symbol}?apikey=${this.apiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`FMP API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.Error) {
        throw new Error(`FMP API error: ${data.Error}`);
      }

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No quote data found');
      }

      return data[0];
    } catch (error) {
      console.error(`Failed to fetch quote for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get quotes for multiple symbols in a single batch request.
   * @param symbols - Array of stock ticker symbols
   * @returns Array of quote data for all symbols
   */
  async getMultipleQuotes(symbols: string[]): Promise<FMPQuote[]> {
    try {
      const symbolsString = symbols.join(',');
      const url = `${this.baseUrl}/quote/${symbolsString}?apikey=${this.apiKey}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`FMP API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.Error) {
        throw new Error(`FMP API error: ${data.Error}`);
      }

      if (!Array.isArray(data)) {
        throw new Error('Invalid response format from FMP API');
      }

      return data;
    } catch (error) {
      console.error(`Failed to fetch quotes for symbols: ${symbols.join(', ')}:`, error);
      throw error;
    }
  }

  /**
   * Search for stocks by company name or symbol.
   * @param query - Search term (company name, symbol, or partial match)
   * @param limit - Maximum number of results (default: 10)
   * @returns Array of matching stock information
   */
  async searchStocks(
    query: string,
    limit: number = 10
  ): Promise<
    Array<{
      symbol: string;
      name: string;
      currency: string;
      stockExchange: string;
      exchangeShortName: string;
    }>
  > {
    try {
      const url = `${this.baseUrl}/search?query=${encodeURIComponent(query)}&limit=${limit}&apikey=${this.apiKey}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`FMP API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.Error) {
        throw new Error(`FMP API error: ${data.Error}`);
      }

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(`Failed to search stocks with query: ${query}:`, error);
      throw error;
    }
  }

  /**
   * Get comprehensive company profile information.
   * @param symbol - Stock ticker symbol
   * @returns Company profile with fundamental data
   */
  async getCompanyProfile(symbol: string): Promise<{
    symbol: string;
    companyName: string;
    currency: string;
    cik: string;
    isin: string;
    cusip: string;
    exchange: string;
    exchangeShortName: string;
    industry: string;
    sector: string;
    website: string;
    description: string;
    ceo: string;
    fullTimeEmployees: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    dcfDiff: number;
    dcf: number;
    image: string;
    ipoDate: string;
    defaultImage: boolean;
    isEtf: boolean;
    isActivelyTrading: boolean;
    isAdr: boolean;
    isFund: boolean;
  }> {
    try {
      const url = `${this.baseUrl}/profile/${symbol}?apikey=${this.apiKey}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`FMP API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.Error) {
        throw new Error(`FMP API error: ${data.Error}`);
      }

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No company profile found');
      }

      return data[0];
    } catch (error) {
      console.error(`Failed to fetch company profile for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get trailing twelve months key metrics for a single stock.
   * @param symbol - Stock ticker symbol
   * @returns Key financial metrics including dividend yield
   */
  async getKeyMetricsTTM(symbol: string): Promise<FMPKeyMetrics> {
    try {
      const url = `${this.baseUrl}/key-metrics-ttm/${symbol}?apikey=${this.apiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`FMP API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.Error) {
        throw new Error(`FMP API error: ${data.Error}`);
      }

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No key metrics data found');
      }

      const metrics = data[0];
      return {
        dividendYieldTTM: typeof metrics.dividendYieldTTM === 'number' ? metrics.dividendYieldTTM : 0,
        dividendPerShareTTM: typeof metrics.dividendPerShareTTM === 'number' ? metrics.dividendPerShareTTM : 0,
        payoutRatioTTM: typeof metrics.payoutRatioTTM === 'number' ? metrics.payoutRatioTTM : 0,
      };
    } catch (error) {
      console.error(`Failed to fetch key metrics for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get key metrics for multiple symbols using parallel individual calls.
   * FMP doesn't support batch for this endpoint.
   * @param symbols - Array of stock ticker symbols
   * @returns Map of symbol to key metrics (failed symbols omitted)
   */
  async getMultipleKeyMetricsTTM(symbols: string[]): Promise<Map<string, FMPKeyMetrics>> {
    const results = await Promise.allSettled(
      symbols.map(async (symbol) => ({
        symbol,
        metrics: await this.getKeyMetricsTTM(symbol),
      }))
    );

    const metricsMap = new Map<string, FMPKeyMetrics>();
    let failedCount = 0;
    for (const result of results) {
      if (result.status === 'fulfilled') {
        metricsMap.set(result.value.symbol, result.value.metrics);
      } else {
        failedCount++;
      }
    }

    if (failedCount > 0) {
      console.warn(`Key metrics failed for ${failedCount}/${symbols.length} symbols`);
    }

    return metricsMap;
  }

  /** Filter price data by time period */
  private filterByPeriod(data: PriceData[], period: string): PriceData[] {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '1day':
        startDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
        break;
      case '5day':
        startDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
        break;
      case '1month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3month':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '6month':
        startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case '1year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case '5year':
        startDate = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return data;
    }

    return data.filter((item) => item.date >= startDate);
  }

  /**
   * Validate API key by making a test request.
   * @returns true if API key is valid, false otherwise
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.getQuote('AAPL');
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
let fmpInstance: FMPDataProvider | null = null;

/**
 * Get the singleton FMPDataProvider instance.
 * @returns The shared FMPDataProvider instance
 */
export function getFMPProvider(): FMPDataProvider {
  if (!fmpInstance) {
    fmpInstance = new FMPDataProvider();
  }
  return fmpInstance;
}

/** Key financial metrics (trailing twelve months) from FMP API */
export interface FMPKeyMetrics {
  dividendYieldTTM: number;
  dividendPerShareTTM: number;
  payoutRatioTTM: number;
}

export type { FMPQuote };
