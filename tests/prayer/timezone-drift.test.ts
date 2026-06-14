import { describe, it, expect } from 'vitest';
import { getPrayerTimes, getPrayerTimesAsync } from '../../src/prayer/calculate.js';

describe('Prayer Module: Timezone Resolution & Drift Verification', () => {
  const coords = { latitude: 40.7128, longitude: -74.0060 }; // New York
  const baseDate = new Date(Date.UTC(2026, 4, 18)); // May 18, 2026

  describe('Explicit Sync Timezone Resolution', () => {
    it('should format local times in UTC when timeZone is 0', () => {
      const result = getPrayerTimes({
        location: coords,
        date: baseDate,
        timeZone: 0
      });
      expect(result.success).toBe(true);
      if (result.success) {
        // Since we explicitly asked for UTC, the formatted local time should match UTC time formatting
        expect(result.data.dhuhr.local).toBeDefined();
        // Since Dhuhr in NY UTC is around 16:52 UTC
        expect(result.data.dhuhr.local).toMatch(/04:52 PM/i);
      }
    });

    it('should apply Etc/GMT inverted sign standard for positive integer offsets (e.g. UTC+5 for Karachi)', () => {
      const result = getPrayerTimes({
        location: { latitude: 24.8607, longitude: 67.0011 },
        date: baseDate,
        timeZone: 5 // UTC+5 -> IANA Etc/GMT-5
      });
      expect(result.success).toBe(true);
      if (result.success) {
        // Karachi Dhuhr at UTC+5 is around 12:30 PM
        expect(result.data.dhuhr.local).toMatch(/12:\d{2} PM/);
      }
    });

    it('should apply Etc/GMT inverted sign standard for negative integer offsets (e.g. UTC-4 for New York Daylight Time)', () => {
      const result = getPrayerTimes({
        location: coords,
        date: baseDate,
        timeZone: -4 // UTC-4 -> IANA Etc/GMT+4
      });
      expect(result.success).toBe(true);
      if (result.success) {
        // NY Dhuhr at UTC-4 is around 12:56 PM
        expect(result.data.dhuhr.local).toMatch(/12:\d{2} PM/);
      }
    });

    it('should accept database Named Timezone strings (e.g., America/New_York) and format correctly', () => {
      const result = getPrayerTimes({
        location: coords,
        date: baseDate,
        timeZone: 'America/New_York'
      });
      expect(result.success).toBe(true);
      if (result.success) {
        // NY Dhuhr in May (Eastern Daylight Time, UTC-4) is around 12:56 PM
        expect(result.data.dhuhr.local).toMatch(/12:5\d PM|12:56 PM/);
      }
    });

    it('should handle fractional timezone offsets cleanly without crashing (e.g., India: +5.5)', () => {
      const result = getPrayerTimes({
        location: { latitude: 28.6139, longitude: 77.2090 }, // New Delhi
        date: baseDate,
        timeZone: 5.5
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dhuhr.local).toBeDefined();
      }
    });
  });

  describe('Explicit Async Timezone Resolution', () => {
    it('should invoke resolveTimezoneAsync hook if provided and explicitTimeZone is omitted', async () => {
      let hookCalled = false;
      const customHook = async (lat: number, lon: number): Promise<string> => {
        hookCalled = true;
        // Verify coords passed to hook
        expect(lat).toBeCloseTo(coords.latitude);
        expect(lon).toBeCloseTo(coords.longitude);
        return 'America/New_York';
      };

      const result = await getPrayerTimesAsync({
        location: coords,
        date: baseDate,
        resolveTimezoneAsync: customHook
      });

      expect(result.success).toBe(true);
      expect(hookCalled).toBe(true);
      if (result.success) {
        expect(result.data.dhuhr.local).toMatch(/12:5\d PM|12:56 PM/);
      }
    });

    it('should bypass the async hook if a strict explicit timeZone override is passed', async () => {
      let hookCalled = false;
      const customHook = async () => {
        hookCalled = true;
        return 'America/New_York';
      };

      const result = await getPrayerTimesAsync({
        location: coords,
        date: baseDate,
        timeZone: 'UTC', // Explicit override
        resolveTimezoneAsync: customHook
      });

      expect(result.success).toBe(true);
      expect(hookCalled).toBe(false); // Hook bypassed
      if (result.success) {
        // UTC format (Dhuhr around 4:56 PM UTC)
        expect(result.data.dhuhr.local).toMatch(/04:5\d PM|04:56 PM/);
      }
    });
  });
});
