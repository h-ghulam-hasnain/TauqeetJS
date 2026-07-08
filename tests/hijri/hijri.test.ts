import { describe, it, expect } from 'vitest';
import { toHijri, toGregorian } from '../../src/hijri/index.js';
import { HijriMethod } from '../../src/hijri/types/HijriMethod.js';

describe('Hijri converters', () => {
  it('toHijri returns a HijriDate object with numeric fields', () => {
    const date = new Date('2024-04-09T00:00:00Z');
    const hijri = toHijri(date, HijriMethod.CIVIL);
    expect(typeof hijri.year).toBe('number');
    expect(typeof hijri.month).toBe('number');
    expect(typeof hijri.day).toBe('number');
    expect(hijri.month).toBeGreaterThanOrEqual(1);
    expect(hijri.month).toBeLessThanOrEqual(12);
  });

  it('round-trips via toGregorian producing a Date', () => {
    const date = new Date('2024-04-09T00:00:00Z');
    const hijri = toHijri(date, HijriMethod.CIVIL);
    const back = toGregorian(hijri, HijriMethod.CIVIL);
    expect(back).toBeInstanceOf(Date);
    // Round-trip may normalize time-of-day; assert same day within ±1 day
    const diffDays = Math.round((back.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    expect(Math.abs(diffDays)).toBeLessThanOrEqual(1);
  });
});
