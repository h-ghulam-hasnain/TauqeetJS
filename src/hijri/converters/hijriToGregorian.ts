import type { HijriDate } from '../types/HijriDate.js';
import type { HijriLocationOptions } from '../types/HijriCalendarResult.js';
import { HijriMethod } from '../types/HijriMethod.js';
import { HijriEngine } from '../engine/HijriEngine.js';

/**
 * Convert a HijriDate to a Gregorian Date using the specified method.
 *
 * @param hijriDate The Hijri date to convert.
 * @param method    The calendar rule to apply (default: CIVIL).
 * @param options   Optional location for visibility-based method.
 */
export function toGregorian(
  hijriDate: HijriDate,
  method: HijriMethod = HijriMethod.CIVIL,
  options?: { location?: HijriLocationOptions }
): Date {
  return new HijriEngine(method, options ?? {}).toGregorian(hijriDate);
}
