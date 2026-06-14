import { LunarEventFinder } from './LunarEventFinder.js';
import type { EventTime } from '../types/phenomena.js';

/**
 * Find the next New Moon (conjunction) after the given Julian Day.
 *
 * Core capability for Hijri calendar calculations.
 */
export function computeNextNewMoon(julianDay: number, deltaT: number): EventTime {
  const finder = new LunarEventFinder(deltaT);
  return finder.findNextNewMoon(julianDay);
}

/**
 * Find the previous New Moon (conjunction) before the given Julian Day.
 *
 * Used for calculating Hijri epoch and moon age.
 */
export function computePreviousNewMoon(julianDay: number, deltaT: number): EventTime {
  const finder = new LunarEventFinder(deltaT);
  return finder.findPreviousNewMoon(julianDay);
}

/**
 * Find the next Full Moon (opposition) after the given Julian Day.
 *
 * Optional capability; included for completeness.
 * Low maintenance cost as it reuses the same binary search infrastructure.
 */
export function computeNextFullMoon(julianDay: number, deltaT: number): EventTime {
  const finder = new LunarEventFinder(deltaT);
  return finder.findNextFullMoon(julianDay);
}

/**
 * Find the previous Full Moon (opposition) before the given Julian Day.
 *
 * Optional capability for completeness.
 */
export function computePreviousFullMoon(julianDay: number, deltaT: number): EventTime {
  const finder = new LunarEventFinder(deltaT);
  return finder.findPreviousFullMoon(julianDay);
}
