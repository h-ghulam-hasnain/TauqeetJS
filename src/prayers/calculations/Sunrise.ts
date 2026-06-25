import { solveIteratively, type IterativeSolverResult } from '../solvers/IterativeSolver.js';
import { computeRefraction, computeDipAngle } from '../corrections/HorizonCorrections.js';
import type { SolarEphemeris } from '../../internal/EphemerisService.js';

/**
 * Calculates Sunrise time iteratively.
 */
export function calculateSunrise(
  date: Date,
  latitude: number,
  longitude: number,
  elevationMeters: number,
  temperatureC: number,
  pressureMbar: number
): IterativeSolverResult | null {
  const dip = computeDipAngle(elevationMeters);
  const refraction = computeRefraction(0, temperatureC, pressureMbar);

  const targetZenithFn = (ephemeris: SolarEphemeris) => {
    return 90 + refraction + ephemeris.semidiameter / 60 - ephemeris.horizontalParallax / 60 + dip;
  };

  // Initial estimate: 6 hours before local noon
  const initialEstimate = 6 - longitude / 15;

  return solveIteratively(date, latitude, longitude, 'morning', targetZenithFn, initialEstimate);
}
