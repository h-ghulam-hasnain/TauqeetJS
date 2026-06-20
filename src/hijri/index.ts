// ── Types ──────────────────────────────────────────────────────────────────
export type { HijriDate } from './types/HijriDate.js';
export { HIJRI_MONTH_NAMES } from './types/HijriDate.js';
export { HijriMethod } from './types/HijriMethod.js';
export type { HijriCalendarResult, HijriLocationOptions } from './types/HijriCalendarResult.js';

// ── Engine ─────────────────────────────────────────────────────────────────
export { HijriEngine } from './engine/HijriEngine.js';
export type { HijriEngineOptions } from './engine/HijriEngine.js';

// ── Convenience converters (inlined to avoid toolchain casing conflicts) ───
import type { HijriDate } from './types/HijriDate.js';
import type { HijriLocationOptions } from './types/HijriCalendarResult.js';
import { HijriMethod } from './types/HijriMethod.js';
import { HijriEngine } from './engine/HijriEngine.js';

/** Convert a Gregorian Date to a HijriDate using the specified method. */
export function toHijri(
  date: Date,
  method: HijriMethod = HijriMethod.CIVIL,
  options?: { location?: HijriLocationOptions }
): HijriDate {
  return new HijriEngine(method, options ?? {}).toHijri(date);
}

/** Convert a HijriDate to a Gregorian Date using the specified method. */
export function toGregorian(
  hijriDate: HijriDate,
  method: HijriMethod = HijriMethod.CIVIL,
  options?: { location?: HijriLocationOptions }
): Date {
  return new HijriEngine(method, options ?? {}).toGregorian(hijriDate);
}

// ── Calendar classes (advanced users) ──────────────────────────────────────
export { CivilCalendar } from './methods/civil/CivilCalendar.js';
export { ConjunctionCalendar } from './methods/astronomical/ConjunctionCalendar.js';
export { VisibilityCalendar } from './methods/sighting/VisibilityCalendar.js';
export { UmmAlQuraCalendar } from './methods/ummalqura/UmmAlQuraCalendar.js';

// ── Core helpers (for advanced/library use) ────────────────────────────────
export { getCivilMonthLength, isCivilLeapYear } from './core/HijriMonthLength.js';
export { getCivilYearLength } from './core/HijriYearLength.js';
export { HIJRI_EPOCH_JD } from './core/HijriEpoch.js';
