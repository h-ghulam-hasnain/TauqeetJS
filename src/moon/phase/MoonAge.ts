import { computePreviousNewMoon, dateToJulianDay, calculateDeltaT } from '../../astronomy/index.js';
import type { MoonAgeResult } from '../types/MoonAge.js';

/**
 * Calculates the exact age of the Moon in days since the last astronomical New Moon (conjunction).
 *
 * @remarks
 * This function calculates the elapsed time from the immediately preceding New Moon to the provided date.
 * The result is highly accurate, utilizing full ephemeris computations.
 *
 * @param date - The target date and time to evaluate the Moon's age.
 * @returns A structured result containing the age in decimal days and the exact `Date` of the previous New Moon.
 */
export function getMoonAge(date: Date): MoonAgeResult {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const ut =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600 +
    date.getUTCMilliseconds() / 3600000;

  const jd = dateToJulianDay(year, month, day) + ut / 24;
  const deltaT = calculateDeltaT(year);

  const prevNewMoonEvent = computePreviousNewMoon(jd, deltaT);
  const prevNewMoonDate = new Date(
    Date.UTC(
      prevNewMoonEvent.year,
      prevNewMoonEvent.month - 1,
      prevNewMoonEvent.day,
      prevNewMoonEvent.hour,
      prevNewMoonEvent.minute,
      prevNewMoonEvent.second
    )
  );

  const ageDays = (date.getTime() - prevNewMoonDate.getTime()) / (24 * 3600 * 1000);

  return {
    ageDays,
    previousNewMoon: prevNewMoonDate,
  };
}
