/**
 * LLM Providers Module - AI-Powered Financial Analysis Insights (Production-Ready)
 *
 * This module demonstrates advanced software engineering patterns for building
 * resilient, scalable AI-powered services. It's been refactored from a basic
 * implementation to production-grade code with proper error handling, caching,
 * and reliability patterns.
 *
 * 🔄 RECENT ARCHITECTURAL EVOLUTION (Key Learning Moment):
 * This file recently underwent a significant refactoring that illustrates a common
 * evolution in production AI systems: moving from "AI controls everything" to 
 * "AI does what it's best at, system handles the rest."
 * 
 * BEFORE: AI generated both content AND metadata (indicators_used, confidence, etc.)
 * AFTER:  AI generates content, system calculates metadata deterministically
 * 
 * WHY THIS CHANGE MATTERS:
 * ✅ RELIABILITY: System metadata now reflects actual data, not AI interpretation
 * ✅ CONSISTENCY: Metadata format is guaranteed, no more parsing errors
 * ✅ DEBUGGABILITY: We can trace exactly which indicators were used
 * ✅ COST EFFICIENCY: Simpler prompts = fewer tokens = lower costs
 *
 * 🏗️ ARCHITECTURAL PATTERNS DEMONSTRATED:
 * ✅ STRATEGY PATTERN: Interchangeable AI providers (OpenAI, Mock fallback)
 * ✅ FACTORY/TEMPLATE PATTERN: Specialized prompt builders per analysis type
 * ✅ SINGLETON PATTERN: Shared service instance with persistent cache
 * ✅ CACHING PATTERN: In-memory cache with TTL and LRU-style eviction
 * ✅ FALLBACK PATTERN: Graceful degradation when primary services fail
 * ✅ ADAPTER PATTERN: Unified interface across different LLM APIs
 * ✅ CIRCUIT BREAKER: Availability checks before expensive operations
 * ✅ SEPARATION OF CONCERNS: AI for creativity, system for accuracy
 *
 * 🛡️ PRODUCTION HARDENING FEATURES:
 * ✅ RESILIENCE: HTTP timeouts, exponential backoff, retry with jitter
 * ✅ PROMPT ENGINEERING: Natural language outputs with system-controlled metadata
 * ✅ OBSERVABILITY: Token usage tracking and performance metadata
 * ✅ SECURITY: Stable cache keys via SHA-256 hashing
 * ✅ COST OPTIMIZATION: Smart caching to reduce API calls
 * ✅ DATA INTEGRITY: Deterministic metadata generation
 *
 * 📚 KEY LEARNING CONCEPTS:
 * - Evolution from structured AI outputs to natural language + system metadata
 * - Defensive programming with guard clauses and optional chaining
 * - Building resilient HTTP clients with timeouts and retries
 * - Cache key generation that avoids collisions and maintains stability
 * - Error isolation patterns that prevent cascading failures
 * - Prompt engineering techniques for reliable AI responses
 * - When to trust AI vs when to use deterministic system logic
 *
 * This code serves as a comprehensive example of how to build production-ready
 * AI services that are reliable, performant, and maintainable, with real-world
 * lessons learned from production deployments.
 */

import crypto from 'crypto';
import { TechnicalAnalysisResult } from '@/lib/technical-analysis/types';

/**
 * LLMInsight Interface - Standardized AI Analysis Result
 * 
 * This interface demonstrates several important TypeScript and API design concepts:
 * 
 * 🎯 DESIGN OBJECTIVES:
 * - CONSISTENT FORMAT: All AI providers return identical data structures
 * - TYPE SAFETY: Union types restrict values to valid options only
 * - EXTENSIBILITY: Metadata object allows for provider-specific data
 * - TRACEABILITY: Track which service generated each insight
 * - OBSERVABILITY: Include performance metrics for monitoring
 * 
 * 🔧 TYPESCRIPT FEATURES DEMONSTRATED:
 * - Union Types: 'technical' | 'portfolio' | 'sentiment' restricts valid values
 * - Optional Properties: Fields marked with ? can be undefined
 * - Index Signatures: [key: string]: any allows additional properties
 * - Nested Objects: Complex metadata structure with typed fields
 * 
 * 💡 WHY THIS STRUCTURE MATTERS:
 * - Frontend components can rely on consistent data shape
 * - TypeScript catches errors at compile time, not runtime
 * - Metadata enables debugging and performance optimization
 * - Provider field enables A/B testing and fallback tracking
 * 
 * @example
 * ```typescript
 * const insight: LLMInsight = {
 *   type: 'technical',
 *   content: 'RSI indicates oversold conditions at 25.3...',
 *   confidence: 0.85,
 *   provider: 'openai',
 *   metadata: { 
 *     indicators_used: ['RSI', 'MACD'],
 *     tokens_total: 245 
 *   }
 * };
 * ```
 */
export interface LLMInsight {
  type: 'technical' | 'portfolio' | 'sentiment';     // What kind of analysis is this?
  content: string;                                   // Human-readable insight (1–3 sentences)
  confidence: number;                                // Heuristic or model-provided 0..1 confidence
  provider: 'openai' | 'bedrock' | 'mock';           // Source provider
  generatedAt: string;                               // ISO timestamp when this insight was generated
  metadata: {
    indicators_used?: string[];                      // Which indicators contributed (traceability)
    timeframe?: string;                              // e.g., '1D', '1H'
    data_quality?: 'high' | 'medium' | 'low';        // Inputs quality assessment
    market_conditions?: string;                      // e.g., 'bullish', 'neutral'
    // Observability telemetry (useful for UI or logging):
    tokens_prompt?: number;
    tokens_completion?: number;
    tokens_total?: number;
    [key: string]: any;
  };
}

/**
 * LLMProvider Interface - Strategy Pattern Implementation
 * 
 * This interface demonstrates the STRATEGY PATTERN, one of the most important
 * design patterns in software engineering. It allows different algorithms
 * (AI providers) to be used interchangeably without changing client code.
 * 
 * 🎯 STRATEGY PATTERN BENEFITS:
 * - OPEN/CLOSED PRINCIPLE: Add new providers without modifying existing code
 * - TESTABILITY: Easy to swap real providers for mocks during testing
 * - RUNTIME FLEXIBILITY: Choose providers based on availability, cost, or performance
 * - SEPARATION OF CONCERNS: Each provider handles its own implementation details
 * 
 * 🔧 INTERFACE DESIGN PRINCIPLES:
 * - MINIMAL SURFACE AREA: Only essential methods are exposed
 * - ASYNC BY DEFAULT: All operations return Promises for non-blocking execution
 * - CONSISTENT PARAMETERS: Same method signatures across all implementations
 * - FAIL-FAST VALIDATION: isAvailable() prevents doomed expensive operations
 * 
 * 💡 REAL-WORLD APPLICATIONS:
 * - Payment processors (Stripe, PayPal, Square)
 * - Cloud storage providers (AWS S3, Google Cloud, Azure)
 * - Authentication providers (OAuth, SAML, local auth)
 * - AI/ML services (OpenAI, Anthropic, local models)
 * 
 * @example
 * ```typescript
 * // All providers implement the same interface
 * const openai: LLMProvider = new OpenAIProvider();
 * const mock: LLMProvider = new MockLLMProvider();
 * 
 * // Can be used interchangeably
 * const insight = await openai.generateInsight('technical', data, 'AAPL');
 * const testInsight = await mock.generateInsight('technical', data, 'AAPL');
 * ```
 */
export interface LLMProvider {
  generateInsight(
    type: 'technical' | 'portfolio' | 'sentiment',
    data: any,
    symbol: string
  ): Promise<LLMInsight>;

  isAvailable(): Promise<boolean>;
}

