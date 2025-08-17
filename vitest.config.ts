/**
 * Vitest Configuration File - Modern Testing Framework Setup
 * 
 * This configuration file sets up Vitest, a fast unit testing framework built by the Vite team.
 * Vitest is designed to be a modern alternative to Jest with better performance and native
 * TypeScript support.
 * 
 * 🔧 WHY VITEST OVER JEST?
 * - Faster execution due to native ESM support and Vite's optimization
 * - Better TypeScript integration without additional setup
 * - Hot Module Replacement (HMR) for tests during development
 * - Compatible with Jest's API, making migration easier
 * - Built-in code coverage without additional plugins
 * 
 * 📚 KEY CONCEPTS DEMONSTRATED:
 * - Configuration as Code: Using TypeScript for type-safe configuration
 * - Path Resolution: Setting up import aliases for cleaner test imports
 * - Environment Configuration: Specifying the runtime environment for tests
 * - Global Test Utilities: Making test functions available without imports
 * 
 * This setup enables our technical analysis engine tests to run efficiently
 * with proper module resolution and TypeScript support.
 */

// Import the configuration function from Vitest
// defineConfig provides TypeScript intellisense and validation for the config object
import { defineConfig } from 'vitest/config'

// Import Node.js path utilities for resolving file paths
// This is needed to create absolute paths for the alias configuration
import path from 'path'

/**
 * Export the Vitest configuration using defineConfig wrapper
 * 
 * defineConfig is a utility function that:
 * - Provides TypeScript autocompletion for configuration options
 * - Validates configuration properties at build time
 * - Ensures compatibility with Vitest's expected configuration schema
 * 
 * This pattern is common in modern build tools (Vite, Vitest, etc.)
 * and provides a better developer experience than plain JavaScript objects.
 */
export default defineConfig({
  /**
   * Test Configuration Section
   * 
   * This section configures how Vitest runs and executes tests.
   * These settings affect the test runtime environment and available APIs.
   */
  test: {
    /**
     * Global Test APIs (globals: true)
     * 
     * When enabled, this makes test functions like describe(), it(), expect()
     * available globally without needing to import them in each test file.
     * 
     * 🎯 BENEFITS:
     * - Cleaner test files without repetitive imports
     * - Familiar Jest-like experience for developers
     * - Reduced boilerplate in test files
     * 
     * 🔄 ALTERNATIVE APPROACH:
     * If set to false, you'd need to import in each test file:
     * import { describe, it, expect } from 'vitest'
     * 
     * For our technical analysis tests, this makes the test files cleaner
     * and focuses attention on the actual test logic rather than imports.
     */
    globals: true,

    /**
     * Test Environment (environment: 'node')
     * 
     * Specifies the JavaScript runtime environment for executing tests.
     * 
     * 🖥️ ENVIRONMENT OPTIONS:
     * - 'node': Server-side Node.js environment (our choice)
     * - 'jsdom': Browser-like environment with DOM APIs
     * - 'happy-dom': Lightweight browser environment alternative
     * - 'edge-runtime': Edge computing environment
     * 
     * 🎯 WHY 'node' FOR OUR PROJECT:
     * - Our technical analysis engine runs server-side calculations
     * - No DOM manipulation needed for mathematical computations
     * - Better performance for CPU-intensive indicator calculations
     * - Matches the Lambda runtime environment where code will deploy
     * 
     * This ensures our tests run in an environment similar to production.
     */
    environment: 'node',
  },

  /**
   * Module Resolution Configuration
   * 
   * This section configures how Vitest resolves module imports,
   * particularly important for TypeScript projects with path aliases.
   */
  resolve: {
    /**
     * Import Aliases Configuration
     * 
     * Aliases allow you to use shorter, more readable import paths
     * instead of complex relative paths like '../../../lib/database'.
     * 
     * 🎯 PATH ALIAS BENEFITS:
     * - Cleaner imports: '@/lib/database' vs '../../../lib/database'
     * - Refactoring safety: Moving files doesn't break imports
     * - Consistency: Same alias works from any directory depth
     * - IDE support: Better autocomplete and navigation
     * 
     * 📁 HOW IT WORKS:
     * - '@' becomes an alias for the './src' directory
     * - path.resolve(__dirname, './src') creates absolute path to src folder
     * - __dirname is the directory containing this config file
     * - './src' is relative to the config file location
     * 
     * 💡 EXAMPLE USAGE IN TESTS:
     * Instead of: import { TechnicalAnalysisEngine } from '../../../lib/technical-analysis/engine'
     * You can use: import { TechnicalAnalysisEngine } from '@/lib/technical-analysis/engine'
     * 
     * This alias matches the one defined in tsconfig.json, ensuring
     * consistency between TypeScript compilation and test execution.
     */
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})