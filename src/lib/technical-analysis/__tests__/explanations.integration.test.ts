import { describe, it, expect } from 'vitest';
import {
  generateMultipleIndicatorExplanations,
  inferMarketContext,
  generateTechnicalIndicatorExplanation,
  MarketContext
} from '../explanations';
import { TechnicalSignal } from '../types';

/**
 * Integration tests for the explanation system
 * Tests explanation generation with realistic market data and contextual adaptation
 */
describe('Technical Indicator Explanation System - Integration Tests', () => {
  
  /**
   * Realistic market data scenarios
   */
  const createRealisticPriceData = (scenario: 'bull' | 'bear' | 'sideways' | 'volatile') => {
    const basePrice = 150;
    const days = 50;
    
    switch (scenario) {
      case 'bull':
        // Steady uptrend with minor pullbacks
        return Array.from({ length: days }, (_, i) => ({
          close: basePrice + (i * 1.2) + (Math.random() * 2 - 1),
          date: new Date(2024, 0, i + 1)
        }));
      
      case 'bear':
        // Steady downtrend with minor bounces
        return Array.from({ length: days }, (_, i) => ({
          close: basePrice - (i * 1.2) + (Math.random() * 2 - 1),
          date: new Date(2024, 0, i + 1)
        }));
      
      case 'sideways':
        // Range-bound with small fluctuations
        return Array.from({ length: days }, (_, i) => ({
          close: basePrice + Math.sin(i / 5) * 3 + (Math.random() * 1 - 0.5),
          date: new Date(2024, 0, i + 1)
        }));
      
      case 'volatile':
        // High volatility with large swings
        return Array.from({ length: days }, (_, i) => ({
          close: basePrice + (i % 2 === 0 ? 10 : -10) + (Math.random() * 5),
          date: new Date(2024, 0, i + 1)
        }));
    }
  };

  /**
   * Test 1: Real market data with bull market conditions
   */
  describe('Bull Market Scenario Integration', () => {
    it('should generate contextually appropriate explanations for bull market with multiple indicators', () => {
      const priceData = createRealisticPriceData('bull');
      const marketContext = inferMarketContext('AAPL', 'Technology', 2500000000000, priceData);
      
      // Verify market context inference
      expect(marketContext.condition).toBe('bull');
      expect(marketContext.sector).toBe('Technology');
      expect(marketContext.marketCap).toBe('large');
      
      // Create realistic technical signals for bull market
      const signals: TechnicalSignal[] = [
        {
          indicator: 'RSI',
          signal: 'buy',
          strength: 0.7,
          value: 35.0,
          timestamp: new Date('2024-01-15'),
          description: 'RSI recovering from oversold'
        },
        {
          indicator: 'MACD',
          signal: 'buy',
          strength: 0.8,
          value: 1.5,
          timestamp: new Date('2024-01-15'),
          description: 'MACD bullish crossover'
        },
        {
          indicator: 'SMA',
          signal: 'buy',
          strength: 0.85,
          value: 155.0,
          timestamp: new Date('2024-01-15'),
          description: 'Golden Cross detected'
        }
      ];
      
      const result = generateMultipleIndicatorExplanations(
        signals,
        'AAPL',
        160.0,
        marketContext
      );
      
      // Verify explanations are generated
      expect(result.explanations).toHaveLength(3);
      expect(result.overallSentiment).toBe('bullish');
      expect(result.conflicts).toHaveLength(0);
      
      // Verify contextual adaptation in explanations
      result.explanations.forEach(explanation => {
        expect(explanation.explanation).toContain('bull market environment');
        expect(explanation.explanation).toContain('Technology stock');
        expect(explanation.actionableInsight).toContain('Large-cap stocks');
      });
      
      // Verify specific indicator explanations
      const rsiExplanation = result.explanations.find(e => e.indicator === 'RSI');
      expect(rsiExplanation).toBeDefined();
      expect(rsiExplanation?.explanation).toContain('AAPL');
      expect(rsiExplanation?.riskLevel).toBe('low');
      
      const macdExplanation = result.explanations.find(e => e.indicator === 'MACD');
      expect(macdExplanation).toBeDefined();
      expect(macdExplanation?.explanation).toContain('bullish signal at current price of $160');
      expect(macdExplanation?.timeframe).toBe('2-3 trading days');
    });
  });

  /**
   * Test 2: Real market data with bear market conditions
   */
  describe('Bear Market Scenario Integration', () => {
    it('should adapt explanations for bear market with conflicting signals', () => {
      const priceData = createRealisticPriceData('bear');
      const marketContext = inferMarketContext('XOM', 'Energy', 450000000000, priceData);
      
      // Verify market context inference
      expect(marketContext.condition).toBe('bear');
      expect(marketContext.sector).toBe('Energy');
      expect(marketContext.marketCap).toBe('large');
      
      // Create mixed signals typical in bear market
      const signals: TechnicalSignal[] = [
        {
          indicator: 'RSI',
          signal: 'buy',
          strength: 0.6,
          value: 28.0,
          timestamp: new Date('2024-01-15'),
          description: 'RSI oversold'
        },
        {
          indicator: 'MACD',
          signal: 'sell',
          strength: 0.75,
          value: -0.8,
          timestamp: new Date('2024-01-15'),
          description: 'MACD bearish'
        },
        {
          indicator: 'ADX',
          signal: 'sell',
          strength: 0.7,
          value: 32.0,
          timestamp: new Date('2024-01-15'),
          description: 'Strong downtrend'
        }
      ];
      
      const result = generateMultipleIndicatorExplanations(
        signals,
        'XOM',
        75.0,
        marketContext
      );
      
      // Verify conflict detection
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0]).toContain('Mixed signals detected');
      expect(result.conflicts[0]).toContain('RSI');
      expect(result.conflicts[0]).toContain('MACD');
      
      // Verify bear market context is applied
      result.explanations.forEach(explanation => {
        expect(explanation.explanation).toContain('bear market conditions');
        expect(explanation.actionableInsight).toContain('tighter stop-losses');
      });
      
      // Verify RSI buy signal has additional caution in bear market
      const rsiExplanation = result.explanations.find(e => e.indicator === 'RSI');
      expect(rsiExplanation?.actionableInsight).toContain('Buying in bear markets is riskier');
    });
  });

  /**
   * Test 3: Volatile market with high-risk indicators
   */
  describe('Volatile Market Scenario Integration', () => {
    it('should provide appropriate risk warnings for volatile market conditions', () => {
      const priceData = createRealisticPriceData('volatile');
      const marketContext = inferMarketContext('TSLA', 'Technology', 800000000000, priceData);
      
      // Verify high volatility detection
      expect(marketContext.volatility).toBe('high');
      expect(marketContext.marketCap).toBe('large');
      
      // Create signals typical in volatile conditions
      const signals: TechnicalSignal[] = [
        {
          indicator: 'STOCHASTIC',
          signal: 'sell',
          strength: 0.7,
          value: 85.0,
          timestamp: new Date('2024-01-15'),
          description: 'Stochastic overbought'
        },
        {
          indicator: 'WILLIAMS %R',
          signal: 'sell',
          strength: 0.65,
          value: -10.0,
          timestamp: new Date('2024-01-15'),
          description: 'Williams %R overbought'
        },
        {
          indicator: 'BOLLINGER_BANDS',
          signal: 'sell',
          strength: 0.6,
          value: 255.0,
          timestamp: new Date('2024-01-15'),
          description: 'Price at upper band'
        }
      ];
      
      const result = generateMultipleIndicatorExplanations(
        signals,
        'TSLA',
        250.0,
        marketContext
      );
      
      // Verify all explanations include volatility warnings
      result.explanations.forEach(explanation => {
        expect(explanation.actionableInsight).toContain('High market volatility');
        expect(explanation.actionableInsight).toContain('smaller position sizes');
        expect(explanation.actionableInsight).toContain('wider stop-losses');
      });
      
      // Verify overall sentiment
      expect(result.overallSentiment).toBe('bearish');
      expect(result.conflicts).toHaveLength(0);
    });
  });

  /**
   * Test 4: Sideways market with neutral signals
   */
  describe('Sideways Market Scenario Integration', () => {
    it('should provide range-trading guidance for sideways market', () => {
      const priceData = createRealisticPriceData('sideways');
      const marketContext = inferMarketContext('JNJ', 'Healthcare', 400000000000, priceData);
      
      // Verify sideways market detection
      expect(marketContext.condition).toBe('sideways');
      expect(marketContext.sector).toBe('Healthcare');
      
      // Create neutral signals typical in range-bound market
      const signals: TechnicalSignal[] = [
        {
          indicator: 'RSI',
          signal: 'hold',
          strength: 0.5,
          value: 50.0,
          timestamp: new Date('2024-01-15'),
          description: 'RSI neutral'
        },
        {
          indicator: 'ADX',
          signal: 'hold',
          strength: 0.4,
          value: 18.0,
          timestamp: new Date('2024-01-15'),
          description: 'No clear trend'
        },
        {
          indicator: 'MACD',
          signal: 'hold',
          strength: 0.45,
          value: 0.05,
          timestamp: new Date('2024-01-15'),
          description: 'MACD neutral'
        }
      ];
      
      const result = generateMultipleIndicatorExplanations(
        signals,
        'JNJ',
        160.0,
        marketContext
      );
      
      // Verify sideways market context
      result.explanations.forEach(explanation => {
        expect(explanation.explanation).toContain('sideways market');
        expect(explanation.actionableInsight.toLowerCase()).toContain('range');
      });
      
      // Verify ADX explanation for no trend
      const adxExplanation = result.explanations.find(e => e.indicator === 'ADX');
      expect(adxExplanation?.explanation).toContain('weak or no trend');
      expect(adxExplanation?.actionableInsight).toContain('Avoid trend-following strategies');
      expect(adxExplanation?.actionableInsight).toContain('range-trading approaches');
      
      // Verify overall sentiment is neutral
      expect(result.overallSentiment).toBe('neutral');
    });
  });

  /**
   * Test 5: Small-cap stock with different sector contexts
   */
  describe('Small-Cap Stock Scenario Integration', () => {
    it('should provide appropriate guidance for small-cap stocks across sectors', () => {
      const sectors = [
        { name: 'Technology', symbol: 'SMCI' },
        { name: 'Healthcare', symbol: 'SGEN' },
        { name: 'Energy', symbol: 'FANG' }
      ];
      
      sectors.forEach(({ name: sector, symbol }) => {
        const priceData = createRealisticPriceData('bull');
        const marketContext = inferMarketContext(symbol, sector, 1500000000, priceData);
        
        // Verify small-cap categorization
        expect(marketContext.marketCap).toBe('small');
        expect(marketContext.sector).toBe(sector);
        
        const signal: TechnicalSignal = {
          indicator: 'RSI',
          signal: 'buy',
          strength: 0.7,
          value: 32.0,
          timestamp: new Date('2024-01-15'),
          description: 'RSI oversold'
        };
        
        const explanation = generateTechnicalIndicatorExplanation(
          signal,
          symbol,
          25.0,
          marketContext
        );
        
        // Verify small-cap specific guidance
        expect(explanation.actionableInsight).toContain('Small-cap stocks');
        expect(explanation.actionableInsight).toContain('more volatile');
        expect(explanation.actionableInsight).toContain('limit orders');
        
        // Verify sector-specific insights are included
        expect(explanation.explanation).toContain(`${sector} stock`);
      });
    });
  });

  /**
   * Test 6: Mid-cap stock with balanced characteristics
   */
  describe('Mid-Cap Stock Scenario Integration', () => {
    it('should provide balanced guidance for mid-cap stocks', () => {
      const priceData = createRealisticPriceData('bull');
      const marketContext = inferMarketContext('SQ', 'Financial', 5000000000, priceData);
      
      // Verify mid-cap categorization
      expect(marketContext.marketCap).toBe('mid');
      expect(marketContext.sector).toBe('Financial');
      
      const signals: TechnicalSignal[] = [
        {
          indicator: 'OBV',
          signal: 'buy',
          strength: 0.7,
          value: 500000,
          timestamp: new Date('2024-01-15'),
          description: 'OBV trending upward'
        },
        {
          indicator: 'MACD',
          signal: 'buy',
          strength: 0.75,
          value: 0.8,
          timestamp: new Date('2024-01-15'),
          description: 'MACD bullish'
        }
      ];
      
      const result = generateMultipleIndicatorExplanations(
        signals,
        'SQ',
        65.0,
        marketContext
      );
      
      // Verify mid-cap specific guidance
      result.explanations.forEach(explanation => {
        expect(explanation.actionableInsight).toContain('Mid-cap stocks');
        expect(explanation.actionableInsight).toContain('balance of growth potential and stability');
      });
      
      // Verify Financial sector insights
      result.explanations.forEach(explanation => {
        expect(explanation.explanation).toContain('Financial stock');
      });
    });
  });

  /**
   * Test 7: Complete workflow with all indicator types
   */
  describe('Complete Indicator Suite Integration', () => {
    it('should generate comprehensive explanations for all supported indicators', () => {
      const priceData = createRealisticPriceData('bull');
      const marketContext = inferMarketContext('AAPL', 'Technology', 2500000000000, priceData);
      
      // Create signals for all supported indicators
      const signals: TechnicalSignal[] = [
        {
          indicator: 'RSI',
          signal: 'buy',
          strength: 0.7,
          value: 35.0,
          timestamp: new Date('2024-01-15'),
          description: 'RSI oversold'
        },
        {
          indicator: 'MACD',
          signal: 'buy',
          strength: 0.8,
          value: 1.2,
          timestamp: new Date('2024-01-15'),
          description: 'MACD bullish'
        },
        {
          indicator: 'BOLLINGER_BANDS',
          signal: 'buy',
          strength: 0.65,
          value: 148.0,
          timestamp: new Date('2024-01-15'),
          description: 'Price at lower band'
        },
        {
          indicator: 'STOCHASTIC',
          signal: 'buy',
          strength: 0.7,
          value: 18.0,
          timestamp: new Date('2024-01-15'),
          description: 'Stochastic oversold'
        },
        {
          indicator: 'WILLIAMS %R',
          signal: 'buy',
          strength: 0.65,
          value: -85.0,
          timestamp: new Date('2024-01-15'),
          description: 'Williams %R oversold'
        },
        {
          indicator: 'ADX',
          signal: 'buy',
          strength: 0.75,
          value: 28.0,
          timestamp: new Date('2024-01-15'),
          description: 'Strong trend'
        },
        {
          indicator: 'OBV',
          signal: 'buy',
          strength: 0.7,
          value: 1000000,
          timestamp: new Date('2024-01-15'),
          description: 'OBV rising'
        },
        {
          indicator: 'SMA',
          signal: 'buy',
          strength: 0.8,
          value: 155.0,
          timestamp: new Date('2024-01-15'),
          description: 'Golden Cross'
        }
      ];
      
      const result = generateMultipleIndicatorExplanations(
        signals,
        'AAPL',
        160.0,
        marketContext
      );
      
      // Verify all explanations are generated
      expect(result.explanations).toHaveLength(8);
      expect(result.overallSentiment).toBe('bullish');
      expect(result.conflicts).toHaveLength(0);
      
      // Verify each indicator has proper structure
      result.explanations.forEach(explanation => {
        expect(explanation).toHaveProperty('indicator');
        expect(explanation).toHaveProperty('value');
        expect(explanation).toHaveProperty('explanation');
        expect(explanation).toHaveProperty('actionableInsight');
        expect(explanation).toHaveProperty('riskLevel');
        expect(explanation).toHaveProperty('confidence');
        expect(explanation).toHaveProperty('timeframe');
        
        // Verify non-empty strings
        expect(explanation.explanation.length).toBeGreaterThan(0);
        expect(explanation.actionableInsight.length).toBeGreaterThan(0);
        
        // Verify market context is applied
        expect(explanation.explanation).toContain('bull market environment');
      });
    });
  });

  /**
   * Test 8: Contextual adaptation accuracy
   */
  describe('Contextual Adaptation Accuracy', () => {
    it('should adapt RSI explanations based on market conditions', () => {
      const scenarios = [
        { condition: 'bull' as const, priceData: createRealisticPriceData('bull') },
        { condition: 'bear' as const, priceData: createRealisticPriceData('bear') },
        { condition: 'sideways' as const, priceData: createRealisticPriceData('sideways') }
      ];
      
      scenarios.forEach(({ condition, priceData }) => {
        const marketContext = inferMarketContext('TEST', 'Technology', 50000000000, priceData);
        expect(marketContext.condition).toBe(condition);
        
        const signal: TechnicalSignal = {
          indicator: 'RSI',
          signal: 'buy',
          strength: 0.7,
          value: 28.0,
          timestamp: new Date('2024-01-15'),
          description: 'RSI oversold'
        };
        
        const explanation = generateTechnicalIndicatorExplanation(
          signal,
          'TEST',
          100.0,
          marketContext
        );
        
        // Verify condition-specific text is present
        expect(explanation.explanation).toContain(`${condition} market`);
        
        // Verify condition-specific guidance
        if (condition === 'bull') {
          expect(explanation.explanation).toContain('increased reliability for upward moves');
        } else if (condition === 'bear') {
          expect(explanation.actionableInsight).toContain('Buying in bear markets is riskier');
          expect(explanation.actionableInsight).toContain('tighter stop-losses');
        } else if (condition === 'sideways') {
          expect(explanation.actionableInsight.toLowerCase()).toContain('range');
        }
      });
    });

    it('should adapt explanations based on volatility levels', () => {
      const volatilityScenarios = [
        { scenario: 'bull' as const, expectedVol: 'low' as const },
        { scenario: 'volatile' as const, expectedVol: 'high' as const }
      ];
      
      volatilityScenarios.forEach(({ scenario, expectedVol }) => {
        const priceData = createRealisticPriceData(scenario);
        const marketContext = inferMarketContext('TEST', 'Technology', 50000000000, priceData);
        
        const signal: TechnicalSignal = {
          indicator: 'MACD',
          signal: 'buy',
          strength: 0.75,
          value: 1.0,
          timestamp: new Date('2024-01-15'),
          description: 'MACD bullish'
        };
        
        const explanation = generateTechnicalIndicatorExplanation(
          signal,
          'TEST',
          100.0,
          marketContext
        );
        
        // Verify volatility-specific guidance
        if (expectedVol === 'high') {
          expect(explanation.actionableInsight).toContain('High market volatility');
          expect(explanation.actionableInsight).toContain('smaller position sizes');
        } else if (expectedVol === 'low') {
          expect(explanation.actionableInsight).toContain('Low volatility environment');
          expect(explanation.actionableInsight).toContain('more reliable technical signals');
        }
      });
    });
  });

  /**
   * Test 9: Real-world edge cases
   */
  describe('Real-World Edge Cases', () => {
    it('should handle extreme RSI values with appropriate explanations', () => {
      const priceData = createRealisticPriceData('volatile');
      const marketContext = inferMarketContext('MEME', 'Technology', 500000000, priceData);
      
      const extremeSignals = [
        { value: 5.0, expectedRange: 'oversold' },
        { value: 95.0, expectedRange: 'overbought' }
      ];
      
      extremeSignals.forEach(({ value, expectedRange }) => {
        const signal: TechnicalSignal = {
          indicator: 'RSI',
          signal: value < 30 ? 'buy' : 'sell',
          strength: 0.8,
          value,
          timestamp: new Date('2024-01-15'),
          description: `RSI ${expectedRange}`
        };
        
        const explanation = generateTechnicalIndicatorExplanation(
          signal,
          'MEME',
          50.0,
          marketContext
        );
        
        expect(explanation.explanation).toContain(expectedRange);
        expect(explanation.explanation).toContain('MEME');
        expect(explanation.actionableInsight).toBeTruthy();
      });
    });

    it('should handle divergence scenarios in volume indicators', () => {
      const priceData = createRealisticPriceData('bull');
      const marketContext = inferMarketContext('STOCK', 'Technology', 10000000000, priceData);
      
      const signal: TechnicalSignal = {
        indicator: 'OBV',
        signal: 'hold',
        strength: 0.6,
        value: 750000,
        timestamp: new Date('2024-01-15'),
        description: 'OBV divergence detected'
      };
      
      const explanation = generateTechnicalIndicatorExplanation(
        signal,
        'STOCK',
        100.0,
        marketContext
      );
      
      expect(explanation.explanation).toContain('divergence');
      expect(explanation.actionableInsight).toContain('Divergences are important warning signals');
      expect(explanation.riskLevel).toBe('medium');
    });

    it('should handle insufficient data gracefully', () => {
      // Very short price data
      const shortPriceData = Array.from({ length: 5 }, (_, i) => ({
        close: 100 + i,
        date: new Date(2024, 0, i + 1)
      }));
      
      const marketContext = inferMarketContext('NEW', 'Technology', 1000000000, shortPriceData);
      
      // Should default to sideways and medium volatility
      expect(marketContext.condition).toBe('sideways');
      expect(marketContext.volatility).toBe('medium');
      
      const signal: TechnicalSignal = {
        indicator: 'RSI',
        signal: 'buy',
        strength: 0.7,
        value: 30.0,
        timestamp: new Date('2024-01-15'),
        description: 'RSI oversold'
      };
      
      const explanation = generateTechnicalIndicatorExplanation(
        signal,
        'NEW',
        105.0,
        marketContext
      );
      
      // Should still generate valid explanation
      expect(explanation.explanation).toBeTruthy();
      expect(explanation.actionableInsight).toBeTruthy();
    });
  });

  /**
   * Test 10: Cross-indicator consistency
   */
  describe('Cross-Indicator Consistency', () => {
    it('should maintain consistent market context across all indicators', () => {
      const priceData = createRealisticPriceData('bear');
      const marketContext = inferMarketContext('BEAR', 'Energy', 300000000000, priceData);
      
      const indicators = ['RSI', 'MACD', 'STOCHASTIC', 'ADX', 'OBV', 'SMA'];
      
      indicators.forEach(indicatorName => {
        const signal: TechnicalSignal = {
          indicator: indicatorName,
          signal: 'sell',
          strength: 0.7,
          value: indicatorName === 'RSI' ? 75.0 : indicatorName === 'ADX' ? 30.0 : -0.5,
          timestamp: new Date('2024-01-15'),
          description: `${indicatorName} bearish`
        };
        
        const explanation = generateTechnicalIndicatorExplanation(
          signal,
          'BEAR',
          50.0,
          marketContext
        );
        
        // All should reference bear market
        expect(explanation.explanation).toContain('bear market conditions');
        
        // All should have large-cap guidance
        expect(explanation.actionableInsight).toContain('Large-cap stocks');
        
        // All should reference Energy sector
        expect(explanation.explanation).toContain('Energy stock');
      });
    });

    it('should provide consistent risk assessments for similar conditions', () => {
      const priceData = createRealisticPriceData('bull');
      const marketContext = inferMarketContext('SAFE', 'Healthcare', 100000000000, priceData);
      
      // Multiple oversold indicators should have similar risk levels
      const oversoldSignals: TechnicalSignal[] = [
        {
          indicator: 'RSI',
          signal: 'buy',
          strength: 0.7,
          value: 25.0,
          timestamp: new Date('2024-01-15'),
          description: 'RSI oversold'
        },
        {
          indicator: 'STOCHASTIC',
          signal: 'buy',
          strength: 0.7,
          value: 15.0,
          timestamp: new Date('2024-01-15'),
          description: 'Stochastic oversold'
        },
        {
          indicator: 'WILLIAMS %R',
          signal: 'buy',
          strength: 0.65,
          value: -85.0,
          timestamp: new Date('2024-01-15'),
          description: 'Williams %R oversold'
        }
      ];
      
      const explanations = oversoldSignals.map(signal =>
        generateTechnicalIndicatorExplanation(signal, 'SAFE', 150.0, marketContext)
      );
      
      // All oversold indicators in bull market should have low or medium risk
      explanations.forEach(explanation => {
        expect(['low', 'medium']).toContain(explanation.riskLevel);
        expect(explanation.explanation).toContain('oversold');
      });
    });
  });

  /**
   * Test 11: Performance with realistic data volumes
   */
  describe('Performance Integration', () => {
    it('should handle large numbers of indicators efficiently', () => {
      const priceData = createRealisticPriceData('bull');
      const marketContext = inferMarketContext('PERF', 'Technology', 50000000000, priceData);
      
      // Create 20 signals (realistic for comprehensive analysis)
      const signals: TechnicalSignal[] = Array.from({ length: 20 }, (_, i) => ({
        indicator: `INDICATOR_${i}`,
        signal: i % 3 === 0 ? 'buy' : i % 3 === 1 ? 'sell' : 'hold',
        strength: 0.5 + (i % 5) * 0.1,
        value: 50 + i * 2,
        timestamp: new Date('2024-01-15'),
        description: `Signal ${i}`
      }));
      
      const startTime = performance.now();
      const result = generateMultipleIndicatorExplanations(
        signals,
        'PERF',
        100.0,
        marketContext
      );
      const endTime = performance.now();
      
      // Should complete in reasonable time (< 50ms)
      expect(endTime - startTime).toBeLessThan(50);
      
      // All explanations should be generated
      expect(result.explanations).toHaveLength(20);
      
      // Should detect conflicts
      expect(result.conflicts.length).toBeGreaterThan(0);
    });
  });
});
