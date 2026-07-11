import { solveIteratively } from '../solvers/IterativeSolver.js';
import type { IterativeSolverResult } from '../solvers/IterativeSolver.js';
import type { PrayerMethodConfig } from '../types/index.js';

/**
 * Calculates the exact time of Isha (nightfall) iteratively or by applying a fixed offset.
 *
 * @remarks
 * Isha occurs when evening twilight ends. Some calculation methods use a specific angle
 * below the western horizon, while others (like Umm al-Qura) define Isha as a fixed number
 * of minutes after Maghrib.
 *
 * @param date - The target date for calculation.
 * @param latitude - Observer's latitude in decimal degrees.
 * @param longitude - Observer's longitude in decimal degrees.
 * @param method - The prayer method configuration specifying the Isha angle or fixed minutes.
 * @param maghribResult - The previously calculated Maghrib result (required if using a fixed offset).
 * @returns The calculated `IterativeSolverResult` for Isha, or null if conditions are not met.
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
      time: new Date(maghribResult.time.getTime() + ishaMinutes * 60000),
    };
  }

  if (method.ishaAngle !== undefined && method.ishaAngle !== null) {
    const targetZenithFn = () => 90 + method.ishaAngle!;
    const initialEstimate = 18 - longitude / 15;
    return solveIteratively(date, latitude, longitude, 'evening', targetZenithFn, initialEstimate);
  }

  return null;
}
