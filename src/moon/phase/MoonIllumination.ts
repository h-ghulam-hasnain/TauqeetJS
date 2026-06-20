import { getMoonPhase } from './MoonPhase.js';

/**
 * Returns only the illuminated fraction of the moon (0.0 to 1.0).
 *
 * @param date The date for which to compute the illuminated fraction.
 * @returns A number between 0 and 1.
 */
export function getMoonIllumination(date: Date): number {
  const phase = getMoonPhase(date);
  return phase.illuminatedFraction;
}
