/**
 * Integration Tests Index
 *
 * Central export point for integration test utilities and setup functions.
 *
 * @example
 * import {
 *   setupIntegrationMocks,
 *   createTestHeaders,
 *   assertSuccessResponse,
 *   mockDbPool,
 *   mockFmpProvider,
 * } from '@/__tests__/integration';
 */

export {
  // Setup utilities
  setupIntegrationMocks,
  clearIntegrationMocks,
  useIntegrationTestSetup,
  resetRateLimits,

  // Mock objects
  mockDbClient,
  mockDbPool,
  mockFmpProvider,

  // Default mock responses
  defaultDbResponses,
  defaultFmpResponses,

  // Helper functions
  getTestClientId,
  createTestHeaders,
  waitFor,
  getResponseJson,
  assertSuccessResponse,
  assertErrorResponse,

  // Types
  type ApiResponse,
} from './setup';
