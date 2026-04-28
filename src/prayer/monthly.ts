import { getPrayerTimes, PrayerConfig } from './index.js';
import { MonthlyPrayerRow, PrayerTimesResult } from './types/index.js';
import { Result, Success, Failure } from '../core/result.js';

/**
 * Calculates prayer times for an entire month.
 */
export function getMonthlyPrayerTimes(
  year: number,
  month: number,
  config: Omit<PrayerConfig, 'date'>
): Result<MonthlyPrayerRow[]> {
  const results: MonthlyPrayerRow[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const timesResult = getPrayerTimes({ ...config, date });
    
    if (!timesResult.success) {
      return Failure(`Failed to calculate times for day ${day}: ${timesResult.error}`);
    }

    const times = timesResult.data;
    results.push({
      ...times,
      date: date.toLocaleDateString(),
      day,
      weekday: date.toLocaleDateString('en-US', { weekday: 'long' })
    });
  }

  return Success(results);
}
