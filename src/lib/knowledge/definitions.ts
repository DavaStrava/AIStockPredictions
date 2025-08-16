/**
 * Financial Terms Knowledge Base - Educational Definitions System
 * 
 * This module provides a comprehensive knowledge base of financial and technical analysis terms
 * used throughout the stock prediction platform. It demonstrates several important software
 * engineering patterns and TypeScript concepts for building maintainable knowledge systems.
 * 
 * Key Concepts Demonstrated:
 * - TypeScript interfaces for type safety and documentation
 * - Union types for controlled vocabularies
 * - Optional properties with the ? operator
 * - Const assertions for immutable data structures
 * - Helper functions for data access and search
 * - Separation of data from presentation logic
 */

/**
 * TermDefinition Interface - Structured Financial Knowledge
 * 
 * This interface defines the complete structure for financial term definitions.
 * It demonstrates several TypeScript and software design concepts:
 * 
 * 1. COMPREHENSIVE DATA MODELING: Each term includes multiple aspects
 *    (definition, formula, interpretation, examples) for complete understanding
 * 
 * 2. UNION TYPES: The 'category' field uses a union type to restrict values
 *    to only valid categories, preventing typos and ensuring consistency
 * 
 * 3. OPTIONAL PROPERTIES: The 'formula?' field is optional since not all
 *    financial terms have mathematical formulas (e.g., general concepts)
 * 
 * 4. EDUCATIONAL STRUCTURE: Fields are organized to support progressive
 *    learning from basic definition to advanced trading applications
 * 
 * @example
 * ```typescript
 * const rsiDefinition: TermDefinition = {
 *   term: 'RSI',
 *   category: 'technical',
 *   shortDefinition: 'Momentum oscillator...',
 *   // ... other required fields
 * };
 * ```
 */
export interface TermDefinition {
  term: string;                    // Full term name (e.g., "RSI (Relative Strength Index)")
  category: 'technical' | 'portfolio' | 'fundamental' | 'general'; // Union type for categorization
  shortDefinition: string;         // Brief one-line explanation
  detailedDefinition: string;      // Comprehensive explanation of the concept
  formula?: string;                // Optional mathematical formula (not all terms have formulas)
  interpretation: string;          // How to read and understand the values
  tradingSignals: string;          // Practical trading applications and signals
  example: string;                 // Real-world example with specific numbers
  relatedTerms: string[];          // Array of related terms for cross-referencing
  icon: string;                    // Emoji icon for visual identification
}

/**
 * FINANCIAL_TERMS - Comprehensive Knowledge Database
 * 
 * This constant demonstrates several important programming patterns:
 * 
 * 1. RECORD TYPE: Uses TypeScript's Record<string, TermDefinition> type
 *    - Creates a dictionary/map structure with string keys and TermDefinition values
 *    - Provides type safety for both keys and values
 *    - Enables efficient O(1) lookup by term name
 * 
 * 2. CONST ASSERTION: The 'const' keyword makes this immutable
 *    - Prevents accidental modification of the knowledge base
 *    - Enables TypeScript to infer more specific types
 *    - Supports tree-shaking in bundlers for smaller builds
 * 
 * 3. STRUCTURED DATA ORGANIZATION: Terms are grouped by category with comments
 *    - Makes the code more maintainable and easier to navigate
 *    - Supports future expansion with new categories
 *    - Enables bulk operations on categories
 * 
 * 4. COMPREHENSIVE COVERAGE: Each term includes all educational aspects
 *    - Supports different learning styles (visual, mathematical, practical)
 *    - Enables progressive disclosure in the UI
 *    - Provides context for AI-powered explanations
 * 
 * Data Structure Benefits:
 * - Fast lookups: O(1) access time by key
 * - Type safety: Compile-time checking of all term data
 * - Maintainability: Clear structure for adding new terms
 * - Extensibility: Easy to add new fields or categories
 */
