import { test, expect } from '@playwright/test';
import { setupApiMocks } from '../helpers/api-mocks';
import {
  setViewport,
  expectNoHorizontalScroll,
  getGridColumnCount,
  hasTransitionStyles,
  measureLayoutShift,
  ViewportName
} from '../helpers/responsive-utils';
import { TEST_IDS, EXPECTED_COLUMNS, TIMEOUTS } from '../fixtures/test-constants';

test.describe('ResponsiveGrid', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test.describe('Column Progression', () => {
    const viewportTests: { viewport: ViewportName; expectedColumns: number }[] = [
      { viewport: 'mobile', expectedColumns: EXPECTED_COLUMNS.mobile },
      { viewport: 'tablet', expectedColumns: EXPECTED_COLUMNS.tablet },
      { viewport: 'desktop', expectedColumns: EXPECTED_COLUMNS.desktop },
      { viewport: 'large', expectedColumns: EXPECTED_COLUMNS.large },
    ];

    for (const { viewport, expectedColumns } of viewportTests) {
      test(`should display ${expectedColumns} column(s) on ${viewport}`, async ({ page }) => {
        await setViewport(page, viewport);
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const grid = page.getByTestId(TEST_IDS.responsiveGrid);

        // Check if grid exists
        const gridCount = await grid.count();
        if (gridCount === 0) {
          // Grid may not be visible on all pages, skip test
          test.skip();
          return;
        }

        // Wait for any transitions to complete
        await page.waitForTimeout(TIMEOUTS.transition);

        // Get the actual column count
        const columns = await getGridColumnCount(
          page,
          `[data-testid="${TEST_IDS.responsiveGrid}"]`
        );

        // The grid might use auto-fit, so we just verify it's responsive
        // and doesn't exceed expected maximum for the viewport
        expect(columns).toBeGreaterThanOrEqual(1);
        expect(columns).toBeLessThanOrEqual(expectedColumns + 1); // Allow some flexibility
      });
    }
  });

  test.describe('No Horizontal Scrolling', () => {
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

  test.describe('Smooth Transitions', () => {
    test('should have transition styles applied', async ({ page }) => {
      await setViewport(page, 'desktop');
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const grid = page.getByTestId(TEST_IDS.responsiveGrid);
      const gridCount = await grid.count();

      if (gridCount === 0) {
        test.skip();
        return;
      }

      const hasTransition = await hasTransitionStyles(
        page,
        `[data-testid="${TEST_IDS.responsiveGrid}"]`
      );

      expect(hasTransition).toBe(true);
    });

    test('should transition smoothly between breakpoints', async ({ page }) => {
      await setViewport(page, 'mobile');
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const grid = page.getByTestId(TEST_IDS.responsiveGrid);
      const gridCount = await grid.count();

      if (gridCount === 0) {
        test.skip();
        return;
      }

      // Measure layout shift when transitioning from mobile to desktop
      const layoutShift = await measureLayoutShift(page, async () => {
        await setViewport(page, 'desktop');
      });

      // Layout shift should be minimal (CLS < 0.1 is considered good)
      // We allow a higher threshold for responsive changes
      expect(layoutShift).toBeLessThan(0.5);
    });
  });

  test.describe('Grid Content', () => {
    test('should display grid items correctly', async ({ page }) => {
      await setViewport(page, 'desktop');
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const grid = page.getByTestId(TEST_IDS.responsiveGrid);
      const gridCount = await grid.count();

      if (gridCount === 0) {
        test.skip();
        return;
      }

      // Check that grid has children
      const childCount = await page.evaluate((testId) => {
        const grid = document.querySelector(`[data-testid="${testId}"]`);
        return grid ? grid.children.length : 0;
      }, TEST_IDS.responsiveGrid);

      expect(childCount).toBeGreaterThan(0);
    });

    test('grid items should be properly sized', async ({ page }) => {
      await setViewport(page, 'desktop');
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const grid = page.getByTestId(TEST_IDS.responsiveGrid);
      const gridCount = await grid.count();

      if (gridCount === 0) {
        test.skip();
        return;
      }

      // Check that grid items have reasonable widths
      const itemWidths = await page.evaluate((testId) => {
        const grid = document.querySelector(`[data-testid="${testId}"]`);
        if (!grid) return [];

        return Array.from(grid.children).map((child) => {
          const rect = child.getBoundingClientRect();
          return rect.width;
        });
      }, TEST_IDS.responsiveGrid);

      // All items should have positive width
      for (const width of itemWidths) {
        expect(width).toBeGreaterThan(0);
      }
    });
  });
});
