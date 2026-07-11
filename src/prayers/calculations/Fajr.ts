import { solveIteratively } from '../solvers/IterativeSolver.js';
import type { IterativeSolverResult } from '../solvers/IterativeSolver.js';
import type { PrayerMethodConfig } from '../types/index.js';

/**
 * Calculates the exact time of Fajr (dawn) iteratively based on a specified twilight angle.
 *
 * @remarks
 * Fajr time corresponds to the beginning of morning twilight, evaluated
 * when the sun reaches a specific angle below the eastern horizon.
 *
 * @param date - The target date for calculation.
 * @param latitude - Observer's latitude in decimal degrees.
 * @param longitude - Observer's longitude in decimal degrees.
 * @param method - The prayer method configuration specifying the Fajr twilight angle.
 * @returns The calculated `IterativeSolverResult` for Fajr, or null if the sun never reaches the specified angle (e.g., during polar summer).
 */
export function calculateFajr(
  date: Date,
  latitude: number,
  longitude: number,
  method: PrayerMethodConfig
): IterativeSolverResult | null {
  const targetZenithFn = () => 90 + method.fajrAngle;
  const initialEstimate = 6 - longitude / 15;

  return solveIteratively(date, latitude, longitude, 'morning', targetZenithFn, initialEstimate);
}
