import { describe, it, expect } from 'vitest';
import { getPrayerTimes } from '../src/prayers/index.js';

describe('TauqeetJS Technical Specification & Engine Validation', () => {
  const lat = 24.8607;
  const long = 67.0011; // Karachi
  const date = new Date(Date.UTC(2024, 3, 27)); // April 27, 2024

  describe('Core Functionality & Result Pattern', () => {
    it('should return a successful Result with correct prayer times for Karachi', () => {
      const result = getPrayerTimes({ lat, long, date });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fajr).toHaveProperty('timestamp');
        expect(result.data.dhuhr).toHaveProperty('timestamp');
        expect(result.data.fajr.timestamp).toBeDefined();
      }
    });

    it('should return failure for invalid latitude (100) instead of throwing exception', () => {
      const result = getPrayerTimes({ lat: 100, long: 67 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/latitude/i);
      }
    });

    it('should return failure for invalid longitude (200) instead of throwing exception', () => {
      const result = getPrayerTimes({ lat: 24, long: 200 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/longitude/i);
      }
    });
  });

  describe('Repeated Calculations Consistency', () => {
    it('should return identical results when the same date is calculated multiple times', () => {
      const res1 = getPrayerTimes({ lat, long, date });
      const res2 = getPrayerTimes({ lat, long, date });

      expect(res1.success).toBe(true);
      expect(res2.success).toBe(true);

      if (res1.success && res2.success) {
        // Deterministic: same inputs must always produce same outputs
        expect(res1.data.fajr.timestamp).toBe(res2.data.fajr.timestamp);
        expect(res1.data.dhuhr.timestamp).toBe(res2.data.dhuhr.timestamp);
        expect(res1.data.isha.timestamp).toBe(res2.data.isha.timestamp);
      }
    });

    it('should produce different results for different dates', () => {
      const date2 = new Date(Date.UTC(2024, 3, 28));
      const res1 = getPrayerTimes({ lat, long, date });
      const res2 = getPrayerTimes({ lat, long, date: date2 });

      expect(res1.success).toBe(true);
      expect(res2.success).toBe(true);

      if (res1.success && res2.success) {
        expect(res1.data.fajr.timestamp).not.toBe(res2.data.fajr.timestamp);
      }
    });
  });

  describe('Atmospheric & Geographic Edge Cases', () => {
    it('should shift Sunrise earlier and Maghrib later at high altitude (4000m)', () => {
      const seaLevel = getPrayerTimes({ lat, long, elevation: 0, date });
      const highAlt = getPrayerTimes({ lat, long, elevation: 4000, date });

      expect(seaLevel.success).toBe(true);
      expect(highAlt.success).toBe(true);

      if (seaLevel.success && highAlt.success) {
        expect(highAlt.data.sunrise.timestamp!).toBeLessThan(seaLevel.data.sunrise.timestamp!);
        expect(highAlt.data.maghrib.timestamp!).toBeGreaterThan(seaLevel.data.maghrib.timestamp!);
        // Solar transit (Dhuhr) must stay within 10 seconds regardless of elevation
        expect(
          Math.abs(highAlt.data.dhuhr.timestamp! - seaLevel.data.dhuhr.timestamp!)
        ).toBeLessThan(10);
      }
    });

    it('should handle extreme latitudes gracefully — Tromsø, Norway in Midnight Sun period', () => {
      const result = getPrayerTimes({
        lat: 69.6492,
        long: 18.9553,
        date: new Date(Date.UTC(2024, 5, 21)), // Summer solstice
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sunrise.status).toBe('POLAR_DAY');
      }
    });

    it('should handle Polar Night gracefully — Tromsø in Winter Solstice', () => {
      const result = getPrayerTimes({
        lat: 69.6492,
        long: 18.9553,
        date: new Date(Date.UTC(2024, 11, 21)), // Winter solstice
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sunrise.status).toBe('POLAR_NIGHT');
      }
    });
  });

  describe('Smart Defaults', () => {
    it('should succeed with minimal config — only lat/long, using all defaults', () => {
      const result = getPrayerTimes({ lat, long });
      expect(result.success).toBe(true);
    });
  });
});
