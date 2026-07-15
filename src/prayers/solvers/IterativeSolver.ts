import { ephemerisService } from '../../internal/ephemerisService.js';
import type { SolarEphemeris } from '../../internal/ephemerisService.js';
import { solveHourAngle } from './HourAngleSolver.js';
import { dateToJulianDay } from '../../astronomy/time/JulianDate.js';

export interface IterativeSolverResult {
  readonly time: Date;
  readonly declination: number;
  readonly equationOfTime: number;
  readonly semidiameter: number;
  readonly horizontalParallax: number;
  readonly iterations: number;
}

/**
 * Helper to convert UTC hours to a Date object on the target day.
 * NOTE: When utcHours is negative or > 24, the Date wraps to adjacent days.
 * The solver uses this only for ephemeris lookup — the anchor JD is passed
 * separately to getSolarEphemeris so cache always stays on the prayer day.
 */
export function toDate(baseDate: Date, utcHours: number): Date {
  const d = new Date(
    Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate(), 0, 0, 0)
  );
  if (isNaN(utcHours)) return new Date(NaN);

  // Convert hours to milliseconds and add directly to midnight of the base day.
  // This preserves fractional seconds precisely and keeps the date correct.
  d.setTime(d.getTime() + utcHours * 3600 * 1000);
  return d;
}

/**
 * General iterative solver to find the precise UTC time of a solar event.
 *
 * @param baseDate            The target prayer date.
 * @param latitude            Observer's latitude in degrees.
 * @param longitude           Observer's longitude in degrees.
 * @param side                'morning' | 'evening' | 'transit'
 * @param targetZenithFn      Returns the target zenith angle given current ephemeris.
 * @param initialEstimateHours Starting UTC hour estimate.
 * @param options             Solver tuning: maxIterations, convergenceSeconds.
 */
export function solveIteratively(
  baseDate: Date,
  latitude: number,
  longitude: number,
  side: 'morning' | 'evening' | 'transit',
  targetZenithFn: (ephemeris: SolarEphemeris) => number,
  initialEstimateHours: number,
  options: { maxIterations: number; convergenceSeconds: number } = {
    maxIterations: 15,
    convergenceSeconds: 0.1,
  }
): IterativeSolverResult | null {
  // Compute the anchor Julian Day once for the entire solver run.
  // This ensures all ephemeris cache lookups stay on the prayer day,
  // even if intermediate hour estimates drift negative or past midnight.
  const baseDateJd = dateToJulianDay(
    baseDate.getUTCFullYear(),
    baseDate.getUTCMonth() + 1,
    baseDate.getUTCDate()
  );

  let currentUtcHours = initialEstimateHours;
  let prevUtcHours = currentUtcHours;
  let lastEphemeris: SolarEphemeris | null = null;
  let iterations = 0;

  for (let i = 0; i < options.maxIterations; i++) {
    iterations++;

    // Build a Date for this probe hour. May wrap to prev/next day — that is OK
    // because we pass baseDateJd separately to anchor sampling to the prayer day.
    const checkDate = toDate(baseDate, currentUtcHours);
    const ephemeris = ephemerisService.getSolarEphemeris(checkDate, baseDateJd);
    lastEphemeris = ephemeris;

    const transitHours = 12 - longitude / 15 - ephemeris.equationOfTime / 60;

    if (side === 'transit') {
      currentUtcHours = transitHours;
    } else {
      const targetZenith = targetZenithFn(ephemeris);
      const hourAngleDeg = solveHourAngle(targetZenith, latitude, ephemeris.declination);

      if (hourAngleDeg === null) {
        return null; // Sun never reaches this zenith (polar night/day or continuous twilight)
      }

      const H = hourAngleDeg / 15;
      currentUtcHours = side === 'morning' ? transitHours - H : transitHours + H;
    }

    // Convergence check
    const diffSeconds = Math.abs(currentUtcHours - prevUtcHours) * 3600;
    if (diffSeconds < options.convergenceSeconds) {
      break;
    }
    prevUtcHours = currentUtcHours;
  }

  if (!lastEphemeris) {
    return null;
  }

  return {
    time: toDate(baseDate, currentUtcHours),
    declination: lastEphemeris.declination,
    equationOfTime: lastEphemeris.equationOfTime,
    semidiameter: lastEphemeris.semidiameter,
    horizontalParallax: lastEphemeris.horizontalParallax,
    iterations,
  };
}
