import type { HijriDate } from '../types/HijriDate.js';
import type { HijriLocationOptions } from '../types/HijriCalendarResult.js';
import { HijriMethod } from '../types/HijriMethod.js';
import { HijriEngine } from '../engine/HijriEngine.js';

/**
 * Convert a Gregorian Date to a HijriDate using the specified method.
 *
 * @param date     The Gregorian date to convert.
 * @param method   The calendar rule to apply (default: CIVIL).
 * @param options  Optional location for visibility-based method.
 */
export function toHijri(
  date: Date,
  method: HijriMethod = HijriMethod.CIVIL,
  options?: { location?: HijriLocationOptions },
): HijriDate {
  return new HijriEngine(method, options ?? {}).toHijri(date);
}