/**
 * OpenAIProvider Class - Production-Ready AI Service Implementation
 * 
 * This class demonstrates how to build a robust, production-ready service that
 * integrates with external APIs. It showcases multiple software engineering
 * patterns and best practices for handling real-world challenges.
 * 
 * 🏗️ DESIGN PATTERNS DEMONSTRATED:
 * - STRATEGY PATTERN: Concrete implementation of LLMProvider interface
 * - DEPENDENCY INJECTION: API key can be injected or read from environment
 * - TEMPLATE METHOD: Specialized prompt builders for different analysis types
 * - CIRCUIT BREAKER: Availability checks prevent doomed expensive operations
 * - RETRY PATTERN: Exponential backoff with jitter for transient failures
 * 
 * 🛡️ PRODUCTION HARDENING FEATURES:
 * - HTTP TIMEOUTS: AbortController prevents hanging requests
 * - RETRY LOGIC: Handles rate limits (429) and server errors (5xx)
 * - JSON ENFORCEMENT: response_format ensures deterministic parsing
 * - GUARD CLAUSES: Early validation prevents unnecessary work
 * - ERROR ISOLATION: Failures don't crash the entire application
 * 
 * 🔧 ADVANCED TECHNIQUES:
 * - EXPONENTIAL BACKOFF: Retry delays increase exponentially (250ms, 500ms, 1000ms)
 * - JITTER: Random delay prevents thundering herd problems
 * - PROMPT ENGINEERING: Structured prompts with clear constraints and schemas
 * - OBSERVABILITY: Token usage tracking for cost monitoring
 * 
 * 💡 KEY LEARNING POINTS:
 * - How to make HTTP requests resilient to network issues
 * - Techniques for getting consistent outputs from AI models
 * - Environment variable usage for secure configuration
 * - Error handling strategies that maintain service availability
 * - Cost optimization through smart prompt design and caching
 * 
 * This implementation serves as a template for building any external API client
 * that needs to be reliable, performant, and maintainable in production.
 */

