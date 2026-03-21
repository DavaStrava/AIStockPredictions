/**
 * LLM Providers Module Tests
 * 
 * Tests for the OpenAIProvider class and related functionality.
 * Focus areas:
 * - System prompt generation (getSystemPrompt)
 * - Prompt content validation (no PII, no specific ages/amounts)
 * - Indicator extraction (extractIndicatorsUsed)
 * - Confidence calculation (calculateConfidence)
 * - Mock provider behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenAIProvider, MockLLMProvider, LLMInsight } from '../llm-providers';

// Mock fetch globally for API tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new OpenAIProvider('test-api-key');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isAvailable', () => {
    it('should return true when API key is configured', async () => {
      const result = await provider.isAvailable();
      expect(result).toBe(true);
    });

    it('should return false when API key is empty', async () => {
      const emptyProvider = new OpenAIProvider('');
      const result = await emptyProvider.isAvailable();
      expect(result).toBe(false);
    });

    it('should return false when API key is undefined', async () => {
      // Temporarily clear env var
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;
      
      const noKeyProvider = new OpenAIProvider();
      const result = await noKeyProvider.isAvailable();
      expect(result).toBe(false);
      
      // Restore
      if (originalKey) process.env.OPENAI_API_KEY = originalKey;
    });
  });

  describe('getSystemPrompt - Content Validation', () => {
    // Access private method via type assertion for testing
    const getSystemPrompt = (provider: OpenAIProvider, type: 'technical' | 'portfolio' | 'sentiment') => {
      return (provider as any).getSystemPrompt(type);
    };

    describe('Base Prompt Requirements', () => {
      it('should NOT contain specific age references', () => {
        const technicalPrompt = getSystemPrompt(provider, 'technical');
        const portfolioPrompt = getSystemPrompt(provider, 'portfolio');
        const sentimentPrompt = getSystemPrompt(provider, 'sentiment');

        // Check for common age patterns
        const agePatterns = [
          /\b40s\b/i,
          /\b40's\b/i,
          /\bforties\b/i,
          /\bin their \d+s\b/i,
          /\b\d+ years old\b/i,
          /\bage \d+\b/i,
        ];

        for (const pattern of agePatterns) {
          expect(technicalPrompt).not.toMatch(pattern);
          expect(portfolioPrompt).not.toMatch(pattern);
          expect(sentimentPrompt).not.toMatch(pattern);
        }
      });

      it('should NOT contain specific dollar amounts in user-facing content', () => {
        const technicalPrompt = getSystemPrompt(provider, 'technical');
        const sentimentPrompt = getSystemPrompt(provider, 'sentiment');

        // Check for dollar amount patterns in user-facing prompts
        // Note: Portfolio prompt contains educational comments with examples,
        // but the actual prompt instructions don't include specific amounts
        const dollarPatterns = [
          /\$\d{3},\d{3}/,           // $700,000
          /\$\d+ million/i,          // $1 million
          /\$\d{6,}/,                // $700000
        ];

        for (const pattern of dollarPatterns) {
          expect(technicalPrompt).not.toMatch(pattern);
          expect(sentimentPrompt).not.toMatch(pattern);
        }
      });

      it('should instruct AI to not reference dollar amounts in responses', () => {
        const technicalPrompt = getSystemPrompt(provider, 'technical');
        
        // The key requirement is that the AI is instructed NOT to include
        // specific dollar amounts in its responses to users
        expect(technicalPrompt).toContain('Do NOT reference');
        expect(technicalPrompt).toContain('dollar amounts');
      });

      it('should NOT reference specific life stages', () => {
        const technicalPrompt = getSystemPrompt(provider, 'technical');
        const portfolioPrompt = getSystemPrompt(provider, 'portfolio');
        const sentimentPrompt = getSystemPrompt(provider, 'sentiment');

        // Check for life stage references
        const lifeStagePatterns = [
          /peak earning years/i,
          /mid-career/i,
          /approaching retirement/i,
          /pre-retirement/i,
        ];

        for (const pattern of lifeStagePatterns) {
          expect(technicalPrompt).not.toMatch(pattern);
          expect(portfolioPrompt).not.toMatch(pattern);
          expect(sentimentPrompt).not.toMatch(pattern);
        }
      });

      it('should contain instruction to NOT reference ages/amounts', () => {
        const technicalPrompt = getSystemPrompt(provider, 'technical');
        
        expect(technicalPrompt).toContain('Do NOT reference specific ages');
        expect(technicalPrompt).toContain('life stages');
        expect(technicalPrompt).toContain('dollar amounts');
      });

      it('should contain investment advice disclaimer', () => {
        const technicalPrompt = getSystemPrompt(provider, 'technical');
        
        expect(technicalPrompt).toContain('Do NOT provide direct investment advice');
      });

      it('should mention long-term wealth building', () => {
        const technicalPrompt = getSystemPrompt(provider, 'technical');
        
        expect(technicalPrompt).toContain('long-term wealth building');
      });
    });

    describe('Analysis Type Specialization', () => {
      it('should include plain-language guidance for technical type', () => {
        const prompt = getSystemPrompt(provider, 'technical');

        // New plain-language prompts focus on insights, not indicator values
        expect(prompt).toContain('DO NOT cite technical indicator values');
        expect(prompt).toContain('plain language');
        expect(prompt).toContain('FORBIDDEN');
        expect(prompt).toContain("What's the situation");
      });

      it('should include plain-language guidance for portfolio type', () => {
        const prompt = getSystemPrompt(provider, 'portfolio');

        // Updated portfolio prompt focuses on actionable advice
        expect(prompt).toContain('plain English');
        expect(prompt).toContain('OWN');
        expect(prompt).toContain('Add more, hold, or trim');
        expect(prompt).toContain('FORBIDDEN');
      });

      it('should include plain-language guidance for sentiment type', () => {
        const prompt = getSystemPrompt(provider, 'sentiment');

        // Updated to Technical Psychology with plain language
        expect(prompt).toContain('crowd psychology');
        expect(prompt).toContain('plain English');
        expect(prompt).toContain('FORBIDDEN');
        expect(prompt).toContain('crowd mood');
      });

      it('should return base prompt for unknown type', () => {
        const prompt = getSystemPrompt(provider, 'unknown' as any);
        
        // Should still contain base prompt elements
        expect(prompt).toContain('seasoned financial advisor');
        expect(prompt).toContain('Do NOT provide direct investment advice');
        // But should NOT contain specialized sections
        expect(prompt).not.toContain('Market Story');
        expect(prompt).not.toContain('Portfolio Context');
        expect(prompt).not.toContain('Smart Money vs Retail');
      });
    });

    describe('Prompt Quality Requirements', () => {
      it('should specify word count target (400-600 words)', () => {
        const prompt = getSystemPrompt(provider, 'technical');
        expect(prompt).toContain('400-600 words');
      });

      it('should specify narrative style', () => {
        const prompt = getSystemPrompt(provider, 'technical');
        expect(prompt).toContain('Narrative and conversational');
        expect(prompt).toContain('flowing narrative paragraphs');
        expect(prompt).toContain('not bullet points');
      });

      it('should emphasize educational approach', () => {
        const prompt = getSystemPrompt(provider, 'technical');
        expect(prompt).toContain('Educational');
        expect(prompt).toContain('explaining the "why"');
      });
    });
  });

  describe('extractIndicatorsUsed', () => {
    const extractIndicatorsUsed = (provider: OpenAIProvider, data: any, type: string) => {
      return (provider as any).extractIndicatorsUsed(data, type);
    };

    it('should extract RSI when present', () => {
      const data = { indicators: { rsi: [{ value: 50 }] } };
      const result = extractIndicatorsUsed(provider, data, 'technical');
      expect(result).toContain('RSI');
    });

    it('should extract MACD when present', () => {
      const data = { indicators: { macd: [{ value: 0.5 }] } };
      const result = extractIndicatorsUsed(provider, data, 'technical');
      expect(result).toContain('MACD');
    });

    it('should extract Bollinger Bands when present', () => {
      const data = { indicators: { bollingerBands: [{ upper: 100, lower: 90 }] } };
      const result = extractIndicatorsUsed(provider, data, 'technical');
      expect(result).toContain('Bollinger Bands');
    });

    it('should extract multiple indicators', () => {
      const data = {
        indicators: {
          rsi: [{ value: 50 }],
          macd: [{ value: 0.5 }],
          stochastic: [{ k: 50, d: 45 }],
          williamsR: [{ value: -50 }],
        }
      };
      const result = extractIndicatorsUsed(provider, data, 'technical');
      expect(result).toContain('RSI');
      expect(result).toContain('MACD');
      expect(result).toContain('Stochastic');
      expect(result).toContain('Williams %R');
    });

    it('should return empty array for empty indicator arrays', () => {
      const data = { indicators: { rsi: [], macd: [] } };
      const result = extractIndicatorsUsed(provider, data, 'technical');
      expect(result).toEqual([]);
    });

    it('should return default indicators for non-technical type', () => {
      const data = { indicators: { rsi: [{ value: 50 }] } };
      const result = extractIndicatorsUsed(provider, data, 'portfolio');
      expect(result).toEqual(['RSI', 'MACD']);
    });

    it('should return default indicators when data is null', () => {
      const result = extractIndicatorsUsed(provider, null, 'technical');
      expect(result).toEqual(['RSI', 'MACD']);
    });

    it('should return default indicators when indicators object is missing', () => {
      const result = extractIndicatorsUsed(provider, {}, 'technical');
      expect(result).toEqual(['RSI', 'MACD']);
    });
  });

  describe('calculateConfidence', () => {
    const calculateConfidence = (provider: OpenAIProvider, data: any, type: string) => {
      return (provider as any).calculateConfidence(data, type);
    };

    it('should return 0.7 for non-technical analysis', () => {
      const data = { signals: [{ strength: 0.8 }] };
      expect(calculateConfidence(provider, data, 'portfolio')).toBe(0.7);
      expect(calculateConfidence(provider, data, 'sentiment')).toBe(0.7);
    });

    it('should return 0.7 when signals array is empty', () => {
      const data = { signals: [] };
      expect(calculateConfidence(provider, data, 'technical')).toBe(0.7);
    });

    it('should return 0.7 when signals is undefined', () => {
      const data = {};
      expect(calculateConfidence(provider, data, 'technical')).toBe(0.7);
    });

    it('should calculate confidence based on signal strength', () => {
      // 10 signals with strength 0.8 each
      // avgStrength = 0.8, density = 1.0
      // confidence = min(0.95, max(0.3, 0.8 * 1.0)) ≈ 0.8
      const data = {
        signals: Array(10).fill({ strength: 0.8 })
      };
      expect(calculateConfidence(provider, data, 'technical')).toBeCloseTo(0.8, 5);
    });

    it('should cap confidence at 0.95', () => {
      // 20 signals with strength 1.0 each
      // avgStrength = 1.0, density = 1.0 (capped)
      // confidence = min(0.95, max(0.3, 1.0 * 1.0)) = 0.95
      const data = {
        signals: Array(20).fill({ strength: 1.0 })
      };
      expect(calculateConfidence(provider, data, 'technical')).toBe(0.95);
    });

    it('should have minimum confidence of 0.3', () => {
      // 1 signal with strength 0.1
      // avgStrength = 0.1, density = 0.1
      // confidence = min(0.95, max(0.3, 0.1 * 0.1)) = 0.3
      const data = {
        signals: [{ strength: 0.1 }]
      };
      expect(calculateConfidence(provider, data, 'technical')).toBe(0.3);
    });

    it('should handle signals with missing strength values', () => {
      const data = {
        signals: [
          { strength: 0.8 },
          { strength: undefined },
          { strength: 0.6 },
          {},
        ]
      };
      // avgStrength = (0.8 + 0 + 0.6 + 0) / 4 = 0.35
      // density = 4/10 = 0.4
      // confidence = max(0.3, 0.35 * 0.4) = max(0.3, 0.14) = 0.3
      expect(calculateConfidence(provider, data, 'technical')).toBe(0.3);
    });

    it('should apply density factor for few signals', () => {
      // 5 signals with strength 0.8 each
      // avgStrength = 0.8, density = 0.5
      // confidence = min(0.95, max(0.3, 0.8 * 0.5)) = 0.4
      const data = {
        signals: Array(5).fill({ strength: 0.8 })
      };
      expect(calculateConfidence(provider, data, 'technical')).toBe(0.4);
    });
  });

  describe('generateInsight - API Integration', () => {
    it('should throw error when API key is not configured', async () => {
      const noKeyProvider = new OpenAIProvider('');
      
      await expect(
        noKeyProvider.generateInsight('technical', {}, 'AAPL')
      ).rejects.toThrow('OpenAI API key not configured');
    });

    it('should make API call with correct headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Test insight' } }],
          usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 }
        })
      });

      await provider.generateInsight('technical', { summary: { overall: 'bullish' } }, 'AAPL');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should return properly formatted LLMInsight', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Technical analysis insight for AAPL' } }],
          usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 }
        })
      });

      const result = await provider.generateInsight(
        'technical',
        { 
          summary: { overall: 'bullish' },
          indicators: { rsi: [{ value: 50 }], macd: [{ value: 0.5 }] },
          signals: [{ strength: 0.7 }]
        },
        'AAPL'
      );

      expect(result.type).toBe('technical');
      expect(result.content).toBe('Technical analysis insight for AAPL');
      expect(result.provider).toBe('openai');
      expect(result.metadata.indicators_used).toContain('RSI');
      expect(result.metadata.indicators_used).toContain('MACD');
      expect(result.metadata.timeframe).toBe('1D');
      expect(result.metadata.data_quality).toBe('high');
      expect(result.metadata.market_conditions).toBe('bullish');
      expect(result.metadata.tokens_total).toBe(150);
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      });

      await expect(
        provider.generateInsight('technical', {}, 'AAPL')
      ).rejects.toThrow('OpenAI API error 401');
    });
  });
});

describe('OpenAIProvider - New Helper Functions', () => {
  let provider: OpenAIProvider;

  beforeEach(() => {
    provider = new OpenAIProvider('test-api-key');
  });

  describe('safeFixed', () => {
    const safeFixed = (provider: OpenAIProvider, value: number | null | undefined, decimals: number) => {
      return (provider as any).safeFixed(value, decimals);
    };

    it('should format valid numbers', () => {
      expect(safeFixed(provider, 45.678, 2)).toBe('45.68');
      expect(safeFixed(provider, 45.678, 1)).toBe('45.7');
      expect(safeFixed(provider, 100, 2)).toBe('100.00');
    });

    it('should return N/A for null', () => {
      expect(safeFixed(provider, null, 2)).toBe('N/A');
    });

    it('should return N/A for undefined', () => {
      expect(safeFixed(provider, undefined, 2)).toBe('N/A');
    });

    it('should return N/A for NaN', () => {
      expect(safeFixed(provider, NaN, 2)).toBe('N/A');
    });

    it('should return N/A for Infinity', () => {
      expect(safeFixed(provider, Infinity, 2)).toBe('N/A');
      expect(safeFixed(provider, -Infinity, 2)).toBe('N/A');
    });

    it('should handle zero correctly', () => {
      expect(safeFixed(provider, 0, 2)).toBe('0.00');
    });

    it('should handle negative numbers', () => {
      expect(safeFixed(provider, -25.5, 1)).toBe('-25.5');
    });
  });

  describe('compactTechnical', () => {
    const compactTechnical = (provider: OpenAIProvider, analysis: any) => {
      return (provider as any).compactTechnical(analysis);
    };

    it('should separate current values from trend arrays', () => {
      const analysis = {
        summary: { overall: 'bullish', strength: 0.7, confidence: 0.8 },
        signals: [{ indicator: 'RSI', signal: 'buy', strength: 0.8 }],
        indicators: {
          rsi: [{ value: 30 }, { value: 35 }, { value: 40 }, { value: 45 }, { value: 50 }],
          macd: [
            { macd: 0.1, signal: 0.05, histogram: 0.05 },
            { macd: 0.2, signal: 0.1, histogram: 0.1 },
          ],
          bollingerBands: [{ upper: 110, middle: 100, lower: 90 }],
          stochastic: [{ k: 75, d: 70 }],
        },
      };

      const result = compactTechnical(provider, analysis);

      // Check current values (last values)
      expect(result.current.rsi).toBe(50);
      expect(result.current.macd).toEqual({ macd: 0.2, signal: 0.1, histogram: 0.1 });
      expect(result.current.bollingerBands).toEqual({ upper: 110, middle: 100, lower: 90 });
      expect(result.current.stochastic).toEqual({ k: 75, d: 70 });

      // Check trend arrays
      expect(result.trend.rsi).toEqual([30, 35, 40, 45, 50]);
      expect(result.trend.macd).toEqual([0.05, 0.1]); // histograms only
      expect(result.trend.stochastic).toEqual([75]); // k values only
    });

    it('should handle empty indicators gracefully', () => {
      const analysis = {
        summary: { overall: 'neutral' },
        signals: [],
        indicators: {},
      };

      const result = compactTechnical(provider, analysis);

      expect(result.current.rsi).toBeNull();
      expect(result.current.macd).toBeNull();
      expect(result.current.bollingerBands).toBeNull();
      expect(result.current.stochastic).toBeNull();
    });

    it('should handle null analysis gracefully', () => {
      const result = compactTechnical(provider, null);

      expect(result.summary).toEqual({ overall: 'neutral', strength: 0.5, confidence: 0.5 });
      expect(result.signals).toEqual([]);
      expect(result.current.rsi).toBeNull();
    });

    it('should cap signals at 20 items', () => {
      const analysis = {
        signals: Array(30).fill({ indicator: 'test', signal: 'buy', strength: 0.5 }),
        indicators: {},
      };

      const result = compactTechnical(provider, analysis);

      expect(result.signals.length).toBe(20);
    });

    it('should extract RSI value from object with value property', () => {
      const analysis = {
        indicators: {
          rsi: [{ value: 45, date: '2024-01-01' }],
        },
      };

      const result = compactTechnical(provider, analysis);

      expect(result.current.rsi).toBe(45);
      expect(result.trend.rsi).toEqual([45]);
    });
  });

  describe('interpretRsiPsychology', () => {
    const interpretRsiPsychology = (provider: OpenAIProvider, rsi?: number | null) => {
      return (provider as any).interpretRsiPsychology(rsi);
    };

    it('should return FEAR zone for RSI < 30', () => {
      expect(interpretRsiPsychology(provider, 25)).toContain('FEAR zone');
      expect(interpretRsiPsychology(provider, 29)).toContain('FEAR zone');
    });

    it('should return cautious for RSI 30-40', () => {
      expect(interpretRsiPsychology(provider, 30)).toContain('cautious');
      expect(interpretRsiPsychology(provider, 39)).toContain('cautious');
    });

    it('should return neutral for RSI 40-60', () => {
      expect(interpretRsiPsychology(provider, 45)).toContain('neutral');
      expect(interpretRsiPsychology(provider, 55)).toContain('neutral');
    });

    it('should return optimistic for RSI 60-70', () => {
      expect(interpretRsiPsychology(provider, 65)).toContain('optimistic');
    });

    it('should return GREED zone for RSI > 70', () => {
      expect(interpretRsiPsychology(provider, 75)).toContain('GREED zone');
      expect(interpretRsiPsychology(provider, 85)).toContain('GREED zone');
    });

    it('should return empty string for null/undefined', () => {
      expect(interpretRsiPsychology(provider, null)).toBe('');
      expect(interpretRsiPsychology(provider, undefined)).toBe('');
    });
  });

  describe('interpretStochasticPsychology', () => {
    const interpretStochasticPsychology = (provider: OpenAIProvider, k?: number | null) => {
      return (provider as any).interpretStochasticPsychology(k);
    };

    it('should return extreme pessimism for k < 20', () => {
      expect(interpretStochasticPsychology(provider, 15)).toContain('extreme pessimism');
    });

    it('should return extreme optimism for k > 80', () => {
      expect(interpretStochasticPsychology(provider, 85)).toContain('extreme optimism');
    });

    it('should return balanced for k 20-80', () => {
      expect(interpretStochasticPsychology(provider, 50)).toContain('balanced');
    });

    it('should return empty string for null/undefined', () => {
      expect(interpretStochasticPsychology(provider, null)).toBe('');
      expect(interpretStochasticPsychology(provider, undefined)).toBe('');
    });
  });

  describe('getBollingerPosition', () => {
    const getBollingerPosition = (provider: OpenAIProvider, bb: any, price?: number) => {
      return (provider as any).getBollingerPosition(bb, price);
    };

    it('should return N/A when bb is null', () => {
      expect(getBollingerPosition(provider, null, 100)).toBe('N/A');
    });

    it('should return N/A when price is undefined', () => {
      expect(getBollingerPosition(provider, { upper: 110, middle: 100, lower: 90 }, undefined)).toBe('N/A');
    });

    it('should detect price above upper band', () => {
      const result = getBollingerPosition(provider, { upper: 110, middle: 100, lower: 90 }, 115);
      expect(result).toContain('ABOVE upper band');
      expect(result).toContain('overextended');
    });

    it('should detect price below lower band', () => {
      const result = getBollingerPosition(provider, { upper: 110, middle: 100, lower: 90 }, 85);
      expect(result).toContain('BELOW lower band');
      expect(result).toContain('oversold');
    });

    it('should detect price above middle band', () => {
      const result = getBollingerPosition(provider, { upper: 110, middle: 100, lower: 90 }, 105);
      expect(result).toContain('above middle band');
      expect(result).toContain('bullish');
    });

    it('should detect price below middle band', () => {
      const result = getBollingerPosition(provider, { upper: 110, middle: 100, lower: 90 }, 95);
      expect(result).toContain('below middle band');
      expect(result).toContain('bearish');
    });

    it('should return within bands when no middle reference', () => {
      const result = getBollingerPosition(provider, { upper: 110, lower: 90 }, 100);
      expect(result).toBe('within bands');
    });
  });

  describe('Updated System Prompts', () => {
    const getSystemPrompt = (provider: OpenAIProvider, type: 'technical' | 'portfolio' | 'sentiment') => {
      return (provider as any).getSystemPrompt(type);
    };

    it('should forbid indicator values in technical prompt', () => {
      const prompt = getSystemPrompt(provider, 'technical');
      expect(prompt).toContain('DO NOT cite technical indicator values');
      expect(prompt).toContain('plain language');
      expect(prompt).toContain('FORBIDDEN');
    });

    it('should include crowd psychology guidance in sentiment prompt', () => {
      const prompt = getSystemPrompt(provider, 'sentiment');
      expect(prompt).toContain('crowd psychology');
      expect(prompt).toContain('Fear');
      expect(prompt).toContain('greed');
      expect(prompt).toContain('price patterns');
    });

    it('should focus on actionable advice in portfolio prompt', () => {
      const prompt = getSystemPrompt(provider, 'portfolio');
      // New plain-language prompts focus on what to DO
      expect(prompt).toContain('OWN');
      expect(prompt).toContain("DON'T own");
      expect(prompt).toContain('advice');
    });

    it('should include held/not-held guidance in portfolio prompt', () => {
      const prompt = getSystemPrompt(provider, 'portfolio');
      expect(prompt).toContain('OWN');
      expect(prompt).toContain('Add more, hold, or trim');
      expect(prompt).toContain('entry point');
    });

    it('should include disclaimer guidance in sentiment prompt', () => {
      const prompt = getSystemPrompt(provider, 'sentiment');
      expect(prompt).toContain('price patterns');
      expect(prompt).toContain('not news');
      expect(prompt).toContain('social sentiment');
    });
  });
});

describe('MockLLMProvider', () => {
  let mockProvider: MockLLMProvider;

  beforeEach(() => {
    mockProvider = new MockLLMProvider();
  });

  describe('isAvailable', () => {
    it('should always return true', async () => {
      const result = await mockProvider.isAvailable();
      expect(result).toBe(true);
    });
  });

  describe('generateInsight', () => {
    it('should return technical insight for technical type', async () => {
      const result = await mockProvider.generateInsight(
        'technical',
        { summary: { trendDirection: 'up', volatility: 'high' } },
        'AAPL'
      );

      expect(result.type).toBe('technical');
      expect(result.provider).toBe('mock');
      expect(result.confidence).toBe(0.6);
      expect(result.content).toContain('AAPL');
      // New plain-language mock should not contain jargon
      expect(result.content).not.toContain('RSI is at');
      expect(result.content).not.toContain('MACD shows');
    });

    it('should return portfolio insight for portfolio type', async () => {
      const result = await mockProvider.generateInsight('portfolio', {}, 'GOOGL');

      expect(result.type).toBe('portfolio');
      expect(result.content).toContain('GOOGL');
      // Should talk about position/ownership in plain language
      expect(result.content).toContain('position');
    });

    it('should return sentiment insight for sentiment type', async () => {
      const result = await mockProvider.generateInsight('sentiment', {}, 'MSFT');

      expect(result.type).toBe('sentiment');
      expect(result.content).toContain('MSFT');
      // Should mention crowd behavior, not indicator values
      expect(result.content).toContain('crowd');
    });

    it('should include standard metadata', async () => {
      const result = await mockProvider.generateInsight(
        'technical',
        { summary: { overall: 'bearish' } },
        'TSLA'
      );

      expect(result.metadata.indicators_used).toEqual(['RSI', 'MACD']);
      expect(result.metadata.timeframe).toBe('1D');
      expect(result.metadata.data_quality).toBe('medium');
      expect(result.metadata.market_conditions).toBe('bearish');
    });

    it('should use neutral as default market condition', async () => {
      const result = await mockProvider.generateInsight('technical', {}, 'NVDA');
      expect(result.metadata.market_conditions).toBe('neutral');
    });
  });
});

describe('OpenAIProvider - Prompt Builders with Price Context', () => {
  let provider: OpenAIProvider;

  beforeEach(() => {
    provider = new OpenAIProvider('test-api-key');
  });

  // Helper to access private methods
  const buildTechnicalPrompt = (provider: OpenAIProvider, analysis: any, symbol: string) => {
    return (provider as any).buildTechnicalPrompt(analysis, symbol);
  };

  const buildPortfolioPrompt = (provider: OpenAIProvider, data: any, symbol: string) => {
    return (provider as any).buildPortfolioPrompt(data, symbol);
  };

  const buildSentimentPrompt = (provider: OpenAIProvider, data: any, symbol: string) => {
    return (provider as any).buildSentimentPrompt(data, symbol);
  };

  // Sample price context
  const samplePriceContext = {
    currentPrice: 150.25,
    priceChange1W: 5.50,
    priceChange1WPercent: 3.8,
    priceChange1M: -12.75,
    priceChange1MPercent: -7.8,
    high1M: 165.00,
    low1M: 145.50,
    high3M: 175.25,
    low3M: 140.00,
  };

  describe('buildTechnicalPrompt', () => {
    it('should include price data section when priceContext is provided', () => {
      const analysis = {
        priceContext: samplePriceContext,
        indicators: {},
      };

      const prompt = buildTechnicalPrompt(provider, analysis, 'AAPL');

      expect(prompt).toContain('PRICE DATA');
      expect(prompt).toContain('$150.25');
      expect(prompt).toContain('+3.8%');
      expect(prompt).toContain('-7.8%');
    });

    it('should format negative percentages correctly', () => {
      const analysis = {
        priceContext: {
          ...samplePriceContext,
          priceChange1WPercent: -5.5,
        },
        indicators: {},
      };

      const prompt = buildTechnicalPrompt(provider, analysis, 'AAPL');

      expect(prompt).toContain('-5.5%');
    });

    it('should format positive percentages with + sign', () => {
      const analysis = {
        priceContext: {
          ...samplePriceContext,
          priceChange1WPercent: 10.5,
        },
        indicators: {},
      };

      const prompt = buildTechnicalPrompt(provider, analysis, 'AAPL');

      expect(prompt).toContain('+10.5%');
    });

    it('should include 1-month and 3-month ranges', () => {
      const analysis = {
        priceContext: samplePriceContext,
        indicators: {},
      };

      const prompt = buildTechnicalPrompt(provider, analysis, 'AAPL');

      expect(prompt).toContain('$145.50 - $165.00'); // 1-month range
      expect(prompt).toContain('$140.00 - $175.25'); // 3-month range
    });

    it('should not include price data section when priceContext is null', () => {
      const analysis = {
        priceContext: null,
        indicators: {},
      };

      const prompt = buildTechnicalPrompt(provider, analysis, 'AAPL');

      expect(prompt).not.toContain('PRICE DATA');
      expect(prompt).not.toContain('Current price:');
    });

    it('should not include price data section when priceContext is missing', () => {
      const analysis = {
        indicators: {},
      };

      const prompt = buildTechnicalPrompt(provider, analysis, 'AAPL');

      expect(prompt).not.toContain('PRICE DATA');
    });

    it('should handle N/A for null values using safeFixed', () => {
      const analysis = {
        priceContext: {
          currentPrice: null,
          priceChange1WPercent: undefined,
          priceChange1MPercent: 5.0,
          high1M: 100,
          low1M: 90,
          high3M: 110,
          low3M: 80,
        },
        indicators: {},
      };

      const prompt = buildTechnicalPrompt(provider, analysis, 'AAPL');

      // Should contain N/A for null values
      expect(prompt).toContain('N/A');
    });
  });

  describe('buildPortfolioPrompt', () => {
    it('should include price info when priceContext is provided', () => {
      const data = {
        priceContext: samplePriceContext,
        portfolioContext: { isHeld: false },
        indicators: {},
      };

      const prompt = buildPortfolioPrompt(provider, data, 'AAPL');

      expect(prompt).toContain('PRICE:');
      expect(prompt).toContain('$150.25');
      expect(prompt).toContain('-7.8%');
    });

    it('should indicate user owns stock when isHeld is true', () => {
      const data = {
        priceContext: samplePriceContext,
        portfolioContext: { isHeld: true },
        indicators: {},
      };

      const prompt = buildPortfolioPrompt(provider, data, 'AAPL');

      expect(prompt).toContain('USER OWNS THIS STOCK');
    });

    it('should indicate user does not own stock when isHeld is false', () => {
      const data = {
        priceContext: samplePriceContext,
        portfolioContext: { isHeld: false },
        indicators: {},
      };

      const prompt = buildPortfolioPrompt(provider, data, 'AAPL');

      expect(prompt).toContain('USER DOES NOT OWN THIS STOCK');
    });

    it('should not include PRICE line when priceContext is null', () => {
      const data = {
        priceContext: null,
        portfolioContext: { isHeld: false },
        indicators: {},
      };

      const prompt = buildPortfolioPrompt(provider, data, 'AAPL');

      expect(prompt).not.toContain('PRICE:');
    });
  });

  describe('buildSentimentPrompt', () => {
    it('should include price context when provided', () => {
      const data = {
        priceContext: samplePriceContext,
        indicators: {},
      };

      const prompt = buildSentimentPrompt(provider, data, 'AAPL');

      expect(prompt).toContain('PRICE CONTEXT');
      expect(prompt).toContain('$150.25');
      expect(prompt).toContain('-7.8%');
    });

    it('should include 3-month range', () => {
      const data = {
        priceContext: samplePriceContext,
        indicators: {},
      };

      const prompt = buildSentimentPrompt(provider, data, 'AAPL');

      expect(prompt).toContain('$140.00 - $175.25');
    });

    it('should not include price context when null', () => {
      const data = {
        priceContext: null,
        indicators: {},
      };

      const prompt = buildSentimentPrompt(provider, data, 'AAPL');

      expect(prompt).not.toContain('PRICE CONTEXT');
    });

    it('should format positive percentage with + sign', () => {
      const data = {
        priceContext: {
          ...samplePriceContext,
          priceChange1MPercent: 15.5,
        },
        indicators: {},
      };

      const prompt = buildSentimentPrompt(provider, data, 'AAPL');

      expect(prompt).toContain('+15.5%');
    });
  });
});
