/**
 * Test constants for E2E responsive layout tests
 */

/** Breakpoint widths matching Tailwind CSS defaults */
export const BREAKPOINTS = {
  mobile: 375,
  sm: 640,
  md: 768,   // tablet
  lg: 1024,  // desktop
  xl: 1280,  // large
  '2xl': 1536, // extra large
  '2k': 2560,  // 2k displays
} as const;

/** Viewport configurations for different device sizes */
export const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1024, height: 768 },
  large: { width: 1440, height: 900 },
  xl: { width: 1920, height: 1080 },
  '2k': { width: 2560, height: 1440 },
} as const;

/** Expected column counts at each breakpoint for ResponsiveGrid */
export const EXPECTED_COLUMNS = {
  mobile: 1,
  tablet: 2,
  desktop: 3,
  large: 4,
  xl: 4,
  '2k': 5,
} as const;

/** Test IDs used in components */
export const TEST_IDS = {
  responsiveGrid: 'responsive-grid',
  technicalIndicatorExplanations: 'technical-indicator-explanations',
  overallSentiment: 'overall-sentiment',
  noIndicators: 'no-indicators',
  explanationPrefix: 'explanation-',
  riskPrefix: 'risk-',
  insightPrefix: 'insight-',
} as const;

/** Timeouts for various operations */
export const TIMEOUTS = {
  pageLoad: 30000,
  animation: 500,
  transition: 300,
  networkIdle: 10000,
} as const;

/** API routes to intercept */
export const API_ROUTES = {
  predictions: '**/api/predictions',
  analysis: '**/api/analysis',
  marketIndices: '**/api/market-indices',
} as const;
