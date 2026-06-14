import { getPrayerTimes, PrayerConfig } from './calculate.js';
import { MonthlyPrayerRow } from './types/index.js';
import { Result, Success, Failure, ErrorCode } from '../core/result.js';
import { resolveTimezoneSync } from './timezone.js';

/**
 * Calculates prayer times for a specific date range (max 31 days).
 */
export function getPrayerTimesRange(
  startDate: Date,
  endDate: Date,
  config: Omit<PrayerConfig, 'date'>
): Result<MonthlyPrayerRow[]> {
  const results: MonthlyPrayerRow[] = [];
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 31) {
    return Failure(ErrorCode.DATE_RANGE_EXCEEDED);
  }

  const timeZone = resolveTimezoneSync(config.timeZone);

  const current = new Date(startDate);
  while (current <= endDate) {
    const date = new Date(current);
    const times = getPrayerTimes({ ...config, date });

    if (!times.success) {
      return Failure(times.error);
    }

    let dateStr = date.toLocaleDateString();
    let weekdayStr = date.toLocaleDateString('en-US', { weekday: 'long' });

    try {
      if (typeof timeZone === 'string') {
        dateStr = new Intl.DateTimeFormat('en-US', { timeZone }).format(date);
        weekdayStr = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone }).format(date);
      }
    } catch(e) {}

    results.push({
      ...times.data,
      date: dateStr,
      day: date.getDate(),
      weekday: weekdayStr
    });

    current.setDate(current.getDate() + 1);
  }

  return Success(results);
}