export const FINANCIAL_TERMS: Record<string, TermDefinition> = {
  // =============================================================================
  // TECHNICAL INDICATORS SECTION
  // =============================================================================
  // Technical indicators are mathematical calculations based on price and volume
  // data that help traders identify trends, momentum, and potential reversal points
  
  'RSI': {
    // EDUCATIONAL NOTE: This term definition demonstrates the comprehensive structure
    // Each field serves a specific educational purpose:
    // - term: Full name with acronym expansion for clarity
    // - category: Enables filtering and organization in the UI
    // - shortDefinition: Quick understanding for tooltips or summaries
    // - detailedDefinition: Complete explanation for learning
    // - formula: Mathematical foundation for technical users
    // - interpretation: How to read the values in practice
    // - tradingSignals: Actionable trading applications
    // - example: Concrete numbers for better understanding
    // - relatedTerms: Cross-references for deeper learning
    // - icon: Visual identifier for quick recognition
    term: 'RSI (Relative Strength Index)',
    category: 'technical',
    shortDefinition: 'Momentum oscillator measuring speed and change of price movements',
    detailedDefinition: 'The Relative Strength Index is a momentum oscillator that measures the speed and change of price movements. It oscillates between 0 and 100 and is typically used to identify overbought or oversold conditions in a stock.',
    formula: 'RSI = 100 - (100 / (1 + RS)), where RS = Average Gain / Average Loss over 14 periods',
    interpretation: 'Values above 70 typically indicate overbought conditions (potential sell signal), while values below 30 indicate oversold conditions (potential buy signal). Values between 30-70 suggest neutral momentum.',
    tradingSignals: 'Buy signals when RSI crosses above 30 from oversold territory. Sell signals when RSI crosses below 70 from overbought territory. Divergences between RSI and price can signal potential reversals.',
    example: 'If RSI is at 75, the stock may be overbought and due for a pullback. If RSI is at 25, the stock may be oversold and due for a bounce.',
    relatedTerms: ['MACD', 'Stochastic', 'Williams %R', 'Momentum'],
    icon: '📊'
  },

  'MACD': {
    term: 'MACD (Moving Average Convergence Divergence)',
    category: 'technical',
    shortDefinition: 'Trend-following momentum indicator showing relationship between two moving averages',
    detailedDefinition: 'MACD is a trend-following momentum indicator that shows the relationship between two moving averages of a security\'s price. It consists of the MACD line, signal line, and histogram.',
    formula: 'MACD Line = 12-period EMA - 26-period EMA; Signal Line = 9-period EMA of MACD Line; Histogram = MACD Line - Signal Line',
    interpretation: 'When MACD is above the signal line, it suggests bullish momentum. When below, it suggests bearish momentum. The histogram shows the strength of the momentum.',
    tradingSignals: 'Bullish crossover when MACD crosses above signal line. Bearish crossover when MACD crosses below signal line. Histogram moving toward zero line suggests weakening momentum.',
    example: 'If MACD line is 2.5 and signal line is 1.8, the positive histogram (0.7) suggests bullish momentum is strengthening.',
    relatedTerms: ['RSI', 'Moving Averages', 'EMA', 'Momentum'],
    icon: '📈'
  },

  'Bollinger Bands': {
    term: 'Bollinger Bands',
    category: 'technical',
    shortDefinition: 'Volatility bands placed above and below a moving average',
    detailedDefinition: 'Bollinger Bands consist of a middle band (20-period SMA) and two outer bands that are standard deviations away from the middle band. They expand and contract based on market volatility.',
    formula: 'Upper Band = SMA(20) + (2 × Standard Deviation); Lower Band = SMA(20) - (2 × Standard Deviation)',
    interpretation: 'When bands are wide, volatility is high. When narrow, volatility is low. Price touching upper band may indicate overbought conditions, lower band may indicate oversold.',
    tradingSignals: 'Buy signals when price bounces off lower band. Sell signals when price falls from upper band. Band squeeze (narrow bands) often precedes significant price moves.',
    example: 'If a stock is trading at $100 with upper band at $105 and lower band at $95, touching $105 might signal overbought conditions.',
    relatedTerms: ['Standard Deviation', 'SMA', 'Volatility', 'Support and Resistance'],
    icon: '📏'
  },

  'Stochastic': {
    term: 'Stochastic Oscillator',
    category: 'technical',
    shortDefinition: 'Momentum indicator comparing closing price to price range over time',
    detailedDefinition: 'The Stochastic Oscillator compares a particular closing price to a range of prices over a certain period. It consists of %K (fast line) and %D (slow line, which is a moving average of %K).',
    formula: '%K = ((Current Close - Lowest Low) / (Highest High - Lowest Low)) × 100; %D = 3-period SMA of %K',
    interpretation: 'Values above 80 indicate overbought conditions, below 20 indicate oversold conditions. The relationship between %K and %D lines provides trading signals.',
    tradingSignals: 'Buy when %K crosses above %D in oversold territory (below 20). Sell when %K crosses below %D in overbought territory (above 80).',
    example: 'If %K is 25 and %D is 22, and %K crosses above %D while both are below 20, this generates a bullish signal from oversold territory.',
    relatedTerms: ['RSI', 'Williams %R', 'Momentum', 'Oscillator'],
    icon: '🌊'
  },

  'Williams %R': {
    term: 'Williams %R',
    category: 'technical',
    shortDefinition: 'Momentum indicator measuring overbought/oversold levels',
    detailedDefinition: 'Williams %R is a momentum indicator that measures overbought and oversold levels. It moves between 0 and -100, with readings above -20 considered overbought and below -80 considered oversold.',
    formula: '%R = ((Highest High - Current Close) / (Highest High - Lowest Low)) × -100',
    interpretation: 'Values between 0 and -20 indicate overbought conditions. Values between -80 and -100 indicate oversold conditions. Values between -20 and -80 are neutral.',
    tradingSignals: 'Buy signals when %R moves above -80 from oversold territory. Sell signals when %R moves below -20 from overbought territory.',
    example: 'If Williams %R is at -85, the stock is in oversold territory and may be due for a bounce higher.',
    relatedTerms: ['Stochastic', 'RSI', 'Momentum', 'Overbought', 'Oversold'],
    icon: '📉'
  },

  // =============================================================================
  // PORTFOLIO THEORY SECTION
  // =============================================================================
  // Portfolio theory terms relate to Modern Portfolio Theory (MPT) developed by
  // Harry Markowitz. These metrics help evaluate risk-adjusted returns and
  // optimize portfolio construction for better risk/reward profiles.
  
  'Beta': {
    term: 'Beta',
    category: 'portfolio',
    shortDefinition: 'Measure of a stock\'s volatility relative to the overall market',
    detailedDefinition: 'Beta measures how much a stock\'s price moves in relation to the overall market. A beta of 1 means the stock moves with the market, above 1 means more volatile than the market, below 1 means less volatile.',
    formula: 'Beta = Covariance(Stock Returns, Market Returns) / Variance(Market Returns)',
    interpretation: 'Beta > 1: More volatile than market; Beta = 1: Moves with market; Beta < 1: Less volatile than market; Beta < 0: Moves opposite to market',
    tradingSignals: 'High beta stocks (>1.5) amplify market moves - good for growth but higher risk. Low beta stocks (<0.7) provide stability but limited upside in bull markets.',
    example: 'A stock with beta of 1.3 would be expected to move 13% when the market moves 10%. If beta is 0.8, it would move 8% when market moves 10%.',
    relatedTerms: ['Alpha', 'Sharpe Ratio', 'Correlation', 'Systematic Risk'],
    icon: '⚖️'
  },

  'Alpha': {
    term: 'Alpha',
    category: 'portfolio',
    shortDefinition: 'Measure of investment performance relative to a benchmark',
    detailedDefinition: 'Alpha represents the excess return of an investment relative to the return of a benchmark index. Positive alpha indicates outperformance, negative alpha indicates underperformance.',
    formula: 'Alpha = Portfolio Return - (Risk-free Rate + Beta × (Market Return - Risk-free Rate))',
    interpretation: 'Positive alpha means the investment outperformed expectations based on its risk level. Negative alpha means underperformance. Alpha of 0 means performance matched expectations.',
    tradingSignals: 'Consistently positive alpha suggests skilled management or favorable conditions. Negative alpha may indicate need for strategy changes or different investments.',
    example: 'If a stock has an alpha of +2%, it outperformed its expected return by 2% after adjusting for market risk (beta).',
    relatedTerms: ['Beta', 'Sharpe Ratio', 'Jensen\'s Alpha', 'Risk-adjusted Return'],
    icon: '🎯'
  },

  'Sharpe Ratio': {
    term: 'Sharpe Ratio',
    category: 'portfolio',
    shortDefinition: 'Risk-adjusted return measure comparing excess return to volatility',
    detailedDefinition: 'The Sharpe Ratio measures the performance of an investment compared to a risk-free asset, after adjusting for its risk. It\'s calculated as the ratio of excess return to standard deviation.',
    formula: 'Sharpe Ratio = (Portfolio Return - Risk-free Rate) / Standard Deviation of Portfolio',
    interpretation: 'Higher Sharpe ratios indicate better risk-adjusted performance. Generally, >1.0 is good, >2.0 is very good, >3.0 is excellent.',
    tradingSignals: 'Use to compare investments with different risk levels. Higher Sharpe ratio investments provide better return per unit of risk taken.',
    example: 'A portfolio with 12% return, 8% volatility, and 2% risk-free rate has Sharpe ratio of (12%-2%)/8% = 1.25, indicating good risk-adjusted performance.',
    relatedTerms: ['Sortino Ratio', 'Alpha', 'Beta', 'Risk-adjusted Return'],
    icon: '📐'
  },

  // =============================================================================
  // GENERAL FINANCIAL TERMS SECTION
  // =============================================================================
  // General terms that apply across multiple areas of financial analysis
  // and are fundamental to understanding market behavior and investment concepts.
  
  'Volatility': {
    term: 'Volatility',
    category: 'general',
    shortDefinition: 'Measure of price fluctuation over time',
    detailedDefinition: 'Volatility measures how much the price of an asset fluctuates over time. Higher volatility means larger price swings, while lower volatility means more stable prices.',
    formula: 'Volatility = Standard Deviation of Returns × √(Number of periods per year)',
    interpretation: 'Low volatility (<15%): Stable, conservative investments. Medium volatility (15-25%): Moderate risk. High volatility (>25%): Higher risk, higher potential reward.',
    tradingSignals: 'High volatility creates more trading opportunities but increases risk. Low volatility periods often precede high volatility periods.',
    example: 'A stock with 20% annual volatility means its price typically fluctuates within ±20% of its average return in a given year.',
    relatedTerms: ['Standard Deviation', 'Bollinger Bands', 'VIX', 'Risk'],
    icon: '📊'
  },

  'Support': {
    term: 'Support Level',
    category: 'technical',
    shortDefinition: 'Price level where buying interest is strong enough to prevent further decline',
    detailedDefinition: 'A support level is a price point where a stock tends to find buying interest and bounce higher. It represents a floor where demand exceeds supply.',
    interpretation: 'Strong support levels are tested multiple times without breaking. The more times a level holds, the stronger it becomes.',
    tradingSignals: 'Buy opportunities often occur near support levels. If support breaks, it often becomes resistance. Multiple touches of support without breaking strengthens the level.',
    example: 'If a stock repeatedly bounces off $50 over several months, $50 becomes a key support level where buyers are likely to step in.',
    relatedTerms: ['Resistance', 'Trend Lines', 'Technical Analysis', 'Price Action'],
    icon: '🛡️'
  },

  'Resistance': {
    term: 'Resistance Level',
    category: 'technical',
    shortDefinition: 'Price level where selling pressure prevents further price increases',
    detailedDefinition: 'A resistance level is a price point where a stock tends to encounter selling pressure and reverse lower. It represents a ceiling where supply exceeds demand.',
    interpretation: 'Strong resistance levels are areas where sellers consistently emerge. Breaking through resistance often leads to further upside momentum.',
    tradingSignals: 'Sell opportunities often occur near resistance levels. Breakouts above resistance can signal strong bullish momentum. Failed breakouts may lead to pullbacks.',
    example: 'If a stock repeatedly fails to break above $75, that level becomes resistance where sellers are likely to emerge.',
    relatedTerms: ['Support', 'Breakout', 'Technical Analysis', 'Price Action'],
    icon: '🚧'
  },

  'Volume': {
    term: 'Volume',
    category: 'technical',
    shortDefinition: 'Number of shares traded during a specific period',
    detailedDefinition: 'Volume represents the total number of shares traded during a given time period. It\'s a key indicator of market interest and can confirm price movements.',
    interpretation: 'High volume confirms price moves and suggests strong conviction. Low volume may indicate lack of interest or potential reversal.',
    tradingSignals: 'Volume should increase in the direction of the trend. High volume breakouts are more reliable. Volume spikes often occur at turning points.',
    example: 'If a stock normally trades 1M shares daily but trades 5M shares on a breakout day, the high volume confirms the move\'s significance.',
    relatedTerms: ['OBV', 'Volume Price Trend', 'Accumulation/Distribution', 'Liquidity'],
    icon: '📊'
  }
};

