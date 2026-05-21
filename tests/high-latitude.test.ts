import { describe, it, expect } from 'vitest';
import { getPrayerTimes } from '../src/prayer/calculate.js';
import { HighLatitudeMethod } from '../src/prayer/types/index.js';
import { ErrorCode } from '../src/core/result.js';
import { formatPrayerTimes } from '../src/prayer/index.js';

describe('High Latitude Adjustment Tests', () => {
  const tromso = { latitude: 69.6492, longitude: 18.9553 };
  const summerSolstice = new Date(Date.UTC(2024, 5, 21)); // June 21, 2024
  const winterSolstice = new Date(Date.UTC(2024, 11, 21)); // December 21, 2024
  const transitionalDate = new Date(Date.UTC(2024, 4, 1)); // May 1, 2024 - sun rises/sets but twilight is continuous

  it('should return Failure (POLAR_DAY) for Tromsø during Summer Solstice due to Midnight Sun', () => {
    const result = getPrayerTimes({
      location: tromso,
      date: summerSolstice
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(ErrorCode.POLAR_DAY);
    }
  });

  it('should return Failure (POLAR_NIGHT) for Tromsø during Winter Solstice due to Polar Night', () => {
    const result = getPrayerTimes({
      location: tromso,
      date: winterSolstice
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(ErrorCode.POLAR_NIGHT);
    }
  });

  it('should succeed and return null for Isha and Midnight for Fajr for Tromsø on May 1st, 2024 by default', () => {
    const result = getPrayerTimes({
      location: tromso,
      date: transitionalDate
    });

    expect(result.success).toBe(true);

    if (result.success) {
      const times = result.data;
      expect(times.isha).toBeNull();
      expect(times.fajr).toBeInstanceOf(Date);
      expect(isNaN(times.fajr!.getTime())).toBe(false);

      // Verify Fajr is strictly Midnight of that night (midpoint between Maghrib and Sunrise)
      let sunriseTime = times.sunrise.getTime();
      if (sunriseTime < times.maghrib.getTime()) {
        sunriseTime += 24 * 60 * 60 * 1000;
      }
      const nightDuration = sunriseTime - times.maghrib.getTime();
      const expectedMidnight = times.maghrib.getTime() + nightDuration / 2;
      expect(times.fajr!.getTime()).toBe(expectedMidnight);

      // Formatter should handle null values cleanly without crashing
      const formatted = formatPrayerTimes(times, '24h');
      expect(formatted.isha).toBe('');
      expect(formatted.fajr).not.toBe('Invalid Date');
      expect(formatted.fajr).not.toBe('');
      expect(typeof formatted.fajr).toBe('string');
    }
  });

  it('should succeed and calculate bounded times for Tromsø during Summer Solstice with MIDDLE_OF_THE_NIGHT override if forced (or wait, wait, MIDDLE_OF_THE_NIGHT check)', () => {
    // Note: MIDDLE_OF_THE_NIGHT overrides normally, but astronomical checks for Polar Day/Night are hard checks that run BEFORE adjustment.
    // So Tromsø on June 21 (which is polar day) will always return POLAR_DAY now.
    // Let's test MIDDLE_OF_THE_NIGHT on a date where it is NOT polar day, but twilight is continuous, e.g. May 1st.
    const result = getPrayerTimes({
      location: tromso,
      date: transitionalDate,
      highLatitudeMethod: HighLatitudeMethod.MIDDLE_OF_THE_NIGHT
    });

    expect(result.success).toBe(true);

    if (result.success) {
      const times = result.data;
      
      // Ensure no dates are null or NaN
      expect(times.fajr).toBeInstanceOf(Date);
      expect(times.isha).toBeInstanceOf(Date);
      expect(isNaN(times.fajr!.getTime())).toBe(false);
      expect(isNaN(times.sunrise.getTime())).toBe(false);
      expect(isNaN(times.dhahwaKubra.getTime())).toBe(false);
      expect(isNaN(times.dhuhr.getTime())).toBe(false);
      expect(isNaN(times.asr.getTime())).toBe(false);
      expect(isNaN(times.maghrib.getTime())).toBe(false);
      expect(isNaN(times.isha!.getTime())).toBe(false);

      // Verify logical order
      expect(times.fajr!.getTime()).toBeLessThan(times.sunrise.getTime());
      expect(times.sunrise.getTime()).toBeLessThan(times.dhahwaKubra.getTime());
      expect(times.dhahwaKubra.getTime()).toBeLessThan(times.maghrib.getTime());
      expect(times.maghrib.getTime()).toBeLessThan(times.isha!.getTime());
      expect(times.dhuhr.getTime()).toBeGreaterThan(times.sunrise.getTime());
      expect(times.dhuhr.getTime()).toBeLessThan(times.maghrib.getTime());

      // Middle of the night checks
      let sunriseTime = times.sunrise.getTime();
      if (sunriseTime < times.maghrib.getTime()) {
        sunriseTime += 24 * 60 * 60 * 1000;
      }
      const nightDuration = sunriseTime - times.maghrib.getTime();
      const halfNight = nightDuration / 2;

      // Assert Fajr is exactly halfNight before sunrise
      expect(times.fajr!.getTime()).toBe(times.sunrise.getTime() - halfNight);

      // Assert Isha is exactly halfNight after maghrib
      expect(times.isha!.getTime()).toBe(times.maghrib.getTime() + halfNight);

      // Recalculated Dhahwa Kubra
      expect(times.dhahwaKubra.getTime()).toBe((times.fajr!.getTime() + times.maghrib.getTime()) / 2);

      // Ensure formatting helper works perfectly
      const formatted = formatPrayerTimes(times, '24h');
      expect(formatted.fajr).not.toBe('Invalid Date');
      expect(formatted.isha).not.toBe('Invalid Date');
      expect(typeof formatted.fajr).toBe('string');
    }
  });
});
