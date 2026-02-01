/**
 * Typed API Client
 *
 * Centralizes all API calls with full TypeScript type safety.
 * Provides consistent error handling, request/response typing,
 * and automatic date parsing.
 *
 * Usage:
 * ```typescript
 * import { api } from '@/lib/api/client';
 *
 * // Fetch trades
 * const trades = await api.trades.list({ status: 'OPEN' });
 *
 * // Create a trade
 * const trade = await api.trades.create({ symbol: 'AAPL', ... });
 *
 * // Get predictions
 * const predictions = await api.predictions.list('AAPL,GOOGL');
 * ```
 */

import type {
  JournalTrade,
  TradeWithPnL,
  PortfolioStats,
  TradeFilters,
  TradeSide,
  Watchlist,
} from '@/types/models';
import type { PredictionResult } from '@/types/predictions';
import type { TechnicalAnalysisResult, PriceData } from '@/lib/technical-analysis/types';

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  details?: string;
  metadata?: Record<string, unknown>;
}

/**
 * API error response
 */
export interface ApiError {
  success: false;
  error: string;
  details?: string;
  field?: string;
}

/**
 * Custom error class for API errors
 */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: string,
    public field?: string
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

// ============================================================================
// Request Types
// ============================================================================

export interface CreateTradeRequest {
  symbol: string;
  side: TradeSide;
  entryPrice: number;
  quantity: number;
  fees?: number;
  notes?: string;
  predictionId?: string;
}

export interface CloseTradeRequest {
  exitPrice: number;
}

export interface UpdateTradeRequest {
  exitPrice?: number;
  fees?: number;
  notes?: string;
}

export interface CreateWatchlistRequest {
  name: string;
  description?: string;
}

export interface UpdateWatchlistRequest {
  name?: string;
  description?: string;
}

export interface AnalysisPostRequest {
  symbol: string;
  priceData: Array<{
    date: string | Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  config?: Record<string, unknown>;
}

// ============================================================================
// Response Types
// ============================================================================

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  type: string;
}

export interface AnalysisResponse {
  data: TechnicalAnalysisResult;
  priceData: PriceData[];
  metadata: {
    symbol: string;
    period: string;
    dataPoints: number;
    timestamp: string;
  };
}

export interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

// ============================================================================
// API Client Implementation
// ============================================================================

/**
 * Configuration for the API client
 */
interface ApiClientConfig {
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
}

/**
 * Options for individual requests
 */
interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/**
 * Typed API Client class
 */
