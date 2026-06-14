import { describe, it, expect } from 'vitest';
import { getPrayerTimes } from '../../src/prayer/calculate.js';

describe('Prayer Module: Formula Invariants & Mathematical Logic', () => {
  const coords = { latitude: 24.8607, longitude: 67.0011 }; // Karachi
  const baseDate = new Date(Date.UTC(2026, 4, 18)); // May 18, 2026

  describe('Chronological Sequence Invariant', () => {
    it('should maintain standard chronological order for all five daily prayers + sunrise', () => {
      const result = getPrayerTimes({
        location: coords,
        date: baseDate,
        method: 'Karachi'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data;
        const f = data.fajr.timestamp!;
        const s = data.sunrise.timestamp!;
        const dk = data.dhahwaKubra.timestamp!;
        const d = data.dhuhr.timestamp!;
        const a = data.asr.timestamp!;
        const m = data.maghrib.timestamp!;
        const i = data.isha.timestamp!;

        // Chronological order: Fajr < Sunrise < Dhahwa Kubra < Dhuhr < Asr < Maghrib < Isha
        expect(f).toBeLessThan(s);
        expect(s).toBeLessThan(dk);
        expect(dk).toBeLessThan(d);
        expect(d).toBeLessThan(a);
        expect(a).toBeLessThan(m);
        expect(m).toBeLessThan(i);
      }
    });
  });

  describe('Solar Transit (Dhuhr / Noon) Invariant', () => {
    it('should place Dhuhr extremely close to solar noon (approx 12:00 in local timezone, corrected by longitude & EOT)', () => {
      const result = getPrayerTimes({
        location: coords,
        date: baseDate,
        timeZone: 5 // UTC+5 for Karachi
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Dhuhr time in Karachi is normally around 12:30 PM (because long is 67, UTC+5 meridian is 75)
        // 67 vs 75 is an 8 degree difference, representing ~32 minutes delay.
        // Thus local noon is around 12:32.
        const localDhuhr = result.data.dhuhr.local!;
        expect(localDhuhr).toMatch(/12:\d{2} PM/);
      }
    });
  });

  describe('Asr Madhab Shadow Factor Invariant', () => {
    it('should ensure Hanafi Asr (2x shadow) is strictly later than Shafi Asr (1x shadow) by > 30 minutes', () => {
      const shafi = getPrayerTimes({ location: coords, date: baseDate, madhab: 'Shafi' });
      const hanafi = getPrayerTimes({ location: coords, date: baseDate, madhab: 'Hanafi' });

      expect(shafi.success).toBe(true);
      expect(hanafi.success).toBe(true);

      if (shafi.success && hanafi.success) {
        const shafiTime = shafi.data.asr.timestamp!;
        const hanafiTime = hanafi.data.asr.timestamp!;

        expect(hanafiTime).toBeGreaterThan(shafiTime);
        const diffMinutes = (hanafiTime - shafiTime) / 60;
        expect(diffMinutes).toBeGreaterThan(30);
      }
    });
  });

  describe('Atmospheric Refraction & Elevation Dip Invariant', () => {
    it('should shift Sunrise earlier and Maghrib later at 3000m altitude, while keeping Dhuhr unchanged', () => {
      const seaLevel = getPrayerTimes({ location: coords, date: baseDate, elevation: 0 });
      const mountain = getPrayerTimes({ location: coords, date: baseDate, elevation: 3000 });

      expect(seaLevel.success).toBe(true);
      expect(mountain.success).toBe(true);

      if (seaLevel.success && mountain.success) {
        const seaSunrise = seaLevel.data.sunrise.timestamp!;
        const mtSunrise = mountain.data.sunrise.timestamp!;
        const seaMaghrib = seaLevel.data.maghrib.timestamp!;
        const mtMaghrib = mountain.data.maghrib.timestamp!;
        const seaDhuhr = seaLevel.data.dhuhr.timestamp!;
        const mtDhuhr = mountain.data.dhuhr.timestamp!;

        // Higher altitude -> earlier sunrise
        expect(mtSunrise).toBeLessThan(seaSunrise);
        // Higher altitude -> later maghrib (sunset)
        expect(mtMaghrib).toBeGreaterThan(seaMaghrib);
        // Solar transit (Dhuhr) is independent of altitude horizon refraction
        expect(Math.abs(mtDhuhr - seaDhuhr)).toBeLessThan(10); // <10 seconds difference
      }
    });
  });

  describe('Manual Offsets & Adjustments Integration', () => {
    it('should shift specified times exactly by the adjustments configured in minutes', () => {
      const noAdjust = getPrayerTimes({ location: coords, date: baseDate });
      const adjust = getPrayerTimes({
        location: coords,
        date: baseDate,
        adjustments: {
          fajr: 5,   // shift Fajr 5 mins later
          dhuhr: -3  // shift Dhuhr 3 mins earlier
        }
      });

      expect(noAdjust.success).toBe(true);
      expect(adjust.success).toBe(true);

      if (noAdjust.success && adjust.success) {
        const baseFajr = noAdjust.data.fajr.timestamp!;
        const adjFajr = adjust.data.fajr.timestamp!;
        const baseDhuhr = noAdjust.data.dhuhr.timestamp!;
        const adjDhuhr = adjust.data.dhuhr.timestamp!;

        expect(adjFajr - baseFajr).toBe(5 * 60);
        expect(baseDhuhr - adjDhuhr).toBe(3 * 60);

        // Others (e.g. sunrise) should be exactly equal
        expect(noAdjust.data.sunrise.timestamp).toBe(adjust.data.sunrise.timestamp);
      }
    });
  });

  describe('Calculation Engine Structural Metadata', () => {
    it('should include declination (DEC), equation of time (EOT), and solver iteration counts in results when requested', () => {
      const result = getPrayerTimes({
        location: coords,
        date: baseDate,
        withMetadata: true
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.metadata).toBeDefined();
        const meta = result.data.metadata!;
        expect(meta.fajr).toHaveProperty('DEC');
        expect(meta.fajr).toHaveProperty('EOT');
        expect(meta.fajr).toHaveProperty('iterations');
        expect(meta.sunrise).toHaveProperty('HP');
        expect(meta.sunrise).toHaveProperty('SD');
      }
    });
  });
});