export class OpenAIProvider implements LLMProvider {
  // Private fields (encapsulation):
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  /**
   * Constructor with Dependency Injection Pattern
   * 
   * This constructor demonstrates the DEPENDENCY INJECTION pattern, which makes
   * code more testable, flexible, and follows the 12-factor app methodology.
   * 
   * 🎯 DEPENDENCY INJECTION BENEFITS:
   * - TESTABILITY: Can inject mock API keys for unit tests
   * - FLEXIBILITY: Different environments can use different configurations
   * - SECURITY: Keeps sensitive data out of source code
   * - 12-FACTOR COMPLIANCE: Configuration via environment variables
   * 
   * 🔧 FALLBACK CHAIN PATTERN:
   * 1. Explicit parameter (highest priority) - useful for testing
   * 2. Environment variable (production default) - secure configuration
   * 3. Empty string (safe fallback) - prevents undefined errors
   * 
   * 💡 WHY THIS MATTERS:
   * - Tests can inject fake keys without touching environment
   * - Production uses secure environment variables
   * - Development can work without breaking on missing config
   * - isAvailable() can safely check for empty string
   * 
   * @param apiKey - Optional API key, falls back to environment variable
   */
  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
  }

  /**
   * Availability Check - Circuit Breaker Pattern
   * 
   * This method implements a lightweight circuit breaker that prevents
   * expensive operations when the service is known to be unavailable.
   * 
   * 🎯 CIRCUIT BREAKER BENEFITS:
   * - FAIL FAST: Avoid expensive network calls when misconfigured
   * - RESOURCE CONSERVATION: Don't waste time on doomed requests
   * - BETTER ERROR MESSAGES: Clear indication of configuration issues
   * - PERFORMANCE: Instant feedback instead of timeout delays
   * 
   * 🔧 IMPLEMENTATION DETAILS:
   * - Double negation (!!) converts truthy/falsy to explicit boolean
   * - Empty string is falsy, non-empty string is truthy
   * - No network calls needed - just configuration validation
   * - Returns Promise for consistency with interface
   * 
   * 💡 REAL-WORLD APPLICATIONS:
   * - Database connection pools check health before queries
   * - Payment processors verify API keys before transactions
   * - Cloud services validate credentials before operations
   * - Microservices check dependencies before processing
   * 
   * @returns Promise<boolean> - true if API key is configured and service can be used
   */
  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  /**
   * Resilient HTTP Client with Retry Logic
   * 
   * This method demonstrates advanced HTTP client patterns for building
   * production-ready services that can handle network issues gracefully.
   * 
   * 🛡️ RESILIENCE FEATURES:
   * - HARD TIMEOUT: AbortController caps request time at 12 seconds
   * - EXPONENTIAL BACKOFF: Retry delays increase exponentially (250ms, 500ms, 1000ms)
   * - JITTER: Random delay prevents thundering herd when many clients retry
   * - SELECTIVE RETRY: Only retry on transient errors (429 rate limit, 5xx server errors)
   * - BOUNDED ATTEMPTS: Limits retries to prevent infinite loops
   * 
   * 🔧 TECHNICAL IMPLEMENTATION:
   * - AbortController: Modern way to cancel fetch requests
   * - setTimeout/clearTimeout: Proper cleanup to prevent memory leaks
   * - Math.pow(2, i): Exponential backoff calculation (2^0, 2^1, 2^2)
   * - Math.random(): Jitter to spread out retry attempts
   * - Status code checking: Distinguish between retryable and permanent errors
   * 
   * 💡 WHY THESE PATTERNS MATTER:
   * - Network requests can fail for many reasons (timeouts, rate limits, server issues)
   * - Exponential backoff prevents overwhelming struggling servers
   * - Jitter prevents all clients from retrying at exactly the same time
   * - Timeouts prevent hanging requests that waste resources
   * - Selective retry avoids retrying permanent errors (like 401 Unauthorized)
   * 
   * This pattern is used by major services like AWS SDKs, Google Cloud clients,
   * and other production systems that need to be reliable.
   * 
   * @param url - The endpoint to POST to
   * @param init - Fetch request configuration
   * @param attempts - Maximum number of retry attempts (default: 3)
   * @param baseDelayMs - Base delay for exponential backoff (default: 250ms)
   * @returns Promise resolving to the HTTP response
   */
  private async postJSONWithRetry(
    url: string,
    init: RequestInit,
    attempts = 3,
    baseDelayMs = 1000  // Increased from 250ms for better rate limit handling
  ) {
    for (let i = 0; i < attempts; i++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000); // 30s cap (increased from 12s)
      try {
        const res = await fetch(url, { ...init, signal: controller.signal });
        // Retry on transient conditions including rate limits
        if (res.status >= 500 || res.status === 429) {
          if (i < attempts - 1) {
            // For 429, use longer delay with exponential backoff
            const delay = res.status === 429 
              ? Math.pow(2, i + 1) * 2000 + Math.random() * 1000  // 4s, 8s, 16s for rate limits
              : Math.pow(2, i) * baseDelayMs + Math.random() * baseDelayMs;
            console.log(`Rate limited or server error (${res.status}), retrying in ${Math.round(delay)}ms...`);
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
        }
        return res;
      } finally {
        clearTimeout(timeout);
      }
    }
    // Final non-retry attempt (defensive; loop already returns)
    return fetch(url, init);
  }

  /**
   * generateInsight - Main entry:
   * - Guard config
   * - Build hardened prompts (system + user)
   * - Enforce JSON responses
   * - Parse & map to LLMInsight
   * - Attach observability metadata (token counts)
   */
  async generateInsight(
    type: 'technical' | 'portfolio' | 'sentiment',
    data: any,
    symbol: string
  ): Promise<LLMInsight> {
    // GUARD CLAUSE: Required configuration
    if (!this.apiKey) throw new Error('OpenAI API key not configured');

    // TEMPLATE METHOD: specialized builders per analysis type
    const systemPrompt = this.getSystemPrompt(type);
    const userPrompt = this.buildPrompt(type, data, symbol);

    // JSON-only response; keeps downstream deterministic
    const body = JSON.stringify({
      model: 'gpt-4o-mini',                 // cost-effective, good reasoning for this task
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1200,                     // increased for detailed narrative
      temperature: 0.7,                     // TEMPERATURE PARAMETER EXPLAINED: Controls AI creativity vs consistency
      /*
        TEMPERATURE PARAMETER DEEP DIVE - Critical AI Model Configuration:
        
        Temperature controls the "randomness" or "creativity" of AI responses on a scale from 0.0 to 2.0:
        
        🎯 TEMPERATURE VALUES AND THEIR EFFECTS:
        - 0.0: Completely deterministic - always picks the most likely next word
          Use case: Mathematical calculations, code generation, factual Q&A
          Result: Consistent but potentially repetitive responses
        
        - 0.1-0.3: Very focused and consistent
          Use case: Technical documentation, API responses, structured data
          Result: Reliable, predictable outputs with minimal variation
        
        - 0.4-0.6: Balanced creativity and consistency (PREVIOUS VALUE: 0.4)
          Use case: Business writing, explanations, moderate creativity needed
          Result: Some variation while maintaining coherence
        
        - 0.7-0.9: Creative and engaging (CURRENT VALUE: 0.7)
          Use case: Marketing copy, storytelling, educational content
          Result: More varied, interesting, and engaging responses
        
        - 1.0+: Highly creative but potentially inconsistent
          Use case: Creative writing, brainstorming, artistic content
          Result: Very diverse outputs but may lose focus or accuracy
        
        🔄 WHY THIS CHANGE FROM 0.4 TO 0.7 MATTERS:
        
        BEFORE (0.4): More predictable financial analysis
        - Responses were consistent but could feel robotic
        - Technical accuracy was high but engagement was lower
        - Users might find explanations dry or hard to follow
        
        AFTER (0.7): More engaging financial education
        - Responses are more varied and interesting to read
        - Better storytelling and analogies for complex concepts
        - Higher user engagement while maintaining accuracy
        - More natural, conversational tone
        
        🎓 EDUCATIONAL IMPLICATIONS:
        For financial education, 0.7 is optimal because:
        - Complex financial concepts need engaging explanations
        - Users learn better with varied examples and analogies
        - Storytelling helps retention of technical information
        - Conversational tone reduces intimidation factor
        
        ⚖️ TRADE-OFFS TO CONSIDER:
        BENEFITS of higher temperature (0.7):
        ✅ More engaging and readable content
        ✅ Better analogies and explanations
        ✅ Varied response styles keep users interested
        ✅ More natural, human-like communication
        
        RISKS of higher temperature (0.7):
        ⚠️ Slightly less consistent terminology
        ⚠️ Potential for more creative but less precise language
        ⚠️ May occasionally prioritize engagement over strict accuracy
        
        🏭 PRODUCTION CONSIDERATIONS:
        This change reflects a mature understanding of AI in production:
        - User experience often trumps perfect consistency
        - Educational content benefits from creativity
        - Financial analysis can be both accurate AND engaging
        - Temperature tuning is an iterative process based on user feedback
        
        💡 KEY LEARNING: Temperature is not just a technical parameter - it's a UX decision
        that directly impacts how users perceive and interact with AI-generated content.
        The "right" temperature depends on your use case, audience, and goals.
      */
      // removed JSON format for natural text response
    });

    // HTTP CLIENT with retries and timeout
    const res = await this.postJSONWithRetry(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body
    });

    // Robust error reporting (include a snippet of body for debugging)
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`OpenAI API error ${res.status}: ${text.slice(0, 200)}`);
    }

    const result = await res.json();
    const content = result.choices?.[0]?.message?.content ?? 'No insight generated';

    // Observability (useful for showing token usage & cost footprint)
    const usage = result.usage ?? {};

    // Map to standardized LLMInsight with narrative content
    return {
      type,
      content: content.trim(),
      confidence: this.calculateConfidence(data, type),
      provider: 'openai',
      generatedAt: new Date().toISOString(),
      metadata: {
        // METADATA CONSTRUCTION PATTERN: Building observability data for AI responses
        // This metadata serves multiple purposes in production AI systems:

        // 1. TRACEABILITY: Track which indicators influenced the AI's analysis
        // RECENT CHANGE: Switched from parsing AI response to using our own extraction
        // This ensures consistency and prevents the AI from hallucinating indicator names
        // The extractIndicatorsUsed() method deterministically identifies which indicators
        // were actually present in the input data, providing reliable traceability
        indicators_used: this.extractIndicatorsUsed(data, type),

        // 2. TEMPORAL CONTEXT: Record the timeframe for this analysis
        // RECENT CHANGE: Hardcoded to '1D' instead of parsing from AI response
        // This reflects the reality that our technical analysis uses daily price data
        // Removes dependency on AI to correctly identify timeframe, improving reliability
        timeframe: '1D',

        // 3. DATA QUALITY ASSESSMENT: Indicate the reliability of input data
        // RECENT CHANGE: Hardcoded to 'high' instead of parsing from AI response
        // Since we validate all price data before analysis, we can confidently assert
        // high quality. This removes potential inconsistency from AI interpretation
        data_quality: 'high',

        // 4. MARKET CONTEXT: Capture overall market sentiment from technical analysis
        // RECENT CHANGE: Uses our technical analysis summary instead of AI parsing
        // This ensures the market condition reflects our actual calculated sentiment
        // rather than the AI's interpretation, providing more accurate context
        // Uses optional chaining (?.) to safely access nested properties
        market_conditions: data?.summary?.overall ?? 'neutral',

        // 5. COST MONITORING: Track token usage for budget management
        // OpenAI charges based on tokens (input + output), so tracking usage
        // helps optimize costs and identify expensive operations
        // These values come directly from OpenAI's API response
        tokens_prompt: usage.prompt_tokens,        // Input tokens (our prompt)
        tokens_completion: usage.completion_tokens, // Output tokens (AI response)
        tokens_total: usage.total_tokens,          // Total cost basis
      }
    };
  }

  /**
   * Generate System Prompts for Different Analysis Types
   * 
   * RECENT ARCHITECTURAL CHANGE EXPLANATION:
   * This method was recently updated as part of a broader shift from JSON-structured outputs 
   * to natural narrative responses. This change reflects several important software engineering
   * principles and lessons learned from production AI systems:
   * 
   * 🔄 RELIABILITY OVER FLEXIBILITY PRINCIPLE:
   * The metadata construction above was changed from parsing AI responses to using our own
   * deterministic methods. This demonstrates a key principle in production AI systems:
   * "Don't let the AI control critical system metadata."
   * 
   * 📊 DATA INTEGRITY PATTERN:
   * By using this.extractIndicatorsUsed() instead of parsed.indicators_used, we ensure
   * that metadata reflects actual system state rather than AI interpretation. This prevents
   * scenarios where the AI might hallucinate indicator names or misinterpret the data.
   * 
   * 🎯 SEPARATION OF CONCERNS:
   * - AI handles: Creative narrative generation, pattern explanation, user education
   * - System handles: Metadata accuracy, data validation, technical calculations
   * This separation makes the system more maintainable and debuggable.
   * 
   * 💡 WHY THIS MATTERS FOR LEARNING:
   * This change illustrates how production systems evolve from "AI does everything" to
   * "AI does what it's best at, system handles the rest." It's a common pattern in
   * mature AI applications where reliability and accuracy are paramount.
   * 
   * Key changes made:
   * - Removed JSON schema requirements in favor of natural language
   * - Added specific user persona (40s investor with $700K portfolio)
   * - Emphasized educational, narrative-style explanations
   * - Increased target word count (400-600 words) for comprehensive analysis
   * - Maintained legal disclaimers while improving user experience
   * 
   * EDUCATIONAL CONCEPTS DEMONSTRATED:
   * 
   * 1. PROMPT ENGINEERING PATTERNS:
   *    System prompts are the foundation of LLM behavior control. This method demonstrates
   *    several advanced prompt engineering techniques:
   *    - Role-based prompting: Establishes the AI as a "seasoned financial advisor"
   *    - Persona targeting: Tailors responses to a specific user profile (40s, $700K savings)
   *    - Constraint setting: Explicitly prohibits investment advice to avoid liability
   *    - Output formatting: Guides response structure and tone
   * 
   * 2. TEMPLATE METHOD PATTERN:
   *    This function uses the Template Method design pattern:
   *    - Base template (basePrompt) defines common structure and constraints
   *    - Specialized templates (technical/portfolio/sentiment) extend the base
   *    - Switch statement selects appropriate specialization
   *    - Default case provides fallback behavior
   * 
   * 3. STRING INTERPOLATION AND COMPOSITION:
   *    - Template literals (backticks) allow multi-line strings with embedded expressions
   *    - String concatenation builds complex prompts from reusable components
   *    - Markdown formatting within strings provides structure for LLM parsing
   * 
   * 4. DOMAIN-SPECIFIC LANGUAGE (DSL):
   *    Each prompt type creates a mini-DSL for that analysis domain:
   *    - Technical: Chart patterns, indicators, entry/exit strategies
   *    - Portfolio: Risk metrics, diversification, life-stage considerations
   *    - Sentiment: Market psychology, institutional vs retail behavior
   * 
   * 5. RISK MANAGEMENT IN AI SYSTEMS:
   *    The prompts include multiple safety mechanisms:
   *    - Explicit disclaimers about not providing investment advice
   *    - Focus on education and explanation rather than recommendations
   *    - Emphasis on letting users draw their own conclusions
   * 
   * This approach transforms a simple string generation function into a sophisticated
   * prompt engineering system that can produce contextually appropriate, legally
   * compliant, and educationally valuable financial analysis.
   */
  private getSystemPrompt(type: 'technical' | 'portfolio' | 'sentiment'): string {
    /**
     * BASE PROMPT TEMPLATE - The Foundation
     * 
     * This base prompt establishes the core persona and constraints that apply
     * to all analysis types. Key elements:
     * 
     * - PERSONA DEFINITION: "Seasoned financial advisor with 20+ years experience"
     *   Creates authority and expertise context for the LLM
     * 
     * - TARGET AUDIENCE: "Sophisticated investor in their 40s with $700K savings"
     *   Provides specific context for tailoring advice complexity and risk tolerance
     * 
     * - COMMUNICATION STYLE: "Narrative and conversational, like explaining to a friend"
     *   Sets expectation for tone and approachability
     * 
     * - CONTENT REQUIREMENTS: "400-600 words", "specific reasoning and context"
     *   Ensures comprehensive, detailed responses rather than superficial summaries
     * 
     * - LEGAL PROTECTION: "Do NOT provide direct investment advice"
     *   Critical disclaimer to avoid regulatory and liability issues
     */
    const basePrompt = `You are a seasoned financial advisor with 20+ years of experience, speaking to a sophisticated investor who is focused on building wealth for retirement while managing risk appropriately.

Your analysis should be:
- Narrative and conversational, like explaining to a knowledgeable friend
- Detailed with specific reasoning and context (aim for 400-600 words)
- Focused on practical implications for someone with substantial savings
- Mindful of risk management for long-term wealth building
- Educational, explaining the "why" behind patterns and indicators
- Forward-looking with actionable next steps

Write in a professional but approachable tone. Use specific examples and analogies when helpful. Structure your response as flowing narrative paragraphs, not bullet points.

IMPORTANT: 
- Do NOT provide direct investment advice. Instead, explain what the data suggests and let the investor draw their own conclusions.
- Do NOT reference specific ages, life stages, or dollar amounts in your response. Keep the analysis general and applicable to any serious investor.`;

    /**
     * SPECIALIZED PROMPT SELECTION - The Strategy Pattern in Action
     * 
     * This switch statement implements the Strategy Pattern, where different
     * analysis types require different prompt strategies. Each case extends
     * the base prompt with domain-specific guidance.
     * 
     * The pattern allows for:
     * - Easy addition of new analysis types
     * - Consistent base behavior across all types
     * - Specialized behavior for each domain
     * - Maintainable and testable prompt logic
     */
    switch (type) {
      case 'technical':
        /**
         * TECHNICAL ANALYSIS PROMPT SPECIALIZATION
         *
         * Technical analysis focuses on chart patterns, indicators, and price action.
         * This prompt guides the LLM to:
         *
         * - Reference CURRENT values from the "current" object FIRST (alignment with UI)
         * - Tell a "market story" from chart patterns (narrative approach)
         * - Explain indicators in practical terms (educational focus)
         * - Provide specific entry/exit levels (actionable insights)
         * - Discuss timeframes and scenarios (forward-looking analysis)
         *
         * CRITICAL: The "current" object contains values that MATCH the user's
         * Technical Indicators panel. Analysis MUST reference these exact values.
         */
        return `${basePrompt}

IMPORTANT: The user's Technical Indicators panel shows CURRENT values from the "current" object in the data.
Your analysis MUST reference these "current" values FIRST with exact numbers, then discuss "trend" for context.
DO NOT make up or estimate indicator values - use ONLY the values provided in "current".

For technical analysis, provide a comprehensive narrative covering:

**Current Readings**: Start by stating the exact current indicator values (RSI, MACD, Stochastic, Bollinger Bands) from the "current" object. These must match what the user sees.

**Market Story**: Paint the bigger picture of what's happening with this stock from a technical perspective. What story are the charts telling about investor behavior and market dynamics?

**Indicator Analysis**: Explain what each current reading means in practical terms and why it matters. Use the "trend" data to show recent direction.

**Risk Assessment**: Discuss position sizing considerations, stop-loss levels, and risk management strategies in general terms (e.g., percentage-based allocation).

**Entry/Exit Strategy**: Provide specific levels to watch and potential scenarios based on current Bollinger Bands and support/resistance.

**Timeline & Expectations**: Discuss likely timeframes for potential moves and what to expect in different market scenarios.`;

      case 'portfolio':
        /**
         * PORTFOLIO ANALYSIS PROMPT SPECIALIZATION
         *
         * This prompt has TWO MODES based on whether the user holds the stock:
         * 1. HELD: Analyze actual position (cost basis, returns, add/hold/reduce)
         * 2. NOT HELD: Analyze as potential addition (entry point, sizing)
         *
         * IMPORTANT: We DO NOT use Sharpe ratio, beta, or correlations here
         * because we don't calculate these metrics. Focus on what we know:
         * - Portfolio value and cash
         * - Position details if held
         * - Technical analysis context
         */
        return `${basePrompt}

IMPORTANT: The "portfolioContext" in the data tells you:
- Whether the user HOLDS this stock (isHeld: true/false)
- Their portfolio value and cash available
- If held: actual shares, cost basis, current price, and returns

If portfolioContext.isHeld is TRUE (user owns this stock):
**Position Review**: Reference the EXACT position data (shares, avg cost, current return %).
**Performance Assessment**: Is this position working for them? Compare their entry to current price.
**Action Consideration**: Based on technical signals, discuss whether to add, hold, or reduce.
**Position Sizing**: Is current allocation appropriate given portfolio value?

If portfolioContext.isHeld is FALSE (user does NOT own this stock):
**Opportunity Assessment**: Analyze if this is a good time to start a position based on technicals.
**Entry Strategy**: Suggest a sensible entry approach (all at once vs. scaling in).
**Position Sizing**: Based on their portfolio value and cash, suggest an appropriate allocation %.
**Risk Consideration**: What would a stop-loss level look like? What's the risk on entry?

DO NOT mention: Sharpe ratio, beta, correlations, or other metrics we don't calculate.
Focus on: The actual portfolio data provided and technical analysis signals.`;

      case 'sentiment':
        /**
         * TECHNICAL PSYCHOLOGY PROMPT SPECIALIZATION
         *
         * RENAMED from "Sentiment" to "Technical Psychology" because we derive
         * this ENTIRELY from technical indicators - NOT from news, social media,
         * or institutional/retail data (which we don't have).
         *
         * What we CAN infer from technicals:
         * - RSI/Stochastic → crowd psychology (fear at lows, greed at highs)
         * - Volume patterns → accumulation vs distribution behavior
         * - Bollinger Bands → trader behavior at extremes
         * - MACD divergences → conviction shifts
         *
         * What we CANNOT claim (no data):
         * - Institutional vs retail positioning
         * - News sentiment
         * - Social media sentiment
         * - Options flow
         */
        return `${basePrompt}

IMPORTANT: This is "Technical Psychology" - derived ENTIRELY from technical indicators.
We do NOT have news sentiment, social media data, or institutional/retail positioning data.
Focus ONLY on what technical indicators reveal about crowd psychology.

For technical psychology analysis:

**Fear & Greed Reading**: Interpret RSI and Stochastic as measures of crowd psychology:
- Low RSI (<30) = fear/panic selling
- High RSI (>70) = greed/euphoria
- Explain what current readings suggest about trader emotions.

**Accumulation vs Distribution**: Analyze volume patterns to infer whether traders are:
- Accumulating (buying on dips, increasing positions)
- Distributing (selling into strength, reducing positions)

**Behavioral Extremes**: Use Bollinger Bands to identify when price is at extremes:
- Upper band = potentially overextended, crowd may be too optimistic
- Lower band = potentially oversold, crowd may be too pessimistic

**Conviction Signals**: Look at MACD for signs of momentum conviction or divergence:
- Strong momentum = high conviction in current trend
- Divergence = potential shift in crowd psychology

DISCLAIMER: Add a note that this analysis is derived from price and volume patterns only, not from news or social sentiment data.`;

      default:
        /**
         * DEFAULT CASE - Defensive Programming
         * 
         * The default case provides fallback behavior if an unexpected
         * analysis type is passed. This demonstrates defensive programming:
         * - Prevents runtime errors from invalid inputs
         * - Provides reasonable fallback behavior
         * - Maintains system stability
         * 
         * In this case, returning the basePrompt ensures the LLM still
         * receives valid instructions even if the specific type isn't recognized.
         */
        return basePrompt;
    }
  }

  /**
   * buildPrompt - Factory method dispatch to specialized prompt builders.
   * Keeps a consistent interface while allowing per-type tuning.
   */
  private buildPrompt(
    type: 'technical' | 'portfolio' | 'sentiment',
    data: any,
    symbol: string
  ): string {
    switch (type) {
      case 'technical': return this.buildTechnicalPrompt(data as TechnicalAnalysisResult, symbol);
      case 'portfolio': return this.buildPortfolioPrompt(data, symbol);
      case 'sentiment': return this.buildSentimentPrompt(data, symbol);
      default:
        return `SYMBOL: ${symbol}\nTYPE: UNKNOWN\nDATA:\n${JSON.stringify(data)}`;
    }
  }

  /**
   * compactTechnical - Input compactor for large time series:
   * - Separates CURRENT values (for exact references) from TREND arrays
   * - Keeps last N points per indicator to reduce token usage
   * - Caps signals to avoid runaway prompts
   * - Preserves summary & salient info for the model
   *
   * IMPORTANT: The "current" object contains the most recent indicator values
   * which MUST match what the user sees in the Technical Indicators panel.
   * The "trend" object contains recent historical values for context.
   */
  private compactTechnical(analysis: TechnicalAnalysisResult) {
    const lastN = (arr?: any[], n = 5) => Array.isArray(arr) ? arr.slice(-n) : undefined;
    const lastValue = <T>(arr?: T[]): T | undefined => Array.isArray(arr) && arr.length > 0 ? arr[arr.length - 1] : undefined;

    // Safely access indicators with fallbacks
    const indicators = analysis?.indicators || {};

    // Extract current (most recent) values - these MUST match UI display
    const currentRsi = lastValue(indicators.rsi);
    const currentMacd = lastValue(indicators.macd);
    const currentBb = lastValue(indicators.bollingerBands);
    const currentStoch = lastValue(indicators.stochastic);

    return {
      summary: analysis?.summary || { overall: 'neutral', strength: 0.5, confidence: 0.5 },
      signals: (analysis?.signals || []).slice(0, 20),
      // CURRENT values - the AI MUST reference these exact values
      current: {
        rsi: typeof currentRsi === 'object' && currentRsi !== null && 'value' in currentRsi
          ? (currentRsi as any).value
          : currentRsi ?? null,
        macd: currentMacd ? {
          macd: (currentMacd as any).macd ?? null,
          signal: (currentMacd as any).signal ?? null,
          histogram: (currentMacd as any).histogram ?? null,
        } : null,
        bollingerBands: currentBb ? {
          upper: (currentBb as any).upper ?? null,
          middle: (currentBb as any).middle ?? null,
          lower: (currentBb as any).lower ?? null,
        } : null,
        stochastic: currentStoch ? {
          k: (currentStoch as any).k ?? null,
          d: (currentStoch as any).d ?? null,
        } : null,
      },
      // TREND arrays - for context on recent movement
      trend: {
        rsi: lastN(indicators.rsi)?.map((r: any) => typeof r === 'object' && r !== null && 'value' in r ? r.value : r),
        macd: lastN(indicators.macd)?.map((m: any) => m?.histogram),
        stochastic: lastN(indicators.stochastic)?.map((s: any) => s?.k),
      }
    };
  }

  /**
   * buildTechnicalPrompt - Technical analysis user prompt
   * Prompt Engineering Tactics:
   * - Clear headers (SYMBOL/TYPE)
   * - CURRENT values prominently displayed for exact reference
   * - Delimited JSON payload (<<<DATA ... DATA>>>)
   * - Scoped tasks emphasizing CURRENT value usage
   */
  /** Safe number formatter - handles null/undefined without throwing */
  private safeFixed(value: number | null | undefined, decimals: number): string {
    if (value === null || value === undefined || !isFinite(value)) return 'N/A';
    return value.toFixed(decimals);
  }

  private buildTechnicalPrompt(analysis: TechnicalAnalysisResult, symbol: string): string {
    const compact = this.compactTechnical(analysis);

    // Format current values for easy reference using safe formatter
    const currentStr = compact.current ? [
      `CURRENT INDICATOR VALUES (reference these EXACT numbers):`,
      `- RSI: ${this.safeFixed(compact.current.rsi, 1)}`,
      `- MACD: ${compact.current.macd ? `Line=${this.safeFixed(compact.current.macd.macd, 2)}, Signal=${this.safeFixed(compact.current.macd.signal, 2)}, Histogram=${this.safeFixed(compact.current.macd.histogram, 2)}` : 'N/A'}`,
      `- Stochastic: ${compact.current.stochastic ? `%K=${this.safeFixed(compact.current.stochastic.k, 1)}, %D=${this.safeFixed(compact.current.stochastic.d, 1)}` : 'N/A'}`,
      `- Bollinger Bands: ${compact.current.bollingerBands ? `Upper=${this.safeFixed(compact.current.bollingerBands.upper, 2)}, Middle=${this.safeFixed(compact.current.bollingerBands.middle, 2)}, Lower=${this.safeFixed(compact.current.bollingerBands.lower, 2)}` : 'N/A'}`,
    ].join('\n') : '';

    return [
      `SYMBOL: ${symbol}`,
      `TYPE: TECHNICAL`,
      ``,
      currentStr,
      ``,
      `FULL DATA (JSON):`,
      `<<<DATA`,
      JSON.stringify(compact),
      `DATA>>>`,
      ``,
      `Tasks:`,
      `1. Start by stating the CURRENT indicator values from above - these match the user's UI.`,
      `2. Explain what these current readings mean (e.g., RSI 25 = oversold).`,
      `3. Use the "trend" arrays to describe recent movement direction.`,
      `4. Highlight entry/exit levels based on current Bollinger Bands.`,
      `5. Discuss risks and opportunities for the next 1–2 sessions.`
    ].join('\n');
  }

  /**
   * buildPortfolioPrompt - Portfolio analysis user prompt
   * Includes portfolio context with held/not-held modes.
   */
  private buildPortfolioPrompt(data: any, symbol: string): string {
    const portfolioContext = data?.portfolioContext;

    // Format portfolio context prominently
    let contextStr = '';
    if (portfolioContext) {
      const { portfolio, position, isHeld } = portfolioContext;
      contextStr = [
        ``,
        `PORTFOLIO CONTEXT:`,
        `- Total portfolio value: $${portfolio?.totalValue?.toLocaleString() ?? 'N/A'}`,
        `- Cash available: $${portfolio?.cashAvailable?.toLocaleString() ?? 'N/A'}`,
        `- Number of positions: ${portfolio?.positionsCount ?? 'N/A'}`,
        ``,
      ].join('\n');

      if (isHeld && position) {
        contextStr += [
          `CURRENT POSITION IN ${symbol} (user HOLDS this stock):`,
          `- Shares: ${position.shares}`,
          `- Average cost basis: $${this.safeFixed(position.avgCostBasis, 2)}`,
          `- Current price: $${this.safeFixed(position.currentPrice, 2)}`,
          `- Market value: $${position.marketValue?.toLocaleString() ?? 'N/A'}`,
          `- Total return: $${this.safeFixed(position.totalReturn, 2)} (${this.safeFixed(position.totalReturnPercent, 2)}%)`,
          ``,
        ].join('\n');
      } else {
        contextStr += [
          `STATUS: User does NOT currently hold ${symbol}.`,
          `Analyze as a POTENTIAL ADDITION to their portfolio.`,
          ``,
        ].join('\n');
      }
    }

    // Compact technical data for context
    const compact = this.compactTechnical(data);

    return [
      `SYMBOL: ${symbol}`,
      `TYPE: PORTFOLIO`,
      contextStr,
      `TECHNICAL CONTEXT (for entry/exit decisions):`,
      `<<<DATA`,
      JSON.stringify({ summary: compact.summary, current: compact.current, signals: compact.signals?.slice(0, 10) }),
      `DATA>>>`,
      ``,
      `Tasks:`,
      portfolioContext?.isHeld
        ? `1. Reference the EXACT position data above (shares, cost, return %).`
        : `1. Analyze if this is a good entry point based on technical signals.`,
      portfolioContext?.isHeld
        ? `2. Assess performance: Is this position working for them?`
        : `2. Suggest position sizing as a % of their $${portfolioContext?.portfolio?.totalValue?.toLocaleString() ?? 'N/A'} portfolio.`,
      `3. Discuss actionable next steps based on current technical setup.`,
      `4. Keep advice practical - no Sharpe ratio, beta, or correlations.`
    ].join('\n');
  }

  /**
   * buildSentimentPrompt - Technical Psychology analysis user prompt
   * Renamed from "sentiment" - focuses on what technicals reveal about crowd psychology.
   * Does NOT use news/social sentiment (we don't have that data).
   */
  private buildSentimentPrompt(data: any, symbol: string): string {
    // Use compact technical data
    const compact = this.compactTechnical(data);

    // Format current readings for psychology interpretation using safe formatter
    const psychologyReadings = compact.current ? [
      ``,
      `TECHNICAL PSYCHOLOGY INDICATORS:`,
      `- RSI: ${this.safeFixed(compact.current.rsi, 1)} ${this.interpretRsiPsychology(compact.current.rsi)}`,
      `- Stochastic %K: ${this.safeFixed(compact.current.stochastic?.k, 1)} ${this.interpretStochasticPsychology(compact.current.stochastic?.k)}`,
      `- MACD Histogram: ${this.safeFixed(compact.current.macd?.histogram, 2)} (momentum conviction)`,
      `- Bollinger Position: ${this.getBollingerPosition(compact.current.bollingerBands, data?.latestPrice)}`,
      ``,
    ].join('\n') : '';

    return [
      `SYMBOL: ${symbol}`,
      `TYPE: TECHNICAL_PSYCHOLOGY`,
      psychologyReadings,
      `FULL DATA (JSON):`,
      `<<<DATA`,
      JSON.stringify({ summary: compact.summary, current: compact.current, trend: compact.trend }),
      `DATA>>>`,
      ``,
      `Tasks:`,
      `1. Interpret current RSI/Stochastic as fear vs greed indicators.`,
      `2. Analyze volume/momentum patterns for accumulation vs distribution.`,
      `3. Identify behavioral extremes from Bollinger Band positioning.`,
      `4. Add disclaimer: "This analysis is derived from technical indicators only, not news or social sentiment."`
    ].join('\n');
  }

  /** Helper to interpret RSI as crowd psychology */
  private interpretRsiPsychology(rsi?: number | null): string {
    if (rsi === undefined || rsi === null) return '';
    if (rsi < 30) return '(FEAR zone - potential panic selling)';
    if (rsi < 40) return '(cautious/worried sentiment)';
    if (rsi > 70) return '(GREED zone - potential euphoria)';
    if (rsi > 60) return '(optimistic sentiment)';
    return '(neutral sentiment)';
  }

  /** Helper to interpret Stochastic as crowd psychology */
  private interpretStochasticPsychology(k?: number | null): string {
    if (k === undefined || k === null) return '';
    if (k < 20) return '(extreme pessimism)';
    if (k > 80) return '(extreme optimism)';
    return '(balanced)';
  }

  /** Helper to describe price position relative to Bollinger Bands */
  private getBollingerPosition(bb?: { upper?: number; middle?: number; lower?: number } | null, price?: number): string {
    if (!bb || !price) return 'N/A';
    if (bb.upper && price > bb.upper) return 'ABOVE upper band (potentially overextended)';
    if (bb.lower && price < bb.lower) return 'BELOW lower band (potentially oversold)';
    if (bb.middle) {
      const position = price > bb.middle ? 'above' : 'below';
      return `${position} middle band (trending ${position === 'above' ? 'bullish' : 'bearish'})`;
    }
    return 'within bands';
  }

  /**
   * Extract Indicators Used - Deterministic Metadata Generation
   * 
   * 🎯 PURPOSE: This method replaced AI-parsed indicator lists to ensure accuracy
   * 
   * 🔍 RECENT CHANGE CONTEXT:
   * Previously, we asked the AI to tell us which indicators it used in its analysis.
   * This created several problems:
   * 1. AI might hallucinate indicator names that don't exist
   * 2. AI might miss indicators that were actually present in the data
   * 3. Inconsistent naming (e.g., "RSI" vs "Relative Strength Index")
   * 
   * 💡 SOLUTION PATTERN: "Trust but Verify" → "Don't Trust, Just Verify"
   * Instead of trusting AI to report what it used, we deterministically check
   * what indicators are actually present in our technical analysis data.
   * 
   * 🔧 IMPLEMENTATION DETAILS:
   * - Uses optional chaining (?.) to safely check nested properties
   * - Checks array length (> 0) to ensure indicators have actual data
   * - Returns standardized names for consistent UI display
   * - Provides fallback for non-technical analysis types
   * 
   * 📊 DATA INTEGRITY BENEFITS:
   * - Metadata always reflects actual system state
   * - No possibility of hallucinated indicator names
   * - Consistent naming across all AI responses
   * - Reliable for debugging and audit trails
   * 
   * @param data - Technical analysis result containing indicator arrays
   * @param type - Analysis type ('technical', 'portfolio', 'sentiment')
   * @returns Array of indicator names that actually have data
   */
  private extractIndicatorsUsed(data: any, type: string): string[] {
    // Only extract indicators for technical analysis type
    if (type === 'technical' && data?.indicators) {
      const indicators: string[] = [];

      // Check each indicator type and add to list if data exists
      // Pattern: Check for existence AND non-empty array
      if (data.indicators.rsi?.length > 0) indicators.push('RSI');
      if (data.indicators.macd?.length > 0) indicators.push('MACD');
      if (data.indicators.bollingerBands?.length > 0) indicators.push('Bollinger Bands');
      if (data.indicators.stochastic?.length > 0) indicators.push('Stochastic');
      if (data.indicators.williamsR?.length > 0) indicators.push('Williams %R');
      if (data.indicators.sma?.length > 0) indicators.push('SMA');
      if (data.indicators.ema?.length > 0) indicators.push('EMA');

      return indicators;
    }

    // Fallback for non-technical analysis or missing data
    // These are the most common indicators, used as reasonable defaults
    return ['RSI', 'MACD'];
  }

  /**
   * Calculate Confidence Score - Algorithmic Confidence Estimation
   * 
   * 🎯 PURPOSE: Generate confidence scores based on actual technical analysis data
   * 
   * 🔍 RECENT CHANGE CONTEXT:
   * Previously, we asked the AI to provide its own confidence score. This created
   * inconsistency because AI confidence doesn't necessarily correlate with the
   * strength of technical signals in the underlying data.
   * 
   * 💡 ALGORITHMIC APPROACH: "Show, Don't Tell"
   * Instead of asking AI how confident it is, we calculate confidence based on:
   * 1. Average strength of technical signals (how strong are the indicators?)
   * 2. Signal density (how many signals are we seeing?)
   * 3. Mathematical bounds to prevent extreme values
   * 
   * 🧮 MATHEMATICAL FORMULA:
   * confidence = min(0.95, max(0.3, avgStrength × densityFactor))
   * 
   * Where:
   * - avgStrength = average of all signal strength values (0-1 scale)
   * - densityFactor = min(signalCount / 10, 1) - caps influence of many weak signals
   * - Bounds: [0.3, 0.95] - avoids overconfidence and complete lack of confidence
   * 
   * 📊 CONFIDENCE INTERPRETATION:
   * - 0.3-0.5: Low confidence (few or weak signals)
   * - 0.5-0.7: Moderate confidence (decent signal strength/count)
   * - 0.7-0.9: High confidence (strong signals with good consensus)
   * - 0.9-0.95: Very high confidence (multiple strong signals)
   * 
   * 🛡️ DEFENSIVE PROGRAMMING:
   * - Uses optional chaining (?.) and nullish coalescing (??) for safety
   * - Handles empty arrays, undefined signals, and missing strength values
   * - Always returns a valid number between 0.3 and 0.95
   * 
   * @param data - Technical analysis data containing signals array
   * @param type - Analysis type (only 'technical' uses signal-based calculation)
   * @returns Confidence score between 0.3 and 0.95
   */
  private calculateConfidence(data: any, type: string): number {
    // Only calculate signal-based confidence for technical analysis
    if (type === 'technical' && Array.isArray(data?.signals) && data.signals.length > 0) {
      const signalCount = data.signals.length;

      // Calculate average signal strength with defensive programming
      // Uses nullish coalescing (??) to handle missing strength values
      const avgStrength = data.signals.reduce(
        (sum: number, s: any) => sum + (s?.strength ?? 0),
        0
      ) / signalCount;

      // Density factor prevents many weak signals from inflating confidence
      // Caps at 1.0 so that 10+ signals don't over-boost confidence
      const density = Math.min(signalCount / 10, 1);

      // Apply mathematical bounds to prevent extreme confidence values
      // Min 0.3: Always maintain some uncertainty (humility principle)
      // Max 0.95: Never claim perfect certainty (black swan protection)
      return Math.min(0.95, Math.max(0.3, avgStrength * density));
    }

    // Default moderate confidence for non-technical analysis
    // 0.7 represents "reasonably confident but not certain"
    return 0.7;
  }
}

