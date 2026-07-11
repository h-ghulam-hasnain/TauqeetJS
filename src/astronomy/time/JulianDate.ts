import type { JulianDateComponents, TimeArgument } from '../types/time.js';

/**
 * Converts a standard Gregorian calendar date to a Julian Day number.
 *
 * @param year - The astronomical year (e.g., 2024). Includes year 0 and negative years.
 * @param month - The month of the year (1 for January, 12 for December).
 * @param day - The fractional day of the month (e.g., 15.5 for noon on the 15th).
 * @returns The calculated Julian Day number.
 */
export function dateToJulianDay(year: number, month: number, day: number): number {
  let y = year;
  let m = month;
  if (m === 1 || m === 2) {
    y -= 1;
    m += 12;
  }

  const a = Math.trunc(y / 100);
  const b = 2 - a + Math.trunc(a / 4);
  return Math.trunc(365.25 * (y + 4716)) + Math.trunc(30.6001 * (m + 1)) + day + b - 1524.5;
}

/**
 * Converts a Julian Day number back into its Gregorian calendar components.
 *
 * @param jd - The Julian Day number.
 * @returns The resulting calendar date components (year, month, fractional day).
 */
export function julianDayToDate(jd: number): JulianDateComponents {
  const z = Math.trunc(jd + 0.5);
  const f = jd + 0.5 - z;
  const alpha = Math.trunc((z - 1867216.25) / 36524.25);
  const a = z + 1 + alpha - Math.trunc(alpha / 4);
  const b = a + 1524;
  const c = Math.trunc((b - 122.1) / 365.25);
  const d = Math.trunc(365.25 * c);
  const e = Math.trunc((b - d) / 30.6001);
  const day = b - d - Math.trunc(30.6001 * e) + f;
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;
  return { day, month, year };
}

/**
 * Computes standard time arguments used extensively in astronomical ephemeris equations.
 *
 * @param j - The base Julian Day at 0h UT.
 * @param ut - Universal Time in hours.
 * @param deltaT - Delta-T correction in seconds.
 * @returns A structured object containing centuries and millennia since the J2000.0 epoch.
 */
export function timeArguments(j: number, ut: number, deltaT: number): TimeArgument {
  const jd = j + ut / 24;
  const jde = jd + deltaT / 86400;
  const t = (jd - 2451545) / 36525;
  const te = (jde - 2451545) / 36525;
  const tau = te / 10;
  return { jd, jde, t, te, tau };
}

/**
 * Normalizes a Universal Time value to ensure it falls within 0 to 24 hours,
 * adjusting the base Julian Day accordingly.
 *
 * @param j - The base Julian Day.
 * @param ut - Universal Time in hours.
 * @returns A tuple containing the normalized Julian Day and Universal Time.
 */
export function normalizeTime(j: number, ut: number): readonly [number, number] {
  let resultJ = j;
  let resultUt = ut;
  while (resultUt < 0) {
    resultJ -= 1;
    resultUt += 24;
  }
  while (resultUt > 24) {
    resultJ += 1;
    resultUt -= 24;
  }
  return [resultJ, resultUt];
}

/**
 * Normalizes an angle representing a meridian or longitude to the range [-180, 180].
 *
 * @param angle - The angle in degrees.
 * @returns The normalized angle in degrees.
 */
export function normalizeMeridianAngle(angle: number): number {
  if (angle > 180) {
    return angle - 360;
  }
  if (angle <= -180) {
    return angle + 360;
  }
  return angle;
}

/**
 * Splits a fractional time value (e.g., hours or degrees) into its integer components.
 *
 * @param value - The fractional value to split.
 * @returns An object containing hours (or degrees), minutes, and seconds.
 */
export function asTimeParts(value: number): { hour: number; minute: number; second: number } {
  const hour = Math.trunc(value);
  const minute = Math.trunc(60 * (value - hour));
  const second = Math.round(3600 * (value - hour - minute / 60));
  return { hour, minute, second };
}
