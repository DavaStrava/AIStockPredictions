import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TechnicalSignal } from '@/lib/technical-analysis/types';
import TechnicalIndicatorExplanations from '../TechnicalIndicatorExplanations';

describe('TechnicalIndicatorExplanations Component', () => {
  const mockIndicators: TechnicalSignal[] = [
    {
      indicator: 'RSI',
      signal: 'sell',
      strength: 0.8,
      value: 75.5,
      timestamp: new Date('2024-01-15'),
      description: 'RSI indicates overbought conditions'
    },
    {
      indicator: 'MACD',
      signal: 'buy',
      strength: 0.7,
      value: 1.25,
      timestamp: new Date('2024-01-15'),
      description: 'MACD bullish crossover detected'
    }
  ];

  const defaultProps = {
    indicators: mockIndicators,
    symbol: 'AAPL',
    currentPrice: 150.00,
    marketContext: {
      condition: 'bull' as const,
      volatility: 'medium' as const,
      sector: 'technology'
    }
  };

  describe('Basic Rendering and Structure', () => {
    it('should render component with correct title', () => {
      render(<TechnicalIndicatorExplanations {...defaultProps} />);
      
      expect(screen.getByTestId('technical-indicator-explanations')).toBeInTheDocument();
      expect(screen.getByText('AAPL Technical Indicators')).toBeInTheDocument();
    });

    it('should render all provided indicators', () => {
      render(<TechnicalIndicatorExplanations {...defaultProps} />);
      
      expect(screen.getByTestId('explanation-rsi')).toBeInTheDocument();
      expect(screen.getByTestId('explanation-macd')).toBeInTheDocument();
    });

    it('should display no indicators message when empty array provided', () => {
      render(
        <TechnicalIndicatorExplanations 
          {...defaultProps} 
          indicators={[]} 
        />
      );
      
      expect(screen.getByTestId('no-indicators')).toBeInTheDocument();
      expect(screen.getByText('No technical indicators available')).toBeInTheDocument();
    });

    it('should handle undefined indicators gracefully', () => {
      render(
        <TechnicalIndicatorExplanations 
          {...defaultProps} 
          indicators={undefined as any} 
        />
      );
      
      expect(screen.getByTestId('technical-indicator-explanations')).toBeInTheDocument();
      expect(screen.getByTestId('no-indicators')).toBeInTheDocument();
    });

    it('should handle null indicators gracefully', () => {
      render(
        <TechnicalIndicatorExplanations 
          {...defaultProps} 
          indicators={null as any} 
        />
      );
      
      expect(screen.getByTestId('technical-indicator-explanations')).toBeInTheDocument();
      expect(screen.getByTestId('no-indicators')).toBeInTheDocument();
    });
  });

  describe('RSI Explanations', () => {
    it('should generate overbought explanation for RSI > 70', () => {
      const overboughtRSI: TechnicalSignal[] = [{
        indicator: 'RSI',
        signal: 'sell',
        strength: 0.8,
        value: 75.5,
        timestamp: new Date(),
        description: 'RSI overbought'
      }];

      render(
        <TechnicalIndicatorExplanations 
          {...defaultProps} 
          indicators={overboughtRSI} 
        />
      );
      
      const explanation = screen.getByTestId('explanation-text-rsi');
      expect(explanation).toHaveTextContent('overbought territory');
      expect(explanation).toHaveTextContent('AAPL');
      expect(explanation).toHaveTextContent('75.5');
      expect(explanation).toHaveTextContent('selling pressure may emerge soon');
      
      const insight = screen.getByTestId('insight-rsi');
      expect(insight).toHaveTextContent('Consider waiting for RSI to drop below 50');
      expect(insight).toHaveTextContent('take profits if currently holding');
      
      const risk = screen.getByTestId('risk-rsi');
      expect(risk).toHaveTextContent('medium');
    });

    it('should generate oversold explanation for RSI < 30', () => {
      const oversoldRSI: TechnicalSignal[] = [{
        indicator: 'RSI',
        signal: 'buy',
        strength: 0.8,
        value: 25.3,
        timestamp: new Date(),
        description: 'RSI oversold'
      }];

      render(
        <TechnicalIndicatorExplanations 
          {...defaultProps} 
          indicators={oversoldRSI} 
        />
      );
      
      const explanation = screen.getByTestId('explanation-text-rsi');
      expect(explanation).toHaveTextContent('oversold conditions');
      expect(explanation).toHaveTextContent('25.3');
      expect(explanation).toHaveTextContent('short-term bounces');
      
      const insight = screen.getByTestId('insight-rsi');
      expect(insight).toHaveTextContent('buying opportunity');
      expect(insight).toHaveTextContent('2-3 trading days');
      
      const risk = screen.getByTestId('risk-rsi');
      expect(risk).toHaveTextContent('low');
    });

    it('should generate neutral explanation for RSI between 30-70', () => {
      const neutralRSI: TechnicalSignal[] = [{
        indicator: 'RSI',
        signal: 'hold',
        strength: 0.5,
        value: 50.0,
        timestamp: new Date(),
        description: 'RSI neutral'
      }];

      render(
        <TechnicalIndicatorExplanations 
          {...defaultProps} 
          indicators={neutralRSI} 
        />
      );
      
      const explanation = screen.getByTestId('explanation-text-rsi');
      expect(explanation).toHaveTextContent('neutral territory');
      expect(explanation).toHaveTextContent('balanced buying and selling pressure');
      
      const insight = screen.getByTestId('insight-rsi');
      expect(insight).toHaveTextContent('No immediate action required');
      expect(insight).toHaveTextContent('Monitor for trend changes');
    });

    it('should handle RSI boundary values correctly', () => {
      const boundaryValues = [30, 70];
      
      boundaryValues.forEach((value, index) => {
        const rsiSignal: TechnicalSignal[] = [{
          indicator: 'RSI',
          signal: 'hold',
          strength: 0.5,
          value,
          timestamp: new Date(),
          description: `RSI at ${value}`
        }];

        const { unmount } = render(
          <TechnicalIndicatorExplanations 
            {...defaultProps} 
            indicators={rsiSignal} 
          />
        );
        
        const explanation = screen.getByTestId('explanation-text-rsi');
        expect(explanation).toHaveTextContent(value.toString());
        
        // Unmount to avoid conflicts with next render
        unmount();
      });
    });
  });

  describe('MACD Explanations', () => {
    it('should generate bullish explanation for MACD buy signal', () => {
      const bullishMACD: TechnicalSignal[] = [{
        indicator: 'MACD',
        signal: 'buy',
        strength: 0.7,
        value: 1.25,
        timestamp: new Date(),
        description: 'MACD bullish crossover'
      }];

      render(
        <TechnicalIndicatorExplanations 
          {...defaultProps} 
          indicators={bullishMACD} 
        />
      );
      
      const explanation = screen.getByTestId('explanation-text-macd');
      expect(explanation).toHaveTextContent('bullish signal');
      expect(explanation).toHaveTextContent('upward momentum is building');
      expect(explanation).toHaveTextContent('150');
      
      const insight = screen.getByTestId('insight-macd');
      expect(insight).toHaveTextContent('potential upward momentum');
      expect(insight).toHaveTextContent('2-3 trading days');
      
      const risk = screen.getByTestId('risk-macd');
      expect(risk).toHaveTextContent('medium');
    });

    it('should generate bearish explanation for MACD sell signal', () => {
      const bearishMACD: TechnicalSignal[] = [{
        indicator: 'MACD',
        signal: 'sell',
        strength: 0.8,
        value: -0.75,
        timestamp: new Date(),
        description: 'MACD bearish crossover'
      }];

      render(
        <TechnicalIndicatorExplanations 
          {...defaultProps} 
          indicators={bearishMACD} 
        />
      );
      
      const explanation = screen.getByTestId('explanation-text-macd');
      expect(explanation).toHaveTextContent('bearish momentum');
      expect(explanation).toHaveTextContent('signal line crossing below');
      
      const insight = screen.getByTestId('insight-macd');
      expect(insight).toHaveTextContent('reducing position size');
      expect(insight).toHaveTextContent('stop-loss orders');
      
      const risk = screen.getByTestId('risk-macd');
      expect(risk).toHaveTextContent('high');
    });

    it('should handle neutral MACD signals', () => {
      const neutralMACD: TechnicalSignal[] = [{
        indicator: 'MACD',
        signal: 'hold',
        strength: 0.4,
        value: 0.05,
        timestamp: new Date(),
        description: 'MACD neutral'
      }];

      render(
        <TechnicalIndicatorExplanations 
          {...defaultProps} 
          indicators={neutralMACD} 
        />
      );
      
      const explanation = screen.getByTestId('explanation-text-macd');
      expect(explanation).toHaveTextContent('mixed signals');
      expect(explanation).toHaveTextContent('no clear directional bias');
      
      const insight = screen.getByTestId('insight-macd');
      expect(insight).toHaveTextContent('Wait for clearer MACD signals');
    });
  });

  describe('Bollinger Bands Explanations', () => {
    it('should generate buy signal explanation for Bollinger Bands', () => {
      const bollingerBuy: TechnicalSignal[] = [{
        indicator: 'BOLLINGER_BANDS',
        signal: 'buy',
        strength: 0.7,
        value: 145.0,
        timestamp: new Date(),
        description: 'Near lower Bollinger Band'
      }];

      render(
        <TechnicalIndicatorExplanations 
          {...defaultProps} 
          indicators={bollingerBuy} 
        />
      );
      
      const explanation = screen.getByTestId('explanation-text-bollinger_bands');
      expect(explanation).toHaveTextContent('lower Bollinger Band');
      expect(explanation).toHaveTextContent('oversold relative to its recent trading range');
      
      const insight = screen.getByTestId('insight-bollinger_bands');
      expect(insight).toHaveTextContent('potential buying opportunity');
      expect(insight).toHaveTextContent('middle band');
      
      const risk = screen.getByTestId('risk-bollinger_bands');
      expect(risk).toHaveTextContent('medium');
    });

    it('should generate sell signal explanation for Bollinger Bands', () => {
      const bollingerSell: TechnicalSignal[] = [{
        indicator: 'BOLLINGER BANDS',
        signal: 'sell',
        strength: 0.8,
        value: 155.0,
        timestamp: new Date(),
        description: 'Near upper Bollinger Band'
      }];

      render(
        <TechnicalIndicatorExplanations 
          {...defaultProps} 
          indicators={bollingerSell} 
        />
      );
      
      const explanation = screen.getByTestId('explanation-text-bollinger bands');
      expect(explanation).toHaveTextContent('upper Bollinger Band');
      expect(explanation).toHaveTextContent('overbought relative to its recent volatility');
      
      const insight = screen.getByTestId('insight-bollinger bands');
      expect(insight).toHaveTextContent('taking profits');
      expect(insight).toHaveTextContent('reducing position size');
    });

    it('should handle neutral Bollinger Bands signals', () => {
      const bollingerNeutral: TechnicalSignal[] = [{
        indicator: 'BOLLINGER_BANDS',
        signal: 'hold',
        strength: 0.5,
        value: 150.0,
        timestamp: new Date(),
        description: 'Middle of Bollinger Bands'
      }];

      render(
        <TechnicalIndicatorExplanations 
          {...defaultProps} 
          indicators={bollingerNeutral} 
        />
      );
      
      const explanation = screen.getByTestId('explanation-text-bollinger_bands');
      expect(explanation).toHaveTextContent('middle range');
      expect(explanation).toHaveTextContent('normal price action');
      
      const insight = screen.getByTestId('insight-bollinger_bands');
      expect(insight).toHaveTextContent('Monitor for moves toward');
      expect(insight).toHaveTextContent('balanced conditions');
    });
  });

  describe('Unknown Indicators Handling', () => {
    it('should handle unknown indicators gracefully', () => {
      const unknownIndicator: TechnicalSignal[] = [{
        indicator: 'UNKNOWN_INDICATOR',
        signal: 'buy',
        strength: 0.5,
        value: 42.0,
        timestamp: new Date(),
        description: 'Unknown indicator'
      }];

      render(
        <TechnicalIndicatorExplanations 
          {...defaultProps} 
          indicators={unknownIndicator} 
        />
      );
      
      const explanation = screen.getByTestId('explanation-text-unknown_indicator');
      expect(explanation).toHaveTextContent('UNKNOWN_INDICATOR value of 42.00');
      expect(explanation).toHaveTextContent('requires additional context');
      
      const insight = screen.getByTestId('insight-unknown_indicator');
      expect(insight).toHaveTextContent('Monitor this indicator alongside other technical signals');
      
      const risk = screen.getByTestId('risk-unknown_indicator');
      expect(risk).toHaveTextContent('medium');
    });

    it('should handle indicators with special characters', () => {
      const specialIndicator: TechnicalSignal[] = [{
        indicator: 'CUSTOM-INDICATOR_V2',
        signal: 'sell',
        strength: 0.6,
        value: 25.5,
        timestamp: new Date(),
        description: 'Custom indicator with special chars'
      }];

      render(
        <TechnicalIndicatorExplanations 
          {...defaultProps} 
          indicators={specialIndicator} 
        />
      );
      
      expect(screen.getByTestId('explanation-custom-indicator_v2')).toBeInTheDocument();
    });
  });

  describe('Multiple Indicators Integration', () => {
    it('should handle multiple indicators with different risk levels', () => {
      const multipleIndicators: TechnicalSignal[] = [
        {
          indicator: 'RSI',
          signal: 'sell',
          strength: 0.8,
          value: 80.0,
          timestamp: new Date(),
          description: 'RSI overbought'
        },
        {
          indicator: 'MACD',
          signal: 'buy',
          strength: 0.6,
          value: 0.5,
          timestamp: new Date(),
          description: 'MACD bullish'
        },
        {
          indicator: 'BOLLINGER_BANDS',
          signal: 'hold',
          strength: 0.5,
          value: 150.0,
          timestamp: new Date(),
          description: 'Bollinger neutral'
        }
      ];

      render(
        <TechnicalIndicatorExplanations 
          {...defaultProps} 
          indicators={multipleIndicators} 
        />
      );
      
      // All indicators should be present
      expect(screen.getByTestId('explanation-rsi')).toBeInTheDocument();
      expect(screen.getByTestId('explanation-macd')).toBeInTheDocument();
      expect(screen.getByTestId('explanation-bollinger_bands')).toBeInTheDocument();
      
      // Different risk levels should be displayed
      expect(screen.getByTestId('risk-rsi')).toHaveTextContent('medium');
      expect(screen.getByTestId('risk-macd')).toHaveTextContent('medium');
      expect(screen.getByTestId('risk-bollinger_bands')).toHaveTextContent('low');
    });

    it('should display current values for all indicators', () => {
      render(<TechnicalIndicatorExplanations {...defaultProps} />);
      
      // Check RSI values
      const rsiContainer = screen.getByTestId('explanation-rsi');
      expect(rsiContainer).toHaveTextContent('75.50');
      
      // Check MACD values
      const macdContainer = screen.getByTestId('explanation-macd');
      expect(macdContainer).toHaveTextContent('1.25');
    });

    it('should display overall sentiment', () => {
      const conflictingIndicators: TechnicalSignal[] = [
        {
          indicator: 'RSI',
          signal: 'buy',
          strength: 0.8,
          value: 25.0,
          timestamp: new Date(),
          description: 'RSI oversold'
        },
        {
          indicator: 'MACD',
          signal: 'sell',
          strength: 0.7,
          value: -1.0,
          timestamp: new Date(),
          description: 'MACD bearish'
        }
      ];

      render(
        <TechnicalIndicatorExplanations 
          {...defaultProps} 
          indicators={conflictingIndicators} 
        />
      );
      
      expect(screen.getByTestId('overall-sentiment')).toBeInTheDocument();
      // The overall sentiment badge just shows the sentiment value (bullish/bearish/neutral), not "Overall:"
      const sentiment = screen.getByTestId('overall-sentiment');
      expect(sentiment.textContent).toMatch(/bullish|bearish|neutral/);
    });

    it('should display conflicts when indicators disagree', () => {
      const conflictingIndicators: TechnicalSignal[] = [
        {
          indicator: 'RSI',
          signal: 'buy',
          strength: 0.8,
          value: 25.0,
          timestamp: new Date(),
          description: 'RSI oversold'
        },
        {
          indicator: 'MACD',
          signal: 'sell',
          strength: 0.7,
          value: -1.0,
          timestamp: new Date(),
          description: 'MACD bearish'
        }
      ];

      render(
        <TechnicalIndicatorExplanations 
          {...defaultProps} 
          indicators={conflictingIndicators} 
        />
      );
      
      // Should show conflicts warning
      expect(screen.getByText('Mixed Signals Detected')).toBeInTheDocument();
    });

    it('should display indicator values and risk levels', () => {
      render(<TechnicalIndicatorExplanations {...defaultProps} />);
      
      // Check for indicator value and risk level display
      const rsiContainer = screen.getByTestId('explanation-rsi');
      expect(rsiContainer).toHaveTextContent('75.50'); // RSI value
      expect(rsiContainer).toHaveTextContent('medium'); // Risk level
    });
  });

  describe('Contextual Adaptation', () => {
    it('should incorporate symbol name in explanations', () => {
      render(
        <TechnicalIndicatorExplanations 
          {...defaultProps} 
          symbol="TSLA" 
        />
      );
      
      expect(screen.getByText('TSLA Technical Indicators')).toBeInTheDocument();
      
      const rsiExplanation = screen.getByTestId('explanation-text-rsi');
      expect(rsiExplanation).toHaveTextContent('TSLA');
    });

    it('should incorporate current price in MACD explanations', () => {
      render(
        <TechnicalIndicatorExplanations 
          {...defaultProps} 
          currentPrice={275.50} 
        />
      );
      
      const macdExplanation = screen.getByTestId('explanation-text-macd');
      expect(macdExplanation).toHaveTextContent('275.5');
    });

    it('should handle market context when provided', () => {
      const bullMarketContext = {
        condition: 'bull' as const,
        volatility: 'high' as const,
        sector: 'technology'
      };

      render(
        <TechnicalIndicatorExplanations 
          {...defaultProps} 
          marketContext={bullMarketContext} 
        />
      );
      
      // Component should render without errors
      expect(screen.getByTestId('technical-indicator-explanations')).toBeInTheDocument();
    });

    it('should handle missing market context gracefully', () => {
      render(
        <TechnicalIndicatorExplanations 
          indicators={mockIndicators}
          symbol="AAPL"
          currentPrice={150.00}
        />
      );
      
      expect(screen.getByTestId('technical-indicator-explanations')).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle indicators with extreme values', () => {
      const extremeIndicators: TechnicalSignal[] = [
        {
          indicator: 'RSI',
          signal: 'sell',
          strength: 1.0,
          value: 100.0,
          timestamp: new Date(),
          description: 'Extreme RSI'
        },
        {
          indicator: 'MACD',
          signal: 'buy',
          strength: 0.0,
          value: -999.99,
          timestamp: new Date(),
          description: 'Extreme MACD'
        }
      ];

      expect(() => {
        render(
          <TechnicalIndicatorExplanations 
            {...defaultProps} 
            indicators={extremeIndicators} 
          />
        );
      }).not.toThrow();
      
      expect(screen.getByTestId('explanation-rsi')).toBeInTheDocument();
      expect(screen.getByTestId('explanation-macd')).toBeInTheDocument();
    });

    it('should handle zero and negative values', () => {
      const edgeCaseIndicators: TechnicalSignal[] = [
        {
          indicator: 'RSI',
          signal: 'buy',
          strength: 0.5,
          value: 0,
          timestamp: new Date(),
          description: 'Zero RSI'
        },
        {
          indicator: 'MACD',
          signal: 'sell',
          strength: 0.7,
          value: -5.0,
          timestamp: new Date(),
          description: 'Negative MACD'
        }
      ];

      render(
        <TechnicalIndicatorExplanations 
          {...defaultProps} 
          indicators={edgeCaseIndicators} 
        />
      );
      
      expect(screen.getByTestId('explanation-rsi')).toBeInTheDocument();
      expect(screen.getByTestId('explanation-macd')).toBeInTheDocument();
    });

    it('should handle missing required props gracefully', () => {
      expect(() => {
        render(
          <TechnicalIndicatorExplanations 
            indicators={mockIndicators}
            symbol=""
            currentPrice={0}
          />
        );
      }).not.toThrow();
    });

    it('should handle malformed indicator data', () => {
      const malformedIndicators = [
        {
          indicator: '',
          signal: 'invalid',
          strength: NaN,
          value: Infinity,
          timestamp: null,
          description: undefined
        }
      ] as any;

      expect(() => {
        render(
          <TechnicalIndicatorExplanations 
            {...defaultProps} 
            indicators={malformedIndicators} 
          />
        );
      }).not.toThrow();
    });
  });

  describe('Risk Level Classification', () => {
    it('should apply correct CSS classes for different risk levels', () => {
      const riskIndicators: TechnicalSignal[] = [
        {
          indicator: 'RSI',
          signal: 'buy',
          strength: 0.5,
          value: 25.0, // Low risk (oversold)
          timestamp: new Date(),
          description: 'Low risk RSI'
        },
        {
          indicator: 'MACD',
          signal: 'sell',
          strength: 0.8,
          value: -1.0, // High risk (bearish)
          timestamp: new Date(),
          description: 'High risk MACD'
        }
      ];

      render(
        <TechnicalIndicatorExplanations 
          {...defaultProps} 
          indicators={riskIndicators} 
        />
      );
      
      const lowRisk = screen.getByTestId('risk-rsi');
      const highRisk = screen.getByTestId('risk-macd');
      
      expect(lowRisk).toHaveClass('bg-green-100', 'text-green-800');
      expect(highRisk).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('should handle medium risk styling', () => {
      const mediumRiskIndicator: TechnicalSignal[] = [{
        indicator: 'RSI',
        signal: 'sell',
        strength: 0.8,
        value: 75.0, // Medium risk (overbought)
        timestamp: new Date(),
        description: 'Medium risk RSI'
      }];

      render(
        <TechnicalIndicatorExplanations 
          {...defaultProps} 
          indicators={mediumRiskIndicator} 
        />
      );
      
      const mediumRisk = screen.getByTestId('risk-rsi');
      expect(mediumRisk).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should provide proper semantic structure', () => {
      render(<TechnicalIndicatorExplanations {...defaultProps} />);
      
      // Should have proper heading hierarchy
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('AAPL Technical Indicators');
      expect(screen.getByRole('heading', { level: 4, name: 'RSI' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 4, name: 'MACD' })).toBeInTheDocument();
    });

    it('should use clear visual indicators for risk levels', () => {
      render(<TechnicalIndicatorExplanations {...defaultProps} />);
      
      const rsiRisk = screen.getByTestId('risk-rsi');
      const macdRisk = screen.getByTestId('risk-macd');
      
      // Risk indicators should have appropriate styling classes
      expect(rsiRisk).toHaveClass('px-2', 'py-0.5', 'rounded', 'text-responsive-badge');
      expect(macdRisk).toHaveClass('px-2', 'py-0.5', 'rounded', 'text-responsive-badge');
    });

    it('should provide actionable insights with clear formatting', () => {
      render(<TechnicalIndicatorExplanations {...defaultProps} />);
      
      const rsiInsight = screen.getByTestId('insight-rsi');
      const macdInsight = screen.getByTestId('insight-macd');
      
      // Insights should be clearly marked and styled
      expect(rsiInsight).toHaveTextContent('💡');
      expect(macdInsight).toHaveTextContent('💡');
      expect(rsiInsight).toHaveClass('text-blue-700', 'dark:text-blue-300', 'font-medium');
      expect(macdInsight).toHaveClass('text-blue-700', 'dark:text-blue-300', 'font-medium');
    });

    it('should support dark mode styling', () => {
      render(<TechnicalIndicatorExplanations {...defaultProps} />);
      
      // Check card containers for dark mode classes
      const rsiCard = screen.getByTestId('explanation-rsi');
      const macdCard = screen.getByTestId('explanation-macd');
      
      expect(rsiCard).toHaveClass('bg-white', 'dark:bg-gray-800');
      expect(rsiCard).toHaveClass('border-gray-200', 'dark:border-gray-700');
      expect(macdCard).toHaveClass('bg-white', 'dark:bg-gray-800');
      expect(macdCard).toHaveClass('border-gray-200', 'dark:border-gray-700');
      
      // Check text elements for dark mode classes
      const explanationTexts = screen.getAllByTestId(/^explanation-text-/);
      explanationTexts.forEach(text => {
        expect(text).toHaveClass('text-responsive-body', 'text-medium-contrast');
      });
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large numbers of indicators efficiently', () => {
      const manyIndicators: TechnicalSignal[] = Array.from({ length: 20 }, (_, i) => ({
        indicator: `INDICATOR_${i}`,
        signal: i % 3 === 0 ? 'buy' : i % 3 === 1 ? 'sell' : 'hold',
        strength: Math.random(),
        value: Math.random() * 100,
        timestamp: new Date(),
        description: `Indicator ${i}`
      }));

      const startTime = performance.now();
      
      render(
        <TechnicalIndicatorExplanations 
          {...defaultProps} 
          indicators={manyIndicators} 
        />
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render efficiently even with many indicators
      expect(renderTime).toBeLessThan(100);
      expect(screen.getByTestId('technical-indicator-explanations')).toBeInTheDocument();
    });

    it('should not cause memory leaks with frequent updates', () => {
      const { rerender } = render(<TechnicalIndicatorExplanations {...defaultProps} />);
      
      // Simulate frequent updates
      for (let i = 0; i < 5; i++) {
        const updatedIndicators = mockIndicators.map(indicator => ({
          ...indicator,
          value: Math.random() * 100,
          timestamp: new Date()
        }));
        
        rerender(
          <TechnicalIndicatorExplanations 
            {...defaultProps} 
            indicators={updatedIndicators} 
          />
        );
      }
      
      // Component should still be functional
      expect(screen.getByTestId('technical-indicator-explanations')).toBeInTheDocument();
    });
  });

  describe('Case Sensitivity and Normalization', () => {
    it('should handle different case variations of indicator names', () => {
      const caseVariations: TechnicalSignal[] = [
        {
          indicator: 'rsi',
          signal: 'buy',
          strength: 0.5,
          value: 25.0,
          timestamp: new Date(),
          description: 'Lowercase RSI'
        },
        {
          indicator: 'Macd',
          signal: 'sell',
          strength: 0.7,
          value: -1.0,
          timestamp: new Date(),
          description: 'Mixed case MACD'
        }
      ];

      render(
        <TechnicalIndicatorExplanations 
          {...defaultProps} 
          indicators={caseVariations} 
        />
      );
      
      expect(screen.getByTestId('explanation-rsi')).toBeInTheDocument();
      expect(screen.getByTestId('explanation-macd')).toBeInTheDocument();
    });
  });
});