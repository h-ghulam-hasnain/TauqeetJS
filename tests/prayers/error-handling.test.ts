import { describe, expect, it } from 'vitest';
import {
  calculatePrayerTimes,
  ConfigurationError,
  getPrayerTimes,
  PrayerCalculationError,
} from '../../src/prayers/index.js';

describe('prayer error handling API', () => {
  it('throws a configuration error for invalid coordinates', () => {
    expect(() =>
      calculatePrayerTimes({
        lat: 100,
        long: 0,
        date: '2026-01-01',
      })
    ).toThrow(ConfigurationError);
  });

  it('returns structured failure metadata for the safe API', () => {
    const result = getPrayerTimes({
      lat: 100,
      long: 0,
      date: '2026-01-01',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('latitude');
    expect(result.code).toBe('CONFIGURATION_ERROR');
  });

  it('preserves the original cause for calculation failures', () => {
    const error = new PrayerCalculationError('test failure', {
      cause: new Error('root cause'),
      details: { phase: 'timezone-resolution' },
    });

    expect(error.cause).toBeInstanceOf(Error);
    expect(error.details).toEqual({ phase: 'timezone-resolution' });
  });
});
