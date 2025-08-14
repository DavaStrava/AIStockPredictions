import { PriceData, OBVResult, VolumePriceTrendResult, AccumulationDistributionResult, TechnicalSignal } from '../types';
import { validatePriceData, calculateSMA, calculateCorrelation } from '../utils';

/**
 * Calculate On-Balance Volume (OBV)
 * 
 * OBV measures buying and selling pressure as a cumulative indicator that adds
 * volume on up days and subtracts volume on down days.
 */
export function calculateOBV(data: PriceData[]): OBVResult[] {
  validatePriceData(data);
  
  const results: OBVResult[] = [];
  let obv = 0;
  
  for (let i = 0; i < data.length; i++) {
    const current = data[i];
    
    if (i === 0) {
      // First day, no change
      obv = current.volume;
    } else {
      const previous = data[i - 1];
      
      if (current.close > previous.close) {
        obv += current.volume;
      } else if (current.close < previous.close) {
        obv -= current.volume;
      }
      // If close is unchanged, OBV remains the same
    }
    
    // Determine trend based on OBV direction
    let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let signal: 'buy' | 'sell' | 'hold' = 'hold';
    let strength = 0.5;
    
    if (i >= 10) { // Need some history to determine trend
      const recentOBV = results.slice(-10).map(r => r.value);
      const recentPrices = data.slice(i - 9, i + 1).map(d => d.close);
      
      // Calculate correlation between OBV and price
      const correlation = calculateCorrelation(recentOBV, recentPrices);
      
      if (correlation > 0.7) {
        trend = 'bullish';
        signal = 'buy';
        strength = Math.min(0.8, 0.5 + correlation * 0.3);
      } else if (correlation < -0.7) {
        trend = 'bearish';
        signal = 'sell';
        strength = Math.min(0.8, 0.5 + Math.abs(correlation) * 0.3);
      }
    }
    
    results.push({
      date: current.date,
      value: obv,
      signal,
      strength,
      trend,
      divergence: 'none', // Will be calculated separately if needed
    });
  }
  
  return results;
}

/**
 * Calculate Volume Price Trend (VPT)
 * 
 * VPT is similar to OBV but uses percentage price changes instead of absolute changes.
 */
export function calculateVolumePriceTrend(data: PriceData[]): VolumePriceTrendResult[] {
  validatePriceData(data);
  
  const results: VolumePriceTrendResult[] = [];
  let vpt = 0;
  
  for (let i = 0; i < data.length; i++) {
    const current = data[i];
    
    if (i === 0) {
      // First day, no change
      vpt = 0;
    } else {
      const previous = data[i - 1];
      const priceChange = (current.close - previous.close) / previous.close;
      vpt += current.volume * priceChange;
    }
    
    // Determine trend
    let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let signal: 'buy' | 'sell' | 'hold' = 'hold';
    let strength = 0.5;
    
    if (i >= 10) {
      const recentVPT = results.slice(-10).map(r => r.value);
      const recentPrices = data.slice(i - 9, i + 1).map(d => d.close);
      
      const correlation = calculateCorrelation(recentVPT, recentPrices);
      
      if (correlation > 0.6) {
        trend = 'bullish';
        signal = 'buy';
        strength = Math.min(0.8, 0.5 + correlation * 0.3);
      } else if (correlation < -0.6) {
        trend = 'bearish';
        signal = 'sell';
        strength = Math.min(0.8, 0.5 + Math.abs(correlation) * 0.3);
      }
    }
    
    results.push({
      date: current.date,
      value: vpt,
      signal,
      strength,
      trend,
    });
  }
  
  return results;
}

/**
 * Calculate Accumulation/Distribution Line (A/D Line)
 * 
 * The A/D Line measures the cumulative flow of money into and out of a security.
 */
export function calculateAccumulationDistribution(data: PriceData[]): AccumulationDistributionResult[] {
  validatePriceData(data);
  
  const results: AccumulationDistributionResult[] = [];
  let adLine = 0;
  
  for (let i = 0; i < data.length; i++) {
    const current = data[i];
    
    // Calculate Money Flow Multiplier
    const highLowRange = current.high - current.low;
    let moneyFlowMultiplier = 0;
    
    if (highLowRange !== 0) {
      moneyFlowMultiplier = ((current.close - current.low) - (current.high - current.close)) / highLowRange;
    }
    
    // Calculate Money Flow Volume
    const moneyFlowVolume = moneyFlowMultiplier * current.volume;
    
    // Add to A/D Line
    adLine += moneyFlowVolume;
    
    // Determine trend
    let trend: 'accumulation' | 'distribution' | 'neutral' = 'neutral';
    let signal: 'buy' | 'sell' | 'hold' = 'hold';
    let strength = 0.5;
    
    if (moneyFlowMultiplier > 0.5) {
      trend = 'accumulation';
      signal = 'buy';
      strength = Math.min(0.8, 0.5 + moneyFlowMultiplier * 0.3);
    } else if (moneyFlowMultiplier < -0.5) {
      trend = 'distribution';
      signal = 'sell';
      strength = Math.min(0.8, 0.5 + Math.abs(moneyFlowMultiplier) * 0.3);
    }
    
    results.push({
      date: current.date,
      value: adLine,
      signal,
      strength,
      trend,
      divergence: 'none', // Will be calculated separately if needed
    });
  }
  
  return results;
}

