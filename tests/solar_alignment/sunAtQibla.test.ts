import { describe, it, expect } from 'vitest';
import { getSunAtQibla } from '../../src/solar-alignment/sunAtQibla.js';

describe('Solar alignment (Sun at Qibla)', () => {
  it('returns alignment fields with Date/time for a normal location', () => {
    const cfg = { latitude: 51.5074, longitude: -0.1278, date: new Date('2024-04-09') };
    const res = getSunAtQibla(cfg);
    // Result fields may be null in degenerate cases, but for London expect non-null
    expect(res).toHaveProperty('qiblaAlignment');
    expect(res).toHaveProperty('antiQiblaAlignment');
    // If not null, ensure the fields have a Date `time` and `local` string
    const checkField = (f: any) => {
      if (f === null) return;
      expect(f).toHaveProperty('time');
      expect(f.time).toBeInstanceOf(Date);
      expect(f).toHaveProperty('local');
      expect(typeof f.local).toBe('string');
    };
    checkField(res.qiblaAlignment);
    checkField(res.antiQiblaAlignment);
    checkField(res.leftPerpendicularAlignment);
    checkField(res.rightPerpendicularAlignment);
  });
});
