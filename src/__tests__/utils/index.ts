/**
 * Test Utilities Index
 *
 * Central export point for all test utilities. Import from this file
 * to access mock request builders, data factories, render helpers, and constants.
 *
 * @example
 * import {
 *   createMockNextRequest,
 *   MockDataBuilder,
 *   renderWithProviders,
 *   TEST_SYMBOLS,
 * } from '@/__tests__/utils';
 */

// Mock Request Utilities
export {
  createMockNextRequest,
  createMockGetRequest,
  createMockPostRequest,
  createMockPatchRequest,
  createMockDeleteRequest,
  createMockPutRequest,
  parseResponseJson,
  createRouteParams,
  type MockRequestOptions,
  type ApiResponseBody,
} from './mock-request';

// Mock Data Builders
export {
  MockDataBuilder,
  mockPriceData,
  mockPriceDataArray,
  mockTrade,
  mockTradeWithPnL,
  mockTradeArray,
  mockPortfolioStats,
  mockPrediction,
  mockAnalysisData,
  mockQuote,
  type MockPriceData,
} from './mock-data';

// Render Helpers
export {
  renderWithProviders,
  renderAsync,
  createCustomRender,
  waitAndClick,
  waitAndType,
  fillForm,
  selectOption,
  screen,
  waitFor,
  within,
  act,
  userEvent,
  type RenderWithProvidersOptions,
  type ExtendedRenderResult,
} from './render-helpers';

// Test Constants
export {
  TEST_SYMBOLS,
  MARKET_INDICES,
  TEST_USER_IDS,
  API_ENDPOINTS,
  HTTP_STATUS,
  TRADE_CONSTANTS,
  TIMEFRAMES,
  TEST_TIMEOUTS,
  RATE_LIMITS,
  ERROR_MESSAGES,
  INDICATOR_CONSTANTS,
  CSS_PATTERNS,
  ARIA_ROLES,
  createMockDbTradeRow,
  mockResponses,
} from './test-constants';
