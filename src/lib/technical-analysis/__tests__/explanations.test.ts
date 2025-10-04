import { describe, it, expect } from 'vitest';
import {
  generateRSIExplanation,
  generateMACDExplanation,
  generateBollingerBandsExplanation,
  generateTechnicalIndicatorExplanation,
  generateMultipleIndicatorExplanations,
  inferMarketContext,
  MarketContext
} from '../explanations';
import { TechnicalSignal } from '../types';

describe('Technical Indicator Explanations', () => {
  const mockSignal: TechnicalSignal = {
    indicator: 'RSI',
    signal: 'buy',
    strength: 0.8,
    value: 25.0,
    timestamp: new Date('2024-01-15'),
    description: 'RSI oversold'
  };

  const mockMarketContext: MarketContext = {
    condition: 'bull',
    volatility: 'medium',
    sector: 'technology',
    marketCap: 'large'
  };

  describe('RSI Explanations', () => {
    it('should generate oversold explanation for RSI < 30', () => {
      const explanation = generateRSIExplanation(mockSignal, 'AAPL', 150.0);
      
      expect(explanation.indicator).toBe('RSI');
      expect(explanation.value).toBe(25.0);
      expect(explanation.explanation).toContain('oversold conditions');
      expect(explanation.explanation).toContain('AAPL');
      expect(explanation.actionableInsight).toContain('buying opportunity');
      expect(explanation.riskLevel).toBe('low');
      expect(explanation.timeframe).toBe('2-3 trading days');
    });

    it('should generate overbought explanation for RSI > 70', () => {
      const overboughtSignal = { ...mockSignal, value: 75.0, signal: 'sell' as const };
      const explanation = generateRSIExplanation(overboughtSignal, 'AAPL', 150.0);
      
      expect(explanation.explanation).toContain('overbought territory');
      expect(explanation.riskLevel).toBe('medium');
      expect(explanation.actionableInsight).toContain('waiting for RSI to drop');
    });

    it('should generate neutral explanation for RSI 30-70', () => {
      const neutralSignal = { ...mockSignal, value: 50.0, signal: 'hold' as const };
      const explanation = generateRSIExplanation(neutralSignal, 'AAPL', 150.0);
      
      expect(explanation.explanation).toContain('neutral territory');
      expect(explanation.riskLevel).toBe('low');
      expect(explanation.actionableInsight).toContain('No immediate action required');
    });

    it('should apply market context to RSI explanations', () => {
      const explanation = generateRSIExplanation(mockSignal, 'AAPL', 150.0, mockMarketContext);
      
      expect(explanation.explanation).toContain('bull market environment');
      expect(explanation.explanation).toContain('technology stock');
    });
  });

  describe('MACD Explanations', () => {
    describe('Bullish MACD Signals', () => {
      it('should generate bullish explanation with current price for buy signal', () => {
        const macdSignal = { ...mockSignal, indicator: 'MACD', signal: 'buy' as const, value: 1.25 };
        const explanation = generateMACDExplanation(macdSignal, 'AAPL', 150.0);
        
        expect(explanation.indicator).toBe('MACD');
        expect(explanation.explanation).toContain('AAPL\'s MACD shows a bullish signal at current price of $150');
        expect(explanation.explanation).toContain('upward momentum is building');
        expect(explanation.explanation).toContain('faster moving average crosses above the slower one');
        expect(explanation.explanation).toContain('strengthening buying interest');
        expect(explanation.riskLevel).toBe('medium');
        expect(explanation.timeframe).toBe('2-3 trading days');
      });

      it('should format current price correctly in bullish explanations', () => {
        const testCases = [
          { price: 150.0, expected: '$150' },
          { price: 2800.50, expected: '$2800.5' },
          { price: 25.99, expected: '$25.99' },
          { price: 1000, expected: '$1000' }
        ];

        testCases.forEach(({ price, expected }) => {
          const macdSignal = { ...mockSignal, indicator: 'MACD', signal: 'buy' as const, value: 1.25 };
          const explanation = generateMACDExplanation(macdSignal, 'TEST', price);
          
          expect(explanation.explanation).toContain(`current price of ${expected}`);
        });
      });

      it('should include symbol name in bullish explanations', () => {
        const symbols = ['AAPL', 'GOOGL', 'TSLA', 'MSFT'];
        
        symbols.forEach(symbol => {
          const macdSignal = { ...mockSignal, indicator: 'MACD', signal: 'buy' as const, value: 1.25 };
          const explanation = generateMACDExplanation(macdSignal, symbol, 150.0);
          
          expect(explanation.explanation).toContain(`${symbol}'s MACD shows a bullish signal`);
        });
      });

      it('should apply market context to bullish MACD explanations', () => {
        const macdSignal = { ...mockSignal, indicator: 'MACD', signal: 'buy' as const, value: 1.25 };
        const explanation = generateMACDExplanation(macdSignal, 'AAPL', 150.0, mockMarketContext);
        
        expect(explanation.explanation).toContain('bull market environment');
        expect(explanation.explanation).toContain('technology stock');
        expect(explanation.actionableInsight).toContain('Large-cap stocks typically show more stable technical patterns');
      });
    });

    describe('Bearish MACD Signals', () => {
      it('should generate bearish explanation for sell signal', () => {
        const macdSignal = { ...mockSignal, indicator: 'MACD', signal: 'sell' as const, value: -0.75 };
        const explanation = generateMACDExplanation(macdSignal, 'AAPL', 150.0);
        
        expect(explanation.indicator).toBe('MACD');
        expect(explanation.explanation).toContain('AAPL\'s MACD indicates bearish momentum');
        expect(explanation.explanation).toContain('signal line crossing below the MACD line');
        expect(explanation.explanation).toContain('weakening buying pressure');
        expect(explanation.riskLevel).toBe('high');
        expect(explanation.actionableInsight).toContain('reducing position size');
        expect(explanation.actionableInsight).toContain('stop-loss orders');
      });

      it('should not include current price in bearish explanations', () => {
        const macdSignal = { ...mockSignal, indicator: 'MACD', signal: 'sell' as const, value: -0.75 };
        const explanation = generateMACDExplanation(macdSignal, 'AAPL', 150.0);
        
        // Should not contain the specific price formatting used in bullish signals
        expect(explanation.explanation).not.toContain('current price of $150');
        expect(explanation.explanation).not.toContain('at current price');
      });
    });

    describe('Neutral MACD Signals', () => {
      it('should generate neutral explanation for hold signal', () => {
        const macdSignal = { ...mockSignal, indicator: 'MACD', signal: 'hold' as const, value: 0.05 };
        const explanation = generateMACDExplanation(macdSignal, 'AAPL', 150.0);
        
        expect(explanation.indicator).toBe('MACD');
        expect(explanation.explanation).toContain('AAPL\'s MACD is showing mixed signals');
        expect(explanation.explanation).toContain('no clear directional bias');
        expect(explanation.riskLevel).toBe('low');
        expect(explanation.actionableInsight).toContain('Wait for clearer MACD signals');
      });

      it('should not include current price in neutral explanations', () => {
        const macdSignal = { ...mockSignal, indicator: 'MACD', signal: 'hold' as const, value: 0.05 };
        const explanation = generateMACDExplanation(macdSignal, 'AAPL', 150.0);
        
        expect(explanation.explanation).not.toContain('current price of $150');
        expect(explanation.explanation).not.toContain('at current price');
      });
    });

    describe('MACD Value Handling', () => {
      it('should handle positive MACD values correctly', () => {
        const testValues = [0.1, 1.25, 5.0, 10.5];
        
        testValues.forEach(value => {
          const macdSignal = { ...mockSignal, indicator: 'MACD', signal: 'buy' as const, value };
          const explanation = generateMACDExplanation(macdSignal, 'AAPL', 150.0);
          
          expect(explanation.value).toBe(value);
          expect(explanation.explanation).toContain('bullish signal');
        });
      });

      it('should handle negative MACD values correctly', () => {
        const testValues = [-0.1, -1.25, -5.0, -10.5];
        
        testValues.forEach(value => {
          const macdSignal = { ...mockSignal, indicator: 'MACD', signal: 'sell' as const, value };
          const explanation = generateMACDExplanation(macdSignal, 'AAPL', 150.0);
          
          expect(explanation.value).toBe(value);
          expect(explanation.explanation).toContain('bearish momentum');
        });
      });

      it('should handle zero and near-zero MACD values', () => {
        const testValues = [0, 0.001, -0.001, 0.01, -0.01];
        
        testValues.forEach(value => {
          const macdSignal = { ...mockSignal, indicator: 'MACD', signal: 'hold' as const, value };
          const explanation = generateMACDExplanation(macdSignal, 'AAPL', 150.0);
          
          expect(explanation.value).toBe(value);
          expect(explanation.explanation).toContain('mixed signals');
        });
      });
    });

    describe('Edge Cases and Error Handling', () => {
      it('should handle extreme price values in bullish explanations', () => {
        const extremePrices = [0.01, 0.1, 1, 10000, 50000];
        
        extremePrices.forEach(price => {
          const macdSignal = { ...mockSignal, indicator: 'MACD', signal: 'buy' as const, value: 1.25 };
          const explanation = generateMACDExplanation(macdSignal, 'AAPL', price);
          
          expect(explanation.explanation).toContain(`current price of $${price}`);
          expect(explanation.explanation).toContain('bullish signal');
        });
      });

      it('should handle special characters in symbol names', () => {
        const specialSymbols = ['BRK.A', 'BRK-B', 'GOOGL', 'META'];
        
        specialSymbols.forEach(symbol => {
          const macdSignal = { ...mockSignal, indicator: 'MACD', signal: 'buy' as const, value: 1.25 };
          const explanation = generateMACDExplanation(macdSignal, symbol, 150.0);
          
          expect(explanation.explanation).toContain(`${symbol}'s MACD`);
        });
      });

      it('should maintain consistent structure across all signal types', () => {
        const signalTypes: Array<{ signal: 'buy' | 'sell' | 'hold', value: number }> = [
          { signal: 'buy', value: 1.25 },
          { signal: 'sell', value: -0.75 },
          { signal: 'hold', value: 0.05 }
        ];

        signalTypes.forEach(({ signal, value }) => {
          const macdSignal = { ...mockSignal, indicator: 'MACD', signal, value };
          const explanation = generateMACDExplanation(macdSignal, 'AAPL', 150.0);
          
          // All explanations should have required properties
          expect(explanation).toHaveProperty('indicator', 'MACD');
          expect(explanation).toHaveProperty('value', value);
          expect(explanation).toHaveProperty('explanation');
          expect(explanation).toHaveProperty('actionableInsight');
          expect(explanation).toHaveProperty('riskLevel');
          expect(explanation).toHaveProperty('confidence');
          expect(explanation).toHaveProperty('timeframe');
          
          // All explanations should have non-empty strings
          expect(explanation.explanation.length).toBeGreaterThan(0);
          expect(explanation.actionableInsight.length).toBeGreaterThan(0);
        });
      });
    });

    describe('Market Context Integration', () => {
      it('should apply different market contexts to bullish MACD signals', () => {
        const contexts: MarketContext[] = [
          { condition: 'bull', volatility: 'low', sector: 'technology' },
          { condition: 'bear', volatility: 'high', sector: 'energy' },
          { condition: 'sideways', volatility: 'medium', sector: 'healthcare' }
        ];

        contexts.forEach(context => {
          const macdSignal = { ...mockSignal, indicator: 'MACD', signal: 'buy' as const, value: 1.25 };
          const explanation = generateMACDExplanation(macdSignal, 'AAPL', 150.0, context);
          
          expect(explanation.explanation).toContain(`${context.condition} market`);
          expect(explanation.explanation).toContain(`${context.sector} stock`);
          if (context.volatility === 'high') {
            expect(explanation.actionableInsight).toContain('High market volatility suggests using smaller position sizes');
          } else if (context.volatility === 'low') {
            expect(explanation.actionableInsight).toContain('Low volatility environment may lead to more reliable technical signals');
          } else {
            // Medium volatility doesn't add specific text, so just check it doesn't crash
            expect(explanation.actionableInsight).toBeTruthy();
          }
        });
      });

      it('should work without market context', () => {
        const macdSignal = { ...mockSignal, indicator: 'MACD', signal: 'buy' as const, value: 1.25 };
        const explanation = generateMACDExplanation(macdSignal, 'AAPL', 150.0);
        
        // Should still generate valid explanation without market context
        expect(explanation.explanation).toContain('bullish signal');
        expect(explanation.explanation).toContain('current price of $150');
        expect(explanation.actionableInsight).toContain('potential upward momentum');
      });
    });
  });

  describe('Bollinger Bands Explanations', () => {
    it('should generate lower band explanation for buy signal', () => {
      const bbSignal = { ...mockSignal, indicator: 'BOLLINGER_BANDS' };
      const explanation = generateBollingerBandsExplanation(bbSignal, 'AAPL', 150.0);
      
      expect(explanation.indicator).toBe('BOLLINGER_BANDS');
      expect(explanation.explanation).toContain('lower Bollinger Band');
      expect(explanation.riskLevel).toBe('medium');
    });

    it('should generate upper band explanation for sell signal', () => {
      const bbSignal = { ...mockSignal, indicator: 'BOLLINGER_BANDS', signal: 'sell' as const };
      const explanation = generateBollingerBandsExplanation(bbSignal, 'AAPL', 150.0);
      
      expect(explanation.explanation).toContain('upper Bollinger Band');
      expect(explanation.actionableInsight).toContain('taking profits');
    });
  });

  describe('Multiple Indicators Analysis', () => {
    it('should detect conflicting signals', () => {
      const signals: TechnicalSignal[] = [
        { ...mockSignal, indicator: 'RSI', signal: 'buy' },
        { ...mockSignal, indicator: 'MACD', signal: 'sell' }
      ];

      const result = generateMultipleIndicatorExplanations(signals, 'AAPL', 150.0);
      
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0]).toContain('Mixed signals detected');
      expect(result.conflicts[0]).toContain('RSI');
      expect(result.conflicts[0]).toContain('MACD');
    });

    it('should determine overall sentiment', () => {
      const bullishSignals: TechnicalSignal[] = [
        { ...mockSignal, indicator: 'RSI', signal: 'buy' },
        { ...mockSignal, indicator: 'MACD', signal: 'buy' }
      ];

      const result = generateMultipleIndicatorExplanations(bullishSignals, 'AAPL', 150.0);
      
      expect(result.overallSentiment).toBe('bullish');
      expect(result.explanations).toHaveLength(2);
    });

    it('should handle empty indicators array', () => {
      const result = generateMultipleIndicatorExplanations([], 'AAPL', 150.0);
      
      expect(result.explanations).toHaveLength(0);
      expect(result.conflicts).toHaveLength(0);
      expect(result.overallSentiment).toBe('neutral');
    });
  });

  describe('Generic Indicator Explanation', () => {
    it('should route to correct explanation function based on indicator type', () => {
      const rsiExplanation = generateTechnicalIndicatorExplanation(mockSignal, 'AAPL', 150.0);
      expect(rsiExplanation.indicator).toBe('RSI');
      
      const macdSignal = { ...mockSignal, indicator: 'MACD' };
      const macdExplanation = generateTechnicalIndicatorExplanation(macdSignal, 'AAPL', 150.0);
      expect(macdExplanation.indicator).toBe('MACD');
    });

    it('should handle unknown indicators with fallback', () => {
      const unknownSignal = { ...mockSignal, indicator: 'UNKNOWN' };
      const explanation = generateTechnicalIndicatorExplanation(unknownSignal, 'AAPL', 150.0);
      
      expect(explanation.indicator).toBe('UNKNOWN');
      expect(explanation.explanation).toContain('requires additional context');
      expect(explanation.riskLevel).toBe('medium');
    });
  });

  describe('Market Context Inference', () => {
    it('should infer market context from basic parameters', () => {
      const context = inferMarketContext('AAPL', 'technology', 2500000000000);
      
      expect(context.sector).toBe('technology');
      expect(context.marketCap).toBe('large');
      expect(context.condition).toBe('sideways'); // Default value
      expect(context.volatility).toBe('medium'); // Default value
    });

    it('should categorize market cap correctly', () => {
      const smallCap = inferMarketContext('SMALL', 'technology', 1000000000);
      expect(smallCap.marketCap).toBe('small');
      
      const midCap = inferMarketContext('MID', 'technology', 5000000000);
      expect(midCap.marketCap).toBe('mid');
      
      const largeCap = inferMarketContext('LARGE', 'technology', 50000000000);
      expect(largeCap.marketCap).toBe('large');
    });

    it('should handle missing parameters', () => {
      const context = inferMarketContext('UNKNOWN');
      
      expect(context.sector).toBe('unknown');
      expect(context.marketCap).toBeUndefined();
    });
  });

  describe('Market Context Application', () => {
    it('should enhance explanations with bull market context', () => {
      const bullContext: MarketContext = {
        condition: 'bull',
        volatility: 'low',
        sector: 'technology'
      };

      const explanation = generateRSIExplanation(mockSignal, 'AAPL', 150.0, bullContext);
      
      expect(explanation.explanation).toContain('bull market environment');
      expect(explanation.actionableInsight).toContain('Low volatility environment');
      expect(explanation.explanation).toContain('technology stock');
    });

    it('should enhance explanations with bear market context', () => {
      const bearContext: MarketContext = {
        condition: 'bear',
        volatility: 'high',
        sector: 'energy',
        marketCap: 'small'
      };

      const explanation = generateRSIExplanation(mockSignal, 'XOM', 75.0, bearContext);
      
      expect(explanation.explanation).toContain('bear market conditions');
      expect(explanation.actionableInsight).toContain('High market volatility');
      expect(explanation.actionableInsight).toContain('Small-cap stocks');
    });
  });
});