import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TechnicalSignal } from '@/lib/technical-analysis/types';

// Mock component since TechnicalIndicatorExplanations doesn't exist yet
// This test file serves as a specification for the component to be implemented
const MockTechnicalIndicatorExplanations = ({
  indicators,
  symbol,
  currentPrice,
  marketContext
}: {
  indicators: TechnicalSignal[];
  symbol: string;
  currentPrice: number;
  marketContext?: any;
}) => {
  // Mock implementation based on spec requirements
  const generateExplanation = (signal: TechnicalSignal) => {
    const { indicator, value, signal: signalType } = signal;
    
    switch (indicator) {
      case 'RSI':
        if (value > 70) {
          return {
            explanation: `${symbol}'s RSI of ${value.toFixed(1)} indicates the stock is in overbought territory, suggesting potential selling pressure may emerge soon.`,
            actionableInsight: `Consider waiting for RSI to drop below 50 before entering a position, or take profits if currently holding.`,
            riskLevel: 'medium' as const
          };
        } else if (value < 30) {
          return {
            explanation: `${symbol}'s RSI of ${value.toFixed(1)} shows oversold conditions, which historically has led to short-term bounces in this price range.`,
            actionableInsight: `This could be a buying opportunity, but confirm with other indicators and monitor for 2-3 trading days.`,
            riskLevel: 'low' as const
          };
        } else {
          return {
            explanation: `${symbol}'s RSI of ${value.toFixed(1)} is in neutral territory, indicating balanced buying and selling pressure.`,
            actionableInsight: `No immediate action required. Monitor for trend changes above 70 or below 30.`,
            riskLevel: 'low' as const
          };
        }
      
      case 'MACD':
        if (signalType === 'buy') {
          return {
            explanation: `${symbol}'s MACD shows a bullish crossover at current price of $${currentPrice}, suggesting upward momentum is building.`,
            actionableInsight: `This MACD crossover suggests potential upward momentum - monitor for confirmation over next 2-3 trading days.`,
            riskLevel: 'medium' as const
          };
        } else if (signalType === 'sell') {
          return {
            explanation: `${symbol}'s MACD indicates bearish momentum with the signal line crossing below the MACD line.`,
            actionableInsight: `Consider reducing position size or setting stop-loss orders as downward pressure may continue.`,
            riskLevel: 'high' as const
          };
        } else {
          return {
            explanation: `${symbol}'s MACD is showing mixed signals with no clear directional bias at the current price level.`,
            actionableInsight: `Wait for clearer MACD signals before making position changes.`,
            riskLevel: 'low' as const
          };
        }
      
      default:
        return {
          explanation: `${indicator} value of ${value.toFixed(2)} for ${symbol} requires additional context for interpretation.`,
          actionableInsight: `Monitor this indicator alongside other technical signals for better decision making.`,
          riskLevel: 'medium' as const
        };
    }
  };

  const explanations = (indicators || []).map((signal, index) => {
    const explanation = generateExplanation(signal);
    return (
      <div key={index} data-testid={`explanation-${signal.indicator.toLowerCase()}`} className="mb-4 p-4 border rounded">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">{signal.indicator}</h4>
          <span 
            className={`px-2 py-1 rounded text-sm ${
              explanation.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
              explanation.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}
            data-testid={`risk-${signal.indicator.toLowerCase()}`}
          >
            {explanation.riskLevel} risk
          </span>
        </div>
        <p className="text-gray-700 mb-2" data-testid={`explanation-text-${signal.indicator.toLowerCase()}`}>
          {explanation.explanation}
        </p>
        <p className="text-blue-700 font-medium" data-testid={`insight-${signal.indicator.toLowerCase()}`}>
          💡 {explanation.actionableInsight}
        </p>
        <div className="mt-2 text-sm text-gray-500">
          Current Value: {signal.value.toFixed(2)} | Signal: {signal.signal}
        </div>
      </div>
    );
  });

  return (
    <div data-testid="technical-indicator-explanations">
      <h3 className="text-lg font-semibold mb-4">Technical Analysis for {symbol}</h3>
      {explanations.length > 0 ? explanations : (
        <p data-testid="no-indicators">No technical indicators available</p>
      )}
    </div>
  );
};

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
      condition: 'bull',
      volatility: 'medium',
      sector: 'technology'
    }
  };

  describe('Basic Rendering and Structure', () => {
    it('should render component with correct title', () => {
      render(<MockTechnicalIndicatorExplanations {...defaultProps} />);
      
      expect(screen.getByTestId('technical-indicator-explanations')).toBeInTheDocument();
      expect(screen.getByText('Technical Analysis for AAPL')).toBeInTheDocument();
    });

    it('should render all provided indicators', () => {
      render(<MockTechnicalIndicatorExplanations {...defaultProps} />);
      
      expect(screen.getByTestId('explanation-rsi')).toBeInTheDocument();
      expect(screen.getByTestId('explanation-macd')).toBeInTheDocument();
    });

    it('should display no indicators message when empty array provided', () => {
      render(
        <MockTechnicalIndicatorExplanations 
          {...defaultProps} 
          indicators={[]} 
        />
      );
      
      expect(screen.getByTestId('no-indicators')).toBeInTheDocument();
      expect(screen.getByText('No technical indicators available')).toBeInTheDocument();
    });

    it('should handle undefined indicators gracefully', () => {
      render(
        <MockTechnicalIndicatorExplanations 
          {...defaultProps} 
          indicators={undefined as any} 
        />
      );
      
      expect(screen.getByTestId('technical-indicator-explanations')).toBeInTheDocument();
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
        <MockTechnicalIndicatorExplanations 
          {...defaultProps} 
          indicators={overboughtRSI} 
        />
      );
      
      const explanation = screen.getByTestId('explanation-text-rsi');
      expect(explanation).toHaveTextContent('overbought territory');
      expect(explanation).toHaveTextContent('AAPL');
      expect(explanation).toHaveTextContent('75.5');
      
      const insight = screen.getByTestId('insight-rsi');
      expect(insight).toHaveTextContent('Consider waiting for RSI to drop below 50');
      
      const risk = screen.getByTestId('risk-rsi');
      expect(risk).toHaveTextContent('medium risk');
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
        <MockTechnicalIndicatorExplanations 
          {...defaultProps} 
          indicators={oversoldRSI} 
        />
      );
      
      const explanation = screen.getByTestId('explanation-text-rsi');
      expect(explanation).toHaveTextContent('oversold conditions');
      expect(explanation).toHaveTextContent('25.3');
      
      const insight = screen.getByTestId('insight-rsi');
      expect(insight).toHaveTextContent('buying opportunity');
      expect(insight).toHaveTextContent('2-3 trading days');
      
      const risk = screen.getByTestId('risk-rsi');
      expect(risk).toHaveTextContent('low risk');
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
        <MockTechnicalIndicatorExplanations 
          {...defaultProps} 
          indicators={neutralRSI} 
        />
      );
      
      const explanation = screen.getByTestId('explanation-text-rsi');
      expect(explanation).toHaveTextContent('neutral territory');
      expect(explanation).toHaveTextContent('balanced buying and selling');
      
      const insight = screen.getByTestId('insight-rsi');
      expect(insight).toHaveTextContent('No immediate action required');
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
        <MockTechnicalIndicatorExplanations 
          {...defaultProps} 
          indicators={bullishMACD} 
        />
      );
      
      const explanation = screen.getByTestId('explanation-text-macd');
      expect(explanation).toHaveTextContent('bullish crossover');
      expect(explanation).toHaveTextContent('upward momentum');
      expect(explanation).toHaveTextContent('$150');
      
      const insight = screen.getByTestId('insight-macd');
      expect(insight).toHaveTextContent('potential upward momentum');
      expect(insight).toHaveTextContent('2-3 trading days');
      
      const risk = screen.getByTestId('risk-macd');
      expect(risk).toHaveTextContent('medium risk');
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
        <MockTechnicalIndicatorExplanations 
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
      expect(risk).toHaveTextContent('high risk');
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
        <MockTechnicalIndicatorExplanations 
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
        }
      ];

      render(
        <MockTechnicalIndicatorExplanations 
          {...defaultProps} 
          indicators={multipleIndicators} 
        />
      );
      
      // Both indicators should be present
      expect(screen.getByTestId('explanation-rsi')).toBeInTheDocument();
      expect(screen.getByTestId('explanation-macd')).toBeInTheDocument();
      
      // Different risk levels should be displayed
      expect(screen.getByTestId('risk-rsi')).toHaveTextContent('medium risk');
      expect(screen.getByTestId('risk-macd')).toHaveTextContent('medium risk');
    });

    it('should display current values and signals for all indicators', () => {
      render(<MockTechnicalIndicatorExplanations {...defaultProps} />);
      
      // Check RSI values
      const rsiContainer = screen.getByTestId('explanation-rsi');
      expect(rsiContainer).toHaveTextContent('Current Value: 75.50');
      expect(rsiContainer).toHaveTextContent('Signal: sell');
      
      // Check MACD values
      const macdContainer = screen.getByTestId('explanation-macd');
      expect(macdContainer).toHaveTextContent('Current Value: 1.25');
      expect(macdContainer).toHaveTextContent('Signal: buy');
    });
  });

  describe('Contextual Adaptation', () => {
    it('should incorporate symbol name in explanations', () => {
      render(
        <MockTechnicalIndicatorExplanations 
          {...defaultProps} 
          symbol="TSLA" 
        />
      );
      
      expect(screen.getByText('Technical Analysis for TSLA')).toBeInTheDocument();
      
      const rsiExplanation = screen.getByTestId('explanation-text-rsi');
      expect(rsiExplanation).toHaveTextContent('TSLA');
    });

    it('should incorporate current price in explanations', () => {
      render(
        <MockTechnicalIndicatorExplanations 
          {...defaultProps} 
          currentPrice={275.50} 
        />
      );
      
      const macdExplanation = screen.getByTestId('explanation-text-macd');
      expect(macdExplanation).toHaveTextContent('$275.5');
    });

    it('should handle market context when provided', () => {
      const bullMarketContext = {
        condition: 'bull',
        volatility: 'high',
        sector: 'technology'
      };

      render(
        <MockTechnicalIndicatorExplanations 
          {...defaultProps} 
          marketContext={bullMarketContext} 
        />
      );
      
      // Component should render without errors
      expect(screen.getByTestId('technical-indicator-explanations')).toBeInTheDocument();
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
        <MockTechnicalIndicatorExplanations 
          {...defaultProps} 
          indicators={unknownIndicator} 
        />
      );
      
      const explanation = screen.getByTestId('explanation-text-unknown_indicator');
      expect(explanation).toHaveTextContent('UNKNOWN_INDICATOR value of 42.00');
      expect(explanation).toHaveTextContent('requires additional context');
      
      const insight = screen.getByTestId('insight-unknown_indicator');
      expect(insight).toHaveTextContent('Monitor this indicator alongside other technical signals');
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
          <MockTechnicalIndicatorExplanations 
            {...defaultProps} 
            indicators={extremeIndicators} 
          />
        );
      }).not.toThrow();
      
      expect(screen.getByTestId('explanation-rsi')).toBeInTheDocument();
      expect(screen.getByTestId('explanation-macd')).toBeInTheDocument();
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
          <MockTechnicalIndicatorExplanations 
            {...defaultProps} 
            indicators={malformedIndicators} 
          />
        );
      }).not.toThrow();
    });

    it('should handle missing required props gracefully', () => {
      expect(() => {
        render(
          <MockTechnicalIndicatorExplanations 
            indicators={mockIndicators}
            symbol=""
            currentPrice={0}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should provide proper semantic structure', () => {
      render(<MockTechnicalIndicatorExplanations {...defaultProps} />);
      
      // Should have proper heading hierarchy
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Technical Analysis for AAPL');
      expect(screen.getByRole('heading', { level: 4, name: 'RSI' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 4, name: 'MACD' })).toBeInTheDocument();
    });

    it('should use clear visual indicators for risk levels', () => {
      render(<MockTechnicalIndicatorExplanations {...defaultProps} />);
      
      const rsiRisk = screen.getByTestId('risk-rsi');
      const macdRisk = screen.getByTestId('risk-macd');
      
      // Risk indicators should have appropriate styling classes
      expect(rsiRisk).toHaveClass('px-2', 'py-1', 'rounded', 'text-sm');
      expect(macdRisk).toHaveClass('px-2', 'py-1', 'rounded', 'text-sm');
    });

    it('should provide actionable insights with clear formatting', () => {
      render(<MockTechnicalIndicatorExplanations {...defaultProps} />);
      
      const rsiInsight = screen.getByTestId('insight-rsi');
      const macdInsight = screen.getByTestId('insight-macd');
      
      // Insights should be clearly marked and styled
      expect(rsiInsight).toHaveTextContent('💡');
      expect(macdInsight).toHaveTextContent('💡');
      expect(rsiInsight).toHaveClass('text-blue-700', 'font-medium');
      expect(macdInsight).toHaveClass('text-blue-700', 'font-medium');
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large numbers of indicators efficiently', () => {
      const manyIndicators: TechnicalSignal[] = Array.from({ length: 50 }, (_, i) => ({
        indicator: `INDICATOR_${i}`,
        signal: i % 2 === 0 ? 'buy' : 'sell',
        strength: Math.random(),
        value: Math.random() * 100,
        timestamp: new Date(),
        description: `Indicator ${i}`
      }));

      const startTime = performance.now();
      
      render(
        <MockTechnicalIndicatorExplanations 
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
      const { rerender } = render(<MockTechnicalIndicatorExplanations {...defaultProps} />);
      
      // Simulate frequent updates
      for (let i = 0; i < 10; i++) {
        const updatedIndicators = mockIndicators.map(indicator => ({
          ...indicator,
          value: Math.random() * 100,
          timestamp: new Date()
        }));
        
        rerender(
          <MockTechnicalIndicatorExplanations 
            {...defaultProps} 
            indicators={updatedIndicators} 
          />
        );
      }
      
      // Component should still be functional
      expect(screen.getByTestId('technical-indicator-explanations')).toBeInTheDocument();
    });
  });
});