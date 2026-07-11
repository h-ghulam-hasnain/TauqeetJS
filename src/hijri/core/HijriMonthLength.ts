/**
 * Civil (tabular) Hijri month lengths.
 *
 * Months alternate 30/29 days. Month 12 has 30 days in a leap year, 29 otherwise.
 * Index 0 = Muharram (month 1).
 */
const BASE_MONTH_LENGTHS = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29] as const;

/**
 * Returns the number of days in a specific civil Hijri month.
 *
 * @remarks
 * Months in the civil calendar strictly alternate between 30 and 29 days.
 * During leap years, the 12th month (Dhu al-Hijjah) has 30 days instead of 29.
 *
 * @param year - The Hijri year (AH).
 * @param month - The Hijri month (1-12).
 * @returns The number of days in the specified month.
 */
export function getCivilMonthLength(year: number, month: number): number {
  if (month === 12 && isCivilLeapYear(year)) return 30;
  return BASE_MONTH_LENGTHS[month - 1]!;
}

/**
 * Determines whether a given Hijri year is a leap year in the 30-year civil cycle.
 *
 * @remarks
 * In the standard civil cycle, 11 leap years exist per 30-year span.
 * The leap years are numbers 2, 5, 7, 10, 13, 15, 18, 21, 24, 26, and 29.
 *
 * @param year - The Hijri year (AH) to evaluate.
 * @returns `true` if the year is a civil leap year; otherwise `false`.
 */
export function isCivilLeapYear(year: number): boolean {
  const LEAP_REMAINDERS = new Set([2, 5, 7, 10, 13, 15, 18, 21, 24, 26, 29]);
  return LEAP_REMAINDERS.has(((year - 1) % 30) + 1);
}
