import { describe, it, expect } from 'vitest';
import { getPrayerTimes } from '../../src/prayers/index.js';
import { getPrayerTimesAsync } from '../../src/prayers/legacy.js';;

describe('Prayer Module: Timezone Resolution & Drift Verification', () => {
  const lat = 40.7128;
  const long = -74.006;
  const baseDate = new Date(Date.UTC(2026, 4, 18)); // May 18, 2026

  describe('Explicit Sync Timezone Resolution', () => {
    it('should format local times in UTC when timeZone is 0', () => {
      const result = getPrayerTimes({
        lat,
        long,
        date: baseDate,
        timeZone: 0,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        // Since we explicitly asked for UTC, the formatted local time should match UTC time formatting
        expect(result.data.dhuhr.local).toBeDefined();
        // Since Dhuhr in NY UTC is around 16:52 UTC
        expect(result.data.dhuhr.local).toMatch(/04:5\d:\d{2} PM/i);
      }
    });

    it('should apply Etc/GMT inverted sign standard for positive integer offsets (e.g. UTC+5 for Karachi)', () => {
      const result = getPrayerTimes({
        lat: 24.8607,
        long: 67.0011,
        date: baseDate,
        timeZone: 5,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        // Karachi Dhuhr at UTC+5 is around 12:30 PM
        expect(result.data.dhuhr.local).toMatch(/12:\d{2}:\d{2} PM/);
      }
    });

    it('should apply Etc/GMT inverted sign standard for negative integer offsets (e.g. UTC-4 for New York Daylight Time)', () => {
      const result = getPrayerTimes({
        lat,
        long,
        date: baseDate,
        timeZone: -4,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        // NY Dhuhr at UTC-4 is around 12:56 PM
        expect(result.data.dhuhr.local).toMatch(/12:\d{2}:\d{2} PM/);
      }
    });

    it('should accept database Named Timezone strings (e.g., America/New_York) and format correctly', () => {
      const result = getPrayerTimes({
        lat,
        long,
        date: baseDate,
        timeZone: 'America/New_York',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        // NY Dhuhr in May (Eastern Daylight Time, UTC-4) is around 12:56 PM
        expect(result.data.dhuhr.local).toMatch(/12:5\d:\d{2} PM/);
      }
    });

    it('should handle fractional timezone offsets cleanly without crashing (e.g., India: +5.5)', () => {
      const result = getPrayerTimes({
        lat: 28.6139,
        long: 77.209,
        date: baseDate,
        timeZone: 5.5,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dhuhr.local).toBeDefined();
      }
    });
  });

  describe('Explicit Async Timezone Resolution', () => {
    it('should invoke resolveTimezoneAsync hook if provided and timeZone is omitted', async () => {
      let hookCalled = false;
      const customHook = async (_lat: number, _lon: number): Promise<string> => {
        hookCalled = true;
        return 'America/New_York';
      };

      const result = await getPrayerTimesAsync({
        lat,
        long,
        date: baseDate,
        resolveTimezoneAsync: customHook,
      });

      expect(result.success).toBe(true);
      expect(hookCalled).toBe(true);
      if (result.success) {
        expect(result.data.dhuhr.local).toMatch(/12:5\d:\d{2} PM/);
      }
    });

    it('should succeed when both timeZone and resolveTimezoneAsync are provided', async () => {
      // resolveTimezoneAsync always executes when present; its return value
      // overwrites the explicit timeZone field (see calculatePrayerTimesAsync source).
      const customHook = async (): Promise<string> => 'America/New_York';

      const result = await getPrayerTimesAsync({
        lat,
        long,
        date: baseDate,
        timeZone: 'UTC', // this is overridden by the hook's return value
        resolveTimezoneAsync: customHook,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Hook returned 'America/New_York' (UTC-4 in May) → Dhuhr ≈ 12:5x PM
        expect(result.data.dhuhr.local).toMatch(/12:\d{2}:\d{2} PM/);
      }
    });
  });
});
