import { isCivilLeapYear } from './HijriMonthLength.js';

/**
 * Returns the length of a Hijri year in the civil calendar (354 or 355 days).
 */
export function getCivilYearLength(year: number): number {
  return isCivilLeapYear(year) ? 355 : 354;
}

/**
 * Returns the total number of civil days from epoch to the start of the given year.
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
