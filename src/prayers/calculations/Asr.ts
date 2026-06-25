import { solveIteratively } from '../solvers/IterativeSolver.js';
import type { IterativeSolverResult } from '../solvers/IterativeSolver.js';
import { computeRefraction } from '../corrections/HorizonCorrections.js';
import { tand, atand } from '../../internal/trig.js';
import type { SolarEphemeris } from '../../internal/EphemerisService.js';

/**
 * Calculates Asr time iteratively.
 *
 * @param date The calculation date.
 * @param latitude The observer's latitude.
 * @param longitude The observer's longitude.
 * @param sf The shadow factor (1 for Shafi, 2 for Hanafi).
 * @param transitDeclination The solar declination at transit (Zuhr).
 * @param temperatureC The ambient temperature.
 * @param pressureMbar The atmospheric pressure.
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
