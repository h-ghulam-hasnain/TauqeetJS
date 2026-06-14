import type { HijriDate } from '../types/HijriDate.js';
import { getCivilMonthLength, isCivilLeapYear } from './HijriMonthLength.js';

/**
 * Add a given number of days to a civil Hijri date.
 */
export function addDays(date: HijriDate, days: number): HijriDate {
  let { year, month, day } = date;
  let remaining = days;

  while (remaining > 0) {
    const daysLeft = getCivilMonthLength(year, month) - day;
    if (remaining <= daysLeft) {
      day += remaining;
      remaining = 0;
    } else {
      remaining -= daysLeft + 1;
      day = 1;
      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
    }
  }

  while (remaining < 0) {
    if (day + remaining >= 1) {
      day += remaining;
      remaining = 0;
    } else {
      remaining += day;
      month--;
      if (month < 1) {
        month = 12;
        year--;
      }
      day = getCivilMonthLength(year, month);
    }
  }

  return { year, month, day };
}

/**
 * Returns the number of days from the start of the month to a given Hijri date.
 */
export function dayOfYear(date: HijriDate): number {
  let days = date.day - 1;
  for (let m = 1; m < date.month; m++) {
    days += getCivilMonthLength(date.year, m);
  }
  return days;
}

export { getCivilMonthLength, isCivilLeapYear };
