/**
 * Vitest Configuration for React Component Tests
 * 
 * This configuration is specifically designed for testing React components
 * and bypasses PostCSS processing issues that can occur with Tailwind CSS v4.
 */

import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Completely bypass CSS processing for tests
  define: {
    'process.env.NODE_ENV': '"test"'
  },
  esbuild: {
    // Transform JSX and handle imports
    loader: 'tsx',
    include: /\.(tsx?|jsx?)$/,
  },
  // Don't process CSS files at all
  assetsInclude: () => false,
})