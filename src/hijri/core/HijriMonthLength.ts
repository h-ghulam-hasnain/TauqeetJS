/**
 * Civil (tabular) Hijri month lengths.
 *
 * Months alternate 30/29 days. Month 12 has 30 days in a leap year, 29 otherwise.
 * Index 0 = Muharram (month 1).
 */
const BASE_MONTH_LENGTHS = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29] as const;

/**
 * Returns the length of a given Hijri month in the civil calendar.
 *
 * @param year  Hijri year (AH)
 * @param month Hijri month (1–12)
 */
export function getCivilMonthLength(year: number, month: number): number {
  if (month === 12 && isCivilLeapYear(year)) return 30;
  return BASE_MONTH_LENGTHS[month - 1]!;
}

/**
 * Returns true when the given Hijri year is a leap year in the 30-year civil cycle.
 *
 * In the 30-year cycle, leap years are: 2,5,7,10,13,15,18,21,24,26,29
 * (i.e. remainder of year % 30 is in that set).
 */
export function isCivilLeapYear(year: number): boolean {
  const LEAP_REMAINDERS = new Set([2, 5, 7, 10, 13, 15, 18, 21, 24, 26, 29]);
  return LEAP_REMAINDERS.has(((year - 1) % 30) + 1);
}
