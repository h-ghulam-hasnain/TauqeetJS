import { solveIteratively } from '../solvers/IterativeSolver.js';
import type { IterativeSolverResult } from '../solvers/IterativeSolver.js';
import { computeRefraction, computeDipAngle } from '../corrections/HorizonCorrections.js';
import type { PrayerMethodConfig } from '../types/index.js';

/**
 * Calculates Maghrib (sunset or method-based Maghrib) time.
 */
export function calculateMaghrib(
  date: Date,
  latitude: number,
  longitude: number,
  elevationMeters: number,
  temperatureC: number,
  pressureMbar: number,
  method: PrayerMethodConfig,
  sunsetResult: IterativeSolverResult | null
): IterativeSolverResult | null {
  // 1. If Maghrib is defined as minutes after Sunset (e.g. interval)
  const maghribMinutes = method.maghribMinutes;
  if (maghribMinutes !== undefined && maghribMinutes !== null) {
    if (!sunsetResult) return null;
    return {
      ...sunsetResult,
      time: new Date(sunsetResult.time.getTime() + maghribMinutes * 60000)
    };
  }

  // 2. If Maghrib is defined by a specific twilight angle
  if (method.maghribAngle !== undefined && method.maghribAngle !== null) {
    const targetZenithFn = () => 90 + method.maghribAngle!;
    const initialEstimate = 18 - (longitude / 15);
    return solveIteratively(
      date,
      latitude,
      longitude,
      'evening',
      targetZenithFn,
      initialEstimate
    );
  }

  // 3. Default: Maghrib is Sunset itself
  return sunsetResult;
}

/**
 * Helper to calculate the astronomical Sunset.
 */
export function calculateSunset(
  date: Date,
  latitude: number,
  longitude: number,
  elevationMeters: number,
  temperatureC: number,
  pressureMbar: number
): IterativeSolverResult | null {
  const dip = computeDipAngle(elevationMeters);
  const refraction = computeRefraction(0, temperatureC, pressureMbar);

  const targetZenithFn = (ephemeris: any) => {
    return 90 + refraction + (ephemeris.semidiameter / 60) - (ephemeris.horizontalParallax / 60) + dip;
  };

  const initialEstimate = 18 - (longitude / 15);

  return solveIteratively(
    date,
    latitude,
    longitude,
    'evening',
    targetZenithFn,
    initialEstimate
  );
}
