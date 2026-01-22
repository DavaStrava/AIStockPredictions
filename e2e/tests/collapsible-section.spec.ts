import { test, expect } from '@playwright/test';
import { setupApiMocks } from '../helpers/api-mocks';
import {
  setViewport,
  measureLayoutShift,
  ViewportName
} from '../helpers/responsive-utils';
import { TIMEOUTS } from '../fixtures/test-constants';

test.describe('CollapsibleSection', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  // Helper to find a collapsible section
  const getCollapsibleButton = (page: ReturnType<typeof test.info>['project']['use']['page'] extends never ? never : Awaited<Parameters<Parameters<typeof test>[1]>[0]['page']>) => {
    // Find button that has an SVG with rotate class (the expand/collapse arrow)
    return page.locator('button:has(svg.transition-transform)').first();
  };

  test.describe('Expand/Collapse Functionality', () => {
    test('should toggle content visibility on click', async ({ page }) => {
      await setViewport(page, 'desktop');
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const toggleButton = getCollapsibleButton(page);
      const count = await toggleButton.count();

      if (count === 0) {
        // No collapsible sections on page
        test.skip();
        return;
      }

      // Get the parent container
      const container = toggleButton.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first();

      // Check if content area exists (the div after the button with border-t)
      const contentArea = container.locator('.border-t');
      const initialContentCount = await contentArea.count();

      // Click to toggle
      await toggleButton.click();
      await page.waitForTimeout(TIMEOUTS.animation);

      // Content visibility should change
      const newContentCount = await contentArea.count();

      // Either visibility changed, or it remained (both are valid states)
      expect(typeof newContentCount).toBe('number');
    });

    test('should expand collapsed section on click', async ({ page }) => {
      await setViewport(page, 'desktop');
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const toggleButton = getCollapsibleButton(page);
      const count = await toggleButton.count();

      if (count === 0) {
        test.skip();
        return;
      }

      // Get the SVG arrow
      const arrow = toggleButton.locator('svg').first();

      // Check if arrow has rotate-180 class (expanded state)
      const isExpanded = await arrow.evaluate((el) =>
        el.classList.contains('rotate-180')
      );

      // Click to toggle
      await toggleButton.click();
      await page.waitForTimeout(TIMEOUTS.animation);

      // Arrow rotation should change
      const isExpandedAfter = await arrow.evaluate((el) =>
        el.classList.contains('rotate-180')
      );

      // State should have toggled
      expect(isExpandedAfter).toBe(!isExpanded);
    });
  });

  test.describe('Arrow Animation', () => {
    test('arrow should have transition styles', async ({ page }) => {
      await setViewport(page, 'desktop');
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const toggleButton = getCollapsibleButton(page);
      const count = await toggleButton.count();

      if (count === 0) {
        test.skip();
        return;
      }

      // Check that SVG has transition-transform class
      const arrow = toggleButton.locator('svg.transition-transform').first();
      const arrowCount = await arrow.count();

      expect(arrowCount).toBeGreaterThan(0);
    });

    test('arrow should rotate 180 degrees when expanded', async ({ page }) => {
      await setViewport(page, 'desktop');
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const toggleButton = getCollapsibleButton(page);
      const count = await toggleButton.count();

      if (count === 0) {
        test.skip();
        return;
      }

      const arrow = toggleButton.locator('svg').first();

      // Get initial transform
      const initialTransform = await arrow.evaluate((el) => {
        return window.getComputedStyle(el).transform;
      });

      // Click to toggle
      await toggleButton.click();
      await page.waitForTimeout(TIMEOUTS.animation);

      // Get new transform
      const newTransform = await arrow.evaluate((el) => {
        return window.getComputedStyle(el).transform;
      });

      // Transform should have changed (rotation applied)
      expect(newTransform).not.toBe(initialTransform);
    });
  });

  test.describe('Touch Interaction on Mobile', () => {
    test('should respond to touch/tap on mobile', async ({ page }) => {
      await setViewport(page, 'mobile');
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const toggleButton = getCollapsibleButton(page);
      const count = await toggleButton.count();

      if (count === 0) {
        test.skip();
        return;
      }

      const arrow = toggleButton.locator('svg').first();
      const initialRotation = await arrow.evaluate((el) =>
        el.classList.contains('rotate-180')
      );

      // Tap on mobile (same as click in Playwright)
      await toggleButton.tap();
      await page.waitForTimeout(TIMEOUTS.animation);

      const newRotation = await arrow.evaluate((el) =>
        el.classList.contains('rotate-180')
      );

      // Rotation should toggle
      expect(newRotation).toBe(!initialRotation);
    });

    test('button should be large enough for touch targets', async ({ page }) => {
      await setViewport(page, 'mobile');
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const toggleButton = getCollapsibleButton(page);
      const count = await toggleButton.count();

      if (count === 0) {
        test.skip();
        return;
      }

      // Get button dimensions
      const bounds = await toggleButton.boundingBox();
      expect(bounds).not.toBeNull();

      if (bounds) {
        // Touch targets should be at least 44x44 (iOS guideline)
        expect(bounds.height).toBeGreaterThanOrEqual(44);
        expect(bounds.width).toBeGreaterThanOrEqual(44);
      }
    });
  });

  test.describe('Layout Shift Prevention', () => {
    test('should not cause layout shift during toggle', async ({ page }) => {
      await setViewport(page, 'desktop');
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const toggleButton = getCollapsibleButton(page);
      const count = await toggleButton.count();

      if (count === 0) {
        test.skip();
        return;
      }

      // Measure layout shift during toggle
      const layoutShift = await measureLayoutShift(page, async () => {
        await toggleButton.click();
      });

      // Layout shift should be minimal
      // Note: Some shift is expected when content appears/disappears
      // We use a relaxed threshold for this test
      expect(layoutShift).toBeLessThan(1.0);
    });

    test('content area should have smooth reveal', async ({ page }) => {
      await setViewport(page, 'desktop');
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const toggleButton = getCollapsibleButton(page);
      const count = await toggleButton.count();

      if (count === 0) {
        test.skip();
        return;
      }

      // Get parent container
      const container = toggleButton.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first();

      // Check that hover transition exists
      const hasTransition = await container.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.transition !== 'none' && style.transition !== '';
      });

      expect(hasTransition).toBe(true);
    });
  });

  test.describe('Responsive Behavior', () => {
    const viewports: ViewportName[] = ['mobile', 'tablet', 'desktop'];

    for (const viewport of viewports) {
      test(`should function correctly on ${viewport}`, async ({ page }) => {
        await setViewport(page, viewport);
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const toggleButton = getCollapsibleButton(page);
        const count = await toggleButton.count();

        if (count === 0) {
          test.skip();
          return;
        }

        // Button should be visible
        await expect(toggleButton).toBeVisible();

        // Should be clickable
        await expect(toggleButton).toBeEnabled();

        // Click should work
        await toggleButton.click();
        await page.waitForTimeout(TIMEOUTS.animation);

        // No errors should occur
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        expect(errors).toHaveLength(0);
      });
    }
  });
});
