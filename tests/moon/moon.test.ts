import { describe, it, expect } from 'vitest';
import {
  getMoonPhase,
  getMoonAge,
  getMoonIllumination,
  getNextNewMoon,
  getPreviousNewMoon,
  getNextFullMoon,
  getPreviousFullMoon,
  checkVisibility,
  VisibilityMethod,
} from '../../src/moon/index.js';

describe('Moon Module: Phase, Events & Visibility', () => {
  const date = new Date(Date.UTC(2026, 4, 18)); // May 18, 2026

  // ─── 1. Moon Phase ────────────────────────────────────────────────────────

  describe('1. getMoonPhase', () => {
    it('should return a valid MoonPhaseResult with all required fields', () => {
      const result = getMoonPhase(date);
      expect(result).toBeDefined();
      // elongation (0–360°), illuminatedFraction (0–1), phaseName (optional string)
      expect(typeof result.elongation).toBe('number');
      expect(result.elongation).toBeGreaterThanOrEqual(0);
      expect(result.elongation).toBeLessThanOrEqual(360);
      expect(typeof result.illuminatedFraction).toBe('number');
      expect(result.illuminatedFraction).toBeGreaterThanOrEqual(0);
      expect(result.illuminatedFraction).toBeLessThanOrEqual(1);
    });

    it('should return a non-empty phaseName when set', () => {
      const result = getMoonPhase(date);
      if (result.phaseName !== undefined) {
        expect(result.phaseName.length).toBeGreaterThan(0);
      }
    });

    it('should produce deterministic output for the same input date', () => {
      const r1 = getMoonPhase(date);
      const r2 = getMoonPhase(new Date(date.getTime()));
      expect(r1.elongation).toBeCloseTo(r2.elongation, 10);
      expect(r1.illuminatedFraction).toBeCloseTo(r2.illuminatedFraction, 10);
    });
  });

  // ─── 2. Moon Age ──────────────────────────────────────────────────────────

  describe('2. getMoonAge', () => {
    it('should return a MoonAgeResult with ageDays between 0 and 29.5', () => {
      const result = getMoonAge(date);
      expect(result).toBeDefined();
      expect(typeof result.ageDays).toBe('number');
      expect(result.ageDays).toBeGreaterThanOrEqual(0);
      expect(result.ageDays).toBeLessThan(30);
    });
  });

  // ─── 3. Moon Illumination ─────────────────────────────────────────────────
  // getMoonIllumination returns a plain number (the illuminated fraction)

  describe('3. getMoonIllumination', () => {
    it('should return a number between 0 and 1', () => {
      const result = getMoonIllumination(date);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('illumination from getMoonIllumination and getMoonPhase must agree within 0.001', () => {
      const phase = getMoonPhase(date);
      const illum = getMoonIllumination(date);
      expect(Math.abs(phase.illuminatedFraction - illum)).toBeLessThan(0.001);
    });
  });

  // ─── 4. Lunar Events ──────────────────────────────────────────────────────
  // getNextNewMoon / getPreviousNewMoon / getNextFullMoon / getPreviousFullMoon
  // all return a plain Date object

  describe('4. Lunar Events (New Moon / Full Moon)', () => {
    it('getNextNewMoon should return a Date after the input date', () => {
      const result = getNextNewMoon(date);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeGreaterThan(date.getTime());
    });

    it('getPreviousNewMoon should return a Date before the input date', () => {
      const result = getPreviousNewMoon(date);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeLessThan(date.getTime());
    });

    it('getNextFullMoon should return a Date after the input date', () => {
      const result = getNextFullMoon(date);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeGreaterThan(date.getTime());
    });

    it('getPreviousFullMoon should return a Date before the input date', () => {
      const result = getPreviousFullMoon(date);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeLessThan(date.getTime());
    });

    it('previous New Moon and previous Full Moon must be different dates', () => {
      const newMoon = getPreviousNewMoon(date);
      const fullMoon = getPreviousFullMoon(date);
      expect(newMoon.getTime()).not.toBe(fullMoon.getTime());
    });

    it('next New Moon and next Full Moon must be different dates', () => {
      const newMoon = getNextNewMoon(date);
      const fullMoon = getNextFullMoon(date);
      expect(newMoon.getTime()).not.toBe(fullMoon.getTime());
    });

    it('previous New Moon must be before next New Moon', () => {
      const prev = getPreviousNewMoon(date);
      const next = getNextNewMoon(date);
      expect(prev.getTime()).toBeLessThan(next.getTime());
    });
  });

  // ─── 5. Crescent Visibility ────────────────────────────────────────────────
  // checkVisibility(params: { date, latitude, longitude, method: VisibilityMethod })
  // returns VisibilityResult: { criterionName, visible, confidence?, category?, details? }

  describe('5. checkVisibility (Odeh, Yallop, HMNAO methods)', () => {
    const visParams = {
      date: new Date(Date.UTC(2026, 4, 27)), // ~day after new moon
      latitude: 24.8607,
      longitude: 67.0011,
    };

    it('should return a VisibilityResult with visible boolean using ODEH method', () => {
      const result = checkVisibility({ ...visParams, method: VisibilityMethod.ODEH });
      expect(result).toBeDefined();
      expect(typeof result.visible).toBe('boolean');
      expect(typeof result.criterionName).toBe('string');
    });

    it('should return a VisibilityResult with visible boolean using YALLOP method', () => {
      const result = checkVisibility({ ...visParams, method: VisibilityMethod.YALLOP });
      expect(result).toBeDefined();
      expect(typeof result.visible).toBe('boolean');
      expect(typeof result.criterionName).toBe('string');
    });

    it('should return a VisibilityResult with visible boolean using HMNAO method', () => {
      const result = checkVisibility({ ...visParams, method: VisibilityMethod.HMNAO });
      expect(result).toBeDefined();
      expect(typeof result.visible).toBe('boolean');
    });

    it('criterionName should be a non-empty string', () => {
      const result = checkVisibility({ ...visParams, method: VisibilityMethod.ODEH });
      expect(result.criterionName.length).toBeGreaterThan(0);
    });
  });
});
