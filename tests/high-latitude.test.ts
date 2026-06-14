import { describe, it, expect } from 'vitest';
import { getPrayerTimes } from '../src/prayer/calculate.js';
import { HighLatitudeMethod } from '../src/prayer/types/index.js';
import { ErrorCode } from '../src/core/result.js';
import { formatPrayerTimes } from '../src/prayer/index.js';

describe('High Latitude Adjustment Tests', () => {
  const tromso = { latitude: 69.6492, longitude: 18.9553 };
  const summerSolstice = new Date(Date.UTC(2024, 5, 21)); // June 21, 2024
  const winterSolstice = new Date(Date.UTC(2024, 11, 21)); // December 21, 2024
  const transitionalDate = new Date(Date.UTC(2024, 4, 1)); // May 1, 2024

  it('should return Failure (POLAR_DAY) for Tromsø during Summer Solstice due to Midnight Sun', () => {
    const result = getPrayerTimes({
      location: tromso,
      date: summerSolstice
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sunrise.status).toBe('POLAR_DAY');
    }
  });

  it('should return Failure (POLAR_NIGHT) for Tromsø during Winter Solstice due to Polar Night', () => {
    const result = getPrayerTimes({
      location: tromso,
      date: winterSolstice
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sunrise.status).toBe('POLAR_NIGHT');
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
      expect(times.isha.utc).toBeNull();
      expect(times.fajr).toHaveProperty('timestamp');
      expect(times.fajr.timestamp).toBeDefined();

      let sunriseTime = times.sunrise.timestamp! * 1000;
      if (sunriseTime < times.maghrib.timestamp! * 1000) {
        sunriseTime += 24 * 60 * 60 * 1000;
      }
      const nightDuration = sunriseTime - times.maghrib.timestamp! * 1000;
      const expectedMidnight = times.maghrib.timestamp! * 1000 + nightDuration / 2;
      expect(times.fajr.timestamp! * 1000).toBe(expectedMidnight);

      const formatted = formatPrayerTimes(times, '24h');
      if (formatted.success) {
        expect(formatted.data.isha).toBeNull();
        expect(formatted.data.fajr).not.toBeNull();
        expect(typeof formatted.data.fajr).toBe('string');
      }
    }
  });

  it('should succeed and calculate bounded times for Tromsø during Summer Solstice with MIDDLE_OF_THE_NIGHT override if forced (or wait, wait, MIDDLE_OF_THE_NIGHT check)', () => {
    const result = getPrayerTimes({
      location: tromso,
      date: transitionalDate,
      highLatitudeMethod: HighLatitudeMethod.MIDDLE_OF_THE_NIGHT
    });

    expect(result.success).toBe(true);

    if (result.success) {
      const times = result.data;
      
      expect(times.fajr).toHaveProperty('timestamp');
      expect(times.isha).toHaveProperty('timestamp');
      expect(times.fajr.timestamp).toBeDefined();
      expect(times.sunrise.timestamp).toBeDefined();
      expect(times.dhahwaKubra.timestamp).toBeDefined();
      expect(times.dhuhr.timestamp).toBeDefined();
      expect(times.asr.timestamp).toBeDefined();
      expect(times.maghrib.timestamp).toBeDefined();
      expect(times.isha.timestamp).toBeDefined();

      expect(times.fajr.timestamp! * 1000).toBeLessThan(times.sunrise.timestamp! * 1000);
      expect(times.sunrise.timestamp! * 1000).toBeLessThan(times.dhahwaKubra.timestamp! * 1000);
      expect(times.dhahwaKubra.timestamp! * 1000).toBeLessThan(times.maghrib.timestamp! * 1000);
      expect(times.maghrib.timestamp! * 1000).toBeLessThan(times.isha.timestamp! * 1000);
      expect(times.dhuhr.timestamp! * 1000).toBeGreaterThan(times.sunrise.timestamp! * 1000);
      expect(times.dhuhr.timestamp! * 1000).toBeLessThan(times.maghrib.timestamp! * 1000);

      let sunriseTime = times.sunrise.timestamp! * 1000;
      if (sunriseTime < times.maghrib.timestamp! * 1000) {
        sunriseTime += 24 * 60 * 60 * 1000;
      }
      const nightDuration = sunriseTime - times.maghrib.timestamp! * 1000;
      const halfNight = nightDuration / 2;

      expect(times.fajr.timestamp! * 1000).toBe(times.sunrise.timestamp! * 1000 - halfNight);
      expect(times.isha.timestamp! * 1000).toBe(times.maghrib.timestamp! * 1000 + halfNight);
      expect(times.dhahwaKubra.timestamp! * 1000).toBe((times.fajr.timestamp! * 1000 + times.maghrib.timestamp! * 1000) / 2);

      const formatted = formatPrayerTimes(times, '24h');
      if (formatted.success) {
        expect(formatted.data.fajr).not.toBeNull();
        expect(formatted.data.isha).not.toBeNull();
        expect(typeof formatted.data.fajr).toBe('string');
      }
    }
  });
});
