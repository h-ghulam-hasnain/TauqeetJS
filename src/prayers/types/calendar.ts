/**
 * A single day's worth of prayer times as flat, JSON-serializable strings.
 *
 * @remarks
 * All prayer time fields are ISO 8601 UTC strings (e.g. `"2026-03-11T03:42:00.000Z"`)
 * or `null` when the calculation is not applicable (e.g. polar night / polar day).
 * The `date` field is always a "YYYY-MM-DD" string anchored to UTC.
 */
export interface DailyPrayerTimes {
  /** The Gregorian date in "YYYY-MM-DD" format. */
  readonly date: string;
  /** Fajr (pre-dawn prayer) time in ISO 8601 UTC, or null when N/A. */
  readonly fajr: string | null;
  /** Sunrise time in ISO 8601 UTC, or null when N/A. */
  readonly sunrise: string | null;
  /** Dhuhr (midday prayer) time in ISO 8601 UTC, or null when N/A. */
  readonly dhuhr: string | null;
  /** Asr (afternoon prayer) time in ISO 8601 UTC, or null when N/A. */
  readonly asr: string | null;
  /** Maghrib (sunset prayer) time in ISO 8601 UTC, or null when N/A. */
  readonly maghrib: string | null;
  /** Isha (night prayer) time in ISO 8601 UTC, or null when N/A. */
  readonly isha: string | null;
}

/**
 * A complete calendar for a single Gregorian month.
 *
 * @example
 * ```typescript
 * const calendar: MonthlyCalendar = service.generateMonthlyCalendar(2026, 3, config);
 * console.log(calendar.days.length); // 31
 * ```
 */
export interface MonthlyCalendar {
  /** The four-digit Gregorian year. */
  readonly year: number;
  /** The 1-indexed month (1 = January … 12 = December). */
  readonly month: number;
  /** Ordered array of prayer times, one entry per calendar day. */
  readonly days: DailyPrayerTimes[];
}

/**
 * A complete calendar for a full Gregorian year (12 months).
 */
export interface AnnualCalendar {
  /** The four-digit Gregorian year. */
  readonly year: number;
  /** Array of 12 monthly calendars in order from January to December. */
  readonly months: MonthlyCalendar[];
}

/**
 * A calendar spanning the duration of Ramadan (or any contiguous period).
 *
 * @remarks
 * Because the Hijri-to-Gregorian boundary is user-supplied, this interface is
 * intentionally agnostic to Hijri year numbers. Consumers are responsible for
 * determining the correct Gregorian start date.
 */
export interface RamadanCalendar {
  /** The Gregorian start date in "YYYY-MM-DD" format. */
  readonly startDate: string;
  /** The Gregorian end date in "YYYY-MM-DD" format (inclusive). */
  readonly endDate: string;
  /** The total number of days in the calendar (29, 30, or 31). */
  readonly duration: number;
  /** Ordered array of prayer times for each day of Ramadan. */
  readonly days: DailyPrayerTimes[];
}
