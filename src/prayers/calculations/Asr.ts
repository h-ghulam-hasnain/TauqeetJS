import { solveIteratively } from '../solvers/IterativeSolver.js';
import type { IterativeSolverResult } from '../solvers/IterativeSolver.js';
import { computeRefraction } from '../corrections/HorizonCorrections.js';
import { tand, atand } from '../../internal/trig.js';
import type { SolarEphemeris } from '../../internal/EphemerisService.js';

/**
 * Calculates the exact time for the Asr prayer using iterative root-finding.
 *
 * @remarks
 * The time of Asr is determined by the shadow length of an object. The target shadow length
 * is the shadow at noon (transit) plus the object's height multiplied by the shadow factor
 * (1 for Shafi/Maliki/Hanbali/Jaafari, and 2 for Hanafi).
 *
 * @param date - The target date for calculation.
 * @param latitude - Observer's latitude in decimal degrees.
 * @param longitude - Observer's longitude in decimal degrees.
 * @param sf - The shadow factor multiplier (usually 1 or 2).
 * @param transitDeclination - The solar declination at solar transit.
 * @param transitSemidiameter - The solar semidiameter at solar transit in arcminutes.
 * @param temperatureC - Ambient temperature for atmospheric refraction adjustment.
 * @param pressureMbar - Atmospheric pressure for refraction adjustment.
 * @returns The calculated `IterativeSolverResult` for Asr, or null if it cannot converge.
 */
export function calculateAsr(
  date: Date,
  latitude: number,
  longitude: number,
  sf: number,
  transitDeclination: number,
  transitSemidiameter: number,
  temperatureC: number,
  pressureMbar: number
): IterativeSolverResult | null {
  // 1. True noon zenith (geometric)
  const zZuhr = Math.abs(latitude - transitDeclination);

  // 2. Transit semidiameter and refraction -> visual/noon baseline
  const sdZuhr = transitSemidiameter / 60; // semidiameter (arcminutes) -> degrees
  const refrZuhr = computeRefraction(90 - zZuhr, temperatureC, pressureMbar);
  const zZuhrVisual = zZuhr - refrZuhr - sdZuhr;

  // Target zenith function uses the probe ephemeris so SD and refraction are time-dependent
  const targetZenithFn = (ephemeris: SolarEphemeris) => {
    // 3. Compute Asr visual zenith from visual-noon baseline
    // Old implementation used: zAsrVisual = atan2d(tand(zZuhrVisual) + factor, 1)
    // which is equivalent to arctan(tan(zZuhrVisual) + sf)
    const zAsrVisual = atand(tand(zZuhrVisual) + sf);

    // 4. Recompute apparent corrections at Asr probe time using current ephemeris SD
    const refrAsr = computeRefraction(90 - zAsrVisual, temperatureC, pressureMbar);
    const sdAsr = (ephemeris?.semidiameter ?? 0) / 60;

    // 5. Observed zenith target
    return zAsrVisual + refrAsr + sdAsr;
  };

  // Initial estimate: 15h local time (approx 3 PM local time)
  const initialEstimate = 15 - longitude / 15;

  return solveIteratively(date, latitude, longitude, 'evening', targetZenithFn, initialEstimate);
}