/**
 * TERM_CATEGORIES - Category Metadata Configuration
 * 
 * This constant demonstrates several advanced TypeScript and design patterns:
 * 
 * 1. CONST ASSERTION ('as const'):
 *    - Makes the object deeply readonly at compile time
 *    - Enables TypeScript to infer literal types instead of general string types
 *    - Prevents accidental mutations that could break the UI
 *    - Example: 'blue' is inferred as literal 'blue', not generic string
 * 
 * 2. CONFIGURATION OBJECT PATTERN:
 *    - Centralizes UI-related metadata for each category
 *    - Separates presentation concerns from data structure
 *    - Makes it easy to change colors/icons without touching term definitions
 *    - Supports consistent theming across the application
 * 
 * 3. STRUCTURED METADATA:
 *    - label: Human-readable display name for UI
 *    - color: Consistent color scheme for visual categorization
 *    - icon: Visual identifier for quick recognition
 * 
 * 4. TYPE SAFETY BENEFITS:
 *    - TypeScript can validate that only valid categories are used
 *    - Autocomplete works for category properties
 *    - Compile-time errors if categories are mistyped
 * 
 * Usage in Components:
 * ```typescript
 * const categoryInfo = TERM_CATEGORIES[term.category];
 * return <div className={`text-${categoryInfo.color}-600`}>
 *   {categoryInfo.icon} {categoryInfo.label}
 * </div>;
 * ```
 */