class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.defaultHeaders,
    };
  }

  /**
   * Makes a typed request to the API
   */
  private async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
      body?: unknown;
      params?: Record<string, string | number | boolean | undefined>;
    } & RequestOptions = {}
  ): Promise<T> {
    const { method = 'GET', body, params, headers, signal } = options;

    // Build URL with query parameters
    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      }
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    // Make request
    const response = await fetch(url, {
      method,
      headers: {
        ...this.defaultHeaders,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });

    // Parse response
    const data = await response.json();

    // Handle errors
    if (!response.ok || !data.success) {
      throw new ApiClientError(
        data.error || `Request failed with status ${response.status}`,
        response.status,
        data.details,
        data.field
      );
    }

    return data.data;
  }

  // ==========================================================================
  // Trades API
  // ==========================================================================

  trades = {
    /**
     * List all trades with optional filters
     */
    list: async (
      filters?: TradeFilters,
      options?: RequestOptions
    ): Promise<TradeWithPnL[]> => {
      const params: Record<string, string | undefined> = {};
      if (filters?.status) params.status = filters.status;
      if (filters?.symbol) params.symbol = filters.symbol;
      if (filters?.startDate) params.startDate = filters.startDate.toISOString();
      if (filters?.endDate) params.endDate = filters.endDate.toISOString();

      const trades = await this.request<TradeWithPnL[]>('/trades', {
        params,
        ...options,
      });

      // Convert date strings to Date objects
      return trades.map((trade) => this.parseTradeDates(trade));
    },

    /**
     * Get a single trade by ID
     */
    get: async (id: string, options?: RequestOptions): Promise<TradeWithPnL> => {
      const trade = await this.request<TradeWithPnL>(`/trades/${id}`, options);
      return this.parseTradeDates(trade);
    },

    /**
     * Create a new trade
     */
    create: async (
      data: CreateTradeRequest,
      options?: RequestOptions
    ): Promise<JournalTrade> => {
      const trade = await this.request<JournalTrade>('/trades', {
        method: 'POST',
        body: data,
        ...options,
      });
      return this.parseTradeDates(trade);
    },

    /**
     * Close a trade by setting exit price
     */
    close: async (
      id: string,
      exitPrice: number,
      options?: RequestOptions
    ): Promise<JournalTrade> => {
      const trade = await this.request<JournalTrade>(`/trades/${id}`, {
        method: 'PATCH',
        body: { exitPrice },
        ...options,
      });
      return this.parseTradeDates(trade);
    },

    /**
     * Update a trade
     */
    update: async (
      id: string,
      data: UpdateTradeRequest,
      options?: RequestOptions
    ): Promise<JournalTrade> => {
      const trade = await this.request<JournalTrade>(`/trades/${id}`, {
        method: 'PATCH',
        body: data,
        ...options,
      });
      return this.parseTradeDates(trade);
    },

    /**
     * Delete a trade
     */
    delete: async (id: string, options?: RequestOptions): Promise<void> => {
      await this.request<void>(`/trades/${id}`, {
        method: 'DELETE',
        ...options,
      });
    },

    /**
     * Get portfolio statistics
     */
    stats: async (options?: RequestOptions): Promise<PortfolioStats> => {
      return this.request<PortfolioStats>('/trades/stats', options);
    },
  };

  // ==========================================================================
  // Predictions API
  // ==========================================================================

  predictions = {
    /**
     * Get predictions for stocks
     * @param symbols - Optional comma-separated stock symbols
     */
    list: async (
      symbols?: string,
      options?: RequestOptions
    ): Promise<PredictionResult[]> => {
      return this.request<PredictionResult[]>('/predictions', {
        params: { symbols },
        ...options,
      });
    },
  };

  // ==========================================================================
  // Analysis API
  // ==========================================================================

  analysis = {
    /**
     * Get technical analysis for a stock
     */
    get: async (
      symbol: string,
      timeframe: '1d' | '5d' | '1m' | '3m' | '6m' | '1y' | '5y' = '1y',
      options?: RequestOptions
    ): Promise<AnalysisResponse> => {
      const response = await fetch(
        `${this.baseUrl}/analysis?symbol=${symbol}&period=${timeframe}`,
        {
          headers: this.defaultHeaders,
          signal: options?.signal,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new ApiClientError(
          data.error || 'Analysis request failed',
          response.status,
          data.details
        );
      }

      // Parse price data dates
      const priceData = (data.priceData || []).map((item: PriceData) => ({
        ...item,
        date: new Date(item.date),
      }));

      return {
        data: data.data,
        priceData,
        metadata: data.metadata,
      };
    },

    /**
     * Submit custom price data for analysis
     */
    submit: async (
      data: AnalysisPostRequest,
      options?: RequestOptions
    ): Promise<TechnicalAnalysisResult> => {
      return this.request<TechnicalAnalysisResult>('/analysis', {
        method: 'POST',
        body: data,
        ...options,
      });
    },
  };

  // ==========================================================================
  // Search API
  // ==========================================================================

  search = {
    /**
     * Search for stocks by symbol or company name
     */
    stocks: async (
      query: string,
      limit: number = 10,
      options?: RequestOptions
    ): Promise<SearchResult[]> => {
      return this.request<SearchResult[]>('/search', {
        params: { q: query, limit },
        ...options,
      });
    },
  };

  // ==========================================================================
  // Market Indices API
  // ==========================================================================

  marketIndices = {
    /**
     * Get current market index data
     */
    list: async (options?: RequestOptions): Promise<MarketIndex[]> => {
      return this.request<MarketIndex[]>('/market-indices', options);
    },

    /**
     * Get analysis for a market index
     */
    analysis: async (
      symbol: string,
      options?: RequestOptions
    ): Promise<TechnicalAnalysisResult> => {
      return this.request<TechnicalAnalysisResult>('/market-index-analysis', {
        params: { symbol },
        ...options,
      });
    },
  };

  // ==========================================================================
  // Watchlists API
  // ==========================================================================

  watchlists = {
    /**
     * List all watchlists
     */
    list: async (options?: RequestOptions): Promise<Watchlist[]> => {
      const watchlists = await this.request<Watchlist[]>('/watchlists', options);
      return watchlists.map((w) => this.parseWatchlistDates(w));
    },

    /**
     * Get a single watchlist by ID
     */
    get: async (id: string, options?: RequestOptions): Promise<Watchlist> => {
      const watchlist = await this.request<Watchlist>(`/watchlists/${id}`, options);
      return this.parseWatchlistDates(watchlist);
    },

    /**
     * Create a new watchlist
     */
    create: async (
      data: CreateWatchlistRequest,
      options?: RequestOptions
    ): Promise<Watchlist> => {
      const watchlist = await this.request<Watchlist>('/watchlists', {
        method: 'POST',
        body: data,
        ...options,
      });
      return this.parseWatchlistDates(watchlist);
    },

    /**
     * Update a watchlist
     */
    update: async (
      id: string,
      data: UpdateWatchlistRequest,
      options?: RequestOptions
    ): Promise<Watchlist> => {
      const watchlist = await this.request<Watchlist>(`/watchlists/${id}`, {
        method: 'PATCH',
        body: data,
        ...options,
      });
      return this.parseWatchlistDates(watchlist);
    },

    /**
     * Delete a watchlist
     */
    delete: async (id: string, options?: RequestOptions): Promise<void> => {
      await this.request<void>(`/watchlists/${id}`, {
        method: 'DELETE',
        ...options,
      });
    },

    /**
     * Add a stock to a watchlist
     */
    addStock: async (
      watchlistId: string,
      symbol: string,
      options?: RequestOptions
    ): Promise<void> => {
      await this.request<void>(`/watchlists/${watchlistId}/stocks`, {
        method: 'POST',
        body: { symbol },
        ...options,
      });
    },

    /**
     * Remove a stock from a watchlist
     */
    removeStock: async (
      watchlistId: string,
      symbol: string,
      options?: RequestOptions
    ): Promise<void> => {
      await this.request<void>(`/watchlists/${watchlistId}/stocks/${symbol}`, {
        method: 'DELETE',
        ...options,
      });
    },
  };

  // ==========================================================================
  // Insights API
  // ==========================================================================

  insights = {
    /**
     * Get AI-powered insights for a stock
     */
    get: async (
      symbol: string,
      options?: RequestOptions
    ): Promise<{ content: string; confidence: number }> => {
      return this.request<{ content: string; confidence: number }>('/insights', {
        params: { symbol },
        ...options,
      });
    },
  };

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Parses date strings to Date objects in trade responses
   */
  private parseTradeDates<T extends JournalTrade | TradeWithPnL>(trade: T): T {
    return {
      ...trade,
      entryDate: new Date(trade.entryDate),
      exitDate: trade.exitDate ? new Date(trade.exitDate) : null,
      createdAt: new Date(trade.createdAt),
      updatedAt: new Date(trade.updatedAt),
    };
  }

  /**
   * Parses date strings to Date objects in watchlist responses
   */
  private parseWatchlistDates(watchlist: Watchlist): Watchlist {
    return {
      ...watchlist,
      createdAt: new Date(watchlist.createdAt),
      updatedAt: new Date(watchlist.updatedAt),
      stocks: watchlist.stocks?.map((stock) => ({
        ...stock,
        addedAt: new Date(stock.addedAt),
      })) || [],
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Default API client instance
 *
 * Usage:
 * ```typescript
 * import { api } from '@/lib/api/client';
 *
 * const trades = await api.trades.list();
 * const predictions = await api.predictions.list('AAPL');
 * ```
 */
export const api = new ApiClient({
  baseUrl: '/api',
});

// Export the class for custom configurations
export { ApiClient };
