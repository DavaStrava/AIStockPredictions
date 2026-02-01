/**
 * Shared Test Constants
 *
 * This module provides commonly used constants for tests to avoid
 * duplication and ensure consistency across test files.
 */

/**
 * Common stock symbols used in tests
 */
export const TEST_SYMBOLS = {
  APPLE: 'AAPL',
  GOOGLE: 'GOOGL',
  MICROSOFT: 'MSFT',
  TESLA: 'TSLA',
  NVIDIA: 'NVDA',
  AMAZON: 'AMZN',
  META: 'META',
} as const;

/**
 * Market index symbols
 */
export const MARKET_INDICES = {
  SP500: '^GSPC',
  NASDAQ: '^IXIC',
  DOW: '^DJI',
  RUSSELL: '^RUT',
} as const;

/**
 * Common user IDs for testing
 */
export const TEST_USER_IDS = {
  DEFAULT: 'test-user-id',
  DEMO: 'demo-user-id',
  ADMIN: 'admin-user-id',
} as const;

/**
 * API endpoints used in tests
 */
export const API_ENDPOINTS = {
  TRADES: '/api/trades',
  TRADES_STATS: '/api/trades/stats',
  ANALYSIS: '/api/analysis',
  PREDICTIONS: '/api/predictions',
  SEARCH: '/api/search',
  INSIGHTS: '/api/insights',
  PORTFOLIOS: '/api/portfolios',
  WATCHLISTS: '/api/watchlists',
  MARKET_INDICES: '/api/market-indices',
} as const;

/**
 * Common HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
} as const;

/**
 * Trade-related constants
 */
export const TRADE_CONSTANTS = {
  SIDE: {
    LONG: 'LONG',
    SHORT: 'SHORT',
  },
  STATUS: {
    OPEN: 'OPEN',
    CLOSED: 'CLOSED',
  },
  DEFAULT_ENTRY_PRICE: 150,
  DEFAULT_QUANTITY: 10,
  DEFAULT_FEES: 5,
} as const;

/**
 * Timeframes for analysis
 */
export const TIMEFRAMES = {
  ONE_DAY: '1d',
  FIVE_DAYS: '5d',
  ONE_MONTH: '1m',
  THREE_MONTHS: '3m',
  SIX_MONTHS: '6m',
  ONE_YEAR: '1y',
  FIVE_YEARS: '5y',
} as const;

/**
 * Default test timeouts (in milliseconds)
 */
export const TEST_TIMEOUTS = {
  SHORT: 5000,
  MEDIUM: 10000,
  LONG: 30000,
  ASYNC_RENDER: 5000,
  API_CALL: 3000,
} as const;

/**
 * Rate limit configurations for testing
 */
export const RATE_LIMITS = {
  DEFAULT: {
    maxRequests: 60,
    windowMs: 60000,
  },
  STRICT: {
    maxRequests: 30,
    windowMs: 60000,
  },
  ANALYSIS: {
    maxRequests: 30,
    windowMs: 60000,
  },
  POST: {
    maxRequests: 20,
    windowMs: 60000,
  },
} as const;

/**
 * Error messages commonly checked in tests
 */
export const ERROR_MESSAGES = {
  NOT_FOUND: 'not found',
  INVALID_REQUEST: 'Invalid request',
  UNAUTHORIZED: 'Unauthorized',
  RATE_LIMITED: 'Too many requests',
  DATABASE_ERROR: 'Database error',
  VALIDATION_ERROR: 'Validation failed',
  MISSING_SYMBOL: 'Symbol is required',
  INVALID_SYMBOL: 'Invalid symbol',
  INVALID_PRICE: 'price must be positive',
  INVALID_QUANTITY: 'quantity must be positive',
  INVALID_SIDE: 'Invalid trade side',
  TRADE_ALREADY_CLOSED: 'Trade is already closed',
} as const;

/**
 * Mock database row helpers
 */
export function createMockDbTradeRow(overrides: Record<string, unknown> = {}) {
  const now = new Date().toISOString();
  const entryDate = new Date();
  entryDate.setDate(entryDate.getDate() - 5);

  return {
    id: 'trade-123',
    user_id: TEST_USER_IDS.DEFAULT,
    symbol: TEST_SYMBOLS.APPLE,
    side: TRADE_CONSTANTS.SIDE.LONG,
    status: TRADE_CONSTANTS.STATUS.OPEN,
    entry_price: TRADE_CONSTANTS.DEFAULT_ENTRY_PRICE.toString(),
    quantity: TRADE_CONSTANTS.DEFAULT_QUANTITY.toString(),
    entry_date: entryDate.toISOString(),
    exit_price: null,
    exit_date: null,
    fees: TRADE_CONSTANTS.DEFAULT_FEES.toString(),
    realized_pnl: null,
    notes: null,
    prediction_id: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

/**
 * Common mock response factories
 */
export const mockResponses = {
  success: <T>(data: T) => ({
    success: true,
    data,
  }),

  error: (message: string, status: number = HTTP_STATUS.BAD_REQUEST) => ({
    success: false,
    error: message,
    status,
  }),

  notFound: (resource: string = 'Resource') => ({
    success: false,
    error: `${resource} not found`,
    status: HTTP_STATUS.NOT_FOUND,
  }),

  validationError: (field: string, message: string) => ({
    success: false,
    error: message,
    field,
    code: 'VALIDATION_ERROR',
    status: HTTP_STATUS.BAD_REQUEST,
  }),
};

/**
 * Technical indicator constants for testing
 */
export const INDICATOR_CONSTANTS = {
  RSI: {
    OVERBOUGHT: 70,
    OVERSOLD: 30,
    NEUTRAL: 50,
  },
  MACD: {
    BULLISH_THRESHOLD: 0,
    BEARISH_THRESHOLD: 0,
  },
  BOLLINGER: {
    STD_DEVIATION: 2,
    PERIOD: 20,
  },
} as const;

/**
 * CSS class patterns for testing
 */
export const CSS_PATTERNS = {
  BULLISH: /green|bullish|positive/i,
  BEARISH: /red|bearish|negative/i,
  NEUTRAL: /gray|neutral|yellow/i,
  LOADING: /loading|spinner|skeleton/i,
  ERROR: /error|danger|alert/i,
} as const;

/**
 * Accessible role patterns for testing
 */
export const ARIA_ROLES = {
  BUTTON: 'button',
  TEXTBOX: 'textbox',
  COMBOBOX: 'combobox',
  DIALOG: 'dialog',
  GRID: 'grid',
  ROW: 'row',
  CELL: 'cell',
  TAB: 'tab',
  TABPANEL: 'tabpanel',
} as const;
