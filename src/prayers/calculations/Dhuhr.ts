import { solveIteratively, type IterativeSolverResult } from '../solvers/IterativeSolver.js';

/**
 * Calculates the exact time of Dhuhr (solar transit or true noon) iteratively.
 *
 * @remarks
 * Dhuhr occurs when the Sun reaches its highest point in the sky for the day,
 * crossing the observer's local meridian.
 *
 * @param date - The target date for calculation.
 * @param latitude - Observer's latitude in decimal degrees.
 * @param longitude - Observer's longitude in decimal degrees.
 * @returns The calculated `IterativeSolverResult` for Dhuhr.
 */
export function calculateDhuhr(
  date: Date,
  latitude: number,
  longitude: number
): IterativeSolverResult | null {
  const initialEstimate = 12 - longitude / 15;
  return solveIteratively(
    date,
    latitude,
    longitude,
    'transit',
    () => 0, // Target zenith is not used for transit
    initialEstimate
  );
}
