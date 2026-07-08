import { describe, it, expect } from 'vitest';
import { computeEarthHeliocentricState } from '../../src/astronomy/theories/vsop87/vsop87.js';
import { normalizeDegrees } from '../../src/internal/angles.js';

describe('VSOP87D Earth Heliocentric Coordinates Validation', () => {
  it('should match Meeus Chapter 25 Example 25.a (1992 Oct 13.0 TD)', () => {
    // JD = 2448908.5
    // te (Julian centuries) = -0.072183436
    // tau (Julian millennia) = te / 10 = -0.0072183436
    const tau = -0.0072183436;

    const state = computeEarthHeliocentricState(tau);

    // Convert coordinates to degrees
    const L_deg = normalizeDegrees((state.longitude * 180) / Math.PI);
    const B_deg = (state.latitude * 180) / Math.PI;

    // Expected values from VSOP87D full theory for Earth:
    // L = 19.907297 degrees (referred to FK5)
    // B = -0.000179 degrees
    // R = 0.99760853 AU
    expect(L_deg).toBeCloseTo(19.907297, 4);
    expect(B_deg).toBeCloseTo(-0.000179, 4);
    expect(state.radius).toBeCloseTo(0.99760853, 6);
  });
});
