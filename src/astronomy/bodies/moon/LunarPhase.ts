import { SolarEphemeris } from '../sun/SolarPosition.js';
import { LunarEphemeris } from './LunarPosition.js';
import { LunarPhaseEngine } from './LunarPhaseEngine.js';

/**
 * Computes instantaneous lunar phase data.
 *
 * @remarks
 * This function returns lightweight, cache-efficient quantities including elongation
 * (Sun-Moon angular distance) and the illuminated fraction of the Moon's disk.
 * It does not search for specific lunar events (like New Moon).
 *
 * @param j - The Julian Day.
 * @param ut - Universal Time in hours.
 * @param deltaT - The Delta-T correction factor in seconds.
 * @returns An object containing the calculated elongation and illuminated fraction.
 */
export function computeLunarPhase(
  j: number,
  ut: number,
  deltaT: number
): {
  readonly elongation: number;
  readonly illuminatedFraction: number;
} {
  const solarEngine = new SolarEphemeris(j, ut, deltaT);
  const lunarEngine = new LunarEphemeris(j, ut, deltaT);
  const phaseEngine = new LunarPhaseEngine(solarEngine, lunarEngine);

  return {
    elongation: phaseEngine.elongation,
    illuminatedFraction: phaseEngine.illuminatedFraction,
  };
}
