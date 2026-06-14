import { getPrayerTimes, PrayerConfig } from './index.js';
import { MonthlyPrayerRow } from './types/index.js';
import { Result, Success, Failure } from '../core/result.js';
import { resolveTimezoneSync } from './timezone.js';

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
  const timeZone = resolveTimezoneSync(config.timeZone);

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const timesResult = getPrayerTimes({ ...config, date });
    
    if (!timesResult.success) {
      return Failure(`Failed to calculate times for day ${day}: ${timesResult.error}`);
    }

    const times = timesResult.data;

    let dateStr = date.toLocaleDateString();
    let weekdayStr = date.toLocaleDateString('en-US', { weekday: 'long' });

    try {
      if (typeof timeZone === 'string') {
        dateStr = new Intl.DateTimeFormat('en-US', { timeZone }).format(date);
        weekdayStr = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone }).format(date);
      }
    } catch(e) {}

    results.push({
      ...times,
      date: dateStr,
      day,
      weekday: weekdayStr
    });
  }

  return Success(results);
}
