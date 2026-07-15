import { describe, it, expect } from 'vitest';
import { getPrayerTimesLegacy } from '../../src/prayers/legacy.js';;

describe('Advanced PrayerMetadata Pipeline Tests', () => {
  const normalLat = 24.8607;
  const normalLong = 67.0011; // Karachi
  const highLat = 69.6492;
  const highLong = 18.9553; // Tromsø
  const date = new Date(Date.UTC(2024, 3, 27)); // April 27, 2024

  it('should not contain metadata when withMetadata is false', () => {
    const result = getPrayerTimesLegacy({ lat: normalLat, long: normalLong, date, withMetadata: false });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata).toBeUndefined();
    }
  });

  it('should collect detailed metadata on a normal day', () => {
    const result = getPrayerTimesLegacy({ lat: normalLat, long: normalLong, date, withMetadata: true });
    expect(result.success).toBe(true);
    if (result.success) {
      const meta = result.data.metadata;
      expect(meta).toBeDefined();
      expect(meta?.fajr).toBeDefined();
      expect(meta?.fajr?.DEC).toBeTypeOf('number');
      expect(meta?.fajr?.iterations).toBeGreaterThan(0);

      expect(meta?.sunrise).toBeDefined();
      expect(meta?.sunrise?.refraction).toBeTypeOf('number');
      expect(meta?.sunrise?.elevationMeters).toBe(0);

      expect(meta?.dhahwaKubra).toBeDefined();
      expect(meta?.dhahwaKubra?.fajrTime).toBeTypeOf('string');
      expect(meta?.dhahwaKubra?.maghribTime).toBeTypeOf('string');

      expect(meta?.dhuhr).toBeDefined();
      expect(meta?.dhuhr?.EOT).toBeTypeOf('number');
      expect(meta?.dhuhr?.iterations).toBeGreaterThan(0);

      expect(meta?.maghrib).toBeDefined();
      expect(meta?.maghrib?.refraction).toBeTypeOf('number');

      expect(meta?.isha).toBeDefined();
    }
  });

  it('should preserve and track the Asr Matrix (Dhuhr and Asr parameters)', () => {
    const result = getPrayerTimesLegacy({ lat: normalLat, long: normalLong, date, withMetadata: true });
    expect(result.success).toBe(true);
    if (result.success) {
      const meta = result.data.metadata;
      expect(meta?.asr).toBeDefined();
      const asr = meta?.asr;
      expect(asr?.DEC_of_Dhuhr).toBeTypeOf('number');
      expect(asr?.DEC_of_Asr).toBeTypeOf('number');
      expect(asr?.SD_of_Dhuhr).toBeTypeOf('number');
      expect(asr?.SD_of_Asr).toBeTypeOf('number');
      expect(asr?.refraction_of_Dhuhr).toBeTypeOf('number');
      expect(asr?.refraction_of_Asr).toBeTypeOf('number');
      expect(asr?.asrAngle).toBeTypeOf('number');
      expect(asr?.iterations).toBeGreaterThan(0);
    }
  });

  it('should apply high-latitude short-circuiting for missing/non-occurring prayers', () => {
    // Tromsø in late June has Polar Day (midnight sun) -> Sunrise/Sunset/Fajr/Isha do not mathematically occur
    const summerDate = new Date(Date.UTC(2024, 5, 21));
    const result = getPrayerTimesLegacy({
      lat: highLat,
      long: highLong,
      date: summerDate,
      withMetadata: true,
      highLatitudeStrategy: 'NearestLatitude', // NearestLatitude fallback changes the effective lat case to 45
    });

    expect(result.success).toBe(true);
    if (result.success) {
      const meta = result.data.metadata;
      // With NearestLatitude, we fall back to a lower latitude, so prayers actually occur and resolve normally
      expect(meta?.fajr).toBeDefined();
      expect(meta?.sunrise).toBeDefined();
    }

    // Let's test with no fallback strategy that prevents polar day calculations
    const resultNoFallback = getPrayerTimesLegacy({
      lat: highLat,
      long: highLong,
      date: summerDate,
      withMetadata: true,
    });
    expect(resultNoFallback.success).toBe(true);
    if (resultNoFallback.success) {
      const meta = resultNoFallback.data.metadata;
      // Fajr, Sunrise, Maghrib, Isha did not mathematically occur as SUCCESS status, so conventional metadata is undefined/omitted
      expect(meta?.fajr).toBeUndefined();
      expect(meta?.sunrise).toBeUndefined();
      expect(meta?.maghrib).toBeUndefined();
    }
  });

  it('should inject high-latitude Isha/Fajr context during strategy overrides', () => {
    const result = getPrayerTimesLegacy({
      lat: highLat,
      long: highLong,
      date: new Date(Date.UTC(2024, 4, 1)), // May 1st, continuous twilight
      highLatitudeStrategy: 'MiddleOfNight',
      withMetadata: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      const meta = result.data.metadata;
      expect(meta?.isha).toBeDefined();
      expect(meta?.isha?.highLatitudeSelectedDateMaghribTime).toBeTypeOf('string');
      expect(meta?.isha?.highLatitudeIshaSelectedDate).toBeTypeOf('string');
      expect(meta?.isha?.highLatitudeFajrNextDay).toBeTypeOf('string');
    }
  });
});
