import { SolarEphemeris } from '../sun/SolarPosition.js';
import { LunarEphemeris } from './LunarPosition.js';
import { LunarPhaseEngine } from './LunarPhaseEngine.js';

/**
 * Compute instantaneous lunar phase data.
 *
 * Returns only the lightweight, cache-efficient quantities:
 * - elongation: Sun-Moon angular distance (0-360°)
 * - illuminatedFraction: fraction of Moon's disk illuminated (0-1)
 *
 * Note: Moon age and event-based queries (next New Moon, etc.)
 * are separate and require explicit event searches.
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
