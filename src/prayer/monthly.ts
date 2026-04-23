import { getPrayerTimes, PrayerConfig } from './calculate.js';
import { MonthlyPrayerRow } from './types.js';

/**
 * Calculates prayer times for an entire month.
 * @param year - The year (e.g. 2026)
 * @param month - The month (1-12)
 * @param config - Prayer configuration (location, method, etc.)
 */
export function getMonthlyPrayerTimes(
  year: number,
  month: number,
  config: Omit<PrayerConfig, 'date'>
): MonthlyPrayerRow[] {
  const results: MonthlyPrayerRow[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const times = getPrayerTimes({ ...config, date });
    
    results.push({
      ...times,
      date: date.toLocaleDateString(),
      day,
      weekday: date.toLocaleDateString('en-US', { weekday: 'long' })
    });
  }

  return results;
}
