import type { HijriDate } from '../types/HijriDate.js';
import type { HijriLocationOptions } from '../types/HijriCalendarResult.js';
import { HijriMethod } from '../types/HijriMethod.js';
import { CivilCalendar } from '../methods/civil/CivilCalendar.js';
import { ConjunctionCalendar } from '../methods/astronomical/ConjunctionCalendar.js';
import { VisibilityCalendar } from '../methods/sighting/VisibilityCalendar.js';
import { UmmAlQuraCalendar } from '../methods/ummalqura/UmmAlQuraCalendar.js';
import { getCivilMonthLength } from '../core/HijriMonthLength.js';
import { HijriConfigurationError } from '../errors.js';

interface CalendarLike {
  toHijri(date: Date): HijriDate;
  toGregorian(hijriDate: HijriDate): Date;
}

/**
 * Configuration options for initializing the Hijri engine.
 */
export interface HijriEngineOptions {
  /** Geographic location, strictly required when using the VISIBILITY method. */
  location?: HijriLocationOptions;
}

/**
 * Central engine to manage conversions between Gregorian and Hijri calendars.
 *
 * @remarks
 * Supports multiple conversion methods including standard civil, Umm al-Qura,
 * astronomical conjunction, and precise location-based lunar visibility.
 *
 * @example
 * ```ts
 * const engine = new HijriEngine(HijriMethod.CIVIL);
 * const hijri = engine.toHijri(new Date());
 * const back  = engine.toGregorian(hijri);
 *
 * // Visibility-based (requires location)
 * const vis = new HijriEngine(HijriMethod.VISIBILITY, { location: { latitude: 21.4225, longitude: 39.8262 } });
 * ```
 */
export class HijriEngine {
  private readonly calendar: CalendarLike;

  constructor(
    private readonly method: HijriMethod = HijriMethod.CIVIL,
    private readonly options: HijriEngineOptions = {}
  ) {
    this.calendar = this.buildCalendar();
  }

  /**
   * Converts a Gregorian Date into a HijriDate.
   *
   * @param date - The Gregorian Date object.
   * @returns The corresponding HijriDate.
   */
  toHijri(date: Date): HijriDate {
    return this.calendar.toHijri(date);
  }

  /**
   * Converts a HijriDate back into a Gregorian Date.
   *
   * @param hijriDate - The HijriDate object.
   * @returns The corresponding Gregorian Date.
   */
  toGregorian(hijriDate: HijriDate): Date {
    return this.calendar.toGregorian(hijriDate);
  }

  /**
   * Builds a 2D calendar grid (7 columns = Sunday to Saturday) for a specific Hijri month.
   *
   * @remarks
   * Each cell contains a HijriDate object or `null` for padding days before or after
   * the month starts/ends. The first column represents Sunday (weekday 0).
   *
   * @param year - The Hijri year.
   * @param month - The Hijri month (1-12).
   * @returns A 2D array representing the weeks of the month.
   */
  getMonthGrid(year: number, month: number): (HijriDate | null)[][] {
    const firstGregorian = this.toGregorian({ year, month, day: 1 });
    const startWeekday = firstGregorian.getUTCDay(); // 0 = Sunday
    const totalDays = getCivilMonthLength(year, month);

    const grid: (HijriDate | null)[][] = [];
    let week: (HijriDate | null)[] = Array(startWeekday).fill(null);

    for (let d = 1; d <= totalDays; d++) {
      week.push({ year, month, day: d });
      if (week.length === 7) {
        grid.push(week);
        week = [];
      }
    }

    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      grid.push(week);
    }

    return grid;
  }

  private buildCalendar(): CalendarLike {
    switch (this.method) {
      case HijriMethod.CIVIL:
        return new CivilCalendar();

      case HijriMethod.CONJUNCTION:
        return new ConjunctionCalendar();

      case HijriMethod.UMM_AL_QURA:
        return new UmmAlQuraCalendar();

      case HijriMethod.VISIBILITY: {
        const loc = this.options.location;
        if (!loc) {
          throw new HijriConfigurationError(
            'HijriEngine: HijriMethod.VISIBILITY requires a location (latitude, longitude).'
          );
        }
        return new VisibilityCalendar(loc);
      }

      default:
        return new CivilCalendar();
    }
  }
}
