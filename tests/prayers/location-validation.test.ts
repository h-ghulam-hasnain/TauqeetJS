import { describe, it, expect } from 'vitest';
import { getPrayerTimes } from '../../src/prayers/index.js';

describe('Extended Test: Location Validation', () => {
  const date = new Date(Date.UTC(2024, 3, 27));

  it('should handle North Pole [90, 0] gracefully via Result pattern', () => {
    const result = getPrayerTimes({ lat: 90, long: 0, date });
    expect(result.success).toBe(false);
    if (!result.success) {
      // It fails either input validation or astronomical calculation logic, but NEVER crashes.
      expect(result.error).toBeDefined();
    }
  });

  it('should handle South Pole [-90, -180] gracefully via Result pattern', () => {
    const result = getPrayerTimes({ lat: -90, long: -180, date });
    expect(result.success).toBe(false);
  });

  it('should process Equator [0, 0] normally', () => {
    const result = getPrayerTimes({ lat: 0, long: 0, date });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fajr).toHaveProperty('timestamp');
      expect(result.data.dhuhr).toHaveProperty('timestamp');
    }
  });

  it('should reject structurally invalid coordinates with a Failure Result', () => {
    const result1 = getPrayerTimes({ lat: 100, long: 0 });
    const result2 = getPrayerTimes({ lat: 0, long: 200 });
    const result3 = getPrayerTimes({ lat: -100, long: -200 });

    expect(result1.success).toBe(false);
    expect(result2.success).toBe(false);
    expect(result3.success).toBe(false);

    if (!result1.success) expect(result1.error).toMatch(/latitude/i);
    if (!result2.success) expect(result2.error).toMatch(/longitude/i);
  });

  it('should reject undefined, null, or NaN coordinates with Failure Result', () => {
    const result1 = getPrayerTimes({ lat: undefined as any, long: 0 });
    const result2 = getPrayerTimes({ lat: 0, long: null as any });
    const result3 = getPrayerTimes({ lat: NaN, long: 0 });
    const result4 = getPrayerTimes({ lat: 0, long: NaN });

    expect(result1.success).toBe(false);
    expect(result2.success).toBe(false);
    expect(result3.success).toBe(false);
    expect(result4.success).toBe(false);

    if (!result1.success) expect(result1.error).toMatch(/latitude/i);
    if (!result2.success) expect(result2.error).toMatch(/longitude/i);
    if (!result3.success) expect(result3.error).toMatch(/latitude/i);
    if (!result4.success) expect(result4.error).toMatch(/longitude/i);
  });
});
