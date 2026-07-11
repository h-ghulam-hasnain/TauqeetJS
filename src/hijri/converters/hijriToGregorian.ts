import type { HijriDate } from '../types/HijriDate.js';
import type { HijriLocationOptions } from '../types/HijriCalendarResult.js';
import { HijriMethod } from '../types/HijriMethod.js';
import { HijriEngine } from '../engine/HijriEngine.js';

/**
 * Converts a structured `HijriDate` back into a standard Gregorian `Date`.
 *
 * @remarks
 * Uses the specified calculation method to reverse-engineer the exact Gregorian date.
 * Acts as a convenient shorthand for `HijriEngine.toGregorian`.
 *
 * @param hijriDate - The structured Hijri date to convert.
 * @param method - The calculation method to apply (defaults to CIVIL).
 * @param options - Optional parameters, such as location required for visibility-based methods.
 * @returns The resulting Gregorian Date object.
 */
export function toGregorian(
  hijriDate: HijriDate,
  method: HijriMethod = HijriMethod.CIVIL,
  options?: { location?: HijriLocationOptions }
): Date {
  return new HijriEngine(method, options ?? {}).toGregorian(hijriDate);
}
