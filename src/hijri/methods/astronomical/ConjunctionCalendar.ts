import type { HijriDate } from '../../types/HijriDate.js';
import { getPreviousNewMoon, getNextNewMoon } from '../../../moon/index.js';
import { dateToJD, jdToDate, HIJRI_EPOCH_JD } from '../../core/HijriEpoch.js';

/**
 * Mean synodic month length (days).
 * IAU value: 29.530588861 days.
 */
const MEAN_SYNODIC_MONTH = 29.530588861;

/**
 * The Julian Day of the new moon that began the Islamic epoch.
 * 15 July 622 CE (Julian calendar) at ~19:38 UTC.
 * JD ≈ 1948437.328  (commonly cited epoch new moon)
 */
const EPOCH_NEW_MOON_JD = 1948437.328;

/**
 * Conjunction-based Hijri calendar.
 *
 * Rule: The Hijri month starts on the calendar day (UTC) in which the new moon
 * occurs (if the conjunction happens before 00:00 UTC of the *next* day, that
 * day is Hijri 1). Islamic days technically begin at sunset, but this calendar
 * uses UTC midnight as the reference for simplicity and wide compatibility.
 */
export class ConjunctionCalendar {
  /**
   * Convert a Gregorian Date to a Hijri date using the conjunction method.
   */
  toHijri(date: Date): HijriDate {
    // Find the most recent new moon before or on this date
    const prevNM = getPreviousNewMoon(date);
    const prevNMJD = dateToJD(prevNM);

    // Count lunations since the epoch new moon
    const lunations = Math.round((prevNMJD - EPOCH_NEW_MOON_JD) / MEAN_SYNODIC_MONTH);

    // Hijri year and month from lunation count
    // Muharram 1 AH = lunation 0
    const totalMonths = lunations + 1; // 1-indexed
    const year = Math.floor((totalMonths - 1) / 12) + 1;
    const month = ((totalMonths - 1) % 12) + 1;

    // Day = days elapsed since this month's new moon + 1
    const dateJD = Math.floor(dateToJD(date));
    const monthStartJD = Math.floor(prevNMJD);
    const day = dateJD - monthStartJD + 1;

    return { year, month, day: Math.max(1, day) };
  }

  /**
   * Convert a Hijri date to a Gregorian Date using the conjunction method.
   *
   * Strategy: approximate the JD of that month's new moon, then get the
   * exact new moon from the Moon module.
   */
  toGregorian(hijriDate: HijriDate): Date {
    const { year, month, day } = hijriDate;

    // Total lunations since epoch new moon for this Hijri month
    const lunations = (year - 1) * 12 + (month - 1);

    // Approximate JD of this month's new moon
    const approxNMJD = EPOCH_NEW_MOON_JD + lunations * MEAN_SYNODIC_MONTH;
    const approxDate = jdToDate(approxNMJD);

    // Get the exact new moon near this approximation
    const exactNM = getPreviousNewMoon(new Date(approxDate.getTime() + 15 * 24 * 3600000));
    const exactNMJD = Math.floor(dateToJD(exactNM));

    // The Gregorian date = month start + (day - 1)
    const targetJD = exactNMJD + day - 1;
    return jdToDate(targetJD);
  }
}
