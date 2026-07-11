import { LunarEventFinder } from './LunarEventFinder.js';
import type { EventTime } from '../types/phenomena.js';

/**
 * Locates the exact astronomical time of the next New Moon (conjunction).
 *
 * @remarks
 * This is a core capability heavily utilized by Hijri calendar calculation methods.
 *
 * @param julianDay - The starting Julian Day.
 * @param deltaT - The Delta-T correction factor in seconds.
 * @returns The precise `EventTime` representing the next New Moon.
 */
export function computeNextNewMoon(julianDay: number, deltaT: number): EventTime {
  const finder = new LunarEventFinder(deltaT);
  return finder.findNextNewMoon(julianDay);
}

/**
 * Locates the exact astronomical time of the previous New Moon (conjunction).
 *
 * @remarks
 * Primarily used to compute the current age of the Moon.
 *
 * @param julianDay - The starting Julian Day.
 * @param deltaT - The Delta-T correction factor in seconds.
 * @returns The precise `EventTime` representing the previous New Moon.
 */
export function computePreviousNewMoon(julianDay: number, deltaT: number): EventTime {
  const finder = new LunarEventFinder(deltaT);
  return finder.findPreviousNewMoon(julianDay);
}

/**
 * Locates the exact astronomical time of the next Full Moon (opposition).
 *
 * @param julianDay - The starting Julian Day.
 * @param deltaT - The Delta-T correction factor in seconds.
 * @returns The precise `EventTime` representing the next Full Moon.
 */
export function computeNextFullMoon(julianDay: number, deltaT: number): EventTime {
  const finder = new LunarEventFinder(deltaT);
  return finder.findNextFullMoon(julianDay);
}

/**
 * Locates the exact astronomical time of the previous Full Moon (opposition).
 *
 * @param julianDay - The starting Julian Day.
 * @param deltaT - The Delta-T correction factor in seconds.
 * @returns The precise `EventTime` representing the previous Full Moon.
 */
export function computePreviousFullMoon(julianDay: number, deltaT: number): EventTime {
  const finder = new LunarEventFinder(deltaT);
  return finder.findPreviousFullMoon(julianDay);
}
