import { TechnicalAnalysisEngine, analyzeTechnicals } from '../engine';
import { generateSamplePriceData } from '../utils';
import { PriceData } from '../types';

describe('Technical Analysis Engine', () => {
  let sampleData: PriceData[];
  let engine: TechnicalAnalysisEngine;
  
  beforeEach(() => {
    // Generate 100 days of sample data
    sampleData = generateSamplePriceData('TEST', 100, 100, 0.02);
    engine = new TechnicalAnalysisEngine();
  });
  
  describe('Engine Initialization', () => {
    it('should initialize with default config', () => {
      const engine = new TechnicalAnalysisEngine();
      expect(engine).toBeInstanceOf(TechnicalAnalysisEngine);
    });
    
    it('should initialize with custom config', () => {
      const customConfig = {
        rsi: { period: 21, overbought: 75, oversold: 25 },
      };
      const engine = new TechnicalAnalysisEngine(customConfig);
      expect(engine).toBeInstanceOf(TechnicalAnalysisEngine);
    });
  });
  
  describe('Comprehensive Analysis', () => {
    it('should analyze all indicators successfully', () => {
      const result = engine.analyze(sampleData, 'TEST');
      
      expect(result).toBeDefined();
      expect(result.symbol).toBe('TEST');
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(Array.isArray(result.signals)).toBe(true);
      expect(result.indicators).toBeDefined();
      expect(result.summary).toBeDefined();
    });
    
    it('should generate RSI indicators', () => {
      const result = engine.analyze(sampleData, 'TEST');
      
      expect(result.indicators.rsi).toBeDefined();
      expect(Array.isArray(result.indicators.rsi)).toBe(true);
      expect(result.indicators.rsi!.length).toBeGreaterThan(0);
    });
    
    it('should generate MACD indicators', () => {
      const result = engine.analyze(sampleData, 'TEST');
      
      expect(result.indicators.macd).toBeDefined();
      expect(Array.isArray(result.indicators.macd)).toBe(true);
      expect(result.indicators.macd!.length).toBeGreaterThan(0);
    });
    
    it('should generate Bollinger Bands indicators', () => {
      const result = engine.analyze(sampleData, 'TEST');
      
      expect(result.indicators.bollingerBands).toBeDefined();
      expect(Array.isArray(result.indicators.bollingerBands)).toBe(true);
      expect(result.indicators.bollingerBands!.length).toBeGreaterThan(0);
    });
    
    it('should generate moving average indicators', () => {
      const result = engine.analyze(sampleData, 'TEST');
      
      expect(result.indicators.sma).toBeDefined();
      expect(Array.isArray(result.indicators.sma)).toBe(true);
      expect(result.indicators.sma!.length).toBeGreaterThan(0);
      
      expect(result.indicators.ema).toBeDefined();
      expect(Array.isArray(result.indicators.ema)).toBe(true);
      expect(result.indicators.ema!.length).toBeGreaterThan(0);
    });
    
    it('should generate momentum indicators', () => {
      const result = engine.analyze(sampleData, 'TEST');
      
      expect(result.indicators.stochastic).toBeDefined();
      expect(Array.isArray(result.indicators.stochastic)).toBe(true);
      
      expect(result.indicators.williamsR).toBeDefined();
      expect(Array.isArray(result.indicators.williamsR)).toBe(true);
      
      expect(result.indicators.adx).toBeDefined();
      expect(Array.isArray(result.indicators.adx)).toBe(true);
    });
    
    it('should generate volume indicators', () => {
      const result = engine.analyze(sampleData, 'TEST');
      
      expect(result.indicators.obv).toBeDefined();
      expect(Array.isArray(result.indicators.obv)).toBe(true);
      
      expect(result.indicators.volumePriceTrend).toBeDefined();
      expect(Array.isArray(result.indicators.volumePriceTrend)).toBe(true);
      
      expect(result.indicators.accumulationDistribution).toBeDefined();
      expect(Array.isArray(result.indicators.accumulationDistribution)).toBe(true);
    });
  });
  
  describe('Signal Generation', () => {
    it('should generate trading signals', () => {
      const result = engine.analyze(sampleData, 'TEST');
      
      expect(Array.isArray(result.signals)).toBe(true);
      
      // Check signal structure
      if (result.signals.length > 0) {
        const signal = result.signals[0];
        expect(signal.indicator).toBeDefined();
        expect(['buy', 'sell', 'hold']).toContain(signal.signal);
        expect(typeof signal.strength).toBe('number');
        expect(signal.strength).toBeGreaterThanOrEqual(0);
        expect(signal.strength).toBeLessThanOrEqual(1);
        expect(signal.timestamp).toBeInstanceOf(Date);
        expect(typeof signal.description).toBe('string');
      }
    });
    
    it('should filter strong signals', () => {
      const result = engine.analyze(sampleData, 'TEST');
      const strongSignals = engine.getStrongSignals(result, 0.7);
      
      expect(Array.isArray(strongSignals)).toBe(true);
      strongSignals.forEach(signal => {
        expect(signal.strength).toBeGreaterThanOrEqual(0.7);
      });
    });
    
    it('should filter signals by indicator', () => {
      const result = engine.analyze(sampleData, 'TEST');
      const rsiSignals = engine.getSignalsByIndicator(result, 'RSI');
      
      expect(Array.isArray(rsiSignals)).toBe(true);
      rsiSignals.forEach(signal => {
        expect(signal.indicator).toBe('RSI');
      });
    });
    
    it('should identify consensus signals', () => {
      const result = engine.analyze(sampleData, 'TEST');
      const consensusSignals = engine.getConsensusSignals(result, 2);
      
      expect(Array.isArray(consensusSignals)).toBe(true);
      // Consensus signals should have combined indicator names
      consensusSignals.forEach(signal => {
        expect(signal.indicator).toContain('Consensus');
      });
    });
  });
  
  describe('Summary Generation', () => {
    it('should generate valid summary', () => {
      const result = engine.analyze(sampleData, 'TEST');
      const summary = result.summary;
      
      expect(['bullish', 'bearish', 'neutral']).toContain(summary.overall);
      expect(typeof summary.strength).toBe('number');
      expect(summary.strength).toBeGreaterThanOrEqual(0);
      expect(summary.strength).toBeLessThanOrEqual(1);
      expect(typeof summary.confidence).toBe('number');
      expect(summary.confidence).toBeGreaterThanOrEqual(0);
      expect(summary.confidence).toBeLessThanOrEqual(1);
      expect(['up', 'down', 'sideways']).toContain(summary.trendDirection);
      expect(['increasing', 'decreasing', 'stable']).toContain(summary.momentum);
      expect(['low', 'medium', 'high']).toContain(summary.volatility);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle insufficient data gracefully', () => {
      const shortData = sampleData.slice(0, 5);
      const result = engine.analyze(shortData, 'TEST');
      
      expect(result).toBeDefined();
      expect(result.symbol).toBe('TEST');
      // Should still return a result even with limited indicators
    });
    
    it('should handle invalid data gracefully', () => {
      const invalidData = [
        ...sampleData.slice(0, 10),
        // Add some invalid data
        { ...sampleData[10], high: -1 }, // Invalid negative high
      ];
      
      // Should throw validation error
      expect(() => engine.analyze(invalidData, 'TEST')).toThrow();
    });
  });
  
  describe('Convenience Function', () => {
    it('should work with analyzeTechnicals function', () => {
      const result = analyzeTechnicals(sampleData, 'TEST');
      
      expect(result).toBeDefined();
      expect(result.symbol).toBe('TEST');
      expect(result.indicators).toBeDefined();
      expect(Array.isArray(result.signals)).toBe(true);
    });
    
    it('should work with custom config in convenience function', () => {
      const customConfig = {
        rsi: { period: 21, overbought: 75, oversold: 25 },
      };
      const result = analyzeTechnicals(sampleData, 'TEST', customConfig);
      
      expect(result).toBeDefined();
      expect(result.symbol).toBe('TEST');
    });
  });
  
  describe('Real-world Scenarios', () => {
    it('should handle trending market data', () => {
      // Generate trending data (upward trend)
      const trendingData = generateSamplePriceData('TREND', 50, 100, 0.01);
      // Manually adjust to create clear upward trend
      for (let i = 1; i < trendingData.length; i++) {
        trendingData[i].close = trendingData[i - 1].close * 1.01; // 1% daily increase
        trendingData[i].high = trendingData[i].close * 1.02;
        trendingData[i].low = trendingData[i].close * 0.98;
        trendingData[i].open = trendingData[i - 1].close;
      }
      
      const result = engine.analyze(trendingData, 'TREND');
      
      expect(result.summary.trendDirection).toBe('up');
      expect(result.summary.overall).toBe('bullish');
    });
    
    it('should handle volatile market data', () => {
      // Generate highly volatile data
      const volatileData = generateSamplePriceData('VOLATILE', 50, 100, 0.05);
      
      const result = engine.analyze(volatileData, 'VOLATILE');
      
      expect(result.summary.volatility).toBe('high');
    });
  });
});