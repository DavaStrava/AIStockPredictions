/**
 * Technical Analysis Library - Barrel Export Pattern
 * ==================================================
 * 
 * This file demonstrates the "barrel export" pattern, a common JavaScript/TypeScript
 * module organization technique. Instead of having a large index file with detailed
 * documentation and selective exports, we use wildcard exports to re-export everything
 * from our core modules.
 * 
 * What is a Barrel Export?
 * ------------------------
 * A barrel export is a way to rollup exports from several modules into a single
 * convenient module. The barrel itself is a module file that re-exports selected
 * exports of other modules.
 * 
 * Benefits of this approach:
 * - Simplifies imports for consumers of the library
 * - Provides a clean public API surface
 * - Allows internal refactoring without breaking external code
 * - Reduces the maintenance burden of the index file
 * 
 * Usage Examples:
 * --------------
 * Instead of importing from specific files:
 * ```typescript
 * import { TechnicalAnalysisEngine } from './technical-analysis/engine';
 * import { PriceData } from './technical-analysis/types';
 * import { validatePriceData } from './technical-analysis/utils';
 * ```
 * 
 * Users can import everything from the barrel:
 * ```typescript
 * import { TechnicalAnalysisEngine, PriceData, validatePriceData } from './technical-analysis';
 * ```
 * 
 * Trade-offs:
 * -----------
 * Pros:
 * - Cleaner, more maintainable index file
 * - Automatic inclusion of new exports from modules
 * - Consistent with modern JavaScript module patterns
 * 
 * Cons:
 * - Less explicit about what's being exported
 * - Potential for namespace pollution if modules export too much
 * - Harder to see the public API at a glance
 * - May include internal utilities not meant for public use
 */

// Re-export everything from the main technical analysis engine
// This includes the TechnicalAnalysisEngine class and all analyzer functions
export * from './engine';

// Re-export all type definitions and interfaces
// This includes PriceData, TechnicalAnalysisResult, all indicator result types, etc.
export * from './types';

// Re-export all utility functions
// This includes data validation, mathematical calculations, and helper functions
export * from './utils';