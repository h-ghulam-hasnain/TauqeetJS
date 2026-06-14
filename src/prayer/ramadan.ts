import { getPrayerTimes, PrayerConfig } from './index.js';
import { RamadanScheduleEntry, TimeField } from './types/index.js';
import { Result, Success, Failure } from '../core/result.js';
import { resolveTimezoneSync } from './timezone.js';

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

  const timeZone = resolveTimezoneSync(config.timeZone);

  const offsetTimeField = (field: TimeField, bufferMinutes: number): TimeField => {
    if (!field.utc || !field.timestamp) return field;
    const newDate = new Date((field.timestamp + bufferMinutes * 60) * 1000);
    let local = null;
    try {
      if (typeof timeZone === 'string') {
        local = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', timeZone }).format(newDate);
      }
    } catch(e) {}
  
    return {
      utc: newDate.toISOString(),
      local: local,
      timestamp: Math.floor(newDate.getTime() / 1000),
      status: field.status
    };
  };

  const current = new Date(startDate);
  while (current <= endDate) {
    const date = new Date(current);
    const timesResult = getPrayerTimes({ ...config, date });

    if (!timesResult.success) {
      return Failure(`Failed to calculate times for ${date.toLocaleDateString()}: ${timesResult.error}`);
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
      date: dateStr,
      day: date.getDate(),
      weekday: weekdayStr,
      fajr: times.fajr,
      maghrib: times.maghrib,
      sahurEndsAt: offsetTimeField(times.fajr, -sahurBuffer),
      iftarAt: offsetTimeField(times.maghrib, iftarBuffer)
    });

    current.setDate(current.getDate() + 1);
  }

  return Success(results);
}
