import { describe, it, expect } from 'vitest';
import { getUnifiedPrayerTimes } from '../../src/prayers/unifiedEngine.js';
import type { PrayerConfig } from '../../src/prayers/types/index.js';

describe('Unified Prayer Engine Validations', () => {
  const isISOString = (str: string) => {
    return typeof str === 'string' && str.includes('T') && str.includes('Z') && !Number.isNaN(Date.parse(str));
  };

  it('Zone A: Standard Latitudes (The Baseline Test) - Karachi', () => {
    const config: PrayerConfig = {
      lat: 24.8607,
      long: 67.0011,
      timeZone: 'Asia/Karachi',
      date: new Date('2026-07-15T12:00:00Z'),
      method: 'Karachi',
      madhab: 'Hanafi'
    };

    const result = getUnifiedPrayerTimes(config);

    expect(result.metadata.dayType).toBe('NORMAL');
    expect(result.metadata.appliedStrategy).toBe('NONE');
    
    expect(isISOString(result.times.fajr)).toBe(true);
    expect(isISOString(result.times.sunrise)).toBe(true);
    expect(isISOString(result.times.dhuhr)).toBe(true);
    expect(isISOString(result.times.asr)).toBe(true);
    expect(isISOString(result.times.maghrib)).toBe(true);
    expect(isISOString(result.times.isha)).toBe(true);

    const f = new Date(result.times.fajr).getTime();
    const s = new Date(result.times.sunrise).getTime();
    const d = new Date(result.times.dhuhr).getTime();
    const a = new Date(result.times.asr).getTime();
    const m = new Date(result.times.maghrib).getTime();
    const i = new Date(result.times.isha).getTime();

    expect(f).toBeLessThan(s);
    expect(s).toBeLessThan(d);
    expect(d).toBeLessThan(a);
    expect(a).toBeLessThan(m);
    expect(m).toBeLessThan(i);
  });

  it('Zone B: High Latitudes / Short Nights (The Twilight Failure Test) - London', () => {
    const config: PrayerConfig = {
      lat: 51.5074,
      long: -0.1278,
      timeZone: 'Europe/London',
      date: new Date('2026-06-21T12:00:00Z'),
      method: 'MWL',
      highLatitudeStrategy: 'MiddleOfNight'
    };

    const result = getUnifiedPrayerTimes(config);

    if (result.metadata.dayType === 'HIGH_LATITUDE') {
      expect(['ANGLE_BASED', 'MIDDLE_OF_NIGHT', 'SEVENTH_OF_NIGHT', 'NEAREST_LATITUDE_FALLBACK']).toContain(result.metadata.appliedStrategy);
    } else {
      // It is possible on 2026-06-21 it triggers POLAR_DAY or it actually works normally? London is 51.5° 
      // Summer Solstice London doesn't get true darkness, twilight doesn't end, it should trigger HIGH_LATITUDE.
      expect(result.metadata.dayType).toBe('HIGH_LATITUDE');
    }

    expect(isISOString(result.times.fajr)).toBe(true);
    expect(isISOString(result.times.sunrise)).toBe(true);
    expect(isISOString(result.times.dhuhr)).toBe(true);
    expect(isISOString(result.times.asr)).toBe(true);
    expect(isISOString(result.times.maghrib)).toBe(true);
    expect(isISOString(result.times.isha)).toBe(true);
  });

  it('Zone C: Extreme Polar Day (The Midnight Sun Test) - Tromsø', () => {
    const config: PrayerConfig = {
      lat: 69.6492,
      long: 18.9553,
      timeZone: 'Europe/Oslo',
      date: new Date('2026-06-21T12:00:00Z'),
      method: 'MWL'
    };

    const result = getUnifiedPrayerTimes(config);

    expect(result.metadata.dayType).toBe('POLAR_DAY');
    expect(result.metadata.appliedStrategy).toBe('NEAREST_LATITUDE_FALLBACK');
    expect(result.metadata.evaluatedLatitude).toBe(45);
    
    expect(isISOString(result.times.fajr)).toBe(true);
    expect(isISOString(result.times.sunrise)).toBe(true);
    expect(isISOString(result.times.dhuhr)).toBe(true);
    expect(isISOString(result.times.asr)).toBe(true);
    expect(isISOString(result.times.maghrib)).toBe(true);
    expect(isISOString(result.times.isha)).toBe(true);
  });

  it('Zone D: Extreme Polar Night (The Perpetual Darkness Test) - McMurdo', () => {
    const config: PrayerConfig = {
      lat: -77.8460,
      long: 166.6660,
      timeZone: 'Pacific/Auckland',
      date: new Date('2026-06-21T12:00:00Z'),
      method: 'MWL'
    };

    const result = getUnifiedPrayerTimes(config);

    expect(result.metadata.dayType).toBe('POLAR_NIGHT');
    expect(result.metadata.appliedStrategy).toBe('NEAREST_LATITUDE_FALLBACK');
    expect(result.metadata.evaluatedLatitude).toBe(-45);

    expect(isISOString(result.times.fajr)).toBe(true);
    expect(isISOString(result.times.sunrise)).toBe(true);
    expect(isISOString(result.times.dhuhr)).toBe(true);
    expect(isISOString(result.times.asr)).toBe(true);
    expect(isISOString(result.times.maghrib)).toBe(true);
    expect(isISOString(result.times.isha)).toBe(true);
  });

  it('Code Robustness: Config Immutability and No Throw', () => {
    const config: PrayerConfig = {
      lat: 24.8607,
      long: 67.0011,
      date: new Date('2026-07-15T12:00:00Z'),
      method: 'Karachi',
      madhab: 'Hanafi',
      adjustments: { fajr: 2, maghrib: 3 }
    };

    // Deep freeze
    Object.freeze(config);
    if (config.adjustments) Object.freeze(config.adjustments);

    expect(() => getUnifiedPrayerTimes(config)).not.toThrow();
  });
});
