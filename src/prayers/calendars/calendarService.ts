import { calculatePrayerTimesInternal } from '../engine/PrayerEngine.js';
import { validatePrayerConfig } from '../validators/validatePrayerConfig.js';
import type { ValidatedPrayerConfig } from '../validators/validatePrayerConfig.js';
import type { PrayerConfig } from '../types/index.js';
import type {
  DailyPrayerTimes,
  MonthlyCalendar,
  AnnualCalendar,
  RamadanCalendar,
} from '../types/calendar.js';

/** Zero-pad a number to two digits. */
function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Format a UTC Date as "YYYY-MM-DD". */
function toDateString(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

/**
 * High-performance calendar generation service for Islamic prayer times.
 *
 * @remarks
 * All three public methods follow the same optimisation strategy:
 *
 * 1. **Single validation pass** — `PrayerConfig` is validated and compiled into a
 *    `ValidatedPrayerConfig` exactly once, outside the daily iteration loop.
 * 2. **Struct-mutation date stepping** — only the `date` field of the compiled config
 *    is mutated per iteration; all other fields (coordinates, method angles, timezone,
 *    etc.) are pointer-stable across the entire batch.
 * 3. **Chebyshev cache reuse** — the internal `EphemerisService` automatically caches
 *    the 8-node Chebyshev polynomial for each day's Julian-Date anchor, so successive
 *    days that share an interpolation window skip full VSOP87 re-evaluation.
 *
 * @example
 * ```typescript
 * const service = new CalendarService();
 * const monthly = service.generateMonthlyCalendar(2026, 9, {
 *   lat: 51.5074,
 *   long: -0.1278,
 *   timeZone: 'Europe/London',
 *   method: 'MWL',
 *   madhab: 'Hanbali',
 * });
 * console.log(monthly.days[0].fajr); // "2026-09-01T03:52:00.000Z"
 * ```
 */
export class CalendarService {
  // ─── Private helpers ────────────────────────────────────────────────────────

  /**
   * Validates `config` once, then iterates `daysCount` consecutive days
   * beginning at `startDate`, returning a flat array of `DailyPrayerTimes`.
   *
   * @param startDate  - UTC noon of the first day to process.
   * @param daysCount  - Total number of calendar days to generate.
   * @param config     - User-supplied prayer configuration.
   * @returns Ordered array of daily prayer times.
   */
  private static generateDays(
    startDate: Date,
    daysCount: number,
    config: PrayerConfig
  ): DailyPrayerTimes[] {
    // ── 1. Validate once — hoist invariants out of the loop ──────────────────
    const validation = validatePrayerConfig({
      ...config,
      date: startDate, // Provide a valid anchor date for validation
    });

    if (!validation.success) {
      throw new Error(`Invalid PrayerConfig: ${validation.error}`);
    }

    // Mutable copy — only `date` changes on each iteration.
    const dayConfig: ValidatedPrayerConfig = { ...validation.config };

    const days: DailyPrayerTimes[] = [];

    // ── 2. Iterate days — O(n) with O(1) allocations inside the loop ─────────
    for (let i = 0; i < daysCount; i++) {
      // Compute the UTC noon timestamp for day i
      const dayTs = startDate.getTime() + i * 86_400_000; // 86 400 000 ms = 1 day
      const dayDate = new Date(dayTs);

      // Mutate only the date field — all other config fields are reused.
      (dayConfig as { date: Date }).date = dayDate;

      const times = calculatePrayerTimesInternal(dayConfig);

      days.push({
        date: toDateString(dayDate),
        fajr: times.fajr.utc,
        sunrise: times.sunrise.utc,
        dhuhr: times.dhuhr.utc,
        asr: times.asr.utc,
        maghrib: times.maghrib.utc,
        isha: times.isha.utc,
      });
    }

    return days;
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Generates a complete prayer-times calendar for a single Gregorian month.
   *
   * @param year   - Four-digit Gregorian year (e.g. `2026`).
   * @param month  - 1-indexed month number (1 = January … 12 = December).
   * @param config - Prayer configuration; `date` is ignored and derived internally.
   *                 All other fields (timezone, method, madhab, elevation, etc.)
   *                 are honoured and applied to every day of the month.
   * @returns A `MonthlyCalendar` with one `DailyPrayerTimes` entry per day.
   * @throws {Error} If `month` is outside the range [1, 12] or `config` is invalid.
   *
   * @example
   * ```typescript
   * const feb = service.generateMonthlyCalendar(2024, 2, config);
   * console.log(feb.days.length); // 29 (leap year)
   * ```
   */
  public static generateMonthlyCalendar(
    year: number,
    month: number,
    config: PrayerConfig
  ): MonthlyCalendar {
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new Error(`Month must be an integer between 1 and 12, got: ${month}`);
    }

    // Date.UTC(year, month, 0) overflows into the last day of the previous month,
    // which is exactly the last day of `month`. This handles Feb 28/29 automatically.
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

    // Anchor at noon UTC to avoid any midnight DST boundary ambiguity.
    const startDate = new Date(Date.UTC(year, month - 1, 1, 12, 0, 0));

    const days = CalendarService.generateDays(startDate, daysInMonth, config);

    return { year, month, days };
  }

  /**
   * Generates a complete prayer-times calendar for a full Gregorian year.
   *
   * @remarks
   * Internally delegates to {@link generateMonthlyCalendar} for each of the 12
   * months. The config is validated only once per month batch, not per day.
   *
   * @param year   - Four-digit Gregorian year (e.g. `2026`).
   * @param config - Prayer configuration applied uniformly to all 365/366 days.
   * @returns An `AnnualCalendar` containing 12 ordered `MonthlyCalendar` entries.
   * @throws {Error} If `config` is invalid.
   *
   * @example
   * ```typescript
   * const year = service.generateAnnualCalendar(2026, config);
   * console.log(year.months.length); // 12
   * ```
   */
  public static generateAnnualCalendar(year: number, config: PrayerConfig): AnnualCalendar {
    const months: MonthlyCalendar[] = [];
    for (let m = 1; m <= 12; m++) {
      months.push(CalendarService.generateMonthlyCalendar(year, m, config));
    }
    return { year, months };
  }

  /**
   * Generates a prayer-times calendar for a contiguous period starting on a
   * specific Gregorian date — intended primarily for Ramadan schedules.
   *
   * @remarks
   * The caller is responsible for determining the correct Gregorian start date
   * (e.g. via an Umm al-Qura arithmetic mapping or a trusted API). This method
   * is intentionally agnostic to the Hijri calendar.
   *
   * @param startDate - First day of the period in `"YYYY-MM-DD"` format.
   * @param config    - Prayer configuration applied to every day in the period.
   * @param duration  - Number of days to generate. Must be 29, 30, or 31.
   *                    Defaults to `30`.
   * @returns A `RamadanCalendar` with `duration` ordered `DailyPrayerTimes` entries.
   * @throws {Error} If `startDate` is malformed, `duration` is out of range, or
   *                 `config` is invalid.
   *
   * @example
   * ```typescript
   * // Ramadan 1445 AH begins 11 March 2024 (Umm al-Qura)
   * const ramadan = service.generateRamadanCalendar('2024-03-11', config, 30);
   * console.log(ramadan.endDate); // "2024-04-09"
   * ```
   */
  public static generateRamadanCalendar(
    startDate: string,
    config: PrayerConfig,
    duration: number = 30
  ): RamadanCalendar {
    if (!Number.isInteger(duration) || duration < 29 || duration > 31) {
      throw new Error(
        `Ramadan duration must be an integer of 29, 30, or 31 days, got: ${duration}`
      );
    }

    // Parse and validate the start date string
    const parts = startDate.split('-').map(Number);
    const [y, m, d] = parts;
    if (
      parts.length !== 3 ||
      !y || !m || !d ||
      !Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d) ||
      m < 1 || m > 12 || d < 1 || d > 31
    ) {
      throw new Error(`startDate must be in YYYY-MM-DD format, got: "${startDate}"`);
    }

    const anchorDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    if (isNaN(anchorDate.getTime())) {
      throw new Error(`startDate resolves to an invalid date: "${startDate}"`);
    }

    const days = CalendarService.generateDays(anchorDate, duration, config);

    return {
      startDate,
      endDate: days[days.length - 1]?.date ?? startDate,
      duration,
      days,
    };
  }
}
