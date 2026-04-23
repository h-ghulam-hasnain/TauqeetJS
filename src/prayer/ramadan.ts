import { getPrayerTimes, PrayerConfig } from './calculate.js';
import { RamadanScheduleEntry } from './types.js';

/**
 * Calculates Ramadan schedule (Sahar and Iftar times) for a date range.
 * @param startDate - Start date of the range
 * @param endDate - End date of the range (max 30 days)
 * @param config - Prayer configuration
 * @param sahurBuffer - Minutes before Fajr for Sahur end (default: 0)
 * @param iftarBuffer - Minutes after Maghrib for Iftar start (default: 0)
 */
export function getRamadanSchedule(
  startDate: Date,
  endDate: Date,
  config: Omit<PrayerConfig, 'date'>,
  sahurBuffer: number = 0,
  iftarBuffer: number = 0
): RamadanScheduleEntry[] {
  const results: RamadanScheduleEntry[] = [];
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

  return results;
}
