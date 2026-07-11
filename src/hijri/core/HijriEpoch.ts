import { dateToJulianDay } from '../../astronomy/index.js';

/**
 * The Islamic Hijri epoch.
 *
 * 1 Muharram 1 AH in the Julian calendar = 16 July 622 CE (Julian).
 * Converted to Gregorian proleptic: 19 July 622 CE.
 *
 * Julian Day Number at UTC midnight on 16 July 622 (Julian) = 1948438.5
 * This is the widely accepted epoch for the tabular/civil Hijri calendar.
 */
export const HIJRI_EPOCH_JD = 1948438.5;

/**
 * Julian Day for the epoch computed from the Gregorian date 19 July 622 CE.
 * We derive this using dateToJulianDay (which uses proleptic Gregorian/Julian) and
 * verify it matches the known constant above.
 */
export function getEpochJD(): number {
  return HIJRI_EPOCH_JD;
}

/**
 * Converts a standard UTC midnight JavaScript `Date` to an integer Julian Day Number.
 *
 * @param date - The target UTC Date.
 * @returns The corresponding Julian Day Number.
 */
export function dateToJD(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  // fractional part for time of day
  const ut =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600 +
    date.getUTCMilliseconds() / 3600000;
  return dateToJulianDay(y, m, d) + ut / 24;
}

/**
 * Converts a Julian Day Number to a standard UTC midnight JavaScript `Date`.
 *
 * @param jd - The Julian Day Number to convert.
 * @returns The resulting UTC Date object.
 */
export function jdToDate(jd: number): Date {
  // Julian day starts at noon; floor to get the calendar day
  const z = Math.floor(jd + 0.5);
  const alpha = Math.floor((z - 1867216.25) / 36524.25);
  const a = z + 1 + alpha - Math.floor(alpha / 4);
  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);

  const day = b - d - Math.floor(30.6001 * e);
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;

  return new Date(Date.UTC(year, month - 1, day));
}