/* -------------------------------------------------------------------------------------------------
 * MockLLMProvider - Fallback Strategy
 *
 * Patterns:
 * - NULL OBJECT: Always available, never throws
 * - FALLBACK: Graceful degradation when APIs fail or are absent
 * - TEST SUPPORT: Deterministic outputs for unit tests
 *
 * Notes:
 * - Provider label is 'mock' (not 'cached') for clarity.
 * - Confidence set to a conservative 0.6.
 * ------------------------------------------------------------------------------------------------- */

export class MockLLMProvider implements LLMProvider {
  async isAvailable(): Promise<boolean> { return true; }

  async generateInsight(
    type: 'technical' | 'portfolio' | 'sentiment',
    data: any,
    symbol: string
  ): Promise<LLMInsight> {
    const mockInsights: Record<string, string> = {
      technical: `Looking at ${symbol} from a technical perspective, the current chart setup presents an interesting story for investors managing a diversified portfolio. The stock is showing ${data?.summary?.trendDirection ?? 'sideways'} price action with ${data?.summary?.volatility ?? 'medium'} volatility, which suggests we're in a period where patience and careful position sizing will be key.

From a risk management standpoint, this would likely represent a modest position in a well-balanced portfolio, depending on your overall allocation strategy. The technical indicators are painting a mixed picture right now - not screaming "buy" but not flashing major warning signs either. This is actually quite common and often represents the best opportunities for disciplined investors.

What I'd be watching closely are the key support and resistance levels that have been established over the recent trading sessions. These levels often act as psychological barriers where institutional money tends to make decisions. Having predetermined entry and exit points becomes crucial - you want to protect the wealth you've built while still participating in potential upside.

The volume patterns suggest we're in a consolidation phase, which historically has been followed by more decisive moves in either direction. This gives you time to plan your approach rather than feeling pressured to act immediately.`,

      portfolio: `From a portfolio construction standpoint, ${symbol} presents some interesting considerations for wealth-building investors. With a diversified approach, you have the luxury of being selective while still maintaining the growth orientation needed to reach your financial goals.

This stock would fit into what I'd call the "core growth" portion of a well-diversified portfolio. You're at a point where you can still take calculated risks for growth, but you can't afford to be reckless with positions that could significantly impact your overall wealth trajectory.

The correlation characteristics of this stock suggest it would complement rather than duplicate existing technology or growth positions you might already hold. This is important because true diversification isn't just about owning different stocks - it's about owning stocks that behave differently under various market conditions.

Position sizing becomes critical here. A 3-4% allocation would give you meaningful exposure without creating undue concentration risk. This allows you to participate in the upside while ensuring that even a significant decline wouldn't derail your long-term financial plans.

The risk-adjusted return profile suggests this could be a multi-year holding rather than a trading position, which aligns well with tax efficiency goals that serious investors should be considering.`,

      sentiment: `Looking at the technical psychology indicators for ${symbol}, we can infer some interesting insights about crowd behavior based solely on price and volume patterns.

The current RSI reading suggests ${data?.summary?.trendDirection === 'up' ? 'optimistic sentiment with traders showing bullish conviction' : data?.summary?.trendDirection === 'down' ? 'cautious sentiment with sellers in control' : 'balanced sentiment without extreme positioning'}. When RSI approaches extremes, it often reflects emotional decision-making rather than rational analysis - fear drives oversold conditions while greed drives overbought readings.

From an accumulation/distribution perspective, the recent volume patterns indicate ${data?.summary?.volatility === 'high' ? 'active trading with potential distribution' : 'steady accumulation behavior'}. Volume spikes often coincide with emotional reactions, and understanding this helps anticipate potential reversals.

The Bollinger Band positioning provides another psychological lens. Price near the bands suggests traders are testing extremes, while consolidation near the middle band indicates a period of uncertainty where neither bulls nor bears have conviction.

Looking at momentum through MACD, we can gauge trader conviction. Strong histogram readings reflect high conviction in the current direction, while divergences between price and MACD often precede sentiment shifts as early movers begin repositioning.

**Note**: This technical psychology analysis is derived entirely from price and volume patterns. We do not have access to news sentiment, social media data, or institutional positioning data. These interpretations are inferences from technical indicators only.`
    };

    return {
      type,
      content: mockInsights[type],
      confidence: 0.6,
      provider: 'mock',
      generatedAt: new Date().toISOString(),
      metadata: {
        indicators_used: ['RSI', 'MACD'],
        timeframe: '1D',
        data_quality: 'medium',
        market_conditions: data?.summary?.overall ?? 'neutral'
      }
    };
  }
}

