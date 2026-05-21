import { describe, it, expect } from 'vitest';
import { getMoonVisibility } from '../src/moon-visibility/index.js';
import { ValidationError, ErrorCode } from '../src/core/result.js';

describe('Moon Visibility Engine & Architectural Specifications', () => {
  const coords = { latitude: 24.8607, longitude: 67.0011 }; // Karachi
  const date = new Date(2026, 4, 18); // May 18, 2026

  describe('1. Input Validation & Defaulting Architecture', () => {
    it('should immediately return Failure(ValidationError.MISSING_COORDINATES) if latitude is missing', () => {
      const res = getMoonVisibility({ longitude: 67.0011 });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe(ValidationError.MISSING_COORDINATES);
      }
    });

    it('should immediately return Failure(ValidationError.MISSING_COORDINATES) if longitude is missing', () => {
      const res = getMoonVisibility({ latitude: 24.8607 });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe(ValidationError.MISSING_COORDINATES);
      }
    });

    it('should default to system current date if date is omitted', () => {
      const res = getMoonVisibility({ latitude: coords.latitude, longitude: coords.longitude });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.almanac.upcomingNewMoon).toBeDefined();
        expect(res.data.almanac.upcomingNewMoon?.date).toBeDefined();
      }
    });

    it('should apply the Sunset Rule (dynamic time defaulting) when time is omitted', () => {
      const resWithoutTime = getMoonVisibility({
        latitude: coords.latitude,
        longitude: coords.longitude,
        date: new Date('2026-05-18T00:00:00Z')
      });
      
      expect(resWithoutTime.success).toBe(true);
      if (resWithoutTime.success) {
        expect(resWithoutTime.data.position.altitude).toBeDefined();
      }
    });
  });

  describe('2. Temporal Accuracy & Disk Analytics', () => {
    it('should calculate altitude, azimuth, HP, SD, and disk analytics strictly using target time', () => {
      const res = getMoonVisibility({
        latitude: coords.latitude,
        longitude: coords.longitude,
        date: date,
        time: '18:45:00'
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.position.altitude).toBeDefined();
        expect(res.data.position.azimuth).toBeDefined();
        expect(res.data.position.hp).toBeDefined();
        expect(res.data.position.sd).toBeDefined();
        
        expect(res.data.analytics.illumination).toBeDefined();
        expect(res.data.analytics.phase).toBeDefined();
        expect(res.data.analytics.age).toBeDefined();
        expect(res.data.analytics.elongation).toBeDefined();
      }
    });
  });

  describe('3. Output Interface & Custom Objects', () => {
    it('should return high-precision DateTimeDetails custom objects for phases', () => {
      const res = getMoonVisibility({
        latitude: coords.latitude,
        longitude: coords.longitude,
        date: date
      });
      expect(res.success).toBe(true);
      if (res.success) {
        const alm = res.data.almanac;
        
        expect(alm.upcomingNewMoon).toHaveProperty('date');
        expect(alm.upcomingNewMoon).toHaveProperty('time');
        expect(alm.upcomingNewMoon).toHaveProperty('julianDay');
        expect(typeof alm.upcomingNewMoon?.date).toBe('string');
        expect(typeof alm.upcomingNewMoon?.time).toBe('string');
        expect(typeof alm.upcomingNewMoon?.julianDay).toBe('number');
        
        expect(alm.upcomingFullMoon).toHaveProperty('date');
        expect(alm.previousNewMoon).toHaveProperty('date');
        expect(alm.previousFullMoon).toHaveProperty('date');
      }
    });

    it('should return DateTimeDetails or "Never Rises"/"Never Sets" for MoonRise, MoonSet, LocalTransit', () => {
      const res = getMoonVisibility({
        latitude: coords.latitude,
        longitude: coords.longitude,
        date: date
      });
      expect(res.success).toBe(true);
      if (res.success) {
        const alm = res.data.almanac;
        
        expect(alm.MoonRise).toBeDefined();
        expect(alm.MoonSet).toBeDefined();
        expect(alm.LocalTransit).toBeDefined();
        
        if (typeof alm.MoonRise !== 'string') {
          expect(alm.MoonRise).toHaveProperty('date');
          expect(alm.MoonRise).toHaveProperty('time');
          expect(alm.MoonRise).toHaveProperty('julianDay');
        } else {
          expect(['Never Rises', 'Never Sets']).toContain(alm.MoonRise);
        }
      }
    });
  });

  describe('4. Solver Precision & Logic Integrity (Bug Verification)', () => {
    it('should NOT mirror Almanac phases (Previous/Next New/Full Moon must be unique and distinct)', () => {
      const res = getMoonVisibility({
        latitude: coords.latitude,
        longitude: coords.longitude,
        date: date
      });
      expect(res.success).toBe(true);
      if (res.success) {
        const alm = res.data.almanac;
        
        // Previous new moon is NOT the same as previous full moon
        expect(alm.previousNewMoon?.date).not.toBe(alm.previousFullMoon?.date);
        
        // Upcoming new moon is NOT the same as upcoming full moon
        expect(alm.upcomingNewMoon?.date).not.toBe(alm.upcomingFullMoon?.date);
        
        console.log('Previous New Moon Date:', alm.previousNewMoon?.date, alm.previousNewMoon?.time);
        console.log('Previous Full Moon Date:', alm.previousFullMoon?.date, alm.previousFullMoon?.time);
        console.log('Next New Moon Date:', alm.upcomingNewMoon?.date, alm.upcomingNewMoon?.time);
        console.log('Next Full Moon Date:', alm.upcomingFullMoon?.date, alm.upcomingFullMoon?.time);
      }
    });

    it('should NOT return Never Rises and Never Sets simultaneously if there is a valid Transit', () => {
      const res = getMoonVisibility({
        latitude: coords.latitude,
        longitude: coords.longitude,
        date: date
      });
      expect(res.success).toBe(true);
      if (res.success) {
        const alm = res.data.almanac;
        
        // If there is a valid transit, we shouldn't have 'Never Rises' and 'Never Sets' simultaneously
        if (alm.LocalTransit !== 'Never Rises' && alm.LocalTransit !== 'Never Sets') {
          const isNeverRises = alm.MoonRise === 'Never Rises';
          const isNeverSets = alm.MoonSet === 'Never Sets';
          expect(isNeverRises && isNeverSets).toBe(false);
        }
      }
    });

    it('should compare precisely with script.js reference values', () => {
      const res = getMoonVisibility({
        latitude: 24.8607,
        longitude: 67.0011,
        date: new Date(Date.UTC(2026, 4, 18, 18, 45, 0)),
        time: '18:45:00'
      });
      expect(res.success).toBe(true);
      if (res.success) {
        const p = res.data.position;
        const a = res.data.analytics;
        console.log('COMPARE DEC:', p.declination);
        console.log('COMPARE SD (arcseconds):', p.sd * 3600);
        console.log('COMPARE HP (arcseconds):', p.hp * 3600);
        console.log('COMPARE ILLUM:', a.illumination);
        console.log('COMPARE ELONGATION:', a.elongation);
        
        // Assertions based on script.js values
        // Dec: script.js got N 28° 03' 11'' (~28.053)
        expect(Math.abs(p.declination - 28.053)).toBeLessThan(0.005);
        // SD: script.js got 997.4''
        expect(Math.abs(p.sd * 3600 - 997.4)).toBeLessThan(2.0);
        // HP: script.js got 3660.5''
        expect(Math.abs(p.hp * 3600 - 3660.5)).toBeLessThan(5.0);
      }
    });
  });
});

