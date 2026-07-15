import { describe, it, expect } from 'vitest';
import { getPrayerTimesLegacy } from '../../src/prayers/legacy.js';;

describe('High Latitude Adjustment Tests', () => {
  const tromso = { lat: 69.6492, long: 18.9553 };
  const summerSolstice = new Date(Date.UTC(2024, 5, 21)); // June 21, 2024
  const winterSolstice = new Date(Date.UTC(2024, 11, 21)); // December 21, 2024
  const transitionalDate = new Date(Date.UTC(2024, 4, 1)); // May 1, 2024

  it('should return POLAR_DAY for Tromsø during Summer Solstice (Midnight Sun)', () => {
    const result = getPrayerTimesLegacy({ ...tromso, date: summerSolstice });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sunrise.status).toBe('POLAR_DAY');
    }
  });

  it('should return POLAR_NIGHT for Tromsø during Winter Solstice', () => {
    const result = getPrayerTimesLegacy({ ...tromso, date: winterSolstice });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sunrise.status).toBe('POLAR_NIGHT');
    }
  });

  it('should succeed and place Fajr at Astronomical Midnight for Tromsø on May 1st (Continuous Twilight)', () => {
    // May 1st in Tromsø: sun stays above horizon at night → Isha not calculable,
    // Fajr falls back to Astronomical Midnight by default strategy.
    const result = getPrayerTimesLegacy({ ...tromso, date: transitionalDate });
    expect(result.success).toBe(true);

    if (result.success) {
      const times = result.data;
      // Isha is not calculable during continuous twilight — timestamp is null
      expect(times.isha.timestamp).toBeNull();
      // Fajr must exist (Astronomical Midnight fallback)
      expect(times.fajr.timestamp).toBeDefined();
      expect(times.fajr.timestamp).not.toBeNull();
    }
  });

  it('should succeed and calculate bounded Fajr/Isha times with MiddleOfNight strategy on May 1st', () => {
    const result = getPrayerTimesLegacy({
      ...tromso,
      date: transitionalDate,
      highLatitudeStrategy: 'MiddleOfNight',
    });
    expect(result.success).toBe(true);

    if (result.success) {
      const times = result.data;

      // All times must be defined
      expect(times.fajr.timestamp).toBeDefined();
      expect(times.sunrise.timestamp).toBeDefined();
      expect(times.dhuhr.timestamp).toBeDefined();
      expect(times.asr.timestamp).toBeDefined();
      expect(times.maghrib.timestamp).toBeDefined();

      // Chronological order must hold
      expect(times.fajr.timestamp!).toBeLessThan(times.sunrise.timestamp!);
      expect(times.sunrise.timestamp!).toBeLessThan(times.dhuhr.timestamp!);
      expect(times.dhuhr.timestamp!).toBeLessThan(times.maghrib.timestamp!);
    }
  });
});
