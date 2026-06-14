import { solveIteratively } from '../solvers/IterativeSolver.js';
import type { IterativeSolverResult } from '../solvers/IterativeSolver.js';
import type { PrayerMethodConfig } from '../types/index.js';

/**
 * Calculates Isha time iteratively.
 */
export function calculateIsha(
  date: Date,
  latitude: number,
  longitude: number,
  method: PrayerMethodConfig,
  maghribResult: IterativeSolverResult | null
): IterativeSolverResult | null {
  const ishaMinutes = method.ishaMinutes;
  if (ishaMinutes !== undefined && ishaMinutes !== null) {
    if (!maghribResult) return null;
    return {
      ...maghribResult,
      time: new Date(maghribResult.time.getTime() + ishaMinutes * 60000)
    };
  }

  if (method.ishaAngle !== undefined && method.ishaAngle !== null) {
    const targetZenithFn = () => 90 + method.ishaAngle!;
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

  return null;
}
