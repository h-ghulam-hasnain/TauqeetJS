import { PrayerTimesResult, TimeField } from './types/index.js';
import { Result, Success, Failure, ErrorCode } from '../core/result.js';

export type FormattedTimes<T> = {
  [K in Exclude<keyof PrayerTimesResult, 'metadata'>]: T extends 'unix' ? number | null : string | null;
};

/**
 * Utility to format calculated prayer times from TimeField structs.
 * Supports ISO8601, Unix timestamps, 12-hour, and 24-hour formats.
 * Incorporates timezone conversion using Intl.DateTimeFormat options.
 *
 * @param times The computed prayer times object (which uses TimeFields).
 * @param type The formatting target ('iso8601' | 'unix' | '12h' | '24h').
 * @param timeZone Optional IANA time zone identifier.
 */
export function formatPrayerTimes<T extends 'iso8601' | 'unix' | '12h' | '24h'>(
  times: Omit<PrayerTimesResult, 'metadata'>,
  type: T,
  timeZone?: string
): Result<FormattedTimes<T>> {
  const VALID_FORMATS = new Set(['iso8601', 'unix', '12h', '24h']);
  if (!VALID_FORMATS.has(type)) {
    return Failure(ErrorCode.UNKNOWN_ERROR);
  }

  const formatted: Record<string, string | number | null> = {};
  const keys: (keyof Omit<PrayerTimesResult, 'metadata'>)[] = [
    'fajr',
    'sunrise',
    'dhahwaKubra',
    'dhuhr',
    'asr',
    'maghrib',
    'isha'
  ];

  for (const key of keys) {
    const field = times[key] as TimeField;
    if (!field.utc) {
      formatted[key] = null;
      continue;
    }

    if (type === 'iso8601') {
      formatted[key] = field.utc;
    } else if (type === 'unix') {
      formatted[key] = field.timestamp;
    } else {
      const d = new Date(field.utc);
      const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: type === '12h'
      };
      if (timeZone) {
        options.timeZone = timeZone;
      }
      try {
        formatted[key] = new Intl.DateTimeFormat('en-US', options).format(d);
      } catch (e) {
        formatted[key] = null;
      }
    }
  }

  return Success(formatted as FormattedTimes<T>);
}
