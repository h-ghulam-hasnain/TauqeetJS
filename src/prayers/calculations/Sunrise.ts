import { solveIteratively, type IterativeSolverResult } from '../solvers/IterativeSolver.js';
import { computeRefraction, computeDipAngle } from '../corrections/HorizonCorrections.js';
import type { SolarEphemeris } from '../../internal/ephemerisService.js';

/**
 * Calculates the exact astronomical time of sunrise iteratively.
 *
 * @remarks
 * Sunrise occurs when the upper limb of the solar disk geometrically crosses the eastern horizon,
 * adjusted for atmospheric refraction, solar semidiameter, and observer elevation (dip angle).
 *
 * @param date - The target date for calculation.
 * @param latitude - Observer's latitude in decimal degrees.
 * @param longitude - Observer's longitude in decimal degrees.
 * @param elevationMeters - Elevation above sea level in meters to account for horizon dip.
 * @param temperatureC - Ambient temperature in Celsius.
 * @param pressureMbar - Atmospheric pressure in millibars.
 * @returns The calculated `IterativeSolverResult` for sunrise, or null if the sun does not rise.
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
