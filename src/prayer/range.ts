import { getPrayerTimes, PrayerConfig } from './calculate.js';
import { MonthlyPrayerRow } from './types/index.js';
import { Result, Success, Failure, ErrorCode } from '../core/result.js';

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

  const current = new Date(startDate);
  while (current <= endDate) {
    const date = new Date(current);
    const times = getPrayerTimes({ ...config, date });

    if (!times.success) {
      return Failure(times.error);
    }

    results.push({
      ...times.data,
      date: date.toLocaleDateString(),
      day: date.getDate(),
      weekday: date.toLocaleDateString('en-US', { weekday: 'long' })
    });

    current.setDate(current.getDate() + 1);
  }

  return Success(results);
}
