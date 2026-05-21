import { PrayerTimesResult } from './types/index.js';

/**
 * Utility to format calculated prayer times.
 * Supports ISO8601, Unix timestamps, 12-hour, and 24-hour formats.
 * Incorporates timezone conversion using Intl.DateTimeFormat options.
 *
 * @param times The computed prayer times object.
 * @param type The formatting target ('iso8601' | 'unix' | '12h' | '24h').
 * @param timeZone Optional IANA time zone identifier.
 */
export function formatPrayerTimes<T extends 'iso8601' | 'unix' | '12h' | '24h'>(
  times: Omit<PrayerTimesResult, 'format'>,
  type: T,
  timeZone?: string
): {
  [K in Exclude<keyof Omit<PrayerTimesResult, 'format'>, 'metadata'>]: K extends 'fajr' | 'isha' | 'dhahwaKubra'
    ? (T extends 'unix' ? number | null : string | null)
    : (T extends 'unix' ? number : string);
} {
  const VALID_FORMATS = new Set(['iso8601', 'unix', '12h', '24h']);
  if (!VALID_FORMATS.has(type)) {
    throw new TypeError(`Invalid format: '${type}'. Allowed formats are: iso8601, unix, 12h, 24h.`);
  }

  const formatted: Record<string, string | number | null> = {};
  const keys: (keyof Omit<PrayerTimesResult, 'format' | 'metadata'>)[] = [
    'fajr',
    'sunrise',
    'dhahwaKubra',
    'dhuhr',
    'asr',
    'maghrib',
    'isha'
  ];

  for (const key of keys) {
    const d = times[key];
    if (d === null) {
      formatted[key] = type === 'unix' ? null : '';
      continue;
    }
    if (isNaN(d.getTime())) {
      formatted[key] = type === 'unix' ? NaN : 'Invalid Date';
      continue;
    }

    if (type === 'iso8601') {
      formatted[key] = d.toISOString();
    } else if (type === 'unix') {
      formatted[key] = Math.floor(d.getTime() / 1000);
    } else {
      const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: type === '12h'
      };
      if (timeZone) {
        options.timeZone = timeZone;
      }
      formatted[key] = new Intl.DateTimeFormat('en-US', options).format(d);
    }
  }

  return formatted as {
    [K in Exclude<keyof Omit<PrayerTimesResult, 'format'>, 'metadata'>]: K extends 'fajr' | 'isha' | 'dhahwaKubra'
      ? (T extends 'unix' ? number | null : string | null)
      : (T extends 'unix' ? number : string);
  };
}
