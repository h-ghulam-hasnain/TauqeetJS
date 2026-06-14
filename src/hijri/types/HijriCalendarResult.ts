import type { HijriDate } from './HijriDate.js';

/** Public result of a Hijri conversion. */
export interface HijriCalendarResult {
  hijriDate: HijriDate;
  /** ISO string of the corresponding Gregorian date (UTC midnight). */
  gregorianDate: string;
  /** The method used for this conversion. */
  method: string;
}

/** Options accepted by methods that need a location (e.g. VISIBILITY). */
export interface HijriLocationOptions {
  latitude: number;
  longitude: number;
  elevation?: number;
}