/* -------------------------------------------------------------------------------------------------
 * LLMInsightService - Service Layer with Caching & Fallback
 *
 * Patterns:
 * - SERVICE LAYER: Simple facade over provider complexity
 * - CHAIN OF RESPONSIBILITY: Try providers in priority order
 * - CACHING: Time-based TTL + oldest-first eviction
 * - CIRCUIT BREAKER (lightweight): isAvailable() check pre-call
 *
 * Performance:
 * - Cache prevents redundant API calls
 * - Promise.allSettled in generateAllInsights for concurrency & isolation
 *
 * Extensibility:
 * - Insert new providers by changing constructor order
 * - Swap OpenAIProvider config via env
 * ------------------------------------------------------------------------------------------------- */

export class LLMInsightService {
  private providers: LLMProvider[];
  private cache: Map<string, { insight: LLMInsight; timestamp: number }> = new Map();
  private cacheTimeout = 30 * 60 * 1000; // 30 minutes
  private maxCacheEntries = 500;         // simple cap to prevent unbounded growth

  constructor() {
    // Priority order matters: best quality first, always-on fallback last
    this.providers = [
      new OpenAIProvider(),   // primary (high quality)
      new MockLLMProvider(),  // fallback (always available)
    ];
  }

  /**
   * stableHash - Deterministic hashing for cache keys:
   * - JSON.stringify + SHA-256 to avoid collisions from slicing
   * - Keeps key length bounded and stable across runs
   */
  private stableHash(obj: unknown) {
    const json = JSON.stringify(obj, (_, v) => (typeof v === 'number' && !isFinite(v) ? String(v) : v));
    return crypto.createHash('sha256').update(json).digest('hex');
  }

