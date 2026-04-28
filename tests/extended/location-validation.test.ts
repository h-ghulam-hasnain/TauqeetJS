import { describe, it, expect } from 'vitest';
import { getPrayerTimes } from '../../src/prayer/calculate.js';

describe('Extended Test: Location Validation', () => {
  const date = new Date(Date.UTC(2024, 3, 27));

  it('should handle North Pole [90, 0] gracefully via Result pattern', () => {
    const result = getPrayerTimes({ location: { latitude: 90, longitude: 0 }, date });
    expect(result.success).toBe(false);
    if (!result.success) {
      // It fails either input validation or astronomical calculation logic, but NEVER crashes.
      expect(result.error).toBeDefined();
    }
  });

  it('should handle South Pole [-90, -180] gracefully via Result pattern', () => {
    const result = getPrayerTimes({ location: { latitude: -90, longitude: -180 }, date });
    expect(result.success).toBe(false);
  });

  it('should process Equator [0, 0] normally', () => {
    const result = getPrayerTimes({ location: { latitude: 0, longitude: 0 }, date });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fajr).toBeInstanceOf(Date);
      expect(result.data.dhuhr).toBeInstanceOf(Date);
    }
  });

  it('should reject structurally invalid coordinates with a Failure Result', () => {
    const result1 = getPrayerTimes({ location: { latitude: 100, longitude: 0 } });
    const result2 = getPrayerTimes({ location: { latitude: 0, longitude: 200 } });
    const result3 = getPrayerTimes({ location: { latitude: -100, longitude: -200 } });

    expect(result1.success).toBe(false);
    expect(result2.success).toBe(false);
    expect(result3.success).toBe(false);

    if (!result1.success) expect(result1.error).toContain('Invalid latitude');
    if (!result2.success) expect(result2.error).toContain('Invalid longitude');
  });
});