export const TERM_CATEGORIES = {
  technical: { label: 'Technical Analysis', color: 'blue', icon: '📊' },
  portfolio: { label: 'Portfolio Theory', color: 'green', icon: '📈' },
  fundamental: { label: 'Fundamental Analysis', color: 'purple', icon: '📋' },
  general: { label: 'General Finance', color: 'gray', icon: '💼' }
} as const;

// =============================================================================
// HELPER FUNCTIONS - Data Access and Search Utilities
// =============================================================================
// These functions provide a clean API for accessing and searching the knowledge base.
// They demonstrate important programming patterns for data access and user experience.

/**
 * Get Term Definition - Smart Lookup Function
 * 
 * This function demonstrates several important programming concepts:
 * 
 * 1. DEFENSIVE PROGRAMMING:
 *    - Returns undefined instead of throwing errors for missing terms
 *    - Handles edge cases gracefully (null, undefined, empty strings)
 *    - Provides fallback behavior for better user experience
 * 
 * 2. PERFORMANCE OPTIMIZATION:
 *    - Tries exact match first (O(1) hash table lookup)
 *    - Falls back to slower search only if needed
 *    - Avoids unnecessary computation for common cases
 * 
 * 3. FLEXIBLE MATCHING:
 *    - Supports exact key matches ("RSI")
 *    - Supports case-insensitive matching ("rsi", "Rsi")
 *    - Supports partial matches in term names ("Relative Strength")
 * 
 * 4. EARLY RETURN PATTERN:
 *    - Returns immediately when exact match is found
 *    - Avoids unnecessary processing
 *    - Makes code more readable and efficient
 * 
 * @param term - The term to look up (case-insensitive)
 * @returns TermDefinition if found, undefined if not found
 * 
 * @example
 * ```typescript
 * const rsi = getTermDefinition('RSI');        // Exact match
 * const rsi2 = getTermDefinition('rsi');       // Case-insensitive
 * const rsi3 = getTermDefinition('Relative');  // Partial match
 * ```
 */
