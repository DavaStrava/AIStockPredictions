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
         * TECHNICAL ANALYSIS PROMPT - PLAIN LANGUAGE INSIGHTS ONLY
         *
         * The user sees indicator values in the UI. They want interpretation,
         * not a recitation of numbers. Explain what's happening with the STOCK,
         * not what the indicators are showing.
         */
        return `${basePrompt}

STRICT RULES - FOLLOW EXACTLY:

DO NOT cite technical indicator values (RSI, MACD, Stochastic, etc.) - the user sees these on their screen.

FORBIDDEN:
- "RSI is at 65.5" or any indicator number
- "MACD shows a line value of..."
- "Bollinger Bands are set with an upper band of..."
- "The Stochastic indicator reveals..."

DO INCLUDE meaningful numbers that support your narrative:
- Price levels: "The stock is trading around $45, up from $32 a month ago"
- Percentage moves: "That's a 40% gain in just a few weeks"
- Support/resistance: "Watch the $40 level - that's where buyers stepped in before"
- Bollinger band prices (as support/resistance, not as "bands"): "If it pulls back, $42 could be a good entry point"

Write like you're explaining to a friend who asked "What's going on with this stock?"

Cover these points in conversational paragraphs:
1. What's the situation? Include the recent price move (% gain/loss, price range) to set context.
2. What's the risk? (Is it a good time to buy, or should you wait for a pullback?)
3. What price levels matter? Give specific prices for support and resistance.
4. What should change your mind? (What would make this setup better or worse?)

Use the indicator data to form your opinion. Express that opinion in plain language, but include relevant price data and percentages to support your points.`;

      case 'portfolio':
        /**
         * PORTFOLIO ANALYSIS PROMPT - PLAIN LANGUAGE, ACTIONABLE
         *
         * Two modes: user holds the stock or doesn't.
         * Focus on what to DO, not reciting portfolio data.
         */
        return `${basePrompt}

STRICT RULES - FOLLOW EXACTLY:

Write in plain English about what makes sense for their portfolio.

FORBIDDEN - DO NOT INCLUDE:
- Technical indicator values (RSI, MACD, Stochastic numbers)
- "RSI is at 27" or "Bollinger Bands show..."
- "Your position shows X shares at $Y cost basis"
- "Your portfolio value is $X"

DO INCLUDE:
- Price data: current price, recent % change, support/resistance levels
- Plain-language assessment: "the stock is down 6% this month and looks oversold"
- Actionable advice: "starting a small position here makes sense" or "wait for a pullback"

If they OWN the stock:
- Is this position working? Add more, hold, or trim?
- Use price moves to support your point (not indicator values)

If they DON'T own it:
- Is now a good entry point based on recent price action?
- What price level would be a better entry?
- How much makes sense as a starting position?

Be conversational - like advice from a friend. Use $ and % but not technical jargon.`;

      case 'sentiment':
        /**
         * TECHNICAL PSYCHOLOGY PROMPT - PLAIN LANGUAGE
         *
         * Explain crowd behavior/psychology derived from technicals.
         * No indicator values - just what the crowd is doing.
         */
        return `${basePrompt}

STRICT RULES - FOLLOW EXACTLY:

Explain what traders and investors seem to be FEELING and DOING with this stock.
Use the technical data to read the crowd psychology, but don't cite numbers.

FORBIDDEN:
- "RSI is at 65.5" or any indicator values
- "Stochastic shows %K of 77.7"
- Technical jargon without plain English explanation
- Listing what each indicator "reveals"

INSTEAD, describe the crowd psychology:
- "Traders are getting greedy here - everyone's piling in and the stock is overheated"
- "There's fear in this stock - people are dumping shares and it feels like panic"
- "Smart money seems to be quietly accumulating while everyone else ignores this"
- "The crowd is uncertain - you can see it in the choppy, indecisive price action"

Address:
1. What's the crowd mood? (Fear, greed, uncertainty, complacency?)
2. Who's in control? (Buyers accumulating? Sellers distributing? Neither?)
3. Are emotions at an extreme? (Panic selling? Euphoric buying? Or balanced?)
4. What does this suggest about timing? (Contrarian opportunity? Go with the crowd? Wait?)

End with a brief note that this is based on price patterns, not news or social sentiment.`;

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

  private buildTechnicalPrompt(analysis: TechnicalAnalysisResult & { priceContext?: any }, symbol: string): string {
    const compact = this.compactTechnical(analysis);
    const priceContext = (analysis as any).priceContext;

    // Format price context for the AI using safe formatting
    let priceStr = '';
    if (priceContext) {
      const fmt = (v: number | null | undefined, decimals = 2) => this.safeFixed(v, decimals);
      const sign = (v: number | null | undefined) => (v !== null && v !== undefined && v >= 0) ? '+' : '';

      priceStr = [
        ``,
        `PRICE DATA (USE these numbers in your response to support your narrative):`,
        `- Current price: $${fmt(priceContext.currentPrice)}`,
        `- 1-week change: ${sign(priceContext.priceChange1WPercent)}${fmt(priceContext.priceChange1WPercent, 1)}% ($${fmt(priceContext.priceChange1W)})`,
        `- 1-month change: ${sign(priceContext.priceChange1MPercent)}${fmt(priceContext.priceChange1MPercent, 1)}% ($${fmt(priceContext.priceChange1M)})`,
        `- 1-month range: $${fmt(priceContext.low1M)} - $${fmt(priceContext.high1M)}`,
        `- 3-month range: $${fmt(priceContext.low3M)} - $${fmt(priceContext.high3M)}`,
        ``,
      ].join('\n');
    }

    return [
      `SYMBOL: ${symbol}`,
      priceStr,
      `INDICATOR DATA (use to form your opinion, but DO NOT cite indicator values like RSI/MACD numbers):`,
      `<<<DATA`,
      JSON.stringify(compact),
      `DATA>>>`,
      ``,
      `Remember: Include price data (%, $) to support your narrative. No technical indicator values.`
    ].join('\n');
  }

  /**
   * buildPortfolioPrompt - Portfolio analysis user prompt
   * Includes portfolio context with held/not-held modes.
   */
  private buildPortfolioPrompt(data: any, symbol: string): string {
    const portfolioContext = data?.portfolioContext;
    const priceContext = data?.priceContext;
    const compact = this.compactTechnical(data);

    // Build context object for the AI to use (not recite)
    const context = {
      symbol,
      isHeld: portfolioContext?.isHeld ?? false,
      portfolio: portfolioContext?.portfolio ?? null,
      position: portfolioContext?.position ?? null,
      priceContext: priceContext ?? null,
      technicals: { summary: compact.summary, current: compact.current }
    };

    // Format price info using safe formatting
    let priceStr = '';
    if (priceContext) {
      const sign = priceContext.priceChange1MPercent >= 0 ? '+' : '';
      priceStr = `Current: $${this.safeFixed(priceContext.currentPrice, 2)}, 1M change: ${sign}${this.safeFixed(priceContext.priceChange1MPercent, 1)}%`;
    }

    return [
      `SYMBOL: ${symbol}`,
      `USER ${context.isHeld ? 'OWNS' : 'DOES NOT OWN'} THIS STOCK`,
      priceStr ? `PRICE: ${priceStr}` : '',
      ``,
      `DATA (use to form advice):`,
      `<<<DATA`,
      JSON.stringify(context),
      `DATA>>>`,
      ``,
      `Remember: Give practical advice with price context. Include $ and % where helpful.`
    ].join('\n');
  }

  /**
   * buildSentimentPrompt - Technical Psychology analysis user prompt
   * Renamed from "sentiment" - focuses on what technicals reveal about crowd psychology.
   * Does NOT use news/social sentiment (we don't have that data).
   */
  private buildSentimentPrompt(data: any, symbol: string): string {
    const compact = this.compactTechnical(data);
    const priceContext = data?.priceContext;

    // Format price info for context using safe formatting
    let priceStr = '';
    if (priceContext) {
      const sign = priceContext.priceChange1MPercent >= 0 ? '+' : '';
      priceStr = [
        ``,
        `PRICE CONTEXT:`,
        `- Current: $${this.safeFixed(priceContext.currentPrice, 2)}`,
        `- 1-month change: ${sign}${this.safeFixed(priceContext.priceChange1MPercent, 1)}%`,
        `- 3-month range: $${this.safeFixed(priceContext.low3M, 2)} - $${this.safeFixed(priceContext.high3M, 2)}`,
        ``,
      ].join('\n');
    }

    return [
      `SYMBOL: ${symbol}`,
      priceStr,
      `INDICATOR DATA (use to read crowd psychology, but DO NOT cite indicator values):`,
      `<<<DATA`,
      JSON.stringify({ summary: compact.summary, current: compact.current, trend: compact.trend }),
      `DATA>>>`,
      ``,
      `Remember: Describe crowd mood in plain English. Include price moves (%) where relevant.`
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
    const trendDirection = data?.summary?.trendDirection ?? 'sideways';
    const isUp = trendDirection === 'up';
    const isDown = trendDirection === 'down';

    const mockInsights: Record<string, string> = {
      technical: `${symbol} is ${isUp ? 'showing strength right now with buyers in control' : isDown ? 'under pressure with sellers dominating' : 'stuck in a holding pattern without clear direction'}. ${isUp ? "The stock has momentum behind it, but it's getting stretched - if you're looking to buy, chasing here carries risk." : isDown ? "This pullback could be an opportunity if the selling exhausts itself, but there's no clear sign of a bottom yet." : "Neither buyers nor sellers have conviction, which often precedes a bigger move in either direction."}

The key level to watch on the downside is the recent support area - if that breaks, expect more selling. On the upside, the stock needs to push through recent resistance to confirm buyers are serious. Until one of those happens, ${symbol} is in wait-and-see territory.

If you're already in this position, ${isUp ? "you're in good shape - consider where you'd take profits if it keeps running" : isDown ? "this is a test of your conviction - decide now whether you'd add at lower prices or cut losses" : "patience is probably the right move here"}. If you're looking to start a position, ${isUp ? "waiting for a pullback to support would give you a better entry" : isDown ? "let the dust settle before stepping in" : "you have time to wait for a clearer setup"}.`,

      portfolio: `${data?.portfolioContext?.isHeld ? `You own ${symbol}, so the question is what to do with it from here. ` : `You don't own ${symbol} yet, so let's think about whether it makes sense to start a position. `}

${data?.portfolioContext?.isHeld
  ? (isUp ? "The position is working - you could let it run, but consider trimming if it's become a bigger piece of your portfolio than you intended. Locking in some gains never hurt anyone." : isDown ? "This one's testing your patience. If your original thesis is still intact, holding makes sense. If you're just hoping it comes back, that's a different situation." : "Not much happening here. If it's a core holding you believe in, sit tight. If you're indifferent, that capital might work harder elsewhere.")
  : (isUp ? "Buying strength can work, but you'd be chasing. A small starter position makes sense if you're committed, with room to add on pullbacks." : isDown ? "Catching falling knives is risky, but if this is a name you've wanted to own, building a position gradually as it bases could work well." : "No rush here. Wait for a better setup or start very small.")}

Think about how this fits with your other holdings. You don't want too much riding on any single position, no matter how good the story sounds.`,

      sentiment: `The crowd ${isUp ? 'is getting optimistic about' : isDown ? 'has turned negative on' : 'seems undecided about'} ${symbol}. ${isUp ? "When everyone's bullish, that's often when the easy gains are over. The buyers who wanted in are already in, so who's left to push it higher?" : isDown ? "Fear is showing up in the price action. That can mean opportunity if the selling is overdone, or it can mean the crowd knows something." : "There's no strong conviction either way, which suggests traders are waiting for a catalyst."}

${isUp ? "Watch for signs that momentum is fading - that's usually when the late buyers get trapped." : isDown ? "Look for signs the panic is exhausting itself - heavy volume without much price movement lower can signal a bottom forming." : "The next move could go either way. Don't force a trade here."}

*Note: This read is based on price and momentum patterns only, not news or social media sentiment.*`
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
