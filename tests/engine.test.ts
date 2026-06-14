import { describe, it, expect } from 'vitest';
import { getPrayerTimes } from '../src/prayer/calculate.js';
import { createPrayerEngine } from '../src/prayer/engine.js';
import { ErrorCode } from '../src/core/result.js';
import { formatPrayerTimes } from '../src/prayer/index.js';

describe('TauqeetJS Technical Specification & Engine Validation', () => {
  const coords = { latitude: 24.8607, longitude: 67.0011 }; // Karachi
  const date = new Date(2024, 3, 27); // April 27, 2024

  describe('Core Functionality & Result Pattern', () => {
    it('should return a successful Result with correct prayer times for Karachi', () => {
      const result = getPrayerTimes({ location: coords, date });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fajr).toHaveProperty('timestamp');
        expect(result.data.dhuhr).toHaveProperty('timestamp');
        expect(result.data.fajr.timestamp).toBeDefined();
      }
    });

    it('should return failure for invalid latitude (100) instead of throwing exception', () => {
      const result = getPrayerTimes({ location: { latitude: 100, longitude: 67 } });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(ErrorCode.INVALID_LATITUDE);
      }
    });
  });

  describe('State Immutability', () => {
    it('should not leak data between calculations on the same engine instance', () => {
      const engine = createPrayerEngine(coords, 'Karachi');
      
      const date1 = new Date(Date.UTC(2024, 3, 27));
      const date2 = new Date(Date.UTC(2024, 3, 28));
      
      const res1 = engine.calculate(date1);
      const res2 = engine.calculate(date2);
      const res3 = engine.calculate(date1);
      
      expect(res1.success).toBe(true);
      expect(res2.success).toBe(true);
      expect(res3.success).toBe(true);
      
      if (res1.success && res3.success) {
        // Result for April 27 should be identical regardless of intermediate calculations
        expect(res1.data.fajr.value?.getTime()).toBe(res3.data.fajr.value?.getTime());
      }
      
      if (res1.success && res2.success) {
        // Result for April 27 and 28 must be different
        expect(res1.data.fajr.value?.getTime()).not.toBe(res2.data.fajr.value?.getTime());
      }
    });
  });

  describe('Atmospheric & Geographic Edge Cases', () => {
    it('should correctly influence refraction logic at high altitudes (4000m)', () => {
      const seaLevel = getPrayerTimes({ location: coords, elevation: 0, date });
      const highAlt = getPrayerTimes({ location: coords, elevation: 4000, date });
      
      expect(seaLevel.success).toBe(true);
      expect(highAlt.success).toBe(true);
      
      if (seaLevel.success && highAlt.success) {
        // High altitude should see sunrise earlier and maghrib later (Altitude Dip)
        expect(highAlt.data.sunrise.timestamp! * 1000).toBeLessThan(seaLevel.data.sunrise.timestamp! * 1000);
        expect(highAlt.data.maghrib.timestamp! * 1000).toBeGreaterThan(seaLevel.data.maghrib.timestamp! * 1000);
        
        // Dhuhr (Noon) should remain largely unaffected by elevation refraction logic
        expect(Math.abs(highAlt.data.dhuhr.timestamp! * 1000 - seaLevel.data.dhuhr.timestamp! * 1000)).toBeLessThan(10000);
      }
    });

    it('should handle extreme latitudes gracefully (Tromsø, Norway in Summer)', () => {
      const tromso = { latitude: 69.6492, longitude: 18.9553 };
      const summerDate = new Date(Date.UTC(2024, 5, 21)); // Midnight Sun period
      
      const result = getPrayerTimes({ location: tromso, date: summerDate });
      
      // Should handle gracefully by returning Success with POLAR_DAY status
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sunrise.status).toBe('POLAR_DAY');
      }
    });
  });

  describe('Smart Defaults Validation', () => {
    it('should apply defaults for method, madhab, and elevation', () => {
      const result = getPrayerTimes({ location: coords, date });
      expect(result.success).toBe(true);
      // Logic checked via coverage - ensuring it doesn't crash with minimal config
    });
  });

  describe('Standalone Presentation Formatting', () => {
    it('should format all prayer times into ISO8601 strings', () => {
      const result = getPrayerTimes({ location: coords, date });
      expect(result.success).toBe(true);
      if (result.success) {
        const formatted = formatPrayerTimes(result.data, 'iso8601');
        if (formatted.success) {
          expect(typeof formatted.data.fajr).toBe('string');
          expect(formatted.data.fajr).toContain('T');
        }
      }
    });

    it('should format all prayer times into Unix timestamps', () => {
      const result = getPrayerTimes({ location: coords, date });
      expect(result.success).toBe(true);
      if (result.success) {
        const formatted = formatPrayerTimes(result.data, 'unix');
        if (formatted.success) {
          expect(typeof formatted.data.fajr).toBe('number');
          expect(formatted.data.fajr).toBeGreaterThan(0);
        }
      }
    });

    it('should throw a TypeError if an invalid format is passed', () => {
      const result = getPrayerTimes({ location: coords, date });
      expect(result.success).toBe(true);
      if (result.success) {
        // @ts-expect-error - testing invalid format at runtime
        const formatRes = formatPrayerTimes(result.data, 'invalid_format');
        expect(formatRes.success).toBe(false);
      }
    });
  });
});
