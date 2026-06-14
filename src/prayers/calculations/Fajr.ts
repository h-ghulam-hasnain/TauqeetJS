import { solveIteratively } from '../solvers/IterativeSolver.js';
import type { IterativeSolverResult } from '../solvers/IterativeSolver.js';
import type { PrayerMethodConfig } from '../types/index.js';

/**
 * Calculates Fajr time iteratively using the specified twilight angle.
 */
export function calculateFajr(
  date: Date,
  latitude: number,
  longitude: number,
  method: PrayerMethodConfig
): IterativeSolverResult | null {
  const targetZenithFn = () => 90 + method.fajrAngle;
  const initialEstimate = 6 - (longitude / 15);

  return solveIteratively(
    date,
    latitude,
    longitude,
    'morning',
    targetZenithFn,
    initialEstimate
  );
}