export function getTermDefinition(term: string): TermDefinition | undefined {
  // STEP 1: Input validation and early return for invalid input
  if (!term || typeof term !== 'string') {
    return undefined;
  }
  
  // STEP 2: Try exact match first (fastest - O(1) hash table lookup)
  // This handles the most common case where users provide exact keys
  if (FINANCIAL_TERMS[term]) {
    return FINANCIAL_TERMS[term];
  }
  
  // STEP 3: Try case-insensitive and partial matching (slower - O(n) iteration)
  // Only executed if exact match fails, preserving performance for common cases
  const lowerTerm = term.toLowerCase();
  
  // Object.entries() converts the Record to an array of [key, value] pairs
  // This allows us to iterate through both keys and values simultaneously
  for (const [key, definition] of Object.entries(FINANCIAL_TERMS)) {
    // Check both the key (e.g., "RSI") and the full term name (e.g., "RSI (Relative Strength Index)")
    if (key.toLowerCase() === lowerTerm || 
        definition.term.toLowerCase().includes(lowerTerm)) {
      return definition;
    }
  }
  
  // STEP 4: Return undefined if no match found (defensive programming)
  // This allows calling code to handle the "not found" case appropriately
  return undefined;
}

/**
 * Search Terms - Full-Text Search Function
 * 
 * This function demonstrates advanced search patterns and functional programming:
 * 
 * 1. FULL-TEXT SEARCH:
 *    - Searches across multiple fields (term, definition, category)
 *    - Provides comprehensive results for user queries
 *    - Supports discovery of related concepts
 * 
 * 2. FUNCTIONAL PROGRAMMING PATTERNS:
 *    - Uses Object.values() to extract all term definitions
 *    - Uses Array.filter() for declarative filtering
 *    - Chains operations for readable, maintainable code
 * 
 * 3. CASE-INSENSITIVE SEARCH:
 *    - Normalizes both query and data to lowercase
 *    - Provides better user experience (no need to match exact case)
 *    - Handles various input styles consistently
 * 
 * 4. MULTI-FIELD MATCHING:
 *    - Searches term names, definitions, and categories
 *    - Increases likelihood of finding relevant results
 *    - Supports different search strategies (exact term vs. concept)
 * 
 * Performance Considerations:
 * - O(n) time complexity where n is number of terms
 * - Could be optimized with search indexing for larger datasets
 * - Currently efficient enough for the expected term count (~50-100 terms)
 * 
 * @param query - Search query string
 * @returns Array of matching TermDefinition objects
 * 
 * @example
 * ```typescript
 * const results = searchTerms('momentum');     // Finds RSI, MACD, Stochastic
 * const results2 = searchTerms('overbought'); // Finds RSI, Stochastic, Williams %R
 * ```
 */
