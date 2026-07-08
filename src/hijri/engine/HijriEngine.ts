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

export interface HijriEngineOptions {
  /** Required when method is VISIBILITY. */
  location?: HijriLocationOptions;
}

/**
 * HijriEngine — the central façade for all Hijri calendar methods.
 *
 * Usage:
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

  /** Convert a Gregorian Date to a HijriDate. */
  toHijri(date: Date): HijriDate {
    return this.calendar.toHijri(date);
  }

  /** Convert a HijriDate to a Gregorian Date. */
  toGregorian(hijriDate: HijriDate): Date {
    return this.calendar.toGregorian(hijriDate);
  }

  /**
   * Build a 2D grid (7 columns = Sun..Sat) for a Hijri month.
   * Each cell is a HijriDate or null for padding days.
   *
   * The first column of the grid is Sunday (weekday 0).
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