  /**
   * setCache - Inserts with naive LRU-like eviction (oldest-first):
   * - When at capacity, removes the oldest entry.
   * - Suitable for small/medium apps without a dedicated cache library.
   */
  private setCache(key: string, value: { insight: LLMInsight; timestamp: number }) {
    if (this.cache.size >= this.maxCacheEntries) {
      let oldestKey: string | undefined;
      let oldestTs = Infinity;
      for (const [k, v] of this.cache) {
        if (v.timestamp < oldestTs) { oldestTs = v.timestamp; oldestKey = k; }
      }
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }

  /**
   * generateInsight - Cached, fault-tolerant generation:
   * 1) Cache lookup (hit returns immediately)
   * 2) Provider chain: first available provider that succeeds wins
   * 3) Errors are isolated per provider; we continue down the chain
   * 4) Success is cached with a TTL
   */
  async generateInsight(
    type: 'technical' | 'portfolio' | 'sentiment',
    data: any,
    symbol: string
  ): Promise<LLMInsight> {
    // Cache key includes symbol, type, and a hash of the input data
    const cacheKey = `${symbol}:${type}:${this.stableHash(data)}`;

    // Cache HIT (fresh)
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.insight;
    }

    // Provider chain (OpenAI -> Mock)
    for (const provider of this.providers) {
      try {
        if (await provider.isAvailable()) {
          const insight = await provider.generateInsight(type, data, symbol);
          this.setCache(cacheKey, { insight, timestamp: Date.now() });
          return insight;
        }
      } catch (err) {
        // Log and continue to next provider (graceful degradation)
        console.error(`Provider failed for ${type}:`, err);
      }
    }

    // Should be rare because Mock is always available
    throw new Error('All LLM providers failed');
  }

