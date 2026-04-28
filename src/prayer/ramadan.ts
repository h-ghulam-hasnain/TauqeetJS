import { getPrayerTimes, PrayerConfig } from './index.js';
import { RamadanScheduleEntry } from './types/index.js';
import { Result, Success, Failure } from '../core/result.js';

/**
 * Calculates Ramadan schedule (Sahar and Iftar times) for a date range.
 */
export function getRamadanSchedule(
  startDate: Date,
  endDate: Date,
  config: Omit<PrayerConfig, 'date'>,
  sahurBuffer: number = 0,
  iftarBuffer: number = 0
): Result<RamadanScheduleEntry[]> {
  const results: RamadanScheduleEntry[] = [];
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 31) {
    return Failure('Date range cannot exceed 31 days.');
  }

  const current = new Date(startDate);
  while (current <= endDate) {
    const date = new Date(current);
    const timesResult = getPrayerTimes({ ...config, date });

    if (!timesResult.success) {
      return Failure(`Failed to calculate times for ${date.toLocaleDateString()}: ${timesResult.error}`);
    }

    const times = timesResult.data;
    results.push({
      date: date.toLocaleDateString(),
      day: date.getDate(),
      weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
      fajr: times.fajr,
      maghrib: times.maghrib,
      sahurEndsAt: new Date(times.fajr.getTime() - sahurBuffer * 60000),
      iftarAt: new Date(times.maghrib.getTime() + iftarBuffer * 60000)
    });

    current.setDate(current.getDate() + 1);
  }

  return Success(results);
}
