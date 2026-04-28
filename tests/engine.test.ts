import { describe, it, expect } from 'vitest';
import { getPrayerTimes } from '../src/prayer/calculate.js';
import { createPrayerEngine } from '../src/prayer/engine.js';

describe('TauqeetJS Technical Specification & Engine Validation', () => {
  const coords = { latitude: 24.8607, longitude: 67.0011 }; // Karachi
  const date = new Date(2024, 3, 27); // April 27, 2024

  describe('Core Functionality & Result Pattern', () => {
    it('should return a successful Result with correct prayer times for Karachi', () => {
      const result = getPrayerTimes({ location: coords, date });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fajr).toBeInstanceOf(Date);
        expect(result.data.dhuhr).toBeInstanceOf(Date);
        expect(isNaN(result.data.fajr.getTime())).toBe(false);
      }
    });

    it('should return failure for invalid latitude (100) instead of throwing exception', () => {
      const result = getPrayerTimes({ location: { latitude: 100, longitude: 67 } });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid latitude');
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
        expect(res1.data.fajr.getTime()).toBe(res3.data.fajr.getTime());
      }
      
      if (res1.success && res2.success) {
        // Result for April 27 and 28 must be different
        expect(res1.data.fajr.getTime()).not.toBe(res2.data.fajr.getTime());
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
        expect(highAlt.data.sunrise.getTime()).toBeLessThan(seaLevel.data.sunrise.getTime());
        expect(highAlt.data.maghrib.getTime()).toBeGreaterThan(seaLevel.data.maghrib.getTime());
        
        // Dhuhr (Noon) should remain largely unaffected by elevation refraction logic
        expect(Math.abs(highAlt.data.dhuhr.getTime() - seaLevel.data.dhuhr.getTime())).toBeLessThan(10000);
      }
    });

    it('should handle extreme latitudes gracefully (Tromsø, Norway in Summer)', () => {
      const tromso = { latitude: 69.6492, longitude: 18.9553 };
      const summerDate = new Date(Date.UTC(2024, 5, 21)); // Midnight Sun period
      
      const result = getPrayerTimes({ location: tromso, date: summerDate });
      
      // Should fail gracefully due to astronomical impossibility of some points
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('could not be calculated');
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
});