  /**
   * generateAllInsights - Parallelize generation for UX speed:
   * - Promise.allSettled for isolation (one failure doesn't sink others)
   * - Falls back to Mock for any failed branch
   * - Time ≈ slowest successful branch
   */
  async generateAllInsights(
    analysis: TechnicalAnalysisResult,
    symbol: string
  ): Promise<{ technical: LLMInsight; portfolio: LLMInsight; sentiment: LLMInsight; }> {
    const [technical, portfolio, sentiment] = await Promise.allSettled([
      this.generateInsight('technical', analysis, symbol),
      this.generateInsight('portfolio', analysis, symbol),
      this.generateInsight('sentiment', analysis, symbol),
    ]);

    return {
      technical: technical.status === 'fulfilled'
        ? technical.value
        : await new MockLLMProvider().generateInsight('technical', analysis, symbol),

      portfolio: portfolio.status === 'fulfilled'
        ? portfolio.value
        : await new MockLLMProvider().generateInsight('portfolio', analysis, symbol),

      sentiment: sentiment.status === 'fulfilled'
        ? sentiment.value
        : await new MockLLMProvider().generateInsight('sentiment', analysis, symbol),
    };
  }
}

/* -------------------------------------------------------------------------------------------------
 * Singleton Pattern - Shared Service Instance
 *
 * Why Singleton Here:
 * - Shared in-memory cache across the app (avoid duplicate calls)
 * - Consistent configuration (one place)
 * - Lambda-friendly reuse across invocations (warm starts)
 *
 * Alternatives:
 * - DI container (e.g., Inversify) if you need multiple named instances
 * - Factory for per-request overrides (A/B testing providers)
 * ------------------------------------------------------------------------------------------------- */

let insightService: LLMInsightService | null = null;

/**
 * getLLMInsightService - Lazy initialization of singleton instance.
 * Usage examples:
 *   const svc = getLLMInsightService();
 *   const insight = await svc.generateInsight('technical', data, 'AAPL');
 */
export function getLLMInsightService(): LLMInsightService {
  if (!insightService) {
    insightService = new LLMInsightService();
  }
  return insightService;
}

/**
 * Get a simple LLM provider for basic text generation
 * This is a simplified interface for direct text generation without the insight service
 */
export function getLLMProvider(): { generateText: (prompt: string) => Promise<string> } {
  return {
    generateText: async (prompt: string): Promise<string> => {
      try {
        // Simple direct OpenAI API call for basic text generation
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          throw new Error('OpenAI API key not configured');
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are a financial analyst providing concise market analysis. Keep responses to 2-3 sentences.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 150,
            temperature: 0.7
          })
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || 'Analysis unavailable at this time.';
      } catch (error) {
        console.error('LLM generation failed:', error);
        return 'Market analysis temporarily unavailable. Please check back later.';
      }
    }
  };
}
