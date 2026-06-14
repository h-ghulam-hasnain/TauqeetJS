import { SolarEphemeris } from '../bodies/sun/SolarPosition.js';
import { LunarEphemeris } from '../bodies/moon/LunarPosition.js';
import { normalizeDegrees } from '../../internal/angles.js';
import { julianDayToDate } from '../time/JulianDate.js';
import type { EventTime } from '../types/phenomena.js';

function isClose(value: number, target: number, tolerance = 1e-6): boolean {
  return Math.abs(value - target) <= tolerance;
}

function eventTimeFromJd(julianDay: number): EventTime {
  let { year, month, day } = julianDayToDate(julianDay);
  let dayWhole = Math.trunc(day);
  const dayFraction = day - dayWhole;
  const ut = dayFraction * 24;
  let hour = Math.trunc(ut);
  let minute = Math.trunc((ut - hour) * 60);
  let second = Math.round(((ut - hour) * 60 - minute) * 60);

  // Handle overflow when seconds round to 60
  if (second >= 60) {
    second = 0;
    minute += 1;
    if (minute >= 60) {
      minute = 0;
      hour += 1;
      if (hour >= 24) {
        hour = 0;
        dayWhole += 1;
      }
    }
  }

  return { julianDay, ut, year, month, day: dayWhole, hour, minute, second };
}

/**
 * Internal lunar event finder.
 * Binary searches for New Moon (conjunction) and Full Moon (opposition) events.
 *
 * Designed to support Hijri calendar calculations and moon visibility algorithms.
 * Reuses cached ephemeris engines to minimize recalculation.
 */
export class LunarEventFinder {
  constructor(readonly deltaT: number) {}

  /**
   * Find the next New Moon (conjunction, elongation ≈ 0°) after the given Julian Day.
   */
  findNextNewMoon(startJd: number): EventTime {
    return this.searchForEvent(startJd, 45, 'forward', 0);
  }

  /**
   * Find the previous New Moon (conjunction, elongation ≈ 0°) before the given Julian Day.
   */
  findPreviousNewMoon(startJd: number): EventTime {
    return this.searchForEvent(startJd, 45, 'backward', 0);
  }

  /**
   * Find the next Full Moon (opposition, elongation ≈ 180°) after the given Julian Day.
   */
  findNextFullMoon(startJd: number): EventTime {
    return this.searchForEvent(startJd, 45, 'forward', 180);
  }

  /**
   * Find the previous Full Moon (opposition, elongation ≈ 180°) before the given Julian Day.
   */
  findPreviousFullMoon(startJd: number): EventTime {
    return this.searchForEvent(startJd, 45, 'backward', 180);
  }

  private computeElongation(julianDay: number): number {
    const solarEngine = new SolarEphemeris(julianDay, 0, this.deltaT);
    const lunarEngine = new LunarEphemeris(julianDay, 0, this.deltaT);
    return normalizeDegrees(lunarEngine.apparentLongitude - solarEngine.apparentLongitude);
  }

  private computeUnwrappedElongation(julianDay: number, referenceElongation: number, direction: 'forward' | 'backward'): number {
    const elongation = this.computeElongation(julianDay);
    if (direction === 'forward') {
      return elongation < referenceElongation ? elongation + 360 : elongation;
    }
    return elongation > referenceElongation ? elongation - 360 : elongation;
  }

  private computeError(
    julianDay: number,
    targetElongation: number,
    referenceElongation: number,
    direction: 'forward' | 'backward',
  ): number {
    const unwrapped = this.computeUnwrappedElongation(julianDay, referenceElongation, direction);
    return unwrapped - targetElongation;
  }

  private determineTarget(startElongation: number, targetElongation: number, direction: 'forward' | 'backward'): number {
    if (direction === 'forward') {
      if (startElongation < targetElongation) {
        return targetElongation;
      }
      return targetElongation + 360;
    }

    if (startElongation > targetElongation) {
      return targetElongation;
    }
    return targetElongation - 360;
  }

  private searchForEvent(
    startJd: number,
    searchWindow: number,
    direction: 'forward' | 'backward',
    targetElongation: number,
  ): EventTime {
    const startElongation = this.computeElongation(startJd);
    const target = this.determineTarget(startElongation, targetElongation, direction);
    const sign = direction === 'forward' ? 1 : -1;
    const step = 1.0 * sign;
    const toleranceDeg = 1e-5;
    const toleranceDays = 1e-8;

    let j0 = startJd;
    let f0 = this.computeError(j0, target, startElongation, direction);
    if (Math.abs(f0) <= toleranceDeg) {
      return eventTimeFromJd(j0);
    }

    let j1 = startJd + step;
    let f1 = this.computeError(j1, target, startElongation, direction);
    let iterations = 0;

    while (Math.sign(f0) === Math.sign(f1) && iterations < 60 && Math.abs(j1 - startJd) <= searchWindow) {
      j0 = j1;
      f0 = f1;
      j1 += step;
      f1 = this.computeError(j1, target, startElongation, direction);
      iterations += 1;
    }

    if (Math.sign(f0) === Math.sign(f1)) {
      // Fallback: if no sign change was found within the expected window,
      // widen the search using a one-day step.
      while (Math.sign(f0) === Math.sign(f1) && iterations < 120 && Math.abs(j1 - startJd) <= searchWindow * 2) {
        j0 = j1;
        f0 = f1;
        j1 += step;
        f1 = this.computeError(j1, target, startElongation, direction);
        iterations += 1;
      }
    }

    // If we still didn't bracket the root, use the last segment anyway.
    if (Math.sign(f0) === Math.sign(f1)) {
      j1 = j0 + step * searchWindow;
      f1 = this.computeError(j1, target, startElongation, direction);
    }

    let jmid = j0;
    for (let iteration = 0; iteration < 60; iteration += 1) {
      jmid = (j0 + j1) / 2;
      const fmid = this.computeError(jmid, target, startElongation, direction);
      if (Math.abs(fmid) <= toleranceDeg || Math.abs(j1 - j0) < toleranceDays) {
        break;
      }

      if (Math.sign(fmid) === Math.sign(f0)) {
        j0 = jmid;
        f0 = fmid;
      } else {
        j1 = jmid;
        f1 = fmid;
      }
    }

    return eventTimeFromJd(jmid);
  }
}
