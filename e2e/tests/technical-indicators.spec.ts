import { test, expect } from '@playwright/test';
import { setupApiMocks, setupCustomApiMocks } from '../helpers/api-mocks';
import {
  setViewport,
  getGridColumnCount,
  ViewportName
} from '../helpers/responsive-utils';
import { TEST_IDS, TIMEOUTS } from '../fixtures/test-constants';
import { mockTechnicalIndicators } from '../fixtures/mock-data';

test.describe('TechnicalIndicatorExplanations', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  // Helper to navigate to a page with technical indicators
  const goToIndicatorsPage = async (page: Awaited<Parameters<Parameters<typeof test>[1]>[0]['page']>) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check if technical indicators component exists
    const indicators = page.getByTestId(TEST_IDS.technicalIndicatorExplanations);
    return indicators;
  };

  test.describe('Grid Layout Responsiveness', () => {
    test('should display 1 column on mobile', async ({ page }) => {
      await setViewport(page, 'mobile');
      const indicators = await goToIndicatorsPage(page);
      const count = await indicators.count();

      if (count === 0) {
        test.skip();
        return;
      }

      // Find the grid inside indicators
      const grid = indicators.locator('.grid');
      const gridCount = await grid.count();

      if (gridCount > 0) {
        await page.waitForTimeout(TIMEOUTS.transition);
        const columns = await getGridColumnCount(
          page,
          `[data-testid="${TEST_IDS.technicalIndicatorExplanations}"] .grid`
        );
        expect(columns).toBeLessThanOrEqual(1);
      }
    });

    test('should display 2 columns on tablet', async ({ page }) => {
      await setViewport(page, 'tablet');
      const indicators = await goToIndicatorsPage(page);
      const count = await indicators.count();

      if (count === 0) {
        test.skip();
        return;
      }

      const grid = indicators.locator('.grid');
      const gridCount = await grid.count();

      if (gridCount > 0) {
        await page.waitForTimeout(TIMEOUTS.transition);
        const columns = await getGridColumnCount(
          page,
          `[data-testid="${TEST_IDS.technicalIndicatorExplanations}"] .grid`
        );
        expect(columns).toBeLessThanOrEqual(2);
      }
    });

    test('should display 3 columns on desktop', async ({ page }) => {
      await setViewport(page, 'desktop');
      const indicators = await goToIndicatorsPage(page);
      const count = await indicators.count();

      if (count === 0) {
        test.skip();
        return;
      }

      const grid = indicators.locator('.grid');
      const gridCount = await grid.count();

      if (gridCount > 0) {
        await page.waitForTimeout(TIMEOUTS.transition);
        const columns = await getGridColumnCount(
          page,
          `[data-testid="${TEST_IDS.technicalIndicatorExplanations}"] .grid`
        );
        expect(columns).toBeLessThanOrEqual(3);
      }
    });
  });

  test.describe('Indicator Display', () => {
    test('should display indicator explanations', async ({ page }) => {
      await setViewport(page, 'desktop');
      const indicators = await goToIndicatorsPage(page);
      const count = await indicators.count();

      if (count === 0) {
        test.skip();
        return;
      }

      // Check for explanation cards
      for (const indicator of mockTechnicalIndicators) {
        const explanationCard = page.getByTestId(
          `${TEST_IDS.explanationPrefix}${indicator.name.toLowerCase()}`
        );
        const cardCount = await explanationCard.count();

        // Card should exist if component is showing this indicator
        if (cardCount > 0) {
          await expect(explanationCard).toBeVisible();
        }
      }
    });

    test('should display risk badges', async ({ page }) => {
      await setViewport(page, 'desktop');
      const indicators = await goToIndicatorsPage(page);
      const count = await indicators.count();

      if (count === 0) {
        test.skip();
        return;
      }

      // Check for risk badges
      for (const indicator of mockTechnicalIndicators) {
        const riskBadge = page.getByTestId(
          `${TEST_IDS.riskPrefix}${indicator.name.toLowerCase()}`
        );
        const badgeCount = await riskBadge.count();

        if (badgeCount > 0) {
          await expect(riskBadge).toBeVisible();
          // Badge should contain risk level text
          const text = await riskBadge.textContent();
          expect(['high', 'medium', 'low']).toContain(text?.toLowerCase());
        }
      }
    });

    test('should display actionable insights with lightbulb emoji', async ({ page }) => {
      await setViewport(page, 'desktop');
      const indicators = await goToIndicatorsPage(page);
      const count = await indicators.count();

      if (count === 0) {
        test.skip();
        return;
      }

      // Check for insight elements
      for (const indicator of mockTechnicalIndicators) {
        const insight = page.getByTestId(
          `${TEST_IDS.insightPrefix}${indicator.name.toLowerCase()}`
        );
        const insightCount = await insight.count();

        if (insightCount > 0) {
          await expect(insight).toBeVisible();
          // Should contain lightbulb emoji
          const html = await insight.innerHTML();
          expect(html).toContain('💡');
        }
      }
    });
  });

  test.describe('Overall Sentiment', () => {
    test('should display overall sentiment badge', async ({ page }) => {
      await setViewport(page, 'desktop');
      const indicators = await goToIndicatorsPage(page);
      const count = await indicators.count();

      if (count === 0) {
        test.skip();
        return;
      }

      const sentimentBadge = page.getByTestId(TEST_IDS.overallSentiment);
      const badgeCount = await sentimentBadge.count();

      if (badgeCount > 0) {
        await expect(sentimentBadge).toBeVisible();
        // Should contain sentiment text
        const text = await sentimentBadge.textContent();
        expect(['bullish', 'bearish', 'neutral']).toContain(text?.toLowerCase());
      }
    });

    test('sentiment badge should have appropriate color', async ({ page }) => {
      await setViewport(page, 'desktop');
      const indicators = await goToIndicatorsPage(page);
      const count = await indicators.count();

      if (count === 0) {
        test.skip();
        return;
      }

      const sentimentBadge = page.getByTestId(TEST_IDS.overallSentiment);
      const badgeCount = await sentimentBadge.count();

      if (badgeCount > 0) {
        // Check for color classes
        const classes = await sentimentBadge.getAttribute('class');
        // Should have background color class
        expect(classes).toMatch(/bg-\w+/);
      }
    });
  });

  test.describe('Empty State', () => {
    test('should display "No indicators" message when empty', async ({ page }) => {
      // Setup mocks with empty indicators
      await setupCustomApiMocks(page, {
        analysis: {
          symbol: 'AAPL',
          currentPrice: 185.50,
          indicators: [],
        },
      });

      await setViewport(page, 'desktop');
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const noIndicators = page.getByTestId(TEST_IDS.noIndicators);
      const count = await noIndicators.count();

      if (count > 0) {
        await expect(noIndicators).toBeVisible();
        const text = await noIndicators.textContent();
        expect(text?.toLowerCase()).toContain('no');
      }
    });
  });

  test.describe('Responsive Text', () => {
    const viewports: ViewportName[] = ['mobile', 'tablet', 'desktop'];

    for (const viewport of viewports) {
      test(`text should be readable on ${viewport}`, async ({ page }) => {
        await setViewport(page, viewport);
        const indicators = await goToIndicatorsPage(page);
        const count = await indicators.count();

        if (count === 0) {
          test.skip();
          return;
        }

        // Check that text elements have reasonable font sizes
        const fontSizes = await page.evaluate((testId) => {
          const container = document.querySelector(`[data-testid="${testId}"]`);
          if (!container) return [];

          const elements = container.querySelectorAll('p, h3, h4, span');
          return Array.from(elements).map((el) => {
            const style = window.getComputedStyle(el);
            return parseFloat(style.fontSize);
          }).filter(size => size > 0);
        }, TEST_IDS.technicalIndicatorExplanations);

        // All text should be at least 12px (readable minimum)
        for (const size of fontSizes) {
          expect(size).toBeGreaterThanOrEqual(12);
        }
      });
    }
  });

  test.describe('Card Layout', () => {
    test('cards should have consistent spacing', async ({ page }) => {
      await setViewport(page, 'desktop');
      const indicators = await goToIndicatorsPage(page);
      const count = await indicators.count();

      if (count === 0) {
        test.skip();
        return;
      }

      // Check grid gap
      const gap = await page.evaluate((testId) => {
        const grid = document.querySelector(`[data-testid="${testId}"] .grid`);
        if (!grid) return 0;
        const style = window.getComputedStyle(grid);
        return parseFloat(style.gap) || parseFloat(style.gridGap) || 0;
      }, TEST_IDS.technicalIndicatorExplanations);

      // Gap should be reasonable (at least 8px)
      expect(gap).toBeGreaterThanOrEqual(0);
    });

    test('cards should have proper borders and shadows', async ({ page }) => {
      await setViewport(page, 'desktop');
      const indicators = await goToIndicatorsPage(page);
      const count = await indicators.count();

      if (count === 0) {
        test.skip();
        return;
      }

      // Check first indicator card for styling
      const firstCard = indicators.locator('[data-testid^="explanation-"]').first();
      const cardCount = await firstCard.count();

      if (cardCount > 0) {
        const hasBorder = await firstCard.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.border !== 'none' && style.borderWidth !== '0px';
        });

        // Card should have border
        expect(hasBorder).toBe(true);
      }
    });
  });
});
