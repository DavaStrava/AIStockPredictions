import { Page } from '@playwright/test';
import {
  mockStockPredictions,
  mockAnalysisData,
  mockMarketIndices,
  emptyPredictions,
  emptyIndicators
} from '../fixtures/mock-data';
import { API_ROUTES } from '../fixtures/test-constants';

/**
 * Setup API mocks for E2E tests
 * Intercepts API routes and returns mock data
 */
export async function setupApiMocks(page: Page, options: {
  emptyPredictions?: boolean;
  emptyIndicators?: boolean;
} = {}) {
  // Mock predictions API
  await page.route(API_ROUTES.predictions, async (route) => {
    const data = options.emptyPredictions ? emptyPredictions : mockStockPredictions;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data),
    });
  });

  // Mock analysis API
  await page.route(API_ROUTES.analysis, async (route) => {
    const data = options.emptyIndicators
      ? { ...mockAnalysisData, indicators: emptyIndicators }
      : mockAnalysisData;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data),
    });
  });

  // Mock market indices API - return empty array
  await page.route(API_ROUTES.marketIndices, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
}

/**
 * Setup API mocks with custom response data
 */
export async function setupCustomApiMocks(page: Page, mocks: {
  predictions?: unknown;
  analysis?: unknown;
  marketIndices?: unknown;
}) {
  if (mocks.predictions !== undefined) {
    await page.route(API_ROUTES.predictions, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mocks.predictions),
      });
    });
  }

  if (mocks.analysis !== undefined) {
    await page.route(API_ROUTES.analysis, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mocks.analysis),
      });
    });
  }

  if (mocks.marketIndices !== undefined) {
    await page.route(API_ROUTES.marketIndices, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mocks.marketIndices),
      });
    });
  }
}

/**
 * Setup API mocks that return errors
 */
export async function setupApiErrorMocks(page: Page, routes: string[]) {
  for (const route of routes) {
    await page.route(route, async (r) => {
      await r.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });
  }
}
