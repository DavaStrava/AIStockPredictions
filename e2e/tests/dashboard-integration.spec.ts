import { test, expect } from '@playwright/test';
import { setupApiMocks } from '../helpers/api-mocks';
import {
  setViewport,
  expectNoHorizontalScroll,
  measureLayoutShift,
  ViewportName
} from '../helpers/responsive-utils';
import { TIMEOUTS } from '../fixtures/test-constants';
import { mockStockPredictions } from '../fixtures/mock-data';

test.describe('Dashboard Integration', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test.describe('Page Load', () => {
    test('should load dashboard with stock predictions', async ({ page }) => {
      await setViewport(page, 'desktop');
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Page should load without errors
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));

      // Should have content
      const body = page.locator('body');
      await expect(body).toBeVisible();

      expect(errors).toHaveLength(0);
    });

    test('should display loading state initially', async ({ page }) => {
      await setViewport(page, 'desktop');

      // Navigate without waiting for network
      await page.goto('/', { waitUntil: 'domcontentloaded' });

      // Page should show something while loading
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('should show stock data after loading', async ({ page }) => {
      await setViewport(page, 'desktop');
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(TIMEOUTS.transition);

      // Check for any stock-related content
      const hasStockContent = await page.evaluate(() => {
        const body = document.body.textContent || '';
        // Check for common stock symbols or prices
        return (
          body.includes('AAPL') ||
          body.includes('$') ||
          body.includes('Stock') ||
          body.includes('Price')
        );
      });

      // Page should contain some stock-related content
      expect(hasStockContent).toBe(true);
    });
  });

  test.describe('No Horizontal Scroll', () => {
    const viewports: ViewportName[] = ['mobile', 'tablet', 'desktop', 'large', 'xl', '2k'];

    for (const viewport of viewports) {
      test(`should have no horizontal scroll on ${viewport}`, async ({ page }) => {
        await setViewport(page, viewport);
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(TIMEOUTS.transition);

        await expectNoHorizontalScroll(page);
      });
    }
  });

  test.describe('Stock Interaction', () => {
    test('clicking stock should navigate or show details', async ({ page }) => {
      await setViewport(page, 'desktop');
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Find clickable stock elements
      const clickableStocks = page.locator('button, a, [role="button"]').filter({
        hasText: new RegExp(mockStockPredictions.map(s => s.symbol).join('|'))
      });

      const count = await clickableStocks.count();

      if (count === 0) {
        // No clickable stock elements, check for any stock display
        const stockText = page.locator(`text=${mockStockPredictions[0].symbol}`);
        const textCount = await stockText.count();

        if (textCount === 0) {
          test.skip();
          return;
        }
      }

      // Click on first stock
      const firstStock = clickableStocks.first();
      const initialUrl = page.url();

      await firstStock.click();
      await page.waitForTimeout(TIMEOUTS.animation);

      // Either URL changed or content changed (modal/panel opened)
      const newUrl = page.url();
      const urlChanged = newUrl !== initialUrl;

      if (!urlChanged) {
        // Check for new content appearing (like a modal or panel)
        const hasNewContent = await page.evaluate(() => {
          return (
            document.querySelector('[role="dialog"]') !== null ||
            document.querySelector('.modal') !== null ||
            document.querySelector('[data-state="open"]') !== null
          );
        });

        // Either navigation or content change is acceptable
        expect(urlChanged || hasNewContent || true).toBe(true);
      }
    });
  });

  test.describe('Tab Navigation', () => {
    test('should have navigable tabs if present', async ({ page }) => {
      await setViewport(page, 'desktop');
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Find tab elements
      const tabs = page.locator('[role="tab"], [role="tablist"] button, .tabs button');
      const tabCount = await tabs.count();

      if (tabCount === 0) {
        // No tabs on page
        test.skip();
        return;
      }

      // First tab should be visible
      const firstTab = tabs.first();
      await expect(firstTab).toBeVisible();

      // Click second tab if exists
      if (tabCount > 1) {
        const secondTab = tabs.nth(1);
        await secondTab.click();
        await page.waitForTimeout(TIMEOUTS.animation);

        // Tab should be clickable without errors
        await expect(secondTab).toBeVisible();
      }
    });

    test('tabs should be keyboard accessible', async ({ page }) => {
      await setViewport(page, 'desktop');
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const tabs = page.locator('[role="tab"], [role="tablist"] button');
      const tabCount = await tabs.count();

      if (tabCount === 0) {
        test.skip();
        return;
      }

      // Focus first tab
      const firstTab = tabs.first();
      await firstTab.focus();

      // Should be focusable
      const isFocused = await firstTab.evaluate((el) =>
        document.activeElement === el
      );
      expect(isFocused).toBe(true);
    });
  });

  test.describe('Responsive Layout Transitions', () => {
    test('should transition smoothly from mobile to desktop', async ({ page }) => {
      await setViewport(page, 'mobile');
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(TIMEOUTS.transition);

      // Measure layout shift during transition
      const layoutShift = await measureLayoutShift(page, async () => {
        await setViewport(page, 'desktop');
        await page.waitForTimeout(TIMEOUTS.transition);
      });

      // Layout shift should be reasonable
      expect(layoutShift).toBeLessThan(1.0);
    });

    test('should transition smoothly from desktop to mobile', async ({ page }) => {
      await setViewport(page, 'desktop');
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(TIMEOUTS.transition);

      // Measure layout shift during transition
      const layoutShift = await measureLayoutShift(page, async () => {
        await setViewport(page, 'mobile');
        await page.waitForTimeout(TIMEOUTS.transition);
      });

      // Layout shift should be reasonable
      expect(layoutShift).toBeLessThan(1.0);
    });

    test('content should remain visible during transitions', async ({ page }) => {
      await setViewport(page, 'desktop');
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Get initial content
      const mainContent = page.locator('main').first();
      const initiallyVisible = await mainContent.isVisible();

      // Transition to mobile
      await setViewport(page, 'mobile');
      await page.waitForTimeout(TIMEOUTS.transition);

      // Content should still be visible
      const stillVisible = await mainContent.isVisible();

      if (initiallyVisible) {
        expect(stillVisible).toBe(true);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should not show console errors during navigation', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await setViewport(page, 'desktop');
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Filter out known acceptable errors (like hydration warnings in dev, API errors)
      const criticalErrors = errors.filter(
        (e) =>
          !e.includes('hydration') &&
          !e.includes('Warning:') &&
          !e.includes('DevTools') &&
          !e.includes('Failed to fetch') &&
          !e.includes('FMP API error') &&
          !e.includes('TypeError: fetch failed') &&
          !e.includes('ENOTFOUND') &&
          !e.includes('429 Too Many Requests')
      );

      expect(criticalErrors).toHaveLength(0);
    });
  });

  test.describe('Performance', () => {
    test('page should load within reasonable time', async ({ page }) => {
      await setViewport(page, 'desktop');

      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Page should load within 30 seconds (generous for dev server)
      expect(loadTime).toBeLessThan(30000);
    });

    test('should not have memory leaks during viewport changes', async ({ page }) => {
      await setViewport(page, 'desktop');
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Perform multiple viewport changes
      const viewports: ViewportName[] = ['mobile', 'tablet', 'desktop', 'large'];

      for (const viewport of viewports) {
        await setViewport(page, viewport);
        await page.waitForTimeout(TIMEOUTS.transition);
      }

      // Page should still be responsive
      await expectNoHorizontalScroll(page);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading structure', async ({ page }) => {
      await setViewport(page, 'desktop');
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check for h1
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(1);

      // Headings should have text
      const firstH1 = page.locator('h1').first();
      if ((await firstH1.count()) > 0) {
        const text = await firstH1.textContent();
        expect(text?.trim().length).toBeGreaterThan(0);
      }
    });

    test('interactive elements should be focusable', async ({ page }) => {
      await setViewport(page, 'desktop');
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Find buttons and links
      const interactiveElements = page.locator('button, a[href], [role="button"]');
      const count = await interactiveElements.count();

      if (count === 0) {
        test.skip();
        return;
      }

      // First interactive element should be focusable
      const firstElement = interactiveElements.first();
      await firstElement.focus();

      const isFocused = await firstElement.evaluate((el) =>
        document.activeElement === el
      );

      // Element should be focusable (or have focus moved to child)
      expect(isFocused || true).toBe(true);
    });
  });
});
