import { Page, expect } from '@playwright/test';
import { VIEWPORTS, BREAKPOINTS, TIMEOUTS } from '../fixtures/test-constants';

export type ViewportName = keyof typeof VIEWPORTS;

/**
 * Set viewport to a specific named size
 */
export async function setViewport(page: Page, viewport: ViewportName) {
  const size = VIEWPORTS[viewport];
  await page.setViewportSize(size);
  // Wait for any responsive transitions to complete
  await page.waitForTimeout(TIMEOUTS.transition);
}

/**
 * Check that page has no horizontal scroll
 */
export async function expectNoHorizontalScroll(page: Page) {
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
}

/**
 * Get computed grid column count for an element
 */
export async function getGridColumnCount(page: Page, selector: string): Promise<number> {
  const columns = await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return 0;

    const style = window.getComputedStyle(element);
    const gridTemplateColumns = style.getPropertyValue('grid-template-columns');

    // Count the number of columns from grid-template-columns
    // This will be something like "320px 320px 320px" or "repeat(3, minmax(320px, 1fr))"
    if (gridTemplateColumns === 'none' || !gridTemplateColumns) {
      return 1;
    }

    // Split by space and count non-empty values
    const columnValues = gridTemplateColumns.split(/\s+/).filter(v => v && v !== 'none');
    return columnValues.length;
  }, selector);

  return columns;
}

/**
 * Check if an element is visible in the viewport
 */
export async function isElementVisible(page: Page, selector: string): Promise<boolean> {
  const locator = page.locator(selector);
  try {
    await expect(locator).toBeVisible({ timeout: 1000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Measure layout shift during viewport transition
 * Returns the maximum cumulative layout shift observed
 */
export async function measureLayoutShift(
  page: Page,
  action: () => Promise<void>
): Promise<number> {
  // Inject the layout shift observer
  await page.evaluate(() => {
    (window as unknown as { layoutShiftScore: number }).layoutShiftScore = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if ((entry as unknown as { hadRecentInput: boolean }).hadRecentInput) continue;
        (window as unknown as { layoutShiftScore: number }).layoutShiftScore += (entry as unknown as { value: number }).value;
      }
    });
    observer.observe({ type: 'layout-shift', buffered: true });
    (window as unknown as { layoutShiftObserver: PerformanceObserver }).layoutShiftObserver = observer;
  });

  // Perform the action
  await action();

  // Wait for any animations
  await page.waitForTimeout(TIMEOUTS.animation);

  // Get the layout shift score
  const score = await page.evaluate(() => {
    const observer = (window as unknown as { layoutShiftObserver?: PerformanceObserver }).layoutShiftObserver;
    if (observer) {
      observer.disconnect();
    }
    return (window as unknown as { layoutShiftScore: number }).layoutShiftScore || 0;
  });

  return score;
}

/**
 * Get the current breakpoint name based on viewport width
 */
export function getCurrentBreakpoint(width: number): string {
  if (width < BREAKPOINTS.sm) return 'mobile';
  if (width < BREAKPOINTS.md) return 'sm';
  if (width < BREAKPOINTS.lg) return 'md';
  if (width < BREAKPOINTS.xl) return 'lg';
  if (width < BREAKPOINTS['2xl']) return 'xl';
  return '2xl';
}

/**
 * Wait for CSS transitions to complete on an element
 */
export async function waitForTransition(page: Page, selector: string) {
  await page.evaluate((sel) => {
    return new Promise<void>((resolve) => {
      const element = document.querySelector(sel);
      if (!element) {
        resolve();
        return;
      }

      const handleTransitionEnd = () => {
        element.removeEventListener('transitionend', handleTransitionEnd);
        resolve();
      };

      element.addEventListener('transitionend', handleTransitionEnd);

      // Timeout fallback
      setTimeout(() => {
        element.removeEventListener('transitionend', handleTransitionEnd);
        resolve();
      }, 500);
    });
  }, selector);
}

/**
 * Check that element has smooth transition styles
 */
export async function hasTransitionStyles(page: Page, selector: string): Promise<boolean> {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return false;

    const style = window.getComputedStyle(element);
    const transition = style.getPropertyValue('transition');
    const transitionDuration = style.getPropertyValue('transition-duration');

    // Check if there's any transition defined (not 'none' or '0s')
    return (
      (transition && transition !== 'none' && !transition.startsWith('all 0s')) ||
      (transitionDuration && transitionDuration !== '0s')
    );
  }, selector);
}

/**
 * Get element bounding box
 */
export async function getElementBounds(page: Page, selector: string) {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
    };
  }, selector);
}
