import { getPrayerTimes, PrayerConfig } from './calculate.js';
import { MonthlyPrayerRow } from './types.js';

/**
 * Calculates prayer times for a specific date range (max 30 days).
 * @param startDate - Start date
 * @param endDate - End date
 * @param config - Prayer configuration
 */
export function getPrayerTimesRange(
  startDate: Date,
  endDate: Date,
  config: Omit<PrayerConfig, 'date'>
): MonthlyPrayerRow[] {
  const results: MonthlyPrayerRow[] = [];
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 31) {
    throw new Error('Date range cannot exceed 31 days.');
  }

  const current = new Date(startDate);
  while (current <= endDate) {
    const date = new Date(current);
    const times = getPrayerTimes({ ...config, date });

    results.push({
      ...times,
      date: date.toLocaleDateString(),
      day: date.getDate(),
      weekday: date.toLocaleDateString('en-US', { weekday: 'long' })
    });

    current.setDate(current.getDate() + 1);
  }

  return results;
}
