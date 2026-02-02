/**
 * Test Setup Configuration
 * 
 * This file configures the testing environment for React component tests.
 * It sets up necessary polyfills, testing library configurations, and global mocks.
 */

import '@testing-library/jest-dom';
import React from 'react';

// Make React available globally for JSX
global.React = React;

// Mock CSS imports to prevent PostCSS issues during testing
// This allows components to import CSS files without breaking tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver for components that use it
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(callback: ResizeObserverCallback) {
    // Store callback if needed for testing
  }
}
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// Mock IntersectionObserver for components that use it (required by Next.js Link)
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn().mockReturnValue([]);
  root: Element | Document | null = null;
  rootMargin: string = '';
  thresholds: ReadonlyArray<number> = [];
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    // Store callback if needed for testing
  }
}
global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;