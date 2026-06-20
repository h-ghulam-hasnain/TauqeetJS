import type { HijriDate } from '../../types/HijriDate.js';
import { HIJRI_EPOCH_JD, dateToJD, jdToDate } from '../../core/HijriEpoch.js';
import { getCivilMonthLength } from '../../core/HijriMonthLength.js';
import { getCivilYearLength, daysBeforeYear } from '../../core/HijriYearLength.js';

/**
 * Civil (tabular) Hijri calendar.
 *
 * Uses a pure arithmetic 30-year cycle with no astronomy.
 * Accurate to within 1–2 days of the actual crescent sighting calendar.
 */
export class CivilCalendar {
  /**
   * Convert a Gregorian Date to a civil Hijri date.
   */
  toHijri(date: Date): HijriDate {
    // Days since the Hijri epoch (floor for whole-day count)
    const jd = Math.floor(dateToJD(date) - HIJRI_EPOCH_JD);

    // Determine Hijri year
    // Each 30-year cycle = 10631 days
    const cycle = Math.floor(jd / 10631);
    let year = cycle * 30 + 1;
    let remaining = jd - cycle * 10631;

    while (remaining >= getCivilYearLength(year)) {
      remaining -= getCivilYearLength(year);
      year++;
    }

    // Determine Hijri month
    let month = 1;
    while (remaining >= getCivilMonthLength(year, month)) {
      remaining -= getCivilMonthLength(year, month);
      month++;
    }

    return { year, month, day: remaining + 1 };
  }

  /**
   * Convert a civil Hijri date to a Gregorian Date (UTC midnight).
   */
  toGregorian(hijriDate: HijriDate): Date {
    const { year, month, day } = hijriDate;

    // Days from epoch to start of this year
    let daysSinceEpoch = daysBeforeYear(year);

    // Add days for completed months
    for (let m = 1; m < month; m++) {
      daysSinceEpoch += getCivilMonthLength(year, m);
    }

    // Add day offset (day 1 = day 0 since epoch)
    daysSinceEpoch += day - 1;

    const jd = HIJRI_EPOCH_JD + daysSinceEpoch;
    return jdToDate(jd);
  }
}
