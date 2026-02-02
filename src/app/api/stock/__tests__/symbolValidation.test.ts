/**
 * Symbol Validation Tests
 *
 * Tests for the stock symbol validation regex that supports:
 * - Standard 1-5 letter symbols (AAPL, GOOGL)
 * - Class shares with dot notation (BRK.A, BRK.B)
 * - Class shares with dash notation (BF-B)
 */

import { describe, it, expect } from 'vitest';

// The symbol validation regex from the stock API route
const SYMBOL_REGEX = /^[A-Z]{1,5}([.-][A-Z]{1,2})?$/;

function isValidSymbol(symbol: string): boolean {
  return SYMBOL_REGEX.test(symbol.toUpperCase());
}

describe('Symbol Validation', () => {
  describe('valid symbols', () => {
    it('should accept standard 1-letter symbol', () => {
      expect(isValidSymbol('T')).toBe(true);
    });

    it('should accept standard 2-letter symbol', () => {
      expect(isValidSymbol('GE')).toBe(true);
    });

    it('should accept standard 3-letter symbol', () => {
      expect(isValidSymbol('SPY')).toBe(true);
    });

    it('should accept standard 4-letter symbol', () => {
      expect(isValidSymbol('AAPL')).toBe(true);
    });

    it('should accept standard 5-letter symbol', () => {
      expect(isValidSymbol('GOOGL')).toBe(true);
    });

    it('should accept class A shares with dot notation', () => {
      expect(isValidSymbol('BRK.A')).toBe(true);
    });

    it('should accept class B shares with dot notation', () => {
      expect(isValidSymbol('BRK.B')).toBe(true);
    });

    it('should accept class B shares with dash notation', () => {
      expect(isValidSymbol('BF-B')).toBe(true);
    });

    it('should accept class A shares with dash notation', () => {
      expect(isValidSymbol('BF-A')).toBe(true);
    });

    it('should accept two-letter class designator', () => {
      expect(isValidSymbol('TEST.AB')).toBe(true);
    });

    it('should accept lowercase symbols (converted to uppercase)', () => {
      expect(isValidSymbol('aapl')).toBe(true);
      expect(isValidSymbol('brk.a')).toBe(true);
      expect(isValidSymbol('bf-b')).toBe(true);
    });
  });

  describe('invalid symbols', () => {
    it('should reject empty string', () => {
      expect(isValidSymbol('')).toBe(false);
    });

    it('should reject symbol with numbers', () => {
      expect(isValidSymbol('AAPL1')).toBe(false);
      expect(isValidSymbol('A1PL')).toBe(false);
      expect(isValidSymbol('123')).toBe(false);
    });

    it('should reject symbol longer than 5 letters (without class)', () => {
      expect(isValidSymbol('AAPLGOO')).toBe(false);
    });

    it('should reject incomplete class designator (trailing dot)', () => {
      expect(isValidSymbol('AAPL.')).toBe(false);
    });

    it('should reject incomplete class designator (trailing dash)', () => {
      expect(isValidSymbol('AAPL-')).toBe(false);
    });

    it('should reject class designator longer than 2 letters', () => {
      expect(isValidSymbol('BRK.ABC')).toBe(false);
    });

    it('should reject symbols with spaces', () => {
      expect(isValidSymbol('AA PL')).toBe(false);
      expect(isValidSymbol(' AAPL')).toBe(false);
      expect(isValidSymbol('AAPL ')).toBe(false);
    });

    it('should reject symbols with special characters', () => {
      expect(isValidSymbol('AAPL!')).toBe(false);
      expect(isValidSymbol('AA@PL')).toBe(false);
      expect(isValidSymbol('AAPL#')).toBe(false);
    });

    it('should reject symbols with multiple class designators', () => {
      expect(isValidSymbol('BRK.A.B')).toBe(false);
      expect(isValidSymbol('BRK-A-B')).toBe(false);
      expect(isValidSymbol('BRK.A-B')).toBe(false);
    });

    it('should reject class designator with numbers', () => {
      expect(isValidSymbol('BRK.1')).toBe(false);
      expect(isValidSymbol('BRK-1')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle single letter with class designator', () => {
      expect(isValidSymbol('T.A')).toBe(true);
    });

    it('should handle 5-letter symbol with class designator', () => {
      expect(isValidSymbol('GOOGL.A')).toBe(true);
    });

    it('should reject base symbol longer than 5 letters even with valid class', () => {
      expect(isValidSymbol('AAPLGO.A')).toBe(false);
    });
  });
});
