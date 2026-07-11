import type { HijriDate } from '../types/HijriDate.js';
import type { HijriLocationOptions } from '../types/HijriCalendarResult.js';
import { HijriMethod } from '../types/HijriMethod.js';
import { HijriEngine } from '../engine/HijriEngine.js';

/**
 * Converts a standard Gregorian `Date` into a structured `HijriDate`.
 *
 * @remarks
 * This function acts as a convenient shorthand for instantiating the `HijriEngine`
 * directly. It supports multiple calendar methods (e.g., Civil, Umm al-Qura).
 *
 * @param date - The Gregorian Date object to convert.
 * @param method - The calculation method to apply (defaults to CIVIL).
 * @param options - Optional parameters, such as location required for visibility-based methods.
 * @returns The resulting date in the Hijri calendar.
 */
export function toHijri(
  date: Date,
  method: HijriMethod = HijriMethod.CIVIL,
  options?: { location?: HijriLocationOptions }
): HijriDate {
  return new HijriEngine(method, options ?? {}).toHijri(date);
}
