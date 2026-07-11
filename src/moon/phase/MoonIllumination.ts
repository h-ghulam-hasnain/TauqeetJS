import { getMoonPhase } from './MoonPhase.js';

/**
 * Determines the currently illuminated fraction of the Moon's disk.
 *
 * @remarks
 * A value of 0.0 represents a completely dark New Moon, and 1.0 represents a fully illuminated Full Moon.
 * This is a lightweight helper for UI elements or simple visibility checks.
 *
 * @param date - The target date to evaluate.
 * @returns The illuminated fraction as a decimal value strictly between 0.0 and 1.0.
 */
export function getMoonIllumination(date: Date): number {
  const phase = getMoonPhase(date);
  return phase.illuminatedFraction;
}
