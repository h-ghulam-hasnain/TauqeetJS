import type { HijriDate } from '../../types/HijriDate.js';
import { ConjunctionCalendar } from '../astronomical/ConjunctionCalendar.js';
import { dateToJD, jdToDate } from '../../core/HijriEpoch.js';
import { UMM_AL_QURA_MONTH_STARTS, UMM_AL_QURA_HIJRI_OFFSET } from './data.js';

/**
 * Umm al-Qura calendar (Saudi Arabia official).
 *
 * This implementation uses the official tabular data (MONTH_STARTS) for dates
 * between 1343 AH and 1500 AH to guarantee exact alignment with the official
 * Saudi civil calendar. For dates outside this range, it falls back to the
 * astronomical conjunction calendar.
 */
export class UmmAlQuraCalendar {
  private conjunction = new ConjunctionCalendar();

  toHijri(date: Date): HijriDate {
    const jd = dateToJD(date);
    const jdn = Math.floor(jd + 0.5);
    const rjd = jdn - 2400000;

    // Binary search for the rightmost index where month_start <= rjd
    let l = 0;
    let r = UMM_AL_QURA_MONTH_STARTS.length;
    while (l < r) {
      const m = Math.floor((l + r) / 2);
      if (rjd < UMM_AL_QURA_MONTH_STARTS[m]!) {
        r = m;
      } else {
        l = m + 1;
      }
    }
    const index = l - 1;

    // Fallback if outside the pre-computed table bounds
    if (index < 0 || index >= UMM_AL_QURA_MONTH_STARTS.length - 1) {
      return this.conjunction.toHijri(date);
    }

    const months = index + UMM_AL_QURA_HIJRI_OFFSET;
    const years = Math.floor(months / 12);
    const year = years + 1;
    const month = months - (years * 12) + 1;
    const day = rjd - UMM_AL_QURA_MONTH_STARTS[index]! + 1;

    return { year, month, day };
  }

  toGregorian(hijriDate: HijriDate): Date {
    const { year, month, day } = hijriDate;
    const priorMonths = (year - 1) * 12 + month - 1;
    const index = priorMonths - UMM_AL_QURA_HIJRI_OFFSET;

    // Fallback if outside the pre-computed table bounds
    if (index < 0 || index >= UMM_AL_QURA_MONTH_STARTS.length - 1) {
      return this.conjunction.toGregorian(hijriDate);
    }

    const rjd = UMM_AL_QURA_MONTH_STARTS[index]! + day - 1;
    const jdn = rjd + 2400000;

    return jdToDate(jdn);
  }
}