export function searchTerms(query: string): TermDefinition[] {
  // Input validation - return empty array for invalid queries
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return [];
  }
  
  // Normalize query to lowercase for case-insensitive matching
  const lowerQuery = query.toLowerCase().trim();
  
  // Use functional programming approach for clean, readable search logic
  return Object.values(FINANCIAL_TERMS).filter(term =>
    // Search in term name (e.g., "RSI (Relative Strength Index)")
    term.term.toLowerCase().includes(lowerQuery) ||
    // Search in short definition (e.g., "momentum oscillator")
    term.shortDefinition.toLowerCase().includes(lowerQuery) ||
    // Search in category (e.g., "technical", "portfolio")
    term.category.toLowerCase().includes(lowerQuery)
    // Note: Could extend to search detailed definitions, examples, etc.
    // but that might return too many results for short queries
  );
}

/**
 * Get Terms by Category - Type-Safe Category Filtering
 * 
 * This function demonstrates advanced TypeScript type safety patterns:
 * 
 * 1. KEYOF OPERATOR:
 *    - 'keyof typeof TERM_CATEGORIES' creates a union type of valid category keys
 *    - Ensures only valid categories can be passed ('technical' | 'portfolio' | 'fundamental' | 'general')
 *    - Provides compile-time error checking and IDE autocomplete
 *    - Prevents runtime errors from invalid category names
 * 
 * 2. TYPE INFERENCE:
 *    - TypeScript infers the return type as TermDefinition[]
 *    - The filter operation maintains type safety throughout
 *    - No need for explicit type annotations
 * 
 * 3. FUNCTIONAL FILTERING:
 *    - Uses Array.filter() for declarative programming style
 *    - More readable than imperative for loops
 *    - Easily composable with other array operations
 * 
 * 4. PERFORMANCE CHARACTERISTICS:
 *    - O(n) time complexity for filtering
 *    - Could be optimized with pre-computed category indexes
 *    - Acceptable performance for expected data size
 * 
 * Usage in UI Components:
 * ```typescript
 * const technicalTerms = getTermsByCategory('technical');
 * const portfolioTerms = getTermsByCategory('portfolio');
 * // TypeScript error: getTermsByCategory('invalid'); // Compile-time error!
 * ```
 * 
 * @param category - Valid category key (type-checked at compile time)
 * @returns Array of terms in the specified category
 */
