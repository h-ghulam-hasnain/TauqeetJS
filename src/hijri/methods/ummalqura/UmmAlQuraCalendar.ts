import type { HijriDate } from '../../types/HijriDate.js';
import { ConjunctionCalendar } from '../astronomical/ConjunctionCalendar.js';

/**
 * Umm al-Qura calendar (Saudi Arabia official).
 *
 * This calendar is conjunction-based and uses Mecca (21.4225°N, 39.8262°E)
 * as the reference location. The month begins the day *after* the astronomical
 * new moon if sunset in Mecca precedes the conjunction; otherwise the month
 * begins two days after.
 *
 * This implementation approximates Umm al-Qura using the conjunction calendar
 * with the Mecca convention. For a fully authoritative implementation, a
 * pre-computed table would be required.
 */
export class UmmAlQuraCalendar {
  private conjunction = new ConjunctionCalendar();

  toHijri(date: Date): HijriDate {
    // The Umm al-Qura calendar closely tracks conjunction; delegate to it.
    return this.conjunction.toHijri(date);
  }

  toGregorian(hijriDate: HijriDate): Date {
    return this.conjunction.toGregorian(hijriDate);
  }
}