/**
 * Detect volume divergences with price
 */
export function detectVolumeDivergences(
  data: PriceData[],
  volumeIndicator: (OBVResult | AccumulationDistributionResult)[],
  lookbackPeriod: number = 20
): (OBVResult | AccumulationDistributionResult)[] {
  if (volumeIndicator.length < lookbackPeriod * 2) {
    return volumeIndicator;
  }
  
  const results = [...volumeIndicator];
  
  for (let i = lookbackPeriod; i < results.length - lookbackPeriod; i++) {
    const currentPrice = data[i].close;
    const currentVolume = results[i].value;
    
    // Look for divergences in the lookback period
    for (let j = i - lookbackPeriod; j < i; j++) {
      const pastPrice = data[j].close;
      const pastVolume = results[j].value;
      
      // Bullish divergence: price makes lower low, volume indicator makes higher low
      if (currentPrice < pastPrice && currentVolume > pastVolume) {
        results[i].divergence = 'bullish';
        results[i].signal = 'buy';
        results[i].strength = Math.min(1, results[i].strength! + 0.2);
        break;
      }
      
      // Bearish divergence: price makes higher high, volume indicator makes lower high
      if (currentPrice > pastPrice && currentVolume < pastVolume) {
        results[i].divergence = 'bearish';
        results[i].signal = 'sell';
        results[i].strength = Math.min(1, results[i].strength! + 0.2);
        break;
      }
    }
  }
  
  return results;
}

/**
 * Generate volume indicator signals
 */
export function generateVolumeSignals(
  obv?: OBVResult[],
  vpt?: VolumePriceTrendResult[],
  ad?: AccumulationDistributionResult[],
  symbol: string = ''
): TechnicalSignal[] {
  const signals: TechnicalSignal[] = [];
  
  // OBV signals
  if (obv) {
    for (const result of obv) {
      if (result.signal !== 'hold') {
        let description = '';
        
        if (result.divergence === 'bullish') {
          description = `OBV bullish divergence - volume supporting potential price reversal`;
        } else if (result.divergence === 'bearish') {
          description = `OBV bearish divergence - volume suggesting potential price weakness`;
        } else if (result.trend === 'bullish') {
          description = `OBV showing bullish trend - buying pressure increasing`;
        } else if (result.trend === 'bearish') {
          description = `OBV showing bearish trend - selling pressure increasing`;
        }
        
        if (description) {
          signals.push({
            indicator: 'OBV',
            signal: result.signal,
            strength: result.strength!,
            value: result.value,
            timestamp: result.date,
            description,
          });
        }
      }
    }
  }
  
  // VPT signals
  if (vpt) {
    for (const result of vpt) {
      if (result.signal !== 'hold') {
        let description = '';
        
        if (result.trend === 'bullish') {
          description = `Volume Price Trend bullish - volume confirming price movement`;
        } else if (result.trend === 'bearish') {
          description = `Volume Price Trend bearish - volume confirming price decline`;
        }
        
        if (description) {
          signals.push({
            indicator: 'VPT',
            signal: result.signal,
            strength: result.strength!,
            value: result.value,
            timestamp: result.date,
            description,
          });
        }
      }
    }
  }
  
  // A/D Line signals
  if (ad) {
    for (const result of ad) {
      if (result.signal !== 'hold') {
        let description = '';
        
        if (result.divergence === 'bullish') {
          description = `A/D Line bullish divergence - accumulation despite price weakness`;
        } else if (result.divergence === 'bearish') {
          description = `A/D Line bearish divergence - distribution despite price strength`;
        } else if (result.trend === 'accumulation') {
          description = `A/D Line showing accumulation - smart money buying`;
        } else if (result.trend === 'distribution') {
          description = `A/D Line showing distribution - smart money selling`;
        }
        
        if (description) {
          signals.push({
            indicator: 'A/D Line',
            signal: result.signal,
            strength: result.strength!,
            value: result.value,
            timestamp: result.date,
            description,
          });
        }
      }
    }
  }
  
  return signals;
}

/**
 * Analyze all volume indicators
 */
export function analyzeVolume(
  data: PriceData[],
  symbol: string,
  config?: {
    detectDivergences?: boolean;
    lookbackPeriod?: number;
  }
): {
  obv: OBVResult[];
  vpt: VolumePriceTrendResult[];
  ad: AccumulationDistributionResult[];
  signals: TechnicalSignal[];
} {
  const { detectDivergences = true, lookbackPeriod = 20 } = config || {};
  
  let obv = calculateOBV(data);
  const vpt = calculateVolumePriceTrend(data);
  let ad = calculateAccumulationDistribution(data);
  
  // Detect divergences if requested
  if (detectDivergences) {
    obv = detectVolumeDivergences(data, obv, lookbackPeriod) as OBVResult[];
    ad = detectVolumeDivergences(data, ad, lookbackPeriod) as AccumulationDistributionResult[];
  }
  
  const signals = generateVolumeSignals(obv, vpt, ad, symbol);
  
  return { obv, vpt, ad, signals };
}