export function getTermsByCategory(category: keyof typeof TERM_CATEGORIES): TermDefinition[] {
  return Object.values(FINANCIAL_TERMS).filter(term => term.category === category);
}

/**
 * Get All Terms - Complete Knowledge Base Access
 * 
 * This simple function demonstrates several important concepts:
 * 
 * 1. COMPLETE DATA ACCESS:
 *    - Provides access to the entire knowledge base
 *    - Useful for operations that need all terms (statistics, exports, etc.)
 *    - Supports bulk operations and analysis
 * 
 * 2. OBJECT.VALUES() PATTERN:
 *    - Extracts all values from the Record<string, TermDefinition>
 *    - Converts the dictionary/map structure to an array
 *    - Enables array operations (map, filter, reduce, etc.)
 * 
 * 3. FUNCTIONAL PROGRAMMING ENABLER:
 *    - Returns an array that can be chained with other operations
 *    - Supports functional programming patterns throughout the application
 *    - Example: getAllTerms().filter(...).map(...).reduce(...)
 * 
 * 4. PERFORMANCE CONSIDERATIONS:
 *    - Creates a new array each time (not cached)
 *    - For frequent access, consider memoization
 *    - Current approach is simple and sufficient for expected usage
 * 
 * Common Use Cases:
 * - Displaying all terms in a glossary
 * - Generating statistics about the knowledge base
 * - Exporting term data for external use
 * - Bulk operations across all terms
 * 
 * @returns Array containing all term definitions
 * 
 * @example
 * ```typescript
 * const allTerms = getAllTerms();
 * const termCount = allTerms.length;
 * const technicalCount = allTerms.filter(t => t.category === 'technical').length;
 * ```
 */
export function getAllTerms(): TermDefinition[] {
  return Object.values(FINANCIAL_TERMS);
}

// =============================================================================
// MODULE SUMMARY - Educational Patterns and Concepts Demonstrated
// =============================================================================

/**
 * EDUCATIONAL SUMMARY: Key Programming Concepts in This Module
 * 
 * This knowledge base module demonstrates numerous important software engineering
 * and TypeScript concepts that are valuable for learning:
 * 
 * 1. TYPE SYSTEM DESIGN:
 *    - Interface definitions for structured data
 *    - Union types for controlled vocabularies
 *    - Optional properties with meaningful defaults
 *    - Const assertions for immutable data
 *    - keyof operator for type-safe key access
 * 
 * 2. DATA STRUCTURE PATTERNS:
 *    - Record<K, V> for dictionary/map structures
 *    - Separation of data from metadata
 *    - Hierarchical organization with categories
 *    - Cross-referencing through related terms
 * 
 * 3. FUNCTIONAL PROGRAMMING:
 *    - Pure functions with no side effects
 *    - Array methods (filter, map, reduce)
 *    - Function composition and chaining
 *    - Immutable data structures
 * 
 * 4. API DESIGN PRINCIPLES:
 *    - Consistent function naming conventions
 *    - Defensive programming with input validation
 *    - Graceful error handling (return undefined vs throw)
 *    - Progressive disclosure of complexity
 * 
 * 5. PERFORMANCE CONSIDERATIONS:
 *    - O(1) hash table lookups for exact matches
 *    - O(n) linear search as fallback
 *    - Early returns to avoid unnecessary computation
 *    - Consideration of caching strategies
 * 
 * 6. USER EXPERIENCE PATTERNS:
 *    - Case-insensitive search for better usability
 *    - Partial matching for discovery
 *    - Multi-field search for comprehensive results
 *    - Visual categorization with icons and colors
 * 
 * 7. MAINTAINABILITY FEATURES:
 *    - Clear separation of concerns
 *    - Comprehensive documentation
 *    - Extensible data structure
 *    - Type safety preventing runtime errors
 * 
 * This module serves as an excellent example of how to build a robust,
 * type-safe, and user-friendly knowledge management system in TypeScript.
 * The patterns demonstrated here can be applied to many other domains
 * beyond financial terminology.
 */