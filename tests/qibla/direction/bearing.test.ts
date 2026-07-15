import { describe, it, expect } from 'vitest';
import { getQiblaDirection } from '../../../src/qibla/direction/bearing.js';
import { MECCA } from '../../../src/qibla/constants.js';

describe('Qibla utilities', () => {
  it('returns a bearing and positive distance for a non-Mecca location', () => {
    const london = { latitude: 51.5074, longitude: -0.1278 };
    const res = getQiblaDirection(london);
    expect(res).toHaveProperty('bearing');
    expect(res).toHaveProperty('distanceKm');
    expect(typeof res.distanceKm).toBe('number');
    expect(res.distanceKm).toBeGreaterThan(0);
    if (res.bearing !== null) {
      expect(typeof res.bearing).toBe('number');
      expect(res.bearing).toBeGreaterThanOrEqual(0);
      expect(res.bearing).toBeLessThan(360);
    }
  });

  it('returns null bearing when location is Mecca (within tolerance)', () => {
    const res = getQiblaDirection({ latitude: MECCA.latitude, longitude: MECCA.longitude });
    // When within ~1m of the Kaaba the library returns `bearing: null`
    expect(res.distanceKm).toBeLessThan(0.01);
    expect(res.bearing).toBeNull();
  });
});
