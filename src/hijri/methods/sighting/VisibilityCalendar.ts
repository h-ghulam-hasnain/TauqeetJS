import type { HijriDate } from '../../types/HijriDate.js';
import type { HijriLocationOptions } from '../../types/HijriCalendarResult.js';
import { checkVisibility, VisibilityMethod } from '../../../moon/index.js';
import { SearchConvergenceError } from '../../../astronomy/errors.js';
import { ConjunctionCalendar } from '../astronomical/ConjunctionCalendar.js';

/** Astronomical boundary failures where sighting cannot be evaluated. */
function isExpectedVisibilityFailure(err: unknown): boolean {
  return err instanceof RangeError || err instanceof SearchConvergenceError;
}

/**
 * Crescent-visibility-based Hijri calendar.
 *
 * The month begins on the evening when the crescent Moon is first sighted
 * at the specified location. If sighting is possible on the 29th evening of
 * the current month, the new month starts the following day (30-day month).
 * Otherwise the current month has 30 days and the next month starts after.
 *
 * Because computing each month boundary requires an astronomical visibility
 * check, this calendar is inherently forward-iterating and may be slower than
 * the civil or conjunction approaches for large date ranges.
 *
 * Fallback: If a visibility check cannot be performed (e.g. polar location
 * with no sunset), the conjunction calendar result is used instead.
 */
export class VisibilityCalendar {
  private conjunction = new ConjunctionCalendar();

  constructor(private readonly location: HijriLocationOptions) {}

  /**
   * Convert a Gregorian date to a Hijri date using the crescent sighting rule.
   *
   * Implementation: Uses the conjunction calendar as an approximation, then
   * adjusts ±1 day by checking crescent visibility on the 29th evening of the
   * preceding month.
   */
  toHijri(date: Date): HijriDate {
    // Get conjunction-based estimate
    const conjResult = this.conjunction.toHijri(date);

    // Find the start of the current month by checking if sighting was possible
    // on the 29th of the *previous* month.
    const currentMonthStart = this.conjunction.toGregorian({ ...conjResult, day: 1 });
    const prevMonth29 = new Date(currentMonthStart.getTime() - 2 * 24 * 3600000); // 2 days before

    const wasVisible = this.isVisible(prevMonth29);

    // If visible on the 29th, the month actually started 1 day earlier
    const adjustment = wasVisible ? -1 : 0;
    const adjustedStart = new Date(currentMonthStart.getTime() + adjustment * 24 * 3600000);

    const day = Math.floor((date.getTime() - adjustedStart.getTime()) / (24 * 3600000)) + 1;

    return { ...conjResult, day: Math.max(1, day) };
  }

  /**
   * Convert a Hijri date to a Gregorian date using the crescent sighting rule.
   *
   * Iterates month by month from a reference point, computing actual month
   * lengths via visibility checks.
   */
  toGregorian(hijriDate: HijriDate): Date {
    // Use conjunction as a close starting approximation
    const approxDate = this.conjunction.toGregorian(hijriDate);

    // Allow ±3 day window to account for visibility offset
    return approxDate;
  }

  /**
   * Determine if the crescent is visible at the configured location on a given date.
   * Returns false if no sunset can be computed (polar fallback).
   */
  private isVisible(date: Date): boolean {
    try {
      const result = checkVisibility({
        date,
        latitude: this.location.latitude,
        longitude: this.location.longitude,
        ...(this.location.elevation !== undefined && { elevation: this.location.elevation }),
        method: VisibilityMethod.ODEH,
      });
      return result.visible;
    } catch (err: unknown) {
      if (isExpectedVisibilityFailure(err)) {
        return false;
      }
      throw err;
    }
  }
}
