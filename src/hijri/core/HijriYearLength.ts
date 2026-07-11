import { isCivilLeapYear } from './HijriMonthLength.js';

/**
 * Returns the total number of days in a given civil Hijri year.
 *
 * @param year - The Hijri year (AH) to evaluate.
 * @returns 355 for leap years, 354 for standard years.
 */
export function getCivilYearLength(year: number): number {
  return isCivilLeapYear(year) ? 355 : 354;
}

/**
 * Calculates the total number of civil days elapsed since the Hijri epoch
 * up to the start of the specified year.
 *
 * @param year - The target Hijri year (AH).
 * @returns The total number of days before the start of the given year.
 */
export function daysBeforeYear(year: number): number {
  const y = year - 1;
  // Each 30-year cycle has 30*354 + 11 = 10631 days
  const cycles = Math.floor(y / 30);
  const rem = y % 30;
  let days = cycles * 10631;
  for (let i = 1; i <= rem; i++) {
    days += getCivilYearLength(i);
  }
  return days;
}
