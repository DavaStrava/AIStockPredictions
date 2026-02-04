import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FMPDataProvider } from '../fmp';

describe('FMP Key Metrics', () => {
  let provider: FMPDataProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new FMPDataProvider('test-key');
  });

  describe('getKeyMetricsTTM', () => {
    it('should return parsed key metrics data', async () => {
      const mockResponse = [
        {
          dividendYieldTTM: 0.0055,
          dividendPerShareTTM: 0.96,
          payoutRatioTTM: 0.153,
          peRatioTTM: 29.5,
        },
      ];

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await provider.getKeyMetricsTTM('AAPL');

      expect(result.dividendYieldTTM).toBe(0.0055);
      expect(result.dividendPerShareTTM).toBe(0.96);
      expect(result.payoutRatioTTM).toBe(0.153);
    });

    it('should default null values to 0', async () => {
      const mockResponse = [
        {
          dividendYieldTTM: null,
          dividendPerShareTTM: null,
          payoutRatioTTM: null,
        },
      ];

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await provider.getKeyMetricsTTM('TSLA');

      expect(result.dividendYieldTTM).toBe(0);
      expect(result.dividendPerShareTTM).toBe(0);
      expect(result.payoutRatioTTM).toBe(0);
    });

    it('should throw on empty response', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      await expect(provider.getKeyMetricsTTM('INVALID')).rejects.toThrow(
        'No key metrics data found'
      );
    });

    it('should throw on API error', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(provider.getKeyMetricsTTM('AAPL')).rejects.toThrow('FMP API error: 500');
    });

    it('should throw on FMP error response', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Error: 'Invalid API key' }),
      } as Response);

      await expect(provider.getKeyMetricsTTM('AAPL')).rejects.toThrow('Invalid API key');
    });
  });

  describe('getMultipleKeyMetricsTTM', () => {
    it('should return metrics map for multiple symbols', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ dividendYieldTTM: 0.005, dividendPerShareTTM: 0.96, payoutRatioTTM: 0.15 }],
      } as Response);

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ dividendYieldTTM: 0.03, dividendPerShareTTM: 1.84, payoutRatioTTM: 0.72 }],
      } as Response);

      const result = await provider.getMultipleKeyMetricsTTM(['AAPL', 'KO']);

      expect(result.size).toBe(2);
      expect(result.get('AAPL')?.dividendYieldTTM).toBe(0.005);
      expect(result.get('KO')?.dividendYieldTTM).toBe(0.03);
    });

    it('should handle partial failures gracefully', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ dividendYieldTTM: 0.005, dividendPerShareTTM: 0.96, payoutRatioTTM: 0.15 }],
      } as Response);

      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const result = await provider.getMultipleKeyMetricsTTM(['AAPL', 'INVALID']);

      expect(result.size).toBe(1);
      expect(result.has('AAPL')).toBe(true);
      expect(result.has('INVALID')).toBe(false);
    });

    it('should return empty map when all fail', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error',
      } as Response);

      const result = await provider.getMultipleKeyMetricsTTM(['A', 'B']);

      expect(result.size).toBe(0);
    });

    it('should return empty map for empty input', async () => {
      const result = await provider.getMultipleKeyMetricsTTM([]);
      expect(result.size).toBe(0);
    });
  });
});
