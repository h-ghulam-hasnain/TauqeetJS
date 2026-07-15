import { describe, it, expect } from 'vitest';
import { getQiblaDistance } from '../../../src/qibla/direction/distance.js';
import { MECCA } from '../../../src/qibla/constants.js';

describe('Qibla distance', () => {
  it('returns a positive distance for a non-Mecca location', () => {
    const london = { latitude: 51.5074, longitude: -0.1278 };
    const res = getQiblaDistance(london);
    expect(res).toHaveProperty('distanceKm');
    expect(typeof res.distanceKm).toBe('number');
    expect(res.distanceKm).toBeGreaterThan(0);
  });

  it('returns near zero distance when location is Mecca', () => {
    const res = getQiblaDistance({ latitude: MECCA.latitude, longitude: MECCA.longitude });
    expect(res.distanceKm).toBeLessThan(0.01);
  });
});
