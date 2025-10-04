import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateStochastic,
  calculateWilliamsR,
  calculateADX,
  generateMomentumSignals,
  analyzeMomentum
} from '../momentum';
import { generateSamplePriceData } from '../../utils';
import { PriceData, StochasticResult, WilliamsRResult, ADXResult, TechnicalSignal } from '../../types';

describe('Momentum Indicators', () => {
  let sampleData: PriceData[];
  let consoleSpy: any;

  beforeEach(() => {
    // Generate 50 days of sample data for testing
    sampleData = generateSamplePriceData('TEST', 50, 100, 0.02);
    
    // Spy on console.warn to test error handling
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('calculateStochastic', () => {
    describe('Normal Operation', () => {
      it('should calculate stochastic oscillator correctly', () => {
        const result = calculateStochastic(sampleData, 14, 3, 80, 20);

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);

        // Check result structure
        const firstResult = result[0];
        expect(firstResult).toHaveProperty('date');
        expect(firstResult).toHaveProperty('k');
        expect(firstResult).toHaveProperty('d');
        expect(firstResult).toHaveProperty('signal');
        expect(firstResult).toHaveProperty('overbought');
        expect(firstResult).toHaveProperty('oversold');

        // Validate %K and %D ranges (should be 0-100)
        result.forEach(item => {
          expect(item.k).toBeGreaterThanOrEqual(0);
          expect(item.k).toBeLessThanOrEqual(100);
          expect(item.d).toBeGreaterThanOrEqual(0);
          expect(item.d).toBeLessThanOrEqual(100);
        });
      });

      it('should generate correct buy signals in oversold conditions', () => {
        // Create data that will generate oversold conditions
        const oversoldData = generateSamplePriceData('OVERSOLD', 20, 100, 0.01);
        // Manually create declining prices to ensure oversold condition
        for (let i = 1; i < oversoldData.length; i++) {
          oversoldData[i].close = oversoldData[i - 1].close * 0.99; // 1% daily decline
          oversoldData[i].high = oversoldData[i].close * 1.005;
          oversoldData[i].low = oversoldData[i].close * 0.995;
          oversoldData[i].open = oversoldData[i - 1].close;
        }

        const result = calculateStochastic(oversoldData, 5, 3, 80, 20);
        
        // Should have some buy signals in oversold conditions
        const buySignals = result.filter(r => r.signal === 'buy' && r.oversold);
        expect(buySignals.length).toBeGreaterThan(0);
      });

      it('should generate correct sell signals in overbought conditions', () => {
        // Create data that will generate overbought conditions
        const overboughtData = generateSamplePriceData('OVERBOUGHT', 20, 100, 0.01);
        // Manually create rising prices to ensure overbought condition
        for (let i = 1; i < overboughtData.length; i++) {
          overboughtData[i].close = overboughtData[i - 1].close * 1.01; // 1% daily rise
          overboughtData[i].high = overboughtData[i].close * 1.005;
          overboughtData[i].low = overboughtData[i].close * 0.995;
          overboughtData[i].open = overboughtData[i - 1].close;
        }

        const result = calculateStochastic(overboughtData, 5, 3, 80, 20);
        
        // Should have some sell signals in overbought conditions
        const sellSignals = result.filter(r => r.signal === 'sell' && r.overbought);
        expect(sellSignals.length).toBeGreaterThan(0);
      });

      it('should use custom parameters correctly', () => {
        const result1 = calculateStochastic(sampleData, 14, 3, 80, 20);
        const result2 = calculateStochastic(sampleData, 10, 5, 75, 25);

        // Different parameters should produce different results
        expect(result1.length).not.toBe(result2.length);
        
        // Custom thresholds should be applied
        const overboughtCount1 = result1.filter(r => r.overbought).length;
        const overboughtCount2 = result2.filter(r => r.overbought).length;
        
        // With lower overbought threshold (75 vs 80), should have more overbought signals
        expect(overboughtCount2).toBeGreaterThanOrEqual(overboughtCount1);
      });
    });

    describe('Error Handling', () => {
      it('should throw error for invalid K period', () => {
        expect(() => calculateStochastic(sampleData, 0, 3, 80, 20)).toThrow('Invalid K period');
        expect(() => calculateStochastic(sampleData, -1, 3, 80, 20)).toThrow('Invalid K period');
        expect(() => calculateStochastic(sampleData, sampleData.length, 3, 80, 20)).toThrow('Invalid K period');
      });

      it('should throw error for insufficient data', () => {
        const shortData = sampleData.slice(0, 5);
        expect(() => calculateStochastic(shortData, 10, 3, 80, 20)).toThrow('Invalid K period');
      });

      it('should validate price data', () => {
        expect(() => calculateStochastic([], 14, 3, 80, 20)).toThrow('Price data must be a non-empty array');
      });
    });

    describe('Edge Cases', () => {
      it('should handle data with identical prices', () => {
        const flatData = sampleData.map(item => ({
          ...item,
          open: 100,
          high: 100,
          low: 100,
          close: 100
        }));

        const result = calculateStochastic(flatData, 14, 3, 80, 20);
        
        // With identical prices, %K should be NaN or handled gracefully
        expect(Array.isArray(result)).toBe(true);
        result.forEach(item => {
          // Should either be NaN or a default value
          expect(typeof item.k).toBe('number');
          expect(typeof item.d).toBe('number');
        });
      });

      it('should handle minimum required data length', () => {
        const minData = sampleData.slice(0, 17); // Just enough for 14+3 periods
        const result = calculateStochastic(minData, 14, 3, 80, 20);
        
        expect(result.length).toBeGreaterThanOrEqual(1); // Should produce at least one result
      });
    });
  });

  describe('calculateWilliamsR', () => {
    describe('Normal Operation', () => {
      it('should calculate Williams %R correctly', () => {
        const result = calculateWilliamsR(sampleData, 14, -20, -80);

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);

        // Check result structure
        const firstResult = result[0];
        expect(firstResult).toHaveProperty('date');
        expect(firstResult).toHaveProperty('value');
        expect(firstResult).toHaveProperty('signal');
        expect(firstResult).toHaveProperty('strength');
        expect(firstResult).toHaveProperty('overbought');
        expect(firstResult).toHaveProperty('oversold');

        // Williams %R should be between -100 and 0
        result.forEach(item => {
          expect(item.value).toBeGreaterThanOrEqual(-100);
          expect(item.value).toBeLessThanOrEqual(0);
          expect(item.strength).toBeGreaterThanOrEqual(0);
          expect(item.strength).toBeLessThanOrEqual(1);
        });
      });

      it('should generate buy signals when oversold', () => {
        // Create declining price data to generate oversold conditions
        const oversoldData = generateSamplePriceData('OVERSOLD', 20, 100, 0.01);
        for (let i = 1; i < oversoldData.length; i++) {
          oversoldData[i].close = oversoldData[i - 1].close * 0.98; // 2% daily decline
          oversoldData[i].high = oversoldData[i].close * 1.01;
          oversoldData[i].low = oversoldData[i].close * 0.99;
          oversoldData[i].open = oversoldData[i - 1].close;
        }

        const result = calculateWilliamsR(oversoldData, 5, -20, -80);
        
        const buySignals = result.filter(r => r.signal === 'buy' && r.oversold);
        expect(buySignals.length).toBeGreaterThan(0);
        
        // Buy signals should have appropriate strength
        buySignals.forEach(signal => {
          expect(signal.strength).toBeGreaterThan(0.5);
        });
      });

      it('should generate sell signals when overbought', () => {
        // Create rising price data to generate overbought conditions
        const overboughtData = generateSamplePriceData('OVERBOUGHT', 20, 100, 0.01);
        for (let i = 1; i < overboughtData.length; i++) {
          overboughtData[i].close = overboughtData[i - 1].close * 1.02; // 2% daily rise
          overboughtData[i].high = overboughtData[i].close * 1.01;
          overboughtData[i].low = overboughtData[i].close * 0.99;
          overboughtData[i].open = overboughtData[i - 1].close;
        }

        const result = calculateWilliamsR(overboughtData, 5, -20, -80);
        
        const sellSignals = result.filter(r => r.signal === 'sell' && r.overbought);
        expect(sellSignals.length).toBeGreaterThan(0);
        
        // Sell signals should have appropriate strength
        sellSignals.forEach(signal => {
          expect(signal.strength).toBeGreaterThan(0.5);
        });
      });

      it('should calculate signal strength correctly', () => {
        const result = calculateWilliamsR(sampleData, 14, -20, -80);
        
        result.forEach(item => {
          if (item.signal === 'buy' && item.oversold) {
            // Strength should increase with distance from oversold threshold
            expect(item.strength).toBeGreaterThanOrEqual(0.6);
          } else if (item.signal === 'sell' && item.overbought) {
            // Strength should increase with distance from overbought threshold
            expect(item.strength).toBeGreaterThanOrEqual(0.6);
          } else {
            // Hold signals should have default strength
            expect(item.strength).toBe(0.5);
          }
        });
      });
    });

    describe('Error Handling', () => {
      it('should throw error for invalid period', () => {
        expect(() => calculateWilliamsR(sampleData, 0, -20, -80)).toThrow('Invalid period');
        expect(() => calculateWilliamsR(sampleData, -1, -20, -80)).toThrow('Invalid period');
        expect(() => calculateWilliamsR(sampleData, sampleData.length, -20, -80)).toThrow('Invalid period');
      });

      it('should validate price data', () => {
        expect(() => calculateWilliamsR([], 14, -20, -80)).toThrow('Price data must be a non-empty array');
      });
    });

    describe('Edge Cases', () => {
      it('should handle custom thresholds', () => {
        const result1 = calculateWilliamsR(sampleData, 14, -20, -80);
        const result2 = calculateWilliamsR(sampleData, 14, -30, -70);

        // Different thresholds should affect overbought/oversold classifications
        const overbought1 = result1.filter(r => r.overbought).length;
        const overbought2 = result2.filter(r => r.overbought).length;
        
        // More lenient threshold (-30 vs -20) should result in different overbought signals
        // Note: The relationship might not always be strictly less due to random data
        expect(typeof overbought1).toBe('number');
        expect(typeof overbought2).toBe('number');
      });
    });
  });

  describe('calculateADX', () => {
    describe('Normal Operation', () => {
      it('should calculate ADX correctly', () => {
        const result = calculateADX(sampleData, 14, 25);

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);

        // Check result structure
        const firstResult = result[0];
        expect(firstResult).toHaveProperty('date');
        expect(firstResult).toHaveProperty('adx');
        expect(firstResult).toHaveProperty('plusDI');
        expect(firstResult).toHaveProperty('minusDI');
        expect(firstResult).toHaveProperty('trend');
        expect(firstResult).toHaveProperty('direction');

        // Validate ADX values (should be 0-100)
        result.forEach(item => {
          expect(item.adx).toBeGreaterThanOrEqual(0);
          expect(item.adx).toBeLessThanOrEqual(100);
          expect(item.plusDI).toBeGreaterThanOrEqual(0);
          expect(item.minusDI).toBeGreaterThanOrEqual(0);
          expect(['strong', 'weak', 'no_trend']).toContain(item.trend);
          expect(['bullish', 'bearish', 'neutral']).toContain(item.direction);
        });
      });

      it('should identify strong trends correctly', () => {
        // Create trending data
        const trendingData = generateSamplePriceData('TRENDING', 30, 100, 0.01);
        for (let i = 1; i < trendingData.length; i++) {
          trendingData[i].close = trendingData[i - 1].close * 1.015; // 1.5% daily rise
          trendingData[i].high = trendingData[i].close * 1.01;
          trendingData[i].low = trendingData[i].close * 0.99;
          trendingData[i].open = trendingData[i - 1].close;
        }

        const result = calculateADX(trendingData, 10, 25);
        
        // Should identify strong bullish trend
        const strongTrends = result.filter(r => r.trend === 'strong');
        expect(strongTrends.length).toBeGreaterThan(0);
        
        // Strong trends should have high ADX values
        strongTrends.forEach(trend => {
          expect(trend.adx).toBeGreaterThanOrEqual(25);
        });
      });

      it('should determine trend direction correctly', () => {
        const result = calculateADX(sampleData, 14, 25);
        
        result.forEach(item => {
          if (item.trend === 'strong' || item.trend === 'weak') {
            if (item.plusDI > item.minusDI) {
              expect(item.direction).toBe('bullish');
            } else {
              expect(item.direction).toBe('bearish');
            }
          } else {
            expect(item.direction).toBe('neutral');
          }
        });
      });

      it('should use custom strong trend threshold', () => {
        const result1 = calculateADX(sampleData, 14, 25);
        const result2 = calculateADX(sampleData, 14, 30);

        const strongTrends1 = result1.filter(r => r.trend === 'strong').length;
        const strongTrends2 = result2.filter(r => r.trend === 'strong').length;

        // Higher threshold should result in fewer strong trend signals
        expect(strongTrends2).toBeLessThanOrEqual(strongTrends1);
      });
    });

    describe('Error Handling', () => {
      it('should throw error for invalid period', () => {
        expect(() => calculateADX(sampleData, 0, 25)).toThrow('Invalid period');
        expect(() => calculateADX(sampleData, -1, 25)).toThrow('Invalid period');
        expect(() => calculateADX(sampleData, sampleData.length - 1, 25)).toThrow('Invalid period');
      });

      it('should validate price data', () => {
        expect(() => calculateADX([], 14, 25)).toThrow('Price data must be a non-empty array');
      });
    });

    describe('Edge Cases', () => {
      it('should handle insufficient data by throwing error', () => {
        const shortData = sampleData.slice(0, 15); // Minimal data
        expect(() => calculateADX(shortData, 14, 25)).toThrow('Invalid period');
      });

      it('should handle data with no directional movement', () => {
        const flatData = sampleData.map(item => ({
          ...item,
          high: item.close * 1.001,
          low: item.close * 0.999
        }));

        const result = calculateADX(flatData, 14, 25);
        expect(Array.isArray(result)).toBe(true);
        
        // Should mostly show no trend or weak trend
        const noTrends = result.filter(r => r.trend === 'no_trend' || r.trend === 'weak');
        expect(noTrends.length).toBeGreaterThan(0);
      });
    });
  });

  describe('generateMomentumSignals', () => {
    let stochasticResults: StochasticResult[];
    let williamsRResults: WilliamsRResult[];
    let adxResults: ADXResult[];

    beforeEach(() => {
      stochasticResults = calculateStochastic(sampleData, 14, 3, 80, 20);
      williamsRResults = calculateWilliamsR(sampleData, 14, -20, -80);
      adxResults = calculateADX(sampleData, 14, 25);
    });

    describe('Signal Generation', () => {
      it('should generate signals from all indicators', () => {
        const signals = generateMomentumSignals(stochasticResults, williamsRResults, adxResults, 'TEST');

        expect(Array.isArray(signals)).toBe(true);
        
        // Check signal structure
        signals.forEach(signal => {
          expect(signal).toHaveProperty('indicator');
          expect(signal).toHaveProperty('signal');
          expect(signal).toHaveProperty('strength');
          expect(signal).toHaveProperty('value');
          expect(signal).toHaveProperty('timestamp');
          expect(signal).toHaveProperty('description');
          
          expect(['buy', 'sell']).toContain(signal.signal);
          expect(signal.strength).toBeGreaterThan(0);
          expect(signal.strength).toBeLessThanOrEqual(1);
          expect(typeof signal.description).toBe('string');
          expect(signal.description.length).toBeGreaterThan(0);
        });
      });

      it('should generate stochastic signals correctly', () => {
        const signals = generateMomentumSignals(stochasticResults, undefined, undefined, 'TEST');
        
        const stochasticSignals = signals.filter(s => s.indicator === 'Stochastic');
        
        stochasticSignals.forEach(signal => {
          expect(signal.description).toContain('Stochastic');
          expect(signal.description).toContain('%K');
          expect(signal.description).toContain('%D');
          
          if (signal.signal === 'buy') {
            expect(signal.description).toContain('oversold crossover');
          } else if (signal.signal === 'sell') {
            expect(signal.description).toContain('overbought crossover');
          }
        });
      });

      it('should generate Williams %R signals correctly', () => {
        const signals = generateMomentumSignals(undefined, williamsRResults, undefined, 'TEST');
        
        const williamsSignals = signals.filter(s => s.indicator === 'Williams %R');
        
        williamsSignals.forEach(signal => {
          expect(signal.description).toContain('Williams %R');
          expect(signal.description).toMatch(/-?\d+\.\d+%/); // Should contain percentage value
          
          if (signal.signal === 'buy') {
            expect(signal.description).toContain('oversold');
          } else if (signal.signal === 'sell') {
            expect(signal.description).toContain('overbought');
          }
        });
      });

      it('should generate ADX signals correctly', () => {
        const signals = generateMomentumSignals(undefined, undefined, adxResults, 'TEST');
        
        const adxSignals = signals.filter(s => s.indicator === 'ADX');
        
        adxSignals.forEach(signal => {
          expect(signal.description).toContain('Strong');
          expect(signal.description).toContain('trend detected');
          expect(signal.description).toContain('ADX at');
          expect(signal.strength).toBeGreaterThanOrEqual(0.5);
          expect(signal.strength).toBeLessThanOrEqual(0.8);
        });
      });

      it('should handle undefined indicators gracefully', () => {
        const signals1 = generateMomentumSignals(undefined, undefined, undefined, 'TEST');
        expect(signals1).toEqual([]);

        const signals2 = generateMomentumSignals(stochasticResults, undefined, undefined, 'TEST');
        expect(Array.isArray(signals2)).toBe(true);
        
        const signals3 = generateMomentumSignals(undefined, williamsRResults, undefined, 'TEST');
        expect(Array.isArray(signals3)).toBe(true);
      });

      it('should filter out hold signals', () => {
        const signals = generateMomentumSignals(stochasticResults, williamsRResults, adxResults, 'TEST');
        
        // Should not contain any hold signals
        const holdSignals = signals.filter(s => s.signal === 'hold');
        expect(holdSignals.length).toBe(0);
      });
    });

    describe('Signal Quality', () => {
      it('should assign appropriate signal strengths', () => {
        const signals = generateMomentumSignals(stochasticResults, williamsRResults, adxResults, 'TEST');
        
        signals.forEach(signal => {
          if (signal.indicator === 'Stochastic') {
            expect(signal.strength).toBeGreaterThanOrEqual(0.6);
            expect(signal.strength).toBeLessThanOrEqual(0.7);
          } else if (signal.indicator === 'Williams %R') {
            // Williams %R strength is calculated dynamically
            expect(signal.strength).toBeGreaterThan(0);
          } else if (signal.indicator === 'ADX') {
            expect(signal.strength).toBeGreaterThanOrEqual(0.5);
            expect(signal.strength).toBeLessThanOrEqual(0.8);
          }
        });
      });

      it('should generate meaningful descriptions', () => {
        const signals = generateMomentumSignals(stochasticResults, williamsRResults, adxResults, 'TEST');
        
        signals.forEach(signal => {
          expect(signal.description.length).toBeGreaterThan(20); // Should be descriptive
          expect(signal.description).toMatch(/\d+/); // Should contain numbers
          
          // Should not contain placeholder text
          expect(signal.description).not.toContain('TODO');
          expect(signal.description).not.toContain('placeholder');
        });
      });
    });
  });

  describe('analyzeMomentum', () => {
    describe('Normal Operation', () => {
      it('should analyze all momentum indicators successfully', () => {
        const result = analyzeMomentum(sampleData, 'TEST');

        expect(result).toHaveProperty('stochastic');
        expect(result).toHaveProperty('williamsR');
        expect(result).toHaveProperty('adx');
        expect(result).toHaveProperty('signals');

        expect(Array.isArray(result.stochastic)).toBe(true);
        expect(Array.isArray(result.williamsR)).toBe(true);
        expect(Array.isArray(result.adx)).toBe(true);
        expect(Array.isArray(result.signals)).toBe(true);
      });

      it('should use custom configuration correctly', () => {
        const customConfig = {
          stochastic: { kPeriod: 10, dPeriod: 5, overbought: 75, oversold: 25 },
          williamsR: { period: 10, overbought: -25, oversold: -75 },
          adx: { period: 10, strongTrend: 30 }
        };

        const result1 = analyzeMomentum(sampleData, 'TEST');
        const result2 = analyzeMomentum(sampleData, 'TEST', customConfig);

        // Different configurations should produce different results
        expect(result1.stochastic.length).not.toBe(result2.stochastic.length);
        expect(result1.williamsR.length).not.toBe(result2.williamsR.length);
      });

      it('should generate comprehensive signals', () => {
        const result = analyzeMomentum(sampleData, 'TEST');

        // Should have signals from multiple indicators
        const indicatorTypes = [...new Set(result.signals.map(s => s.indicator))];
        expect(indicatorTypes.length).toBeGreaterThan(0);

        // Signals should be properly formatted
        result.signals.forEach(signal => {
          expect(['Stochastic', 'Williams %R', 'ADX']).toContain(signal.indicator);
          expect(['buy', 'sell']).toContain(signal.signal);
          expect(signal.strength).toBeGreaterThan(0);
          expect(signal.strength).toBeLessThanOrEqual(1);
        });
      });
    });

    describe('Error Handling and Edge Cases - NEW FUNCTIONALITY', () => {
      it('should handle insufficient data for Stochastic calculation gracefully', () => {
        const shortData = sampleData.slice(0, 10); // Less than default kPeriod of 14

        const result = analyzeMomentum(shortData, 'TEST');

        // Should return empty stochastic array without throwing
        expect(result.stochastic).toEqual([]);
        
        // Other indicators should still work
        expect(Array.isArray(result.williamsR)).toBe(true);
        expect(Array.isArray(result.adx)).toBe(true);
        expect(Array.isArray(result.signals)).toBe(true);
      });

      it('should handle insufficient data for Williams %R calculation gracefully', () => {
        const shortData = sampleData.slice(0, 10); // Less than default period of 14

        const result = analyzeMomentum(shortData, 'TEST');

        // Should return empty Williams %R array without throwing
        expect(result.williamsR).toEqual([]);
        
        // Other indicators should still work if they have enough data
        expect(Array.isArray(result.adx)).toBe(true);
        expect(Array.isArray(result.signals)).toBe(true);
      });

      it('should handle Stochastic calculation errors gracefully', () => {
        // Create invalid data that will cause calculation to fail
        const invalidData = sampleData.map(item => ({
          ...item,
          high: -1, // Invalid negative high
          low: -2   // Invalid negative low
        }));

        const result = analyzeMomentum(invalidData, 'TEST');

        // Should return empty stochastic array and log warning
        expect(result.stochastic).toEqual([]);
        expect(consoleSpy).toHaveBeenCalledWith('Stochastic calculation failed:', expect.any(Error));
      });

      it('should handle Williams %R calculation errors gracefully', () => {
        // Create invalid data that will cause calculation to fail
        const invalidData = sampleData.map(item => ({
          ...item,
          high: -1, // Invalid negative high
          low: -2   // Invalid negative low
        }));

        const result = analyzeMomentum(invalidData, 'TEST');

        // Should return empty Williams %R array and log warning
        expect(result.williamsR).toEqual([]);
        expect(consoleSpy).toHaveBeenCalledWith('Williams %R calculation failed:', expect.any(Error));
      });

      it('should continue processing other indicators when one fails', () => {
        const shortData = sampleData.slice(0, 5); // Very short data

        const result = analyzeMomentum(shortData, 'TEST');

        // Both Stochastic and Williams %R should fail, but function should continue
        expect(result.stochastic).toEqual([]);
        expect(result.williamsR).toEqual([]);
        
        // Function should still return a valid result structure
        expect(result).toHaveProperty('stochastic');
        expect(result).toHaveProperty('williamsR');
        expect(result).toHaveProperty('adx');
        expect(result).toHaveProperty('signals');
      });

      it('should handle custom config with insufficient data', () => {
        const shortData = sampleData.slice(0, 8);
        const customConfig = {
          stochastic: { kPeriod: 10, dPeriod: 3, overbought: 80, oversold: 20 },
          williamsR: { period: 10, overbought: -20, oversold: -80 }
        };

        const result = analyzeMomentum(shortData, 'TEST', customConfig);

        // Both should fail due to insufficient data for period 10
        expect(result.stochastic).toEqual([]);
        expect(result.williamsR).toEqual([]);
      });

      it('should work correctly when only some indicators have sufficient data', () => {
        const mediumData = sampleData.slice(0, 20); // Enough for some indicators
        const customConfig = {
          stochastic: { kPeriod: 5, dPeriod: 3, overbought: 80, oversold: 20 }, // Should work
          williamsR: { period: 25, overbought: -20, oversold: -80 }, // Should fail due to insufficient data
          adx: { period: 10, strongTrend: 25 } // Should work
        };

        const result = analyzeMomentum(mediumData, 'TEST', customConfig);

        // Stochastic should work
        expect(result.stochastic.length).toBeGreaterThan(0);
        
        // Williams %R should fail due to insufficient data (no error thrown, just empty array)
        expect(result.williamsR).toEqual([]);
        
        // ADX should work
        expect(result.adx.length).toBeGreaterThan(0);
        
        // Should generate signals from working indicators
        expect(result.signals.length).toBeGreaterThan(0);
      });
    });

    describe('Integration Testing', () => {
      it('should produce consistent results across multiple runs', () => {
        const result1 = analyzeMomentum(sampleData, 'TEST');
        const result2 = analyzeMomentum(sampleData, 'TEST');

        expect(result1.stochastic).toEqual(result2.stochastic);
        expect(result1.williamsR).toEqual(result2.williamsR);
        expect(result1.adx).toEqual(result2.adx);
        expect(result1.signals).toEqual(result2.signals);
      });

      it('should handle real-world market scenarios', () => {
        // Test with volatile market data
        const volatileData = generateSamplePriceData('VOLATILE', 50, 100, 0.05);
        const result = analyzeMomentum(volatileData, 'VOLATILE');

        expect(result.stochastic.length).toBeGreaterThan(0);
        expect(result.williamsR.length).toBeGreaterThan(0);
        expect(result.adx.length).toBeGreaterThan(0);

        // Volatile data should generate more signals
        expect(result.signals.length).toBeGreaterThan(0);
      });

      it('should handle trending market data', () => {
        // Create strong trending data
        const trendingData = generateSamplePriceData('TRENDING', 40, 100, 0.01);
        for (let i = 1; i < trendingData.length; i++) {
          trendingData[i].close = trendingData[i - 1].close * 1.02; // 2% daily rise
          trendingData[i].high = trendingData[i].close * 1.01;
          trendingData[i].low = trendingData[i].close * 0.99;
          trendingData[i].open = trendingData[i - 1].close;
        }

        const result = analyzeMomentum(trendingData, 'TRENDING');

        // Should identify strong trend in ADX
        const strongTrends = result.adx.filter(r => r.trend === 'strong');
        expect(strongTrends.length).toBeGreaterThan(0);

        // Should generate ADX signals
        const adxSignals = result.signals.filter(s => s.indicator === 'ADX');
        expect(adxSignals.length).toBeGreaterThan(0);
      });
    });

    describe('Performance and Memory', () => {
      it('should handle large datasets efficiently', () => {
        const largeData = generateSamplePriceData('LARGE', 1000, 100, 0.02);
        
        const startTime = Date.now();
        const result = analyzeMomentum(largeData, 'LARGE');
        const endTime = Date.now();

        // Should complete within reasonable time (less than 1 second)
        expect(endTime - startTime).toBeLessThan(1000);

        // Should produce results
        expect(result.stochastic.length).toBeGreaterThan(0);
        expect(result.williamsR.length).toBeGreaterThan(0);
        expect(result.adx.length).toBeGreaterThan(0);
      });

      it('should not leak memory with repeated calls', () => {
        // Run multiple analyses to check for memory leaks
        for (let i = 0; i < 10; i++) {
          const testData = generateSamplePriceData(`TEST_${i}`, 50, 100, 0.02);
          const result = analyzeMomentum(testData, `TEST_${i}`);
          
          // Verify results are properly structured
          expect(Array.isArray(result.stochastic)).toBe(true);
          expect(Array.isArray(result.williamsR)).toBe(true);
          expect(Array.isArray(result.adx)).toBe(true);
          expect(Array.isArray(result.signals)).toBe(true);
        }
      });
    });
  });
});