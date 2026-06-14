import { solveIteratively, type IterativeSolverResult } from '../solvers/IterativeSolver.js';

/**
 * Calculates Dhuhr (solar transit) time iteratively.
 */
export function calculateDhuhr(
  date: Date,
  latitude: number,
  longitude: number
): IterativeSolverResult | null {
  const initialEstimate = 12 - (longitude / 15);
  return solveIteratively(
    date,
    latitude,
    longitude,
    'transit',
    () => 0, // Target zenith is not used for transit
    initialEstimate
  );
}